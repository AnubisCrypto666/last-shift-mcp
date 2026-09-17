import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { initializeSession, rpc } from "../helpers/mcpClient.js";
import { ROOM_STATE_URI } from "../../src/room/roomResource.js";

/**
 * End-to-end over the real HTTP/session layer (supertest, no live network).
 * The test client never declares the `sampling` capability - exactly the
 * scenario plan-pracy's Gate 1 requires: the Bedrock fallback path must
 * work when sampling isn't offered. A fake NarrativeGenerator is injected
 * so no real AWS call happens.
 */

function fakeGenerator(text = "narrated text") {
  return { generate: vi.fn().mockResolvedValue(text) };
}

async function readRoomState(app: ReturnType<typeof createApp>, sessionId: string) {
  const res = await rpc(app, sessionId, { id: 99, method: "resources/read", params: { uri: ROOM_STATE_URI } });
  return JSON.parse(res.body.result.contents[0].text);
}

describe("examine_room tool", () => {
  it("is listed among the server's tools", async () => {
    const app = createApp({ enableJsonResponse: true });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, { id: 2, method: "tools/list", params: {} });
    const names = res.body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("examine_room");
  });

  it("falls back to Bedrock (no sampling declared) and returns its text", async () => {
    const generator = fakeGenerator("a dented toolbox, narrated");
    const app = createApp({
      enableJsonResponse: true,
      roomDeps: { narrativeGenerator: generator, isRecordedDemoMode: () => false },
    });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, {
      id: 3,
      method: "tools/call",
      params: { name: "examine_room", arguments: { target: "toolbox" } },
    });

    expect(res.status).toBe(200);
    expect(res.body.result.content[0].text).toBe("a dented toolbox, narrated");
    expect(generator.generate).toHaveBeenCalledOnce();
  });

  it("picking up the toolbox adds the multitool to inventory", async () => {
    const app = createApp({
      enableJsonResponse: true,
      roomDeps: { narrativeGenerator: fakeGenerator(), isRecordedDemoMode: () => false },
    });
    const { sessionId } = await initializeSession(app);

    await rpc(app, sessionId!, {
      id: 4,
      method: "tools/call",
      params: { name: "examine_room", arguments: { target: "toolbox" } },
    });

    const view = await readRoomState(app, sessionId!);
    expect(view.inventory).toEqual(["multitool"]);
  });

  it("examining the control panel discovers its fragment", async () => {
    const app = createApp({
      enableJsonResponse: true,
      roomDeps: { narrativeGenerator: fakeGenerator(), isRecordedDemoMode: () => false },
    });
    const { sessionId } = await initializeSession(app);

    await rpc(app, sessionId!, {
      id: 5,
      method: "tools/call",
      params: { name: "examine_room", arguments: { target: "control_panel" } },
    });

    const view = await readRoomState(app, sessionId!);
    expect(view.discoveredFragments.control_panel).toBe("7X");
  });

  it("a general look (no target) doesn't change inventory or fragments", async () => {
    const app = createApp({
      enableJsonResponse: true,
      roomDeps: { narrativeGenerator: fakeGenerator(), isRecordedDemoMode: () => false },
    });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, {
      id: 6,
      method: "tools/call",
      params: { name: "examine_room", arguments: {} },
    });

    expect(res.status).toBe(200);
    const view = await readRoomState(app, sessionId!);
    expect(view.inventory).toEqual([]);
    expect(view.discoveredFragments).toEqual({});
  });

  it("DEMO_MODE=recorded returns the fixture text instead of calling the generator", async () => {
    const generator = fakeGenerator("should not be used");
    const app = createApp({
      enableJsonResponse: true,
      roomDeps: { narrativeGenerator: generator, isRecordedDemoMode: () => true },
    });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, {
      id: 7,
      method: "tools/call",
      params: { name: "examine_room", arguments: { target: "control_panel" } },
    });

    expect(res.body.result.content[0].text).toMatch(/7X/);
    expect(generator.generate).not.toHaveBeenCalled();
  });
});
