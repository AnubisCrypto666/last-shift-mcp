import type { McpServer } from "@modelcontextprotocol/server";
import { toRoomStateView, type RoomState } from "./state.js";

export const ROOM_STATE_URI = "room://state";

/**
 * Registers the `room://state` resource: structured JSON of the room,
 * inventory, and remaining time. Read-only - all mutation happens through
 * the tools (examine_room, use_item, attempt_escape).
 */
export function registerRoomStateResource(server: McpServer, state: RoomState): void {
  server.registerResource(
    "Room State",
    ROOM_STATE_URI,
    {
      title: "Room State",
      description: "Current room, inventory, discovered fragments, and time remaining.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: ROOM_STATE_URI,
          mimeType: "application/json",
          text: JSON.stringify(toRoomStateView(state)),
        },
      ],
    }),
  );
}
