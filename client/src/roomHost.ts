import type { Client } from "@modelcontextprotocol/client";
import { AppBridge, PostMessageTransport, buildAllowAttribute, getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";

export interface RoomHost {
  iframe: HTMLIFrameElement;
  bridge: AppBridge;
  resourceUri: string;
}

/**
 * Finds the UI resource declared on any of the connected server's tools
 * (via `_meta.ui.resourceUri`), reads it, and mounts it in a sandboxed
 * iframe wired to a real AppBridge/PostMessageTransport host connection -
 * the same mechanism plan-pracy specifies for Alexa+'s MCP Apps (RESEARCH.md
 * B5-bis), not a bespoke iframe.
 *
 * Known limitation, not yet resolved: `ui://room-map`'s server-rendered HTML
 * (server/src/room/uiRoomMap.ts) only runs a local countdown script - it
 * does not implement the MCP Apps *view* side of the protocol (no
 * `ui/notifications/initialized`, no listening for host requests). So
 * `bridge.oninitialized` will not fire yet; this step only proves the host
 * side (iframe + transport + bridge) and the resource's own local behavior
 * (the ticking clock) work together. Whether to extend the view side is a
 * separate decision, not made here.
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
  const transport = new PostMessageTransport(frameWindow, frameWindow);
  await bridge.connect(transport);

  iframe.srcdoc = html;

  return { iframe, bridge, resourceUri };
}

/**
 * Re-reads the room-view resource and replaces the iframe's content.
 *
 * Stopgap (audit OI-14, option A): the resource already renders fresh
 * state on every read (server/src/room/uiRoomMap.ts), but the view has no
 * live channel to the host (see the known-limitation note above) - a full
 * `srcdoc` replace is the only way to reflect a state change today. Call
 * this after every tool call that might have changed room state.
 */
export async function refreshRoomView(client: Client, host: RoomHost): Promise<void> {
  host.iframe.srcdoc = await readResourceHtml(client, host.resourceUri);
}
