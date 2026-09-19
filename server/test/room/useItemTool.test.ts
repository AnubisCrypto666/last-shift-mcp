import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { createApp } from "../../src/app.js";
import { createMcpServer } from "../../src/mcpServer.js";
import { initializeSession, rpc } from "../helpers/mcpClient.js";
import { ROOM_STATE_URI } from "../../src/room/roomResource.js";

function fakeRoomDeps() {
  return { narrativeGenerator: { generate: vi.fn().mockResolvedValue("narrated") }, isRecordedDemoMode: () => false };
}

async function readRoomState(app: ReturnType<typeof createApp>, sessionId: string) {
  const res = await rpc(app, sessionId, { id: 99, method: "resources/read", params: { uri: ROOM_STATE_URI } });
  return JSON.parse(res.body.result.contents[0].text);
}

describe("use_item tool", () => {
  it("is listed among the server's tools", async () => {
    const app = createApp({ enableJsonResponse: true, roomDeps: fakeRoomDeps() });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, { id: 2, method: "tools/list", params: {} });
    const names = res.body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("use_item");
  });

  it("the full puzzle chain: examine toolbox -> use multitool on vent -> both fragments discovered", async () => {
    const app = createApp({ enableJsonResponse: true, roomDeps: fakeRoomDeps() });
    const { sessionId } = await initializeSession(app);

    await rpc(app, sessionId!, {
      id: 3,
      method: "tools/call",
      params: { name: "examine_room", arguments: { target: "toolbox" } },
    });
    await rpc(app, sessionId!, {
      id: 4,
      method: "tools/call",
      params: { name: "examine_room", arguments: { target: "control_panel" } },
    });
    const useRes = await rpc(app, sessionId!, {
      id: 5,
      method: "tools/call",
      params: { name: "use_item", arguments: { item: "multitool", target: "vent" } },
    });

    expect(useRes.status).toBe(200);
    expect(useRes.body.result.content[0].text).toMatch(/fragment/i);

    const view = await readRoomState(app, sessionId!);
    expect(view.ventUnlocked).toBe(true);
    expect(view.discoveredFragments).toEqual({ control_panel: "7X", vent: "Q2" });
  });

  it("using the multitool before picking it up fails and doesn't unlock the vent", async () => {
    const app = createApp({ enableJsonResponse: true, roomDeps: fakeRoomDeps() });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, {
      id: 3,
      method: "tools/call",
      params: { name: "use_item", arguments: { item: "multitool", target: "vent" } },
    });

    expect(res.body.result.content[0].text).toMatch(/don't have a multitool/i);
    const view = await readRoomState(app, sessionId!);
    expect(view.ventUnlocked).toBe(false);
  });

  // N5: the production error path for an invalid tool argument is the MCP
  // server's own schema validation (isError result), not applyUseItem()'s
  // "You don't have a X" text - see the unit test "rejects an unknown item"
  // in useItem.test.ts, which exercises applyUseItem() directly and so
  // never goes through this schema layer (audit note 6).
  it("use_item with an item outside its enum is rejected by schema validation, not applyUseItem's own text (audit N5)", async () => {
    const server = createMcpServer({ roomDeps: fakeRoomDeps() });
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.1" }, { capabilities: {} });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "use_item",
      arguments: { item: "flashlight", target: "vent" } as any,
    });

    expect(result.isError).toBe(true);
    expect((result.content as any[])[0].text).toMatch(/invalid|validation/i);

    const state = await client.readResource({ uri: ROOM_STATE_URI });
    const view = JSON.parse((state.contents[0] as { text: string }).text);
    expect(view.ventUnlocked).toBe(false);
  });

  it("examine_room with a target outside its enum is rejected by schema validation (audit N5)", async () => {
    const server = createMcpServer({ roomDeps: fakeRoomDeps() });
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.1" }, { capabilities: {} });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({
      name: "examine_room",
      arguments: { target: "reactor" } as any,
    });

    expect(result.isError).toBe(true);
  });
});
