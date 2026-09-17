import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { toRoomStateView, type RoomState } from "./state.js";

export const ROOM_MAP_URI = "ui://room-map";

function escapeHtml(value: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (ch) => map[ch]!);
}

/**
 * MCP Apps HTML per RESEARCH.md B5-bis: this is the `ui://` resource
 * content only - the sandboxed iframe + postMessage HOST side is the
 * client's responsibility (plan-pracy section 2, Component 2), not the
 * server's. The countdown ticks locally via embedded JS seeded from the
 * server's `remainingSeconds` at read time; real state changes (items,
 * fragments, vent) require a fresh resource read, which a host re-issues
 * around each related tool call.
 */
export function renderRoomMapHtml(view: ReturnType<typeof toRoomStateView>): string {
  const itemsHtml = view.inventory.length
    ? view.inventory.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li><em>empty</em></li>";

  const fragmentEntries = Object.entries(view.discoveredFragments) as [string, string][];
  const fragmentsHtml = fragmentEntries.length
    ? fragmentEntries.map(([key, value]) => `<li>${escapeHtml(key)}: <strong>${escapeHtml(value)}</strong></li>`).join("")
    : "<li><em>none found yet</em></li>";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: system-ui, sans-serif; background: #160303; color: #f5e6c8; margin: 0; padding: 16px; }
  h1 { font-size: 1rem; letter-spacing: .05em; text-transform: uppercase; color: #ff6b57; margin: 0 0 8px; }
  #timer { font-size: 2.5rem; font-variant-numeric: tabular-nums; color: #ff6b57; }
  .panel { border: 1px solid #4a1f1f; border-radius: 8px; padding: 12px; margin-top: 12px; background: #210606; }
  ul { margin: 4px 0 0; padding-left: 1.2em; }
  .vent { color: ${view.ventUnlocked ? "#7cfc9a" : "#f5e6c8"}; }
  .status { text-transform: uppercase; letter-spacing: .05em; font-size: .8rem; opacity: .8; }
</style>
</head>
<body>
  <h1>${escapeHtml(view.station)} &mdash; ${escapeHtml(view.room)}</h1>
  <div class="status">${escapeHtml(view.status)}</div>
  <div id="timer">--:--</div>
  <div class="panel">
    <strong>Inventory</strong>
    <ul>${itemsHtml}</ul>
  </div>
  <div class="panel">
    <strong>Fragments found</strong>
    <ul>${fragmentsHtml}</ul>
  </div>
  <div class="panel vent">Vent: ${view.ventUnlocked ? "open" : "sealed"}</div>
  <script>
    (function () {
      var remaining = ${JSON.stringify(view.remainingSeconds)};
      var el = document.getElementById("timer");
      function render() {
        var m = Math.floor(Math.max(0, remaining) / 60);
        var s = Math.max(0, remaining) % 60;
        el.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      }
      render();
      var interval = setInterval(function () {
        remaining -= 1;
        if (remaining <= 0) { remaining = 0; clearInterval(interval); }
        render();
      }, 1000);
    })();
  </script>
</body>
</html>`;
}

export function registerRoomMapResource(server: McpServer, state: RoomState): void {
  registerAppResource(
    server,
    "Room Map",
    ROOM_MAP_URI,
    { description: "Live map of Maintenance Bay 7: inventory, discovered fragments, vent status, and the countdown timer." },
    async () => ({
      contents: [
        {
          uri: ROOM_MAP_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: renderRoomMapHtml(toRoomStateView(state)),
        },
      ],
    }),
  );
}
