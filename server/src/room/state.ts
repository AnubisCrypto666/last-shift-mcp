/**
 * Room content and state for "Ostatnia Szychta" (The Last Shift): a
 * maintenance technician trapped in Maintenance Bay 7 aboard Kessler
 * Station during a coolant-leak decompression countdown, escaping by
 * assembling a code from two discovered fragments.
 *
 * Content is intentionally small and fixed (plan-pracy section 5: tight
 * scope over breadth) - one room, three examine targets, one item, one
 * puzzle chain. Pure, framework-free functions here so they're unit
 * testable without any MCP machinery.
 */

export const STATION_NAME = "Kessler Station";
export const ROOM_NAME = "Maintenance Bay 7";
export const DURATION_SECONDS = 600;

export const CONTROL_PANEL_FRAGMENT = "7X";
export const VENT_FRAGMENT = "Q2";
export const MULTITOOL_ITEM = "multitool";

export type RoomStatus = "active" | "escaped" | "failed";

export interface RoomState {
  startedAt: number;
  durationSeconds: number;
  inventory: string[];
  discoveredFragments: Partial<Record<"control_panel" | "vent", string>>;
  ventUnlocked: boolean;
  escaped: boolean;
  wrongAttempts: number;
}

export function createInitialRoomState(now: number = Date.now()): RoomState {
  return {
    startedAt: now,
    durationSeconds: DURATION_SECONDS,
    inventory: [],
    discoveredFragments: {},
    ventUnlocked: false,
    escaped: false,
    wrongAttempts: 0,
  };
}

export function getRemainingSeconds(state: RoomState, now: number = Date.now()): number {
  const elapsed = (now - state.startedAt) / 1000;
  return Math.max(0, Math.round(state.durationSeconds - elapsed));
}

export function getStatus(state: RoomState, now: number = Date.now()): RoomStatus {
  if (state.escaped) return "escaped";
  if (getRemainingSeconds(state, now) <= 0) return "failed";
  return "active";
}

/** The code the player must submit to escape, once both fragments are found. */
export function getEscapeCode(state: RoomState): string | undefined {
  const { control_panel, vent } = state.discoveredFragments;
  if (control_panel && vent) return `${control_panel}${vent}`;
  return undefined;
}

/** JSON-serializable view of the room, for the `room://state` resource. */
export function toRoomStateView(state: RoomState, now: number = Date.now()) {
  return {
    station: STATION_NAME,
    room: ROOM_NAME,
    status: getStatus(state, now),
    remainingSeconds: getRemainingSeconds(state, now),
    inventory: [...state.inventory],
    discoveredFragments: { ...state.discoveredFragments },
    ventUnlocked: state.ventUnlocked,
    wrongAttempts: state.wrongAttempts,
  };
}
