import type { Client } from "@modelcontextprotocol/client";

const ROOM_STATE_URI = "room://state";

interface RoomStateView {
  station: string;
  room: string;
  status: string;
  remainingSeconds: number;
  inventory: string[];
  discoveredFragments: Record<string, string>;
  ventUnlocked: boolean;
}

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Text narration of the room's structured state, independent of the visual
 * ui://room-map panel - the MCP Design Guide's voice-only fallback
 * requirement (NOTES.md, 2026-09-17: "data must remain intelligible without
 * any visual support"), which the iframe resource itself does not provide.
 * Read at session start and after each action (main.ts), per the confirmed
 * Component 2 brief section 3.
 */
export async function narrateRoomState(client: Client): Promise<string> {
  const { contents } = await client.readResource({ uri: ROOM_STATE_URI });
  const content = contents[0];
  const text = content && "text" in content ? content.text : undefined;
  if (typeof text !== "string") {
    throw new Error(`Resource ${ROOM_STATE_URI} did not return text content`);
  }
  const state = JSON.parse(text) as RoomStateView;

  const inventory = state.inventory.length ? state.inventory.join(", ") : "nothing";
  const fragments = Object.values(state.discoveredFragments);
  const fragmentText = fragments.length ? fragments.join(", ") : "no fragments found yet";

  return (
    `${state.station} - ${state.room}. Status: ${state.status}. ` +
    `Time remaining: ${formatClock(state.remainingSeconds)}. ` +
    `Inventory: ${inventory}. Fragments: ${fragmentText}. ` +
    `Vent: ${state.ventUnlocked ? "open" : "sealed"}.`
  );
}
