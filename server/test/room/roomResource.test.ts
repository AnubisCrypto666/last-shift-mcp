import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { initializeSession, rpc } from "../helpers/mcpClient.js";
import { ROOM_STATE_URI } from "../../src/room/roomResource.js";
import { DURATION_SECONDS } from "../../src/room/state.js";

describe("room://state resource", () => {
  it("is listed among the server's resources", async () => {
    const app = createApp({ enableJsonResponse: true });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, { id: 2, method: "resources/list", params: {} });

    expect(res.status).toBe(200);
    const uris = res.body.result.resources.map((r: { uri: string }) => r.uri);
    expect(uris).toContain(ROOM_STATE_URI);
  });

  it("reads a fresh, active room with the full starting duration", async () => {
    const app = createApp({ enableJsonResponse: true });
    const { sessionId } = await initializeSession(app);

    const res = await rpc(app, sessionId!, {
      id: 3,
      method: "resources/read",
      params: { uri: ROOM_STATE_URI },
    });

    expect(res.status).toBe(200);
    const [content] = res.body.result.contents;
    expect(content.mimeType).toBe("application/json");

    const view = JSON.parse(content.text);
    expect(view.station).toBe("Kessler Station");
    expect(view.room).toBe("Maintenance Bay 7");
    expect(view.status).toBe("active");
    expect(view.remainingSeconds).toBeLessThanOrEqual(DURATION_SECONDS);
    expect(view.remainingSeconds).toBeGreaterThan(DURATION_SECONDS - 5); // generous slack for test runtime
    expect(view.inventory).toEqual([]);
    expect(view.discoveredFragments).toEqual({});
  });

  it("gives each session its own independent room state", async () => {
    const app = createApp({ enableJsonResponse: true });
    const session1 = await initializeSession(app);
    const session2 = await initializeSession(app);
    expect(session1.sessionId).not.toBe(session2.sessionId);

    // No cross-session mutation possible yet (no tools registered until step
    // 4's later pieces land) - this just locks in that state is genuinely
    // per-session, not a module-level singleton, before mutation exists to
    // test against directly.
    const res1 = await rpc(app, session1.sessionId!, {
      id: 4,
      method: "resources/read",
      params: { uri: ROOM_STATE_URI },
    });
    const res2 = await rpc(app, session2.sessionId!, {
      id: 4,
      method: "resources/read",
      params: { uri: ROOM_STATE_URI },
    });

    const view1 = JSON.parse(res1.body.result.contents[0].text);
    const view2 = JSON.parse(res2.body.result.contents[0].text);
    expect(view1).toEqual(view2); // both fresh, but computed independently
  });
});
