import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { toRoomStateView, type RoomState } from "./state.js";

export const ROOM_MAP_URI = "ui://room-map";

// Same relative depth from src/room/ (dev, via tsx) and dist/room/ (prod,
// via tsc) up to the server package root, so this resolves correctly either
// way: server/{src,dist}/room/uiRoomMap.{ts,js} -> ../../build/...
const VIEW_BUNDLE_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../build/roomMapView.bundle.js");

/**
 * The MCP Apps *view* runtime (server/src/room/view/roomMapView.ts),
 * pre-bundled by esbuild into a self-contained IIFE (OI-14, option B) -
 * see package.json's build:view script, wired to run automatically before
 * build/dev/start/test via npm pre-hooks. Read once at module load; a
 * missing file means build:view hasn't run yet.
 */
const VIEW_BUNDLE_JS = (() => {
  try {
    return readFileSync(VIEW_BUNDLE_PATH, "utf8");
  } catch (error) {
    throw new Error(
      `Room-map view bundle not found at ${VIEW_BUNDLE_PATH}. Run "npm run build:view" first (npm run dev/build/start/test do this automatically). Cause: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
})();

function escapeHtml(value: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (ch) => map[ch]!);
}

// A minified third-party bundle could in principle contain the literal
// substring "</script" inside a string constant, which would prematurely
// close our inline <script> tag at the HTML-parser level regardless of JS
// syntax. Neutralize it without changing the bundle's behavior.
function escapeScriptClose(js: string): string {
  return js.replace(/<\/script/gi, "<\\/script");
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
      var status = ${JSON.stringify(view.status)};
      var el = document.getElementById("timer");
      function render() {
        var m = Math.floor(Math.max(0, remaining) / 60);
        var s = Math.max(0, remaining) % 60;
        el.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      }
      render();
      if (status === "active") {
        var interval = setInterval(function () {
          remaining -= 1;
          if (remaining <= 0) { remaining = 0; clearInterval(interval); }
          render();
        }, 1000);
      }
    })();
  </script>
  <script>${escapeScriptClose(VIEW_BUNDLE_JS)}</script>
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
