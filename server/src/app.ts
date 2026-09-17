import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import type { Express, NextFunction, Request, Response } from "express";
import { createMcpServer, type McpServerOptions } from "./mcpServer.js";

/**
 * `createMcpExpressApp()`'s Origin *validation* (reject requests from
 * disallowed origins) is not the same thing as CORS (let the *browser* read
 * a same-allowed-origin response). The package does ship `cors()`, but only
 * on its internal OAuth metadata router (`src/auth/metadataRouter.ts`) - not
 * on the `/mcp` routes we hand-wire below. Confirmed by reading
 * `node_modules/@modelcontextprotocol/express/dist/index.cjs` directly: zero
 * `Access-Control-*` headers ever appear on a real `/mcp` response, curl
 * doesn't enforce CORS so this was invisible there, and a real browser
 * client (client/) failed silently until this was added. Reuses the same
 * `allowedOrigins` hostname list passed to `createMcpExpressApp()` so there
 * is one allow-list, not two that can drift.
 */
function corsForMcp(allowedOrigins: readonly string[]) {
  const allowed = new Set(allowedOrigins);
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      let hostname: string | undefined;
      try {
        hostname = new URL(origin).hostname;
      } catch {
        hostname = undefined;
      }
      if (hostname && allowed.has(hostname)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version");
        res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, Mcp-Protocol-Version");
      }
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  };
}

export interface AppOptions {
  /** Room-engine dependency overrides (narration, demo mode) - test-only in practice. */
  roomDeps?: McpServerOptions["roomDeps"];
  /**
   * Origin HOSTNAMES to accept (e.g. "allowed.example" - no scheme/port),
   * matched against the `Origin` header's parsed hostname. Requests with no
   * Origin header always pass (non-browser clients: curl, MCP Inspector).
   * Matches @modelcontextprotocol/node's `originValidation()` semantics -
   * see NOTES.md, 2026-09-16.
   */
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
 * (MCP-Protocol-Version) are handled internally by NodeStreamableHTTPServerTransport;
 * Origin validation is `createMcpExpressApp()`'s own built-in `allowedOrigins`
 * option (v2 ships this natively - v1 didn't, see FRICTION-LOG.md). Passing
 * it explicitly - even as `[]` - matters: left unset, `createMcpExpressApp()`
 * defaults to `localhostOriginValidation()` (only `localhost`/`127.0.0.1`/
 * `[::1]`), which silently rejected every non-localhost Origin in early
 * testing here before this was passed through. See NOTES.md, 2026-09-16.
 *
 * Kept as a factory - not `app.listen()` - so tests can exercise it directly
 * over HTTP via supertest without a live port.
 */
export function createApp(options: AppOptions = {}): Express {
  const { allowedOrigins = [], enableJsonResponse = false, roomDeps } = options;

  const app = createMcpExpressApp({ allowedOrigins: [...allowedOrigins] });
  app.use(corsForMcp(allowedOrigins));

  // One transport per active session; each transport is bound to its own
  // McpServer instance created at initialization time.
  const transports: Record<string, NodeStreamableHTTPServerTransport> = {};

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      let transport: NodeStreamableHTTPServerTransport;

      if (sessionId) {
        if (!transports[sessionId]) {
          // Unknown/expired session id. Per RESEARCH.md B6 (MCP spec
          // 2025-11-25, Session Management #3-4): "The server MAY terminate
          // the session at any time, after which it MUST respond to requests
          // containing that session ID with HTTP 404 Not Found" - not 400.
          // v1's reference example collapsed this into a generic 400 branch
          // (FRICTION-LOG.md, 2026-09-15); v2's own transport gets this right
          // internally, confirming the fix was correct, not just a house style.
          res.status(404).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Session not found" },
            id: null,
          });
          return;
        }
        transport = transports[sessionId];
      } else if (isInitializeRequest(req.body)) {
        transport = new NodeStreamableHTTPServerTransport({
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

        const server = createMcpServer({ roomDeps });
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
