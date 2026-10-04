import type { CallToolResult, Client, Tool } from "@modelcontextprotocol/client";
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
 * (option A, below) should run at all (OI-14 option B, stage 3). Default is
 * "on" (unchanged behavior) - only the literal value "off" disables it;
 * anything else, including an absent param, keeps the existing refresh.
 *
 * Why this matters: every `refreshRoomView` call replaces `iframe.srcdoc`,
 * which makes the browser load a brand-new document into the iframe and
 * re-run its embedded `<script>`s from scratch - including the view bundle,
 * which calls `App.connect()` again and sends a second `ui/initialize` on
 * the same host<->view pipe. `AppBridge._onAppsInitialize` (see
 * node_modules/@modelcontextprotocol/ext-apps/dist/src/app-bridge.js)
 * handles that gracefully (replaces the stored appInfo, logs
 * "AppBridge received a second ui/initialize") rather than erroring, but it
 * is still a second handshake the host never asked for. With `refresh=off`,
 * this function never runs after the initial mount, so the iframe's
 * document - and the view's `App` instance inside it - lives for the whole
 * session, and `ui/initialize` fires exactly once.
 */
export function shouldRefreshSrcdoc(search: string): boolean {
  return new URLSearchParams(search).get("refresh") !== "off";
}

/**
 * Re-reads the room-view resource and replaces the iframe's content.
 *
 * Audit OI-14, option A: the resource already renders fresh state on every
 * read (server/src/room/uiRoomMap.ts). Originally the only update
 * mechanism (the view had no live channel to the host); option B (stage 2:
 * `sendToolCallToView` below, stage 3: the view's own DOM update) now
 * covers the same state changes without a document reload, so this is kept
 * as a second, independent path - callers gate it on `shouldRefreshSrcdoc`
 * (OI-14 stage 3) rather than removing it, since a real MCP Apps host that
 * remounts its own view per tool call needs this entry point to exist
 * regardless of our client's own toggle.
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
export async function sendToolCallToView(
  host: Pick<RoomHost, "bridge" | "tools" | "viewReady">,
  call: { name: string; arguments?: Record<string, unknown> },
  result: CallToolResult,
): Promise<void> {
  if (!host.viewReady) return;

  const tool = host.tools.find((candidate) => candidate.name === call.name);
  if (tool) {
    host.bridge.setHostContext({ toolInfo: { tool } });
  }

  await host.bridge.sendToolInput({ arguments: call.arguments ?? {} });
  await host.bridge.sendToolResult(result);
}
