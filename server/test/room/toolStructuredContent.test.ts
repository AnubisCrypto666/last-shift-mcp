import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { createMcpServer } from "../../src/mcpServer.js";
import { roomStateViewSchema } from "../../src/room/roomStateSchema.js";

/**
 * OI-14 option B, stage 2: examine_room, use_item, and attempt_escape all
 * return structuredContent shaped by the shared roomStateViewSchema,
 * alongside their existing text content. This is the in-band channel the
 * room-map view will read from `ui/notifications/tool-result` (stage 2's
 * client/view work) - these tests only cover the server's half: every
 * return path produces a schema-valid structuredContent, including the
 * attempt_escape branches that don't change room state (wrong code,
 * decline, cancel).
 */

function fakeRoomDeps() {
  return { narrativeGenerator: { generate: vi.fn().mockResolvedValue("narrated") }, isRecordedDemoMode: () => false };
}

async function connectedClient(elicitationHandler?: (request: unknown) => Promise<unknown>) {
  const server = createMcpServer({ roomDeps: fakeRoomDeps() });
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "test-client", version: "0.0.1" }, { capabilities: { elicitation: {} } });
  if (elicitationHandler) {
    client.setRequestHandler("elicitation/create" as any, elicitationHandler as any);
  }

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

async function discoverBothFragments(client: Client) {
  await client.callTool({ name: "examine_room", arguments: { target: "toolbox" } });
  await client.callTool({ name: "examine_room", arguments: { target: "control_panel" } });
  await client.callTool({ name: "use_item", arguments: { item: "multitool", target: "vent" } });
}

describe("structuredContent on examine_room, use_item, attempt_escape (OI-14 option B, stage 2)", () => {
  it("examine_room (general look) returns structuredContent matching the shared schema", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "examine_room", arguments: {} });

    expect(result.isError).toBeFalsy();
    const parsed = roomStateViewSchema.safeParse(result.structuredContent);
    expect(parsed.success).toBe(true);
    expect(result.structuredContent).toMatchObject({ status: "active", inventory: [], discoveredFragments: {} });
  });

  it("examine_room (control_panel) structuredContent reflects the newly discovered fragment", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "examine_room", arguments: { target: "control_panel" } });

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ discoveredFragments: { control_panel: "7X" } });
  });

  it("use_item structuredContent reflects the unlocked vent and discovered fragment", async () => {
    const client = await connectedClient();
    await client.callTool({ name: "examine_room", arguments: { target: "toolbox" } });
    const result = await client.callTool({ name: "use_item", arguments: { item: "multitool", target: "vent" } });

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ ventUnlocked: true, discoveredFragments: { vent: "Q2" } });
  });

  it("use_item (no-op failure path, e.g. missing multitool) still returns schema-valid structuredContent", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "use_item", arguments: { item: "multitool", target: "vent" } });

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ ventUnlocked: false });
  });

  it("attempt_escape with the correct code: structuredContent reports status escaped", async () => {
    const client = await connectedClient(async () => ({ action: "accept", content: { code: "7XQ2" } }));
    await discoverBothFragments(client);

    const result = await client.callTool({ name: "attempt_escape", arguments: {} });

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ status: "escaped" });
  });

  it("attempt_escape with a wrong code: structuredContent reports active status and the incremented wrongAttempts", async () => {
    const client = await connectedClient(async () => ({ action: "accept", content: { code: "0000" } }));
    await discoverBothFragments(client);

    const result = await client.callTool({ name: "attempt_escape", arguments: {} });

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ status: "active", wrongAttempts: 1 });
  });

  it("attempt_escape declined: structuredContent is schema-valid and unchanged (status active, wrongAttempts 0)", async () => {
    const client = await connectedClient(async () => ({ action: "decline" }));
    await discoverBothFragments(client);

    const result = await client.callTool({ name: "attempt_escape", arguments: {} });

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ status: "active", wrongAttempts: 0 });
  });

  it("attempt_escape cancelled: structuredContent is schema-valid and unchanged (status active, wrongAttempts 0)", async () => {
    const client = await connectedClient(async () => ({ action: "cancel" }));
    await discoverBothFragments(client);

    const result = await client.callTool({ name: "attempt_escape", arguments: {} });

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ status: "active", wrongAttempts: 0 });
  });

  it("attempt_escape after the game already ended (status-over branch) still returns schema-valid structuredContent", async () => {
    const client = await connectedClient(async () => ({ action: "accept", content: { code: "7XQ2" } }));
    await discoverBothFragments(client);
    await client.callTool({ name: "attempt_escape", arguments: {} }); // escapes

    const result = await client.callTool({ name: "attempt_escape", arguments: {} }); // already escaped

    expect(roomStateViewSchema.safeParse(result.structuredContent).success).toBe(true);
    expect(result.structuredContent).toMatchObject({ status: "escaped" });
  });

  it("the three tools advertise outputSchema matching the shared room-state shape", async () => {
    const client = await connectedClient();
    const { tools } = await client.listTools();
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));

    for (const name of ["examine_room", "use_item", "attempt_escape"]) {
      expect(byName[name]?.outputSchema, `${name} should declare an outputSchema`).toBeDefined();
      expect(byName[name]?.outputSchema?.properties).toHaveProperty("status");
      expect(byName[name]?.outputSchema?.properties).toHaveProperty("remainingSeconds");
      expect(byName[name]?.outputSchema?.properties).toHaveProperty("inventory");
      expect(byName[name]?.outputSchema?.properties).toHaveProperty("discoveredFragments");
      expect(byName[name]?.outputSchema?.properties).toHaveProperty("ventUnlocked");
    }
  });
});
