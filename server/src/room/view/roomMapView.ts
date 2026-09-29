import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";

/**
 * MCP Apps *view* side of ui://room-map (OI-14, option B, stage 1: handshake
 * only). Bundled by esbuild (see package.json's build:view script) into a
 * single self-contained IIFE and inlined as a plain <script> by
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
 * Stage 1 only proves this handshake; tool-input/tool-result handling and
 * DOM updates land in later stages (OI-14 history, session 2026-09-29).
 */
const app = new App({ name: "last-shift-room-map", version: "0.1.0" }, {});

app
  .connect(new PostMessageTransport(window.parent, window.parent))
  .then(() => {
    console.log("[room-map view] MCP Apps handshake complete (ui/initialize -> ui/notifications/initialized)");
  })
  .catch((error) => {
    console.error("[room-map view] MCP Apps handshake failed", error);
  });
