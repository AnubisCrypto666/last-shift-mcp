import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

/** What examine_room needs from an LLM: turn a prompt into narration text. */
export interface NarrativeGenerator {
  generate(prompt: string): Promise<string>;
}

export interface BedrockNarrativeGeneratorOptions {
  /**
   * Bedrock model id. Defaults to the BEDROCK_MODEL_ID env var, or the
   * cross-region Claude Haiku inference profile verified live against
   * Bedrock during OI-02's audit D2 procedure (NOTES.md, 2026-09-23).
   */
  modelId?: string;
  /** Defaults to the AWS_REGION env var, or the region verified alongside modelId above. */
  region?: string;
  client?: BedrockRuntimeClient;
}

/**
 * Real Bedrock-backed narrative generator, used when the connected MCP
 * client hasn't declared the `sampling` capability. Uses the Converse API
 * (model-agnostic across Bedrock's text models) rather than a
 * model-specific request body.
 *
 * This is the real, switchable code path plan-pracy asked for - not a
 * stub. Tests don't call this directly (no AWS credentials in CI); they
 * inject a fake NarrativeGenerator into registerExamineRoomTool instead.
 * See NOTES.md for the AWS credits/model-access status.
 */
export function createBedrockNarrativeGenerator(
  options: BedrockNarrativeGeneratorOptions = {},
): NarrativeGenerator {
  const modelId = options.modelId ?? process.env.BEDROCK_MODEL_ID ?? "eu.anthropic.claude-haiku-4-5-20251001-v1:0";
  const client = options.client ?? new BedrockRuntimeClient({ region: options.region ?? process.env.AWS_REGION ?? "eu-north-1" });

  return {
    async generate(prompt: string): Promise<string> {
      const command = new ConverseCommand({
        modelId,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 200 },
      });
      const response = await client.send(command);
      const text = response.output?.message?.content?.find((block) => block.text)?.text;
      if (!text) {
        throw new Error("Bedrock Converse response had no text content");
      }
      return text;
    },
  };
}
