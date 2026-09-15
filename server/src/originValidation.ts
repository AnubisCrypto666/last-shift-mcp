import type { NextFunction, Request, Response } from "express";

/**
 * Origin-header validation per MCP 2025-11-25 Streamable HTTP transport
 * ("Security Warning"): "Servers MUST validate the Origin header on all
 * incoming connections to prevent DNS rebinding attacks... If the Origin
 * header is present and invalid, servers MUST respond with HTTP 403
 * Forbidden." (RESEARCH.md, section B6.)
 *
 * Requests with no Origin header at all (curl, MCP Inspector, server-to-
 * server calls) are let through - Origin is a browser-set header, and the
 * spec only mandates rejection when it's present and not allow-listed.
 *
 * Written by hand because the SDK's own Origin-validation options on
 * StreamableHTTPServerTransport (`allowedOrigins`, `enableDnsRebindingProtection`)
 * are marked `@deprecated` in the installed version (1.30.0) with "Use
 * external middleware for origin validation instead" - and the SDK's own
 * `createMcpExpressApp()` helper only validates the Host header, not Origin.
 * See NOTES.md, 2026-09-15.
 */
export function originValidation(allowedOrigins: readonly string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    if (origin !== undefined && !allowedOrigins.includes(origin)) {
      res.status(403).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: `Invalid Origin: ${origin}` },
        id: null,
      });
      return;
    }
    next();
  };
}
