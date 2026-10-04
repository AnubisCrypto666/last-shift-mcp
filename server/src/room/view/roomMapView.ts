import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { roomStateViewSchema } from "../roomStateSchema.js";

declare global {
  interface Window {
    /** Set by the inline clock `<script>` in uiRoomMap.ts - see that file's doc comment. */
    __roomMapClock?: { resync(remainingSeconds: number, status: string): void };
  }
}

type RoomStateView = ReturnType<typeof roomStateViewSchema.parse>;

/**
 * MCP Apps *view* side of ui://room-map (OI-14, option B). Bundled by
 * esbuild (see package.json's build:view script) into a single
 * self-contained IIFE and inlined as a plain <script> by
 * server/src/room/uiRoomMap.ts - this file never runs under Node, only
 * inside the sandboxed iframe a host mounts the resource HTML into.
 *
 * The iframe has no `allow-same-origin` (see client/src/roomHost.ts), so its
 * origin is opaque; the only channel to the host is window.parent via
 * postMessage. PostMessageTransport validates inbound messages by
 * `event.source`, not by origin - see roomHost.ts for the host-side half of
 * that.
 *
 * App.connect() performs the full SEP-1865 handshake: sends `ui/initialize`,
 * waits for the host's response, then sends `ui/notifications/initialized`.
 * Per spec ("Sandbox proxy", point 6): "The Host MUST NOT send any request
 * or notification to the View before it receives an `initialized`
 * notification" - so nothing else may happen before connect() resolves.
 * Stage 1 (session 2026-09-29) proved this handshake. Stage 2 added the
 * host->view data channel (tool-input/tool-result, logged only). Stage 3
 * (this file, OI-14 history) applies `tool-result`'s `structuredContent` to
 * this document in place - see `applyRoomStateView` below - instead of only
 * logging it, so the view also works when a host never re-sends the
 * `ui://room-map` resource after the first read (option A's `iframe.srcdoc`
 * replace is the other, independent update path - see uiRoomMap.ts).
 */
const app = new App({ name: "last-shift-room-map", version: "0.1.0" }, {});

/**
 * `ui/notifications/tool-input` and `ui/notifications/tool-result` (see
 * spec.types.d.ts) carry arguments and the CallToolResult respectively, but
 * neither carries the tool's *name* - that field only exists on
 * `McpUiHostContext.toolInfo.tool`, sent via `ui/notifications/host-context-
 * changed`. roomHost.ts (OI-14 option B, stage 2) updates toolInfo via
 * `AppBridge.setHostContext()` immediately before each sendToolInput call,
 * so by the time tool-input/tool-result arrive here, this already holds the
 * name of the tool that was just called - this is in-band protocol state,
 * not a side channel.
 */
let currentToolName: string | undefined;

/**
 * Rebuilds the five DOM regions `uiRoomMap.ts` renders (status, inventory,
 * fragments, vent, clock) from a validated `structuredContent` payload,
 * without touching the rest of the document - no `innerHTML`, no
 * re-parsing. A later call simply overwrites the DOM state of an earlier
 * one; there is no stale leftover because every region is fully replaced
 * (`replaceChildren`/`textContent`), not appended to.
 */
function applyRoomStateView(view: RoomStateView): void {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = view.status;

  const inventoryEl = document.getElementById("inventory-list");
  if (inventoryEl) {
    inventoryEl.replaceChildren();
    if (view.inventory.length === 0) {
      const li = document.createElement("li");
      const em = document.createElement("em");
      em.textContent = "empty";
      li.append(em);
      inventoryEl.append(li);
    } else {
      for (const item of view.inventory) {
        const li = document.createElement("li");
        li.textContent = item;
        inventoryEl.append(li);
      }
    }
  }

  const fragmentsEl = document.getElementById("fragments-list");
  if (fragmentsEl) {
    fragmentsEl.replaceChildren();
    const entries = Object.entries(view.discoveredFragments);
    if (entries.length === 0) {
      const li = document.createElement("li");
      const em = document.createElement("em");
      em.textContent = "none found yet";
      li.append(em);
      fragmentsEl.append(li);
    } else {
      for (const [key, value] of entries) {
        const li = document.createElement("li");
        li.append(`${key}: `);
        const strong = document.createElement("strong");
        strong.textContent = value ?? "";
        li.append(strong);
        fragmentsEl.append(li);
      }
    }
  }

  const ventEl = document.getElementById("vent");
  if (ventEl) {
    ventEl.textContent = `Vent: ${view.ventUnlocked ? "open" : "sealed"}`;
    ventEl.classList.toggle("unlocked", view.ventUnlocked);
    ventEl.classList.toggle("locked", !view.ventUnlocked);
  }

  // Resyncs the one clock uiRoomMap.ts's inline script owns (see that
  // file's doc comment) instead of starting a second interval here.
  window.__roomMapClock?.resync(view.remainingSeconds, view.status);
}

app.addEventListener("hostcontextchanged", (ctx) => {
  if (ctx.toolInfo?.tool?.name) currentToolName = ctx.toolInfo.tool.name;
});

app.addEventListener("toolinput", (params) => {
  console.log(`[room-map view] tool-input ${currentToolName ?? "?"} ${JSON.stringify(params.arguments ?? {})}`);
});

app.addEventListener("toolresult", (params) => {
  console.log(`[room-map view] tool-result ${currentToolName ?? "?"} ${JSON.stringify(params.structuredContent ?? null)}`);
  const parsed = roomStateViewSchema.safeParse(params.structuredContent);
  if (parsed.success) {
    applyRoomStateView(parsed.data);
  } else {
    console.error("[room-map view] tool-result structuredContent failed roomStateViewSchema validation", parsed.error);
  }
});

app
  .connect(new PostMessageTransport(window.parent, window.parent))
  .then(() => {
    console.log("[room-map view] MCP Apps handshake complete (ui/initialize -> ui/notifications/initialized)");
  })
  .catch((error) => {
    console.error("[room-map view] MCP Apps handshake failed", error);
  });
