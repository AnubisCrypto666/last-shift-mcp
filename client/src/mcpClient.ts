import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const SERVER_URL = new URL(import.meta.env.VITE_MCP_SERVER_URL ?? "http://127.0.0.1:3000/mcp");

let client: Client | undefined;
let connecting: Promise<Client> | undefined;

/**
 * Lazily connects once and reuses the same session for the app's lifetime.
 * Concurrent callers await the same in-flight connect rather than racing
 * separate initialize handshakes.
 */
export function getClient(): Promise<Client> {
  if (client) return Promise.resolve(client);
  if (!connecting) {
    connecting = (async () => {
      const instance = new Client(
        { name: "last-shift-mcp-client", version: "0.1.0" },
        { capabilities: { elicitation: {} } },
      );
      const transport = new StreamableHTTPClientTransport(SERVER_URL);
      await instance.connect(transport);
      client = instance;
      return instance;
    })();
  }
  return connecting;
}
