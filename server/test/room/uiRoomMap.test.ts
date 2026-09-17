import { describe, expect, it } from "vitest";
import { renderRoomMapHtml } from "../../src/room/uiRoomMap.js";
import { createInitialRoomState, toRoomStateView } from "../../src/room/state.js";

const T0 = 1_700_000_000_000;

describe("renderRoomMapHtml", () => {
  it("embeds the station/room name, status, and remaining seconds", () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));

    expect(html).toContain("Kessler Station");
    expect(html).toContain("Maintenance Bay 7");
    expect(html).toContain("active");
    expect(html).toContain("600"); // embedded seed for the client-side countdown
  });

  it("shows an empty-state placeholder with no inventory or fragments yet", () => {
    const state = createInitialRoomState(T0);
    const html = renderRoomMapHtml(toRoomStateView(state, T0));

    expect(html).toContain("empty");
    expect(html).toContain("none found yet");
  });

  it("lists discovered items and fragments once present", () => {
    const state = createInitialRoomState(T0);
    state.inventory.push("multitool");
    state.discoveredFragments.control_panel = "7X";
    const html = renderRoomMapHtml(toRoomStateView(state, T0));

    expect(html).toContain("multitool");
    expect(html).toContain("control_panel");
    expect(html).toContain("7X");
  });

  it("reflects vent status in the markup", () => {
    const state = createInitialRoomState(T0);
    expect(renderRoomMapHtml(toRoomStateView(state, T0))).toContain("sealed");
    state.ventUnlocked = true;
    expect(renderRoomMapHtml(toRoomStateView(state, T0))).toContain("open");
  });

  it("escapes HTML-significant characters in dynamic fields (defense in depth)", () => {
    const state = createInitialRoomState(T0);
    state.inventory.push('<script>alert(1)</script>');
    const html = renderRoomMapHtml(toRoomStateView(state, T0));
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
