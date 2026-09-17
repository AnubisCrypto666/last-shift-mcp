export type ExamineTarget = "control_panel" | "toolbox" | "vent";

/**
 * The plain, deterministic fact of what's there - always available, never
 * dependent on an LLM. Used both as the prompt seed for narration and as
 * the last-resort return value if sampling AND Bedrock both fail (the tool
 * never hard-fails outright).
 */
export function baseDescription(target: ExamineTarget | undefined, ventUnlocked: boolean): string {
  switch (target) {
    case "control_panel":
      return "A scorched control panel. Most of the readout is dead, but one line still glows: a partial access code.";
    case "toolbox":
      return "A dented toolbox wedged under the bench. Inside: a multitool, still warm from the last shift.";
    case "vent":
      return ventUnlocked
        ? "The vent panel hangs open, wires spilling out. Behind them, scratched into the metal, a second code fragment."
        : "A sealed vent panel, bolts stripped smooth. It won't budge by hand.";
    default:
      return "Maintenance Bay 7. Red emergency lighting. A control panel, a toolbox, and a sealed vent - and a clock you can hear ticking somewhere behind the wall.";
  }
}

/**
 * Pre-written, reviewed fixture text for DEMO_MODE=recorded (plan-pracy
 * section 2, Component 3: a demo recorded today must read identically a
 * month from now). Live sampling/Bedrock narration is a separately named
 * feature, shown in README/examples/ - not relied on for the video.
 */
export function recordedFixture(target: ExamineTarget | undefined, ventUnlocked: boolean): string {
  if (target === "control_panel") {
    return "The control panel is mostly dead, but one line of the readout still glows steady: fragment 7X, half-buried in static.";
  }
  if (target === "toolbox") {
    return "Inside the toolbox: a multitool, still warm from the last shift. You take it.";
  }
  if (target === "vent") {
    return ventUnlocked
      ? "The vent panel hangs open now. Scratched into the metal behind the wiring: fragment Q2."
      : "The vent panel is sealed, bolts stripped smooth. It won't budge by hand - you'll need a tool.";
  }
  return "Maintenance Bay 7 hums under red emergency lighting. Somewhere behind the wall, a coolant line ticks down. A control panel blinks on the far wall, a toolbox sits wedged under the bench, and a sealed vent panel waits by the floor grate.";
}

export function buildNarrationPrompt(target: ExamineTarget | undefined, base: string): string {
  return (
    `You are narrating a tense, time-pressured escape-room scene aboard a damaged space station ` +
    `for a text adventure called "Ostatnia Szychta" (The Last Shift). The player just examined ` +
    `${target ? `the ${target.replace("_", " ")}` : "the room"}. Here is the plain fact of what's there: ` +
    `"${base}" Rewrite it as 1-2 vivid, urgent sentences. Do not invent new objects, items, or clues - ` +
    `only the fact given. Do not mention game mechanics, tools, or that this is a game.`
  );
}
