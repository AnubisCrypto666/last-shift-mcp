import { describe, expect, it } from "vitest";
import { applyUseItem } from "../../src/room/useItem.js";
import { createInitialRoomState } from "../../src/room/state.js";

describe("applyUseItem", () => {
  it("refuses when the player doesn't have the multitool yet", () => {
    const state = createInitialRoomState();
    const text = applyUseItem(state, "multitool", "vent");
    expect(text).toMatch(/don't have a multitool/i);
    expect(state.ventUnlocked).toBe(false);
  });

  it("unlocks the vent and discovers its fragment when the multitool is used on it", () => {
    const state = createInitialRoomState();
    state.inventory.push("multitool");

    const text = applyUseItem(state, "multitool", "vent");

    expect(state.ventUnlocked).toBe(true);
    expect(state.discoveredFragments.vent).toBe("Q2");
    expect(text).toMatch(/fragment/i);
  });

  it("is idempotent - using it again just says it's already open, doesn't reset anything", () => {
    const state = createInitialRoomState();
    state.inventory.push("multitool");
    applyUseItem(state, "multitool", "vent");

    const text = applyUseItem(state, "multitool", "vent");

    expect(text).toMatch(/already open/i);
    expect(state.discoveredFragments.vent).toBe("Q2");
  });

  it("rejects an unknown item", () => {
    const state = createInitialRoomState();
    const text = applyUseItem(state, "flashlight", "vent");
    expect(text).toMatch(/don't have a flashlight/i);
  });

  it("rejects a target the multitool has no effect on", () => {
    const state = createInitialRoomState();
    state.inventory.push("multitool");
    const text = applyUseItem(state, "multitool", "control_panel");
    expect(text).toMatch(/doesn't do anything/i);
    expect(state.ventUnlocked).toBe(false);
  });
});
