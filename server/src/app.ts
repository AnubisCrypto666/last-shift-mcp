import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { Express } from "express";
import { createMcpServer } from "./mcpServer.js";
import { originValidation } from "./originValidation.js";

export interface AppOptions {
  /** Origin header values to accept; requests with no Origin header always pass. */
  allowedOrigins?: readonly string[];
  /**
   * If true, POST responses are plain `application/json` instead of an SSE
   * stream. Spec default is SSE (see RESEARCH.md B6); this knob exists for
   * simpler test assertions and for clients that prefer a single response.
   */
  enableJsonResponse?: boolean;
}

/**
 * Builds the Express app exposing the single MCP endpoint (`/mcp`) required
 * by Streamable HTTP: POST for client-to-server messages, GET to open a
 * server-initiated SSE stream, DELETE for explicit session termination.
 * Session lifecycle (Mcp-Session-Id) and protocol-version validation
 * (MCP-Protocol-Version) are handled internally by StreamableHTTPServerTransport;
 * Origin validation is our own middleware (see originValidation.ts).
 *
 * Kept as a factory - not `app.listen()` - so tests can exercise it directly
 * over HTTP via supertest without a live port.
 */
export function createApp(options: AppOptions = {}): Express {
  const { allowedOrigins = [], enableJsonResponse = false } = options;

  const app = createMcpExpressApp();
  app.use(originValidation(allowedOrigins));

  // One transport per active session; each transport is bound to its own
  // McpServer instance created at initialization time.
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId) {
        if (!transports[sessionId]) {
          // Unknown/expired session id. Per RESEARCH.md B6 (MCP spec
          // 2025-11-25, Session Management #3-4): "The server MAY terminate
          // the session at any time, after which it MUST respond to requests
          // containing that session ID with HTTP 404 Not Found" - not 400.
          // The SDK's own reference example (examples/server/simpleStreamableHttp.js)
          // collapses this into the generic 400 branch below; fixed here.
          // See NOTES.md, 2026-09-15 - candidate for an upstream issue.
          res.status(404).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Session not found" },
            id: null,
          });
          return;
        }
        transport = transports[sessionId];
      } else if (isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse,
          onsessioninitialized: (sid) => {
            transports[sid] = transport;
          },
        });
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };

        const server = createMcpServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Bad Request: No valid session ID provided" },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId) {
      res.status(400).send("Missing session ID");
      return;
    }
    if (!transports[sessionId]) {
      res.status(404).send("Session not found");
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId) {
      res.status(400).send("Missing session ID");
      return;
    }
    if (!transports[sessionId]) {
      res.status(404).send("Session not found");
      return;
    }
    try {
      await transports[sessionId].handleRequest(req, res);
    } catch {
      if (!res.headersSent) {
        res.status(500).send("Error processing session termination");
      }
    }
  });

  return app;
}
