import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { createMcpServer } from "../../src/mcpServer.js";
import { ROOM_STATE_URI } from "../../src/room/roomResource.js";

/**
 * attempt_escape needs a genuine bidirectional exchange mid-tool-call (the
 * server elicits, the client answers, before the tool call resolves) -
 * something the raw-HTTP/supertest harness used elsewhere isn't well suited
 * to drive. InMemoryTransport.createLinkedPair() + a real Client from
 * @modelcontextprotocol/client gives us the actual protocol semantics
 * in-process, no network, no live environment - still fully "controlled
 * inputs". This directly exercises Gate 1's own wording: "elicitation
 * działa od żądania do walidacji."
 */

function fakeRoomDeps() {
  return { narrativeGenerator: { generate: vi.fn().mockResolvedValue("narrated") }, isRecordedDemoMode: () => false };
}

async function connectedClient(elicitationHandler: (request: unknown) => Promise<unknown>) {
  const server = createMcpServer({ roomDeps: fakeRoomDeps() });
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "test-client", version: "0.0.1" }, { capabilities: { elicitation: {} } });
  client.setRequestHandler("elicitation/create" as any, elicitationHandler as any);

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

async function readRoomState(client: Client) {
  const result = await client.readResource({ uri: ROOM_STATE_URI });
  const [content] = result.contents;
  return JSON.parse((content as { text: string }).text);
}

async function discoverBothFragments(client: Client) {
  await client.callTool({ name: "examine_room", arguments: { target: "toolbox" } });
  await client.callTool({ name: "examine_room", arguments: { target: "control_panel" } });
  await client.callTool({ name: "use_item", arguments: { item: "multitool", target: "vent" } });
}

describe("attempt_escape tool (end-to-end via InMemoryTransport)", () => {
  it("is listed among the server's tools", async () => {
    const client = await connectedClient(async () => ({ action: "decline" }));
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toContain("attempt_escape");
  });

  it("elicits a code and escapes on the correct answer", async () => {
    let elicitedMessage: string | undefined;
    const client = await connectedClient(async (request) => {
      elicitedMessage = (request as any)?.params?.message;
      return { action: "accept", content: { code: "7XQ2" } };
    });

    await discoverBothFragments(client);
    const result = await client.callTool({ name: "attempt_escape", arguments: {} });

    expect(elicitedMessage).toMatch(/code/i);
    expect((result.content as any[])[0].text).toMatch(/out|escape/i);

    const view = await readRoomState(client);
    expect(view.status).toBe("escaped");
  });

  it("a wrong code doesn't end the game - it's a twist that costs time", async () => {
    const client = await connectedClient(async () => ({ action: "accept", content: { code: "0000" } }));

    await discoverBothFragments(client);
    const before = await readRoomState(client);
    await client.callTool({ name: "attempt_escape", arguments: {} });
    const after = await readRoomState(client);

    expect(after.status).toBe("active");
    expect(after.wrongAttempts).toBe(1);
    expect(after.remainingSeconds).toBeLessThan(before.remainingSeconds);
  });

  it("declining the elicitation leaves the room untouched", async () => {
    const client = await connectedClient(async () => ({ action: "decline" }));

    await discoverBothFragments(client);
    await client.callTool({ name: "attempt_escape", arguments: {} });
    const view = await readRoomState(client);

    expect(view.status).toBe("active");
    expect(view.wrongAttempts).toBe(0);
  });

  it("attempting escape a second time after already escaping just says so, doesn't re-trigger elicitation", async () => {
    const elicitHandler = vi.fn().mockResolvedValue({ action: "accept", content: { code: "7XQ2" } });
    const client = await connectedClient(elicitHandler);

    await discoverBothFragments(client);
    await client.callTool({ name: "attempt_escape", arguments: {} });
    expect(elicitHandler).toHaveBeenCalledOnce();

    const result = await client.callTool({ name: "attempt_escape", arguments: {} });
    expect(elicitHandler).toHaveBeenCalledOnce(); // not called again
    expect((result.content as any[])[0].text).toMatch(/already escaped/i);
  });
});
