import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

/**
 * Protocol-level smoke test, not a UI - confirms the client-side v2 SDK can
 * actually complete initialize -> tools/list against the real running
 * server before any host/UI work depends on it (OI-04 prep).
 */
async function main(): Promise<void> {
  const serverUrl = new URL(process.env.MCP_SERVER_URL ?? "http://127.0.0.1:3000/mcp");

  const client = new Client({ name: "last-shift-mcp-client-verify", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(serverUrl);

  await client.connect(transport);
  console.log(`Connected. Server: ${JSON.stringify(client.getServerVersion())}`);

  const { tools } = await client.listTools();
  console.log(`tools/list returned ${tools.length} tool(s):`);
  for (const tool of tools) {
    console.log(`  - ${tool.name}`);
  }

  await client.close();
}

main().catch((error) => {
  console.error("Connection verification failed:", error);
  process.exitCode = 1;
});
