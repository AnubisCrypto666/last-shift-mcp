import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { initializeSession, rpc } from "../helpers/mcpClient.js";
import { ROOM_MAP_URI } from "../../src/room/uiRoomMap.js";

function fakeRoomDeps() {
  return { narrativeGenerator: { generate: vi.fn().mockResolvedValue("narrated") }, isRecordedDemoMode: () => false };
}

describe("ui://room-map resource", () => {
  it("is listed among the server's resources", async () => {
    const app = createApp({ enableJsonResponse: true, roomDeps: fakeRoomDeps() });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, { id: 2, method: "resources/list", params: {} });
    const uris = res.body.result.resources.map((r: { uri: string }) => r.uri);
    expect(uris).toContain(ROOM_MAP_URI);
  });

  it("reads as MCP Apps HTML (text/html;profile=mcp-app)", async () => {
    const app = createApp({ enableJsonResponse: true, roomDeps: fakeRoomDeps() });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, {
      id: 3,
      method: "resources/read",
      params: { uri: ROOM_MAP_URI },
    });

    const [content] = res.body.result.contents;
    expect(content.mimeType).toBe("text/html;profile=mcp-app");
    expect(content.text).toContain("Kessler Station");
  });

  it("reflects state mutated by a tool call on the next read", async () => {
    const app = createApp({ enableJsonResponse: true, roomDeps: fakeRoomDeps() });
    const { sessionId } = await initializeSession(app);

    await rpc(app, sessionId!, {
      id: 4,
      method: "tools/call",
      params: { name: "examine_room", arguments: { target: "toolbox" } },
    });

    const res = await rpc(app, sessionId!, {
      id: 5,
      method: "resources/read",
      params: { uri: ROOM_MAP_URI },
    });
    expect(res.body.result.contents[0].text).toContain("multitool");
  });

  it("examine_room, use_item, and attempt_escape all declare _meta.ui.resourceUri pointing at the room map", async () => {
    const app = createApp({ enableJsonResponse: true, roomDeps: fakeRoomDeps() });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, { id: 6, method: "tools/list", params: {} });
    const byName = Object.fromEntries(res.body.result.tools.map((t: { name: string }) => [t.name, t]));

    for (const name of ["examine_room", "use_item", "attempt_escape"]) {
      expect(byName[name]._meta?.ui?.resourceUri).toBe(ROOM_MAP_URI);
    }
  });
});
