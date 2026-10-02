import { z } from "zod/v4";

/**
 * Shared `structuredContent`/`outputSchema` shape for examine_room, use_item,
 * and attempt_escape (OI-14 option B, stage 2): the same room-state view the
 * `ui://room-map` resource renders, now carried in-band on every tool result
 * instead of only through a separate resource read. Kept out of state.ts so
 * that file stays dependency-free (see its own doc comment).
 */
export const roomStateViewSchema = z.object({
  station: z.string(),
  room: z.string(),
  status: z.enum(["active", "escaped", "failed"]),
  remainingSeconds: z.number(),
  inventory: z.array(z.string()),
  discoveredFragments: z.object({
    control_panel: z.string().optional(),
    vent: z.string().optional(),
  }),
  ventUnlocked: z.boolean(),
  wrongAttempts: z.number(),
});
