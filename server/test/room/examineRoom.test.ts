import { describe, expect, it, vi } from "vitest";
import {
  applyExamineSideEffects,
  narrateDescription,
  statusOverMessage,
  type ExamineRoomDeps,
} from "../../src/room/examineRoom.js";
import { CONTROL_PANEL_FRAGMENT, MULTITOOL_ITEM, createInitialRoomState } from "../../src/room/state.js";

describe("applyExamineSideEffects", () => {
  it("discovers the control_panel fragment on first examine, not again after", () => {
    const state = createInitialRoomState();
    applyExamineSideEffects(state, "control_panel");
    expect(state.discoveredFragments.control_panel).toBe(CONTROL_PANEL_FRAGMENT);

    // idempotent: examining again doesn't duplicate or change anything
    applyExamineSideEffects(state, "control_panel");
    expect(state.discoveredFragments.control_panel).toBe(CONTROL_PANEL_FRAGMENT);
  });

  it("adds the multitool to inventory on first examine of the toolbox, not twice", () => {
    const state = createInitialRoomState();
    applyExamineSideEffects(state, "toolbox");
    applyExamineSideEffects(state, "toolbox");
    expect(state.inventory).toEqual([MULTITOOL_ITEM]);
  });

  it("examining the vent has no side effect (unlocking happens via use_item)", () => {
    const state = createInitialRoomState();
    applyExamineSideEffects(state, "vent");
    expect(state.ventUnlocked).toBe(false);
    expect(state.discoveredFragments.vent).toBeUndefined();
  });

  it("a general look (no target) has no side effect", () => {
    const state = createInitialRoomState();
    applyExamineSideEffects(state, undefined);
    expect(state.inventory).toEqual([]);
    expect(state.discoveredFragments).toEqual({});
  });
});

describe("statusOverMessage", () => {
  it("differs between escaped and failed", () => {
    expect(statusOverMessage("escaped")).toMatch(/already escaped/i);
    expect(statusOverMessage("failed")).toMatch(/sealed|zero/i);
  });
});

describe("narrateDescription", () => {
  function deps(overrides: Partial<ExamineRoomDeps> = {}): ExamineRoomDeps {
    return {
      narrativeGenerator: { generate: vi.fn().mockResolvedValue("bedrock text") },
      isRecordedDemoMode: () => false,
      ...overrides,
    };
  }

  it("recorded mode returns the fixture regardless of sampling support", async () => {
    const d = deps({ isRecordedDemoMode: () => true });
    const requestSampling = vi.fn();
    const text = await narrateDescription({
      target: "control_panel",
      base: "irrelevant",
      ventUnlocked: false,
      deps: d,
      supportsSampling: true,
      requestSampling,
    });
    expect(text).toMatch(/7X/);
    expect(requestSampling).not.toHaveBeenCalled();
    expect(d.narrativeGenerator.generate).not.toHaveBeenCalled();
  });

  it("calls Bedrock directly when the client doesn't support sampling", async () => {
    const d = deps();
    const requestSampling = vi.fn();
    const text = await narrateDescription({
      target: "toolbox",
      base: "a toolbox",
      ventUnlocked: false,
      deps: d,
      supportsSampling: false,
      requestSampling,
    });
    expect(text).toBe("bedrock text");
    expect(requestSampling).not.toHaveBeenCalled();
    expect(d.narrativeGenerator.generate).toHaveBeenCalledOnce();
  });

  it("prefers sampling over Bedrock when the client supports it", async () => {
    const d = deps();
    const requestSampling = vi.fn().mockResolvedValue("sampled text");
    const text = await narrateDescription({
      target: "toolbox",
      base: "a toolbox",
      ventUnlocked: false,
      deps: d,
      supportsSampling: true,
      requestSampling,
    });
    expect(text).toBe("sampled text");
    expect(d.narrativeGenerator.generate).not.toHaveBeenCalled();
  });

  it("falls back to Bedrock when sampling throws", async () => {
    const d = deps();
    const requestSampling = vi.fn().mockRejectedValue(new Error("client declined"));
    const text = await narrateDescription({
      target: "toolbox",
      base: "a toolbox",
      ventUnlocked: false,
      deps: d,
      supportsSampling: true,
      requestSampling,
    });
    expect(text).toBe("bedrock text");
  });

  it("falls back to the plain base description when both sampling and Bedrock fail", async () => {
    const d = deps({ narrativeGenerator: { generate: vi.fn().mockRejectedValue(new Error("no AWS creds")) } });
    const requestSampling = vi.fn().mockRejectedValue(new Error("client declined"));
    const text = await narrateDescription({
      target: "toolbox",
      base: "a plain toolbox description",
      ventUnlocked: false,
      deps: d,
      supportsSampling: true,
      requestSampling,
    });
    expect(text).toBe("a plain toolbox description");
  });
});
