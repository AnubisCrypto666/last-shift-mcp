import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

/**
 * Transport-level tests against synthetic, controlled JSON-RPC requests -
 * no live network, no deployed server, no Bedrock/AWS calls. Exercises the
 * session lifecycle and Origin validation required by RESEARCH.md B6
 * (MCP 2025-11-25, Streamable HTTP). Room-logic tools/resources land in a
 * later step (plan-pracy section 2, step 4) and get their own tests then.
 */

const SESSION_HEADER = "mcp-session-id";

function initializeRequest(id: number | string = 1) {
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

async function initializeSession(app: ReturnType<typeof createApp>) {
  const res = await request(app)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .send(initializeRequest());
  const sessionId = res.headers[SESSION_HEADER] as string | undefined;
  return { res, sessionId };
}

describe("POST /mcp - session lifecycle", () => {
  it("creates a session on a valid initialize request and returns Mcp-Session-Id", async () => {
    const app = createApp({ enableJsonResponse: true });
    const { res, sessionId } = await initializeSession(app);

    expect(res.status).toBe(200);
    expect(sessionId).toBeTruthy();
    expect(res.body.jsonrpc).toBe("2.0");
    expect(res.body.result.protocolVersion).toBe("2025-11-25");
  });

  it("rejects a non-initialize request with no session id (400)", async () => {
    const app = createApp({ enableJsonResponse: true });
    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });

    expect(res.status).toBe(400);
  });

  it("rejects a request carrying an unknown session id (404, not 400)", async () => {
    // RESEARCH.md B6, Session Management #3-4: an unknown/expired session id
    // MUST get 404, not the generic 400 for "no session id at all". The
    // SDK's own reference example collapses these into one 400 branch -
    // see NOTES.md 2026-09-15 and the comment in src/app.ts.
    const app = createApp({ enableJsonResponse: true });
    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set(SESSION_HEADER, "00000000-0000-0000-0000-000000000000")
      .send({ jsonrpc: "2.0", id: 3, method: "tools/list", params: {} });

    expect(res.status).toBe(404);
  });

  it("defaults to an SSE stream response when enableJsonResponse is not set", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .send(initializeRequest());

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
  });

  it("rejects a subsequent request with an unsupported MCP-Protocol-Version (400)", async () => {
    const app = createApp({ enableJsonResponse: true });
    const { sessionId } = await initializeSession(app);
    expect(sessionId).toBeTruthy();

    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set(SESSION_HEADER, sessionId!)
      .set("MCP-Protocol-Version", "2099-01-01")
      .send({ jsonrpc: "2.0", id: 4, method: "tools/list", params: {} });

    expect(res.status).toBe(400);
  });
});

describe("GET /mcp - server-initiated stream", () => {
  it("rejects a missing session id (400)", async () => {
    const app = createApp();
    const res = await request(app).get("/mcp").set("Accept", "text/event-stream");
    expect(res.status).toBe(400);
  });

  it("rejects an unknown session id (404)", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/mcp")
      .set("Accept", "text/event-stream")
      .set(SESSION_HEADER, "00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("Origin validation (RESEARCH.md B6, Security Warning)", () => {
  // allowedOrigins holds HOSTNAMES (matching @modelcontextprotocol/node's
  // originValidation() semantics - it parses the Origin header and compares
  // only the hostname, not the full origin string). See NOTES.md 2026-09-16.

  it("rejects a disallowed Origin header (403)", async () => {
    const app = createApp({ allowedOrigins: ["allowed.example"], enableJsonResponse: true });
    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Origin", "https://evil.example")
      .send(initializeRequest());

    expect(res.status).toBe(403);
  });

  it("accepts an allowed Origin header", async () => {
    const app = createApp({ allowedOrigins: ["allowed.example"], enableJsonResponse: true });
    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Origin", "https://allowed.example")
      .send(initializeRequest());

    expect(res.status).toBe(200);
  });

  it("accepts a request with no Origin header at all (non-browser clients)", async () => {
    const app = createApp({ allowedOrigins: ["allowed.example"], enableJsonResponse: true });
    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .send(initializeRequest());

    expect(res.status).toBe(200);
  });

  it("rejects a malformed Origin header (403) - v2's validateOriginHeader parses and denies on failure", async () => {
    const app = createApp({ allowedOrigins: ["allowed.example"], enableJsonResponse: true });
    const res = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Origin", "not-a-valid-url")
      .send(initializeRequest());

    expect(res.status).toBe(403);
  });
});
