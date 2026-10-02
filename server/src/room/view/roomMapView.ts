import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";

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
 * Stage 1 (session 2026-09-29) proved this handshake. Stage 2 (this file,
 * OI-14 history) adds the host->view data channel: tool-input and
 * tool-result are received here and logged only - DOM updates are stage 3.
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

app.addEventListener("hostcontextchanged", (ctx) => {
  if (ctx.toolInfo?.tool?.name) currentToolName = ctx.toolInfo.tool.name;
});

app.addEventListener("toolinput", (params) => {
  console.log(`[room-map view] tool-input ${currentToolName ?? "?"} ${JSON.stringify(params.arguments ?? {})}`);
});

app.addEventListener("toolresult", (params) => {
  console.log(`[room-map view] tool-result ${currentToolName ?? "?"} ${JSON.stringify(params.structuredContent ?? null)}`);
});

app
  .connect(new PostMessageTransport(window.parent, window.parent))
  .then(() => {
    console.log("[room-map view] MCP Apps handshake complete (ui/initialize -> ui/notifications/initialized)");
  })
  .catch((error) => {
    console.error("[room-map view] MCP Apps handshake failed", error);
  });
