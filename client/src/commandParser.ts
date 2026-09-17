export type ParsedCommand =
  | { tool: "examine_room"; args: { target?: string } }
  | { tool: "use_item"; args: { item: string; target: string } }
  | { tool: "attempt_escape"; args: Record<string, never> };

const EXAMINE_TARGETS = new Set(["control_panel", "toolbox", "vent"]);

function normalizeTarget(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Minimal free-text command parser standing in for Alexa+'s NLU (plan-pracy
 * section 2: "priorytet: działa, nie: ładny"). Recognizes exactly the three
 * server tools; anything else is unrecognized and left to the caller to
 * show a hint for.
 */
export function parseCommand(input: string): ParsedCommand | undefined {
  const text = input.trim().toLowerCase();
  if (!text) return undefined;

  if (text.includes("escape")) {
    return { tool: "attempt_escape", args: {} };
  }

  const useMatch = text.match(/^use\s+(.+?)\s+on\s+(.+)$/);
  if (useMatch) {
    return { tool: "use_item", args: { item: normalizeTarget(useMatch[1]!), target: normalizeTarget(useMatch[2]!) } };
  }

  if (text === "look" || text === "look around" || text === "examine room" || text === "examine") {
    return { tool: "examine_room", args: {} };
  }

  const examineMatch = text.match(/^(?:examine|look at|check)\s+(.+)$/);
  if (examineMatch) {
    const target = normalizeTarget(examineMatch[1]!);
    if (EXAMINE_TARGETS.has(target)) {
      return { tool: "examine_room", args: { target } };
    }
  }

  return undefined;
}

export const COMMAND_HINT =
  "Try: \"look\", \"examine control panel\", \"examine toolbox\", \"examine vent\", \"use multitool on vent\", or \"escape\".";
