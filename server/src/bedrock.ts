import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

/** What examine_room needs from an LLM: turn a prompt into narration text. */
export interface NarrativeGenerator {
  generate(prompt: string): Promise<string>;
}

export interface BedrockNarrativeGeneratorOptions {
  /**
   * Bedrock model id. Defaults to BEDROCK_MODEL_ID env var, or a Claude
   * Haiku on-demand id as a placeholder - confirm the final choice once AWS
   * credits are active and model access is verified (plan-pracy section 8,
   * open decision).
   */
  modelId?: string;
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
  const modelId = options.modelId ?? process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-5-haiku-20241022-v1:0";
  const client = options.client ?? new BedrockRuntimeClient({ region: options.region ?? process.env.AWS_REGION });

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
