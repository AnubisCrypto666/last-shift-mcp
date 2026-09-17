import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { statusOverMessage } from "./examineRoom.js";
import { getEscapeCode, getStatus, type RoomState } from "./state.js";

export const WRONG_CODE_TIME_PENALTY_SECONDS = 20;

export interface ElicitOutcome {
  action: "accept" | "decline" | "cancel";
  code?: string;
}

/**
 * A wrong code is a twist, not a dead end (plan-pracy section 2): it costs
 * time (raising tension against the countdown) rather than ending the game
 * outright. Only running out of time (RoomStatus "failed", checked by the
 * caller before this runs) or a correct code ends it.
 */
export function applyAttemptEscape(state: RoomState, outcome: ElicitOutcome, now: number = Date.now()): string {
  if (outcome.action !== "accept") {
    return "You hesitate, code half-entered, then pull your hand back. The countdown keeps going.";
  }

  const submitted = (outcome.code ?? "").trim().toUpperCase();
  const expected = getEscapeCode(state);

  if (expected && submitted === expected) {
    state.escaped = true;
    return "The lock clunks. The vent seal releases. You're out - Maintenance Bay 7 falls silent behind you.";
  }

  state.wrongAttempts += 1;
  state.startedAt -= WRONG_CODE_TIME_PENALTY_SECONDS * 1000;
  void now;
  return "The panel rejects the code with a sharp buzz and a flash of red light. You've lost precious time.";
}

export function registerAttemptEscapeTool(server: McpServer, state: RoomState): void {
  server.registerTool(
    "attempt_escape",
    {
      title: "Attempt Escape",
      description:
        "Make a final attempt to escape Maintenance Bay 7. You'll be asked to enter the escape code you've assembled from the fragments you've found.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      const status = getStatus(state);
      if (status !== "active") {
        return { content: [{ type: "text" as const, text: statusOverMessage(status) }] };
      }

      let outcome: ElicitOutcome;
      try {
        const result = await ctx.mcpReq.elicitInput({
          mode: "form",
          message: "Enter the escape code to unlock the bay door.",
          requestedSchema: {
            type: "object",
            properties: {
              code: {
                type: "string",
                title: "Escape Code",
                description: "The code assembled from the fragments you've found.",
              },
            },
            required: ["code"],
          },
        });
        outcome =
          result.action === "accept"
            ? { action: "accept", code: (result.content as { code?: string } | undefined)?.code }
            : { action: result.action };
      } catch {
        // Client doesn't support elicitation, or the request otherwise
        // failed - treat it the same as the player backing out, not a crash.
        outcome = { action: "cancel" };
      }

      const text = applyAttemptEscape(state, outcome);
      return { content: [{ type: "text" as const, text }] };
    },
  );
}
