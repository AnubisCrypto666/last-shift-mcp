import { describe, expect, it } from "vitest";
import {
  createInitialRoomState,
  getEscapeCode,
  getRemainingSeconds,
  getStatus,
  toRoomStateView,
  DURATION_SECONDS,
} from "../../src/room/state.js";

const T0 = 1_700_000_000_000; // fixed, arbitrary epoch ms - deterministic "now" for every test

describe("createInitialRoomState", () => {
  it("starts with an empty inventory, no fragments, not escaped", () => {
    const state = createInitialRoomState(T0);
    expect(state.inventory).toEqual([]);
    expect(state.discoveredFragments).toEqual({});
    expect(state.escaped).toBe(false);
    expect(state.ventUnlocked).toBe(false);
    expect(state.wrongAttempts).toBe(0);
    expect(state.durationSeconds).toBe(DURATION_SECONDS);
  });
});

describe("getRemainingSeconds", () => {
  it("counts down from the full duration at t=0", () => {
    const state = createInitialRoomState(T0);
    expect(getRemainingSeconds(state, T0)).toBe(DURATION_SECONDS);
  });

  it("decreases as time passes", () => {
    const state = createInitialRoomState(T0);
    expect(getRemainingSeconds(state, T0 + 100_000)).toBe(DURATION_SECONDS - 100);
  });

  it("never goes below zero", () => {
    const state = createInitialRoomState(T0);
    expect(getRemainingSeconds(state, T0 + (DURATION_SECONDS + 999) * 1000)).toBe(0);
  });
});

describe("getStatus", () => {
  it("is 'active' while time remains and the player hasn't escaped", () => {
    const state = createInitialRoomState(T0);
    expect(getStatus(state, T0 + 1000)).toBe("active");
  });

  it("is 'failed' once time runs out", () => {
    const state = createInitialRoomState(T0);
    expect(getStatus(state, T0 + (DURATION_SECONDS + 1) * 1000)).toBe("failed");
  });

  it("is 'escaped' once escaped is set, even if time has also run out", () => {
    const state = createInitialRoomState(T0);
    state.escaped = true;
    expect(getStatus(state, T0 + (DURATION_SECONDS + 1) * 1000)).toBe("escaped");
  });
});

describe("getEscapeCode", () => {
  it("is undefined with no fragments discovered", () => {
    const state = createInitialRoomState(T0);
    expect(getEscapeCode(state)).toBeUndefined();
  });

  it("is undefined with only one of the two fragments discovered", () => {
    const state = createInitialRoomState(T0);
    state.discoveredFragments.control_panel = "7X";
    expect(getEscapeCode(state)).toBeUndefined();
  });

  it("concatenates control_panel then vent once both are discovered", () => {
    const state = createInitialRoomState(T0);
    state.discoveredFragments.control_panel = "7X";
    state.discoveredFragments.vent = "Q2";
    expect(getEscapeCode(state)).toBe("7XQ2");
  });
});

describe("toRoomStateView", () => {
  it("serializes a snapshot without exposing internal fields like startedAt", () => {
    const state = createInitialRoomState(T0);
    state.inventory.push("multitool");
    const view = toRoomStateView(state, T0 + 5000);

    expect(view).toEqual({
      station: "Kessler Station",
      room: "Maintenance Bay 7",
      status: "active",
      remainingSeconds: DURATION_SECONDS - 5,
      inventory: ["multitool"],
      discoveredFragments: {},
      ventUnlocked: false,
      wrongAttempts: 0,
    });
  });

  it("is a snapshot copy - mutating the view does not mutate the state", () => {
    const state = createInitialRoomState(T0);
    const view = toRoomStateView(state, T0);
    view.inventory.push("mutated");
    expect(state.inventory).toEqual([]);
  });
});
