import { describe, expect, it } from "vitest";
import type { CallToolResult, JSONRPCMessage, Tool, Transport } from "@modelcontextprotocol/client";
import { App } from "@modelcontextprotocol/ext-apps";
import { AppBridge } from "@modelcontextprotocol/ext-apps/app-bridge";
import { sendToolCallToView, shouldRefreshSrcdoc, type RoomHost } from "../src/roomHost.js";

/**
 * Mock-transport test for OI-14 option B, stage 2: sendToolCallToView must
 * not send `ui/notifications/tool-input`/`ui/notifications/tool-result` to
 * the view before the view's `ui/initialize` handshake completes ("Sandbox
 * proxy", point 6 of SEP-1865: "The Host MUST NOT send any request or
 * notification to the View before it receives an `initialized`
 * notification"), and must send both, in order, once it has.
 *
 * No DOM/iframe/postMessage involved - this links a real `AppBridge` (the
 * host side, same class roomHost.ts uses) to a real `App` (the view side,
 * same class server/src/room/view/roomMapView.ts uses) over a minimal
 * in-process Transport pair, exercising the actual sendToolCallToView
 * export against the real protocol library.
 */

class LinkedTransport implements Transport {
  peer!: LinkedTransport;
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;

  async start(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    queueMicrotask(() => this.peer.onmessage?.(message));
  }

  async close(): Promise<void> {
    this.onclose?.();
  }
}

function createLinkedPair(): [LinkedTransport, LinkedTransport] {
  const a = new LinkedTransport();
  const b = new LinkedTransport();
  a.peer = b;
  b.peer = a;
  return [a, b];
}

const EXAMINE_ROOM_TOOL: Tool = {
  name: "examine_room",
  description: "Look around the room.",
  inputSchema: { type: "object" },
};

function makeResult(): CallToolResult {
  return {
    content: [{ type: "text", text: "A dented toolbox." }],
    structuredContent: { status: "active", remainingSeconds: 590, inventory: [], discoveredFragments: {}, ventUnlocked: false, wrongAttempts: 0 },
  };
}

describe("sendToolCallToView (OI-14 option B, stage 2 mock-transport test)", () => {
  it("sends nothing to the view before the handshake completes", async () => {
    const [hostTransport, viewTransport] = createLinkedPair();

    const bridge = new AppBridge(null, { name: "test-host", version: "0.0.1" }, { serverTools: {} });
    await bridge.connect(hostTransport);

    const host: Pick<RoomHost, "bridge" | "tools" | "viewReady"> = { bridge, tools: [EXAMINE_ROOM_TOOL], viewReady: false };

    const toolInputReceived: unknown[] = [];
    const toolResultReceived: unknown[] = [];
    // autoResize:false - this test runs in plain Node, no DOM/ResizeObserver.
    const app = new App({ name: "test-view", version: "0.0.1" }, {}, { autoResize: false });
    app.ontoolinput = (params) => toolInputReceived.push(params);
    app.ontoolresult = (params) => toolResultReceived.push(params);

    // Deliberately not connecting the view yet: host.viewReady stays false,
    // mirroring the real iframe's load/handshake lag that roomHost.ts's
    // `bridge.oninitialized` guard exists for.
    await sendToolCallToView(host, { name: "examine_room", arguments: { target: "toolbox" } }, makeResult());

    expect(toolInputReceived).toHaveLength(0);
    expect(toolResultReceived).toHaveLength(0);

    // Now complete the handshake and confirm the guard lifts. oninitialized
    // is a one-shot event on the host side too - it must be registered
    // before app.connect() fires it, or the handshake notification is
    // dispatched to no listener and lost.
    const initialized = new Promise((resolve) => {
      bridge.oninitialized = resolve;
    });
    await app.connect(viewTransport);
    await initialized;
    host.viewReady = true;

    await sendToolCallToView(host, { name: "examine_room", arguments: { target: "toolbox" } }, makeResult());

    expect(toolInputReceived).toHaveLength(1);
    expect(toolResultReceived).toHaveLength(1);
  });

  it("sends tool-input before tool-result, and host-context toolInfo before both, once initialized", async () => {
    const [hostTransport, viewTransport] = createLinkedPair();

    const bridge = new AppBridge(null, { name: "test-host", version: "0.0.1" }, { serverTools: {} });
    await bridge.connect(hostTransport);

    // autoResize:false - this test runs in plain Node, no DOM/ResizeObserver.
    const app = new App({ name: "test-view", version: "0.0.1" }, {}, { autoResize: false });
    const order: string[] = [];
    let toolNameAtInput: string | undefined;
    let toolNameAtResult: string | undefined;
    let currentToolName: string | undefined;

    app.addEventListener("hostcontextchanged", (ctx) => {
      if (ctx.toolInfo?.tool?.name) currentToolName = ctx.toolInfo.tool.name;
      order.push("hostcontextchanged");
    });
    app.ontoolinput = () => {
      toolNameAtInput = currentToolName;
      order.push("toolinput");
    };
    app.ontoolresult = () => {
      toolNameAtResult = currentToolName;
      order.push("toolresult");
    };

    const initialized = new Promise((resolve) => {
      bridge.oninitialized = resolve;
    });
    await app.connect(viewTransport);
    await initialized;

    const host: Pick<RoomHost, "bridge" | "tools" | "viewReady"> = { bridge, tools: [EXAMINE_ROOM_TOOL], viewReady: true };
    await sendToolCallToView(host, { name: "examine_room", arguments: { target: "toolbox" } }, makeResult());

    expect(order).toEqual(["hostcontextchanged", "toolinput", "toolresult"]);
    expect(toolNameAtInput).toBe("examine_room");
    expect(toolNameAtResult).toBe("examine_room");
  });
});

describe("sendToolCallToView resends host-context-changed for repeated tool calls (OI-14 stage 4, playtest anomaly 2026-10-05)", () => {
  it("fires hostcontextchanged on both calls when the same tool is invoked twice in a row", async () => {
    const [hostTransport, viewTransport] = createLinkedPair();

    const bridge = new AppBridge(null, { name: "test-host", version: "0.0.1" }, { serverTools: {} });
    await bridge.connect(hostTransport);

    const app = new App({ name: "test-view", version: "0.0.1" }, {}, { autoResize: false });
    const toolNamesSeen: Array<string | undefined> = [];
    app.addEventListener("hostcontextchanged", (ctx) => {
      toolNamesSeen.push(ctx.toolInfo?.tool?.name);
    });

    const initialized = new Promise((resolve) => {
      bridge.oninitialized = resolve;
    });
    await app.connect(viewTransport);
    await initialized;

    const host: Pick<RoomHost, "bridge" | "tools" | "viewReady"> = { bridge, tools: [EXAMINE_ROOM_TOOL], viewReady: true };

    // "examine control panel" then "examine toolbox" - different arguments,
    // but the SAME tool (examine_room). Without a changing toolInfo.id,
    // AppBridge.setHostContext (app-bridge.js) diffs the new toolInfo
    // against its cached _hostContext by JSON.stringify equality and skips
    // sending ui/notifications/host-context-changed when nothing differs -
    // exactly what happened in the owner's 2026-10-05 playtest, where the
    // second call's view logged "tool-input ? {...}" instead of the tool name.
    await sendToolCallToView(host, { name: "examine_room", arguments: { target: "control_panel" } }, makeResult());
    await sendToolCallToView(host, { name: "examine_room", arguments: { target: "toolbox" } }, makeResult());

    expect(toolNamesSeen).toEqual(["examine_room", "examine_room"]);
  });
});

describe("shouldRefreshSrcdoc (OI-14 option B, stage 4 - default flipped to off)", () => {
  it("defaults to disabled - no param, or any value other than the literal 'on'", () => {
    expect(shouldRefreshSrcdoc("")).toBe(false);
    expect(shouldRefreshSrcdoc("?")).toBe(false);
    expect(shouldRefreshSrcdoc("?foo=bar")).toBe(false);
    expect(shouldRefreshSrcdoc("?refresh=off")).toBe(false); // still works - now the same as no param at all
    expect(shouldRefreshSrcdoc("?refresh=ON")).toBe(false); // case-sensitive: only the exact lowercase literal enables it
  });

  it("enables only on the exact literal '?refresh=on'", () => {
    expect(shouldRefreshSrcdoc("?refresh=on")).toBe(true);
    expect(shouldRefreshSrcdoc("?foo=bar&refresh=on")).toBe(true);
  });
});
