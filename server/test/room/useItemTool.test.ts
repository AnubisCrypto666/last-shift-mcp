import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
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
});
