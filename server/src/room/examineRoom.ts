import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { createBedrockNarrativeGenerator, type NarrativeGenerator } from "../bedrock.js";
import { baseDescription, buildNarrationPrompt, recordedFixture, type ExamineTarget } from "./descriptions.js";
import { CONTROL_PANEL_FRAGMENT, MULTITOOL_ITEM, getStatus, type RoomState, type RoomStatus } from "./state.js";
import { ROOM_MAP_URI } from "./uiRoomMap.js";

export interface ExamineRoomDeps {
  /** Fallback narrator when the client doesn't declare `sampling`. */
  narrativeGenerator: NarrativeGenerator;
  /** Returns true when the server should use recorded fixtures instead of any live LLM call. */
  isRecordedDemoMode: () => boolean;
}

export function defaultExamineRoomDeps(): ExamineRoomDeps {
  return {
    narrativeGenerator: createBedrockNarrativeGenerator(),
    isRecordedDemoMode: () => process.env.DEMO_MODE === "recorded",
  };
}

/** Discovering a fragment/item is a one-time side effect of examining the right target. */
export function applyExamineSideEffects(state: RoomState, target: ExamineTarget | undefined): void {
  if (target === "control_panel" && !state.discoveredFragments.control_panel) {
    state.discoveredFragments.control_panel = CONTROL_PANEL_FRAGMENT;
  }
  if (target === "toolbox" && !state.inventory.includes(MULTITOOL_ITEM)) {
    state.inventory.push(MULTITOOL_ITEM);
  }
}

export function statusOverMessage(status: RoomStatus): string {
  if (status === "escaped") return "You already escaped Maintenance Bay 7. There's nothing left to examine.";
  return "The countdown reached zero. The bay is sealed. There's nothing left to examine.";
}

interface NarrateArgs {
  target: ExamineTarget | undefined;
  base: string;
  ventUnlocked: boolean;
  deps: ExamineRoomDeps;
  supportsSampling: boolean;
  requestSampling: (prompt: string) => Promise<string | undefined>;
}

/**
 * Sampling first (if the client declared the capability), then Bedrock,
 * then - if both fail - the plain base description. The tool call itself
 * never hard-fails because narration did.
 */
export async function narrateDescription(args: NarrateArgs): Promise<string> {
  const { target, base, ventUnlocked, deps, supportsSampling, requestSampling } = args;

  if (deps.isRecordedDemoMode()) {
    return recordedFixture(target, ventUnlocked);
  }

  const prompt = buildNarrationPrompt(target, base);

  if (supportsSampling) {
    try {
      const sampled = await requestSampling(prompt);
      if (sampled) return sampled;
    } catch {
      // Fall through to Bedrock.
    }
  }

  try {
    return await deps.narrativeGenerator.generate(prompt);
  } catch {
    return base;
  }
}

export function registerExamineRoomTool(server: McpServer, state: RoomState, deps: Partial<ExamineRoomDeps> = {}): void {
  const resolvedDeps: ExamineRoomDeps = { ...defaultExamineRoomDeps(), ...deps };

  server.registerTool(
    "examine_room",
    {
      title: "Examine Room",
      description:
        "Look around Maintenance Bay 7, or examine a specific object: control_panel, toolbox, or vent.",
      inputSchema: z.object({
        target: z.enum(["control_panel", "toolbox", "vent"]).optional().describe("What to examine; omit to look around the whole room."),
      }),
      _meta: { ui: { resourceUri: ROOM_MAP_URI } },
    },
    async (args, ctx) => {
      const status = getStatus(state);
      if (status !== "active") {
        return { content: [{ type: "text" as const, text: statusOverMessage(status) }] };
      }

      const target = args.target;
      applyExamineSideEffects(state, target);

      const capabilities = server.server.getClientCapabilities();
      const supportsSampling = Boolean(capabilities?.sampling);

      const text = await narrateDescription({
        target,
        base: baseDescription(target, state.ventUnlocked),
        ventUnlocked: state.ventUnlocked,
        deps: resolvedDeps,
        supportsSampling,
        requestSampling: async (prompt) => {
          const result = await ctx.mcpReq.requestSampling({
            messages: [{ role: "user", content: { type: "text", text: prompt } }],
            maxTokens: 200,
          });
          const content = Array.isArray(result.content) ? result.content[0] : result.content;
          return content?.type === "text" ? content.text : undefined;
        },
      });

      return { content: [{ type: "text" as const, text }] };
    },
  );
}
