import request from "supertest";
import type { Express } from "express";

export const SESSION_HEADER = "mcp-session-id";

export function initializeRequest(id: number | string = 1) {
  return {
    jsonrpc: "2.0" as const,
    id,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "test-client", version: "0.0.1" },
    },
  };
}

export async function initializeSession(app: Express) {
  const res = await request(app)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .send(initializeRequest());
  const sessionId = res.headers[SESSION_HEADER] as string | undefined;
  return { res, sessionId };
}

/** Sends a JSON-RPC request within an already-initialized session. */
export function rpc(
  app: Express,
  sessionId: string,
  body: { id: number | string; method: string; params?: Record<string, unknown> },
) {
  return request(app)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set(SESSION_HEADER, sessionId)
    .send({ jsonrpc: "2.0" as const, ...body });
}
