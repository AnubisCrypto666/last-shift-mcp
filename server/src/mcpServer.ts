import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Creates a fresh MCP server instance. Tools, resources, and the elicitation
 * flow are registered separately, once the room logic lands (plan-pracy
 * section 2, step 4) - this factory only carries server identity so the
 * transport scaffold has something real to connect to.
 */
export function createMcpServer(): McpServer {
  return new McpServer({
    name: "last-shift-mcp",
    version: "0.1.0",
  });
}
