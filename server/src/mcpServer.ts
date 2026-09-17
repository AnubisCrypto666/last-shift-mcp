import { McpServer } from "@modelcontextprotocol/server";
import { registerRoomStateResource } from "./room/roomResource.js";
import { registerExamineRoomTool, type ExamineRoomDeps } from "./room/examineRoom.js";
import { registerUseItemTool } from "./room/useItem.js";
import { registerAttemptEscapeTool } from "./room/attemptEscape.js";
import { registerRoomMapResource } from "./room/uiRoomMap.js";
import { createInitialRoomState } from "./room/state.js";

export interface McpServerOptions {
  /** Overrides for room-engine dependencies (narration, demo mode) - test-only in practice. */
  roomDeps?: Partial<ExamineRoomDeps>;
}

/**
 * Creates a fresh MCP server instance with its own room-engine state
 * (plan-pracy section 2, Component 1). One `McpServer` is created per
 * session (see app.ts), so a fresh `RoomState` here means each session
 * plays its own, independent room - no cross-session leakage.
 *
 * Built on @modelcontextprotocol/server (v2), not the v1 @modelcontextprotocol/sdk
 * monolith - v2 is required for @modelcontextprotocol/ext-apps (the ui://
 * room-map resource) and is the MCP maintainers' own stated stable line.
 * See NOTES.md, 2026-09-16.
 */
export function createMcpServer(options: McpServerOptions = {}): McpServer {
  const server = new McpServer({
    name: "last-shift-mcp",
    version: "0.1.0",
  });

  const state = createInitialRoomState();
  registerRoomStateResource(server, state);
  registerRoomMapResource(server, state);
  registerExamineRoomTool(server, state, options.roomDeps);
  registerUseItemTool(server, state);
  registerAttemptEscapeTool(server, state);

  return server;
}
