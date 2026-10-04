import { describe, expect, it, vi } from "vitest";
import vm from "node:vm";
import { renderRoomMapHtml } from "../../src/room/uiRoomMap.js";
import { createInitialRoomState, toRoomStateView } from "../../src/room/state.js";

const T0 = 1_700_000_000_000;

function runEmbeddedClockScript(html: string) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error("embedded clock script not found in rendered HTML");

  const element = { textContent: "" };
  const setInterval = vi.fn();
  const clearInterval = vi.fn();
  const context = vm.createContext({
    document: { getElementById: () => element },
    window: {}, // the clock script assigns window.__roomMapClock (OI-14 option B, stage 3)
    setInterval,
    clearInterval,
  });
  vm.runInContext(script, context);
  return { element, setInterval, clearInterval };
}

/**
 * Extracts the second embedded <script> (the bundled MCP Apps view runtime,
 * server/src/room/view/roomMapView.ts) and runs it in a vm context with a
 * fake `window.parent` standing in for the host, so we can watch what the
 * view actually posts - proving the SEP-1865 handshake ordering rather than
 * just asserting the bundle's text is present.
 */
function runViewBundle(html: string) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
  const bundleScript = scripts[1];
  if (!bundleScript) throw new Error("embedded view bundle script not found in rendered HTML (expected 2nd <script>)");

  const sent: Array<Record<string, unknown>> = [];
  const listeners: Array<(event: { source: unknown; data: unknown }) => void> = [];
  const fakeParent = { postMessage: (message: Record<string, unknown>) => sent.push(message) };
  const windowStub = {
    parent: fakeParent,
    addEventListener: (type: string, listener: (event: { source: unknown; data: unknown }) => void) => {
      if (type === "message") listeners.push(listener);
    },
    removeEventListener: () => {},
  };

  const context = vm.createContext({
    window: windowStub,
    console,
    crypto: globalThis.crypto,
    structuredClone: globalThis.structuredClone,
    TextEncoder,
    TextDecoder,
    AbortController,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  });
  vm.runInContext(bundleScript, context);

  return {
    sent,
    dispatchFromHost(data: Record<string, unknown>) {
      for (const listener of listeners) listener({ source: fakeParent, data });
    },
  };
}

/** Minimal fake DOM element: just enough of the Element API applyRoomStateView (roomMapView.ts) actually calls. */
function createFakeElement() {
  const classes = new Set<string>();
  const el = {
    textContent: "",
    children: [] as unknown[],
    classList: {
      toggle: (name: string, force?: boolean) => {
        const has = classes.has(name);
        const want = force === undefined ? !has : force;
        if (want) classes.add(name);
        else classes.delete(name);
      },
      contains: (name: string) => classes.has(name),
    },
    replaceChildren: (...nodes: unknown[]) => {
      el.children = nodes;
    },
    append: (...nodes: unknown[]) => {
      el.children.push(...nodes);
    },
  };
  return el;
}

/**
 * Runs BOTH embedded `<script>` blocks (the inline clock, then the bundled
 * MCP Apps view runtime) in one shared `vm` context - the same way a real
 * browser shares one global scope between same-document `<script>` tags -
 * so the view bundle's `window.__roomMapClock?.resync(...)` call (OI-14
 * option B, stage 3) actually reaches the clock script's real `resync`,
 * not a stub. `document.getElementById` resolves the five ids
 * `uiRoomMap.ts` renders (status/timer/inventory-list/fragments-list/vent)
 * against fake elements that record what was written to them.
 */
function runFullRoomMapScripts(html: string) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
  const [clockScript, bundleScript] = scripts;
  if (!clockScript || !bundleScript) throw new Error("expected two embedded <script> blocks in rendered HTML");

  const elements: Record<string, ReturnType<typeof createFakeElement>> = {
    timer: createFakeElement(),
    status: createFakeElement(),
    "inventory-list": createFakeElement(),
    "fragments-list": createFakeElement(),
    vent: createFakeElement(),
  };

  const sent: Array<Record<string, unknown>> = [];
  const listeners: Array<(event: { source: unknown; data: unknown }) => void> = [];
  const fakeParent = { postMessage: (message: Record<string, unknown>) => sent.push(message) };
  const windowStub = {
    parent: fakeParent,
    addEventListener: (type: string, listener: (event: { source: unknown; data: unknown }) => void) => {
      if (type === "message") listeners.push(listener);
    },
    removeEventListener: () => {},
  };
  const documentStub = {
    getElementById: (id: string) => elements[id] ?? null,
    createElement: () => createFakeElement(),
  };

  const setIntervalCalls: unknown[][] = [];
  const clearIntervalCalls: unknown[][] = [];

  const context = vm.createContext({
    window: windowStub,
    document: documentStub,
    console,
    crypto: globalThis.crypto,
    structuredClone: globalThis.structuredClone,
    TextEncoder,
    TextDecoder,
    AbortController,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    setInterval: (...args: unknown[]) => {
      setIntervalCalls.push(args);
      return setIntervalCalls.length;
    },
    clearInterval: (...args: unknown[]) => {
      clearIntervalCalls.push(args);
    },
  });

  vm.runInContext(clockScript, context);
  vm.runInContext(bundleScript, context);

  return {
    elements,
    sent,
    setIntervalCalls,
    clearIntervalCalls,
    dispatchFromHost(data: Record<string, unknown>) {
      for (const listener of listeners) listener({ source: fakeParent, data });
    },
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function completeHandshake(run: ReturnType<typeof runFullRoomMapScripts>) {
  await tick();
  run.dispatchFromHost({
    jsonrpc: "2.0",
    id: run.sent[0]!.id,
    result: { protocolVersion: "2025-11-25", hostInfo: { name: "test-host", version: "0.0.0" }, hostCapabilities: {}, hostContext: {} },
  });
  await tick();
}

function sendToolResult(run: ReturnType<typeof runFullRoomMapScripts>, structuredContent: Record<string, unknown>) {
  run.dispatchFromHost({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: { content: [], structuredContent } });
  return tick();
}

describe("embedded view bundle applies tool-result to the DOM in place (OI-14 option B, stage 3)", () => {
  it("writes all five fields from structuredContent, and a later tool-result overwrites the earlier one", async () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    const run = runFullRoomMapScripts(html);
    await completeHandshake(run);

    await sendToolResult(run, {
      station: "Kessler Station",
      room: "Maintenance Bay 7",
      status: "active",
      remainingSeconds: 550,
      inventory: ["multitool"],
      discoveredFragments: { control_panel: "7X" },
      ventUnlocked: false,
      wrongAttempts: 0,
    });

    expect(run.elements.status.textContent).toBe("active");
    expect(run.elements.timer.textContent).toBe("09:10");
    expect(run.elements["inventory-list"].children).toHaveLength(1);
    expect(run.elements["fragments-list"].children).toHaveLength(1);
    expect(run.elements.vent.textContent).toBe("Vent: sealed");
    expect(run.elements.vent.classList.contains("locked")).toBe(true);

    await sendToolResult(run, {
      station: "Kessler Station",
      room: "Maintenance Bay 7",
      status: "active",
      remainingSeconds: 500,
      inventory: ["multitool"],
      discoveredFragments: { control_panel: "7X", vent: "Q2" },
      ventUnlocked: true,
      wrongAttempts: 1,
    });

    // The second tool-result's values replace the first's - no leftover from the earlier state.
    expect(run.elements.timer.textContent).toBe("08:20");
    expect(run.elements["fragments-list"].children).toHaveLength(2);
    expect(run.elements.vent.textContent).toBe("Vent: open");
    expect(run.elements.vent.classList.contains("unlocked")).toBe(true);
    expect(run.elements.vent.classList.contains("locked")).toBe(false);
  });

  it("stops the clock when a tool-result reports status escaped", async () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    const run = runFullRoomMapScripts(html);
    await completeHandshake(run);

    expect(run.setIntervalCalls).toHaveLength(1); // the initial active-state clock

    await sendToolResult(run, {
      station: "Kessler Station",
      room: "Maintenance Bay 7",
      status: "escaped",
      remainingSeconds: 212,
      inventory: ["multitool"],
      discoveredFragments: { control_panel: "7X", vent: "Q2" },
      ventUnlocked: true,
      wrongAttempts: 0,
    });

    expect(run.clearIntervalCalls.length).toBeGreaterThanOrEqual(1);
    expect(run.setIntervalCalls).toHaveLength(1); // no new interval started once escaped
    expect(run.elements.status.textContent).toBe("escaped");
    expect(run.elements.timer.textContent).toBe("03:32");
  });

  it("stops the clock when a tool-result reports status failed (timeout)", async () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    const run = runFullRoomMapScripts(html);
    await completeHandshake(run);

    expect(run.setIntervalCalls).toHaveLength(1);

    await sendToolResult(run, {
      station: "Kessler Station",
      room: "Maintenance Bay 7",
      status: "failed",
      remainingSeconds: 0,
      inventory: [],
      discoveredFragments: {},
      ventUnlocked: false,
      wrongAttempts: 2,
    });

    expect(run.clearIntervalCalls.length).toBeGreaterThanOrEqual(1);
    expect(run.setIntervalCalls).toHaveLength(1);
    expect(run.elements.status.textContent).toBe("failed");
    expect(run.elements.timer.textContent).toBe("00:00");
  });
});

describe("renderRoomMapHtml", () => {
  it("embeds the station/room name, status, and remaining seconds", () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));

    expect(html).toContain("Kessler Station");
    expect(html).toContain("Maintenance Bay 7");
    expect(html).toContain("active");
    expect(html).toContain("600"); // embedded seed for the client-side countdown
  });

  it("shows an empty-state placeholder with no inventory or fragments yet", () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));

    expect(html).toContain("empty");
    expect(html).toContain("none found yet");
  });

  it("lists discovered items and fragments once present", () => {
    const state = createInitialRoomState(T0);
    state.inventory.push("multitool");
    state.discoveredFragments.control_panel = "7X";
    const html = renderRoomMapHtml(toRoomStateView(state, T0));

    expect(html).toContain("multitool");
    expect(html).toContain("control_panel");
    expect(html).toContain("7X");
  });

  it("reflects vent status in the markup", () => {
    const state = createInitialRoomState(T0);
    expect(renderRoomMapHtml(toRoomStateView(state, T0))).toContain("sealed");
    state.ventUnlocked = true;
    expect(renderRoomMapHtml(toRoomStateView(state, T0))).toContain("open");
  });

  it("escapes HTML-significant characters in dynamic fields (defense in depth)", () => {
    const state = createInitialRoomState(T0);
    state.inventory.push('<script>alert(1)</script>');
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps the countdown ticking while the game is active", () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    const { setInterval } = runEmbeddedClockScript(html);

    expect(setInterval).toHaveBeenCalledTimes(1);
  });

  it("does not start the ticking countdown once the game is over (escaped)", () => {
    const state = createInitialRoomState(T0);
    state.escaped = true;
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    const { element, setInterval } = runEmbeddedClockScript(html);

    expect(setInterval).not.toHaveBeenCalled();
    expect(element.textContent).toBe("10:00"); // final state, not a live tick
  });

  it("does not start the ticking countdown once the game is over (failed)", () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0 + 10 * 60 * 1000));
    const { setInterval } = runEmbeddedClockScript(html);

    expect(setInterval).not.toHaveBeenCalled();
  });
});

describe("embedded MCP Apps view bundle (OI-14, option B)", () => {
  it("sends ui/initialize on load, and ui/notifications/initialized only after the host responds", async () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    const { sent, dispatchFromHost } = runViewBundle(html);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ jsonrpc: "2.0", method: "ui/initialize" });
    // SEP-1865, "Sandbox proxy" point 6: the Host MUST NOT send anything
    // before `initialized` - symmetric on the view side, nothing but
    // ui/initialize may go out before the host's response arrives.
    expect(sent.some((m) => m.method === "ui/notifications/initialized")).toBe(false);

    dispatchFromHost({
      jsonrpc: "2.0",
      id: sent[0]!.id,
      result: {
        protocolVersion: "2025-11-25",
        hostInfo: { name: "test-host", version: "0.0.0" },
        hostCapabilities: {},
        hostContext: {},
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sent).toHaveLength(2);
    expect(sent[1]).toMatchObject({ jsonrpc: "2.0", method: "ui/notifications/initialized" });
  });
});
