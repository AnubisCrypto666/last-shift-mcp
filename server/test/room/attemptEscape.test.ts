import { describe, expect, it } from "vitest";
import { WRONG_CODE_TIME_PENALTY_SECONDS, applyAttemptEscape } from "../../src/room/attemptEscape.js";
import { createInitialRoomState, getRemainingSeconds } from "../../src/room/state.js";

const T0 = 1_700_000_000_000;

function stateWithBothFragments() {
  const state = createInitialRoomState(T0);
  state.discoveredFragments.control_panel = "7X";
  state.discoveredFragments.vent = "Q2";
  return state;
}

describe("applyAttemptEscape", () => {
  it("escapes on the correct code", () => {
    const state = stateWithBothFragments();
    const text = applyAttemptEscape(state, { action: "accept", code: "7XQ2" }, T0);
    expect(state.escaped).toBe(true);
    expect(text).toMatch(/out|escape/i);
  });

  it("is case- and whitespace-insensitive on the correct code", () => {
    const state = stateWithBothFragments();
    applyAttemptEscape(state, { action: "accept", code: "  7xq2  " }, T0);
    expect(state.escaped).toBe(true);
  });

  it("a wrong code costs time as a twist, not a hard failure", () => {
    const state = stateWithBothFragments();
    const before = getRemainingSeconds(state, T0);

    const text = applyAttemptEscape(state, { action: "accept", code: "0000" }, T0);

    expect(state.escaped).toBe(false);
    expect(state.wrongAttempts).toBe(1);
    expect(getRemainingSeconds(state, T0)).toBe(before - WRONG_CODE_TIME_PENALTY_SECONDS);
    expect(text).toMatch(/reject|buzz/i);
  });

  it("a guess before both fragments are known is always wrong, never a crash", () => {
    const state = createInitialRoomState(T0); // no fragments discovered yet
    const text = applyAttemptEscape(state, { action: "accept", code: "7XQ2" }, T0);
    expect(state.escaped).toBe(false);
    expect(text).toMatch(/reject|buzz/i);
  });

  it("declining or cancelling costs nothing and doesn't count as a wrong attempt", () => {
    const state = stateWithBothFragments();
    applyAttemptEscape(state, { action: "decline" }, T0);
    applyAttemptEscape(state, { action: "cancel" }, T0);
    expect(state.wrongAttempts).toBe(0);
    expect(state.escaped).toBe(false);
  });

  it("repeated wrong attempts keep compounding the time penalty", () => {
    const state = stateWithBothFragments();
    applyAttemptEscape(state, { action: "accept", code: "wrong1" }, T0);
    applyAttemptEscape(state, { action: "accept", code: "wrong2" }, T0);
    expect(state.wrongAttempts).toBe(2);
    expect(getRemainingSeconds(state, T0)).toBe(600 - 2 * WRONG_CODE_TIME_PENALTY_SECONDS);
  });
});
