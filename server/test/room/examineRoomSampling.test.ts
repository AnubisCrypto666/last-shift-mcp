import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { createMcpServer } from "../../src/mcpServer.js";

/**
 * Drives examine_room's sampling-preferred path over the real
 * InMemoryTransport/JSON-RPC protocol, the same way
 * attemptEscapeTool.test.ts drives elicitation - the existing sampling
 * coverage (examineRoom.test.ts) only unit-tests narrateDescription()
 * with a mocked requestSampling callback, never a client that actually
 * declares the `sampling` capability and answers sampling/createMessage
 * over the wire (audit N2, OI-08 evidence).
 */

describe("examine_room tool - sampling over the real protocol", () => {
  it("prefers sampling over Bedrock when the client declares the sampling capability", async () => {
    const generate = vi.fn().mockRejectedValue(new Error("Bedrock should not have been called"));
    const server = createMcpServer({
      roomDeps: { narrativeGenerator: { generate }, isRecordedDemoMode: () => false },
    });
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();

    const samplingHandler = vi.fn().mockResolvedValue({
      model: "test-model",
      role: "assistant",
      content: { type: "text", text: "sampled narration" },
      stopReason: "endTurn",
    });

    const client = new Client({ name: "test-client", version: "0.0.1" }, { capabilities: { sampling: {} } });
    client.setRequestHandler("sampling/createMessage" as any, samplingHandler as any);

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({ name: "examine_room", arguments: { target: "toolbox" } });

    expect((result.content as any[])[0].text).toBe("sampled narration");
    expect(generate).not.toHaveBeenCalled();
    expect(samplingHandler).toHaveBeenCalledOnce();

    const request = samplingHandler.mock.calls[0][0] as { params: { messages: { content: { text: string } }[]; maxTokens: number } };
    expect(request.params.messages[0].content.text).toEqual(expect.any(String));
    expect(request.params.maxTokens).toBe(200);
  });
});
