import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { statusOverMessage } from "./examineRoom.js";
import { VENT_FRAGMENT, getStatus, type RoomState } from "./state.js";
import { ROOM_MAP_URI } from "./uiRoomMap.js";

/**
 * use_item is deliberately plain, deterministic text - no sampling/Bedrock
 * narration. Only examine_room carries that per plan-pracy section 2; a
 * fixed action-result message keeps the one puzzle chain reliable and fast.
 */
export function applyUseItem(state: RoomState, item: string, target: string): string {
  if (item !== "multitool") {
    return `You don't have a ${item}.`;
  }
  if (!state.inventory.includes("multitool")) {
    return "You don't have a multitool. Try examining the toolbox first.";
  }
  if (target !== "vent") {
    return "That doesn't do anything here.";
  }
  if (state.ventUnlocked) {
    return "The vent panel is already open.";
  }

  state.ventUnlocked = true;
  state.discoveredFragments.vent = VENT_FRAGMENT;
  return "You wedge the multitool into the seam and force the vent panel open. Wiring spills out - and scratched into the metal behind it, a second code fragment.";
}

export function registerUseItemTool(server: McpServer, state: RoomState): void {
  server.registerTool(
    "use_item",
    {
      title: "Use Item",
      description: "Use an item from your inventory on something in the room, e.g. the multitool on the vent.",
      inputSchema: z.object({
        item: z.enum(["multitool"]).describe("The item to use, from your inventory."),
        target: z.enum(["vent"]).describe("What to use it on."),
      }),
      _meta: { ui: { resourceUri: ROOM_MAP_URI } },
    },
    async (args) => {
      const status = getStatus(state);
      if (status !== "active") {
        return { content: [{ type: "text" as const, text: statusOverMessage(status) }] };
      }
      const text = applyUseItem(state, args.item, args.target);
      return { content: [{ type: "text" as const, text }] };
    },
  );
}
