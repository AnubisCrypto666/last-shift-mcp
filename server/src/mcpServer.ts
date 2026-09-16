import { McpServer } from "@modelcontextprotocol/server";

/**
 * Creates a fresh MCP server instance. Tools, resources, and the elicitation
 * flow are registered separately, once the room logic lands (plan-pracy
 * section 2, step 4) - this factory only carries server identity so the
 * transport scaffold has something real to connect to.
 *
 * Built on @modelcontextprotocol/server (v2), not the v1 @modelcontextprotocol/sdk
 * monolith - v2 is required for @modelcontextprotocol/ext-apps (the ui://
 * room-map resource, step 4) and is the MCP maintainers' own stated stable
 * line. See NOTES.md, 2026-09-16.
 */
export function createMcpServer(): McpServer {
  return new McpServer({
    name: "last-shift-mcp",
    version: "0.1.0",
  });
}
