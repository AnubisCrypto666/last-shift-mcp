import type { CallToolResult, Client, RequestId, Tool } from "@modelcontextprotocol/client";
import { AppBridge, PostMessageTransport, buildAllowAttribute, getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";

export interface RoomHost {
  iframe: HTMLIFrameElement;
  bridge: AppBridge;
  resourceUri: string;
  /** The server's tools, as returned by the one `listTools()` call in `mountRoomView` - looked up by name in `sendToolCallToView` to fill `McpUiHostContext.toolInfo`. */
  tools: Tool[];
  /**
   * True once the view has completed the `ui/initialize` ->
   * `ui/notifications/initialized` handshake (set by the `bridge.oninitialized`
   * callback wired up in `mountRoomView`). Per SEP-1865 ("Sandbox proxy",
   * point 6): "The Host MUST NOT send any request or notification to the
   * View before it receives an `initialized` notification" - `sendToolCallToView`
   * checks this before calling `sendToolInput`/`sendToolResult`.
   */
  viewReady: boolean;
}

/**
 * Finds the UI resource declared on any of the connected server's tools
 * (via `_meta.ui.resourceUri`), reads it, and mounts it in a sandboxed
 * iframe wired to a real AppBridge/PostMessageTransport host connection -
 * the same mechanism plan-pracy specifies for Alexa+'s MCP Apps (RESEARCH.md
 * B5-bis), not a bespoke iframe.
 *
 * `ui://room-map`'s server-rendered HTML (server/src/room/uiRoomMap.ts) now
 * inlines a real MCP Apps *view* runtime (server/src/room/view/roomMapView.ts,
 * OI-14 option B) that performs the `ui/initialize` handshake, so
 * `bridge.oninitialized` does fire - once it does, `viewReady` flips to
 * `true` and `sendToolCallToView` below is allowed to send notifications.
 */
async function readResourceHtml(client: Client, uri: string): Promise<string> {
  const { contents } = await client.readResource({ uri });
  const content = contents[0];
  const html = content && "text" in content ? content.text : undefined;
  if (typeof html !== "string") {
    throw new Error(`Resource ${uri} did not return text content`);
  }
  return html;
}

export async function mountRoomView(client: Client, container: HTMLElement): Promise<RoomHost | undefined> {
  const { tools } = await client.listTools();
  const toolWithUi = tools.find((tool) => getToolUiResourceUri(tool) !== undefined);
  const resourceUri = toolWithUi ? getToolUiResourceUri(toolWithUi) : undefined;
  if (!resourceUri) return undefined;

  const html = await readResourceHtml(client, resourceUri);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts");
  const allow = buildAllowAttribute(undefined);
  if (allow) iframe.setAttribute("allow", allow);
  container.replaceChildren(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    throw new Error("Room iframe has no contentWindow after insertion");
  }

  const bridge = new AppBridge(
    client,
    { name: "last-shift-mcp-client", version: "0.1.0" },
    { serverTools: {} },
  );
  // OI-14 (option B): the iframe below is sandboxed without
  // `allow-same-origin`, so it has an opaque origin - there is no `origin`
  // string to check. Passing `frameWindow` as PostMessageTransport's
  // `eventSource` makes it validate inbound messages by
  // `event.source === frameWindow` instead (see
  // @modelcontextprotocol/ext-apps/message-transport.ts), which works
  // regardless of origin opacity. Confirmed by reading the transport's
  // source (checked into node_modules): it never reads `event.origin`.
  const transport = new PostMessageTransport(frameWindow, frameWindow);
  await bridge.connect(transport);

  const host: RoomHost = { iframe, bridge, resourceUri, tools, viewReady: false };
  bridge.oninitialized = () => {
    host.viewReady = true;
  };

  iframe.srcdoc = html;

  return host;
}

/**
 * Reads the `?refresh=` query parameter deciding whether `refreshRoomView`
 * (option A, below) should run at all. OI-14 stage 4 flips the default to
 * disabled: only the exact literal "on" enables it now; anything else,
 * including an absent param or the literal "off", keeps it disabled. (Up
 * through stage 3 this was inverted - default "on", only "off" disabled it;
 * see this function's git history for that version and its own rationale.)
 *
 * Why the flip is safe: every `refreshRoomView` call replaces
 * `iframe.srcdoc`, which makes the browser load a brand-new document into
 * the iframe and re-run its embedded `<script>`s from scratch - including
 * the view bundle, which calls `App.connect()` again and sends a second
 * `ui/initialize` on the same host<->view pipe. `AppBridge._onAppsInitialize`
 * (see node_modules/@modelcontextprotocol/ext-apps/dist/src/app-bridge.js)
 * handles that gracefully (replaces the stored appInfo, logs
 * "AppBridge received a second ui/initialize") rather than erroring, but
 * it's still a handshake the host never asked for, and real MCP Apps hosts
 * (Alexa+ included) never do this - stage 2/3's own `sendToolCallToView`
 * channel is what they rely on instead. The owner's playtest (2026-10-05,
 * real Bedrock, Chrome) confirmed the no-refresh path end to end: one
 * handshake per session, correct tool-input/tool-result ordering, all five
 * map fields updating in place, and the clock stopping correctly on
 * escape - see OPEN-ITEMS.md OI-14 history for the exact log lines. `?refresh=on`
 * is kept as an explicit, opt-in diagnostic switch that simulates a host
 * which remounts its view on every tool call (also a spec-legal pattern -
 * see OI-14's "Uwaga o trybie widoku").
 */
export function shouldRefreshSrcdoc(search: string): boolean {
  return new URLSearchParams(search).get("refresh") === "on";
}

/**
 * Re-reads the room-view resource and replaces the iframe's content.
 *
 * Audit OI-14, option A: the resource already renders fresh state on every
 * read (server/src/room/uiRoomMap.ts). Originally the only update
 * mechanism (the view had no live channel to the host); option B (stage 2:
 * `sendToolCallToView` below, stage 3: the view's own DOM update) now
 * covers the same state changes without a document reload, and stage 4
 * made that the default. This function stays as an explicit,
 * `?refresh=on`-gated diagnostic path (`shouldRefreshSrcdoc`) rather than
 * being removed, so a view-remounting host pattern stays exercisable
 * on demand.
 */
export async function refreshRoomView(client: Client, host: RoomHost): Promise<void> {
  host.iframe.srcdoc = await readResourceHtml(client, host.resourceUri);
}

/**
 * Forwards one completed `tools/call` to the view over the real MCP Apps
 * host->view channel (OI-14 option B, stage 2), alongside the existing
 * srcdoc refresh (option A, `refreshRoomView`) - the two are independent and
 * both still run after every tool call.
 *
 * Per SEP-1865: `ui/notifications/tool-input` is MUST and must precede
 * `ui/notifications/tool-result` (also MUST, conditionally - see OPEN-ITEMS.md
 * OI-14); both are no-ops here until the view's handshake completes
 * (`host.viewReady`), since the Host MUST NOT send either before
 * `ui/notifications/initialized` ("Sandbox proxy", point 6).
 *
 * Neither notification's `params` carries the tool's name (see
 * spec.types.d.ts: `McpUiToolInputNotification`/`McpUiToolResultNotification`).
 * The spec-sanctioned place for that is `McpUiHostContext.toolInfo.tool`
 * (sent via `ui/notifications/host-context-changed`), which `bridge.setHostContext`
 * updates here immediately before `sendToolInput` - in-band protocol state,
 * not a side channel smuggled into the wrong notification's params.
 */
/**
 * Local, monotonically increasing stand-in for the "JSON-RPC id of the
 * tools/call request" `McpUiHostContext.toolInfo.id` is documented to carry
 * (spec.types.d.ts). We don't thread the real MCP request id through from
 * `client.callTool()` here, but any value that changes on every call is
 * enough to fix the bug below, and `id`'s whole documented purpose is to
 * distinguish one call from the next.
 *
 * Root cause (OI-14 stage 4, playtest anomaly 2026-10-05): `AppBridge.setHostContext`
 * (node_modules/@modelcontextprotocol/ext-apps/dist/src/app-bridge.js) diffs
 * the new context against its cached `_hostContext` by `JSON.stringify`
 * equality and silently skips `sendHostContextChange` (hence no
 * `ui/notifications/host-context-changed`) when nothing differs. Without
 * this counter, two consecutive calls to the *same* tool (e.g. "examine
 * control panel" then "examine toolbox" - both `examine_room`) produced an
 * identical `{ toolInfo: { tool } }` payload, so the second call's
 * notification was dropped - the view's `currentToolName` (roomMapView.ts)
 * was never updated for that call and logged "?" instead of the tool name.
 * Confirmed by reproducing it directly against the real `AppBridge` class
 * in client/test/roomHost.test.ts before adding this fix.
 */
let toolCallSequence: RequestId = 0;

export async function sendToolCallToView(
  host: Pick<RoomHost, "bridge" | "tools" | "viewReady">,
  call: { name: string; arguments?: Record<string, unknown> },
  result: CallToolResult,
): Promise<void> {
  if (!host.viewReady) return;

  const tool = host.tools.find((candidate) => candidate.name === call.name);
  if (tool) {
    toolCallSequence = Number(toolCallSequence) + 1;
    host.bridge.setHostContext({ toolInfo: { id: toolCallSequence, tool } });
  }

  await host.bridge.sendToolInput({ arguments: call.arguments ?? {} });
  await host.bridge.sendToolResult(result);
}
