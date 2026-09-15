# Notes

Running technical notes, captured at the moment something is learned or breaks.
Raw material for README "known issues" and OSS contributions. Do not
reconstruct from memory at the end — write it now.

---

## 2026-09-13

- Environment check before installing Amazon Devices Builder Tools:
  `node --version` → v24.14.0. Within the safe range (18+, below the v26
  SQLite3 binding failure reported for this tool). No downgrade needed.
- Prior prep session (2026-09-10, see `SESSION-REPORT-amazon-prep.md`):
  Devpost account + hackathon registration done, track = Alexa+, secondary
  goal = Providing Product Feedback. AWS account active, MFA on root, budget
  alert $5/mo, credit request form submitted (pending, typically 24-48h).
  Amazon Developer account not yet created — needed before research step 5
  (MCP contract for Alexa+).

## 2026-09-15

- Server scaffold (`server/`): Node 24 + TypeScript 7.0.2 + `@modelcontextprotocol/sdk@1.30.0`
  + Express 5.2.1. `npm view` confirmed these as latest at install time rather
  than guessing pinned versions.
- The installed SDK ships a full worked Streamable HTTP reference example at
  `dist/esm/examples/server/simpleStreamableHttp.js` - read it directly from
  node_modules instead of guessing the `StreamableHTTPServerTransport` API
  from memory. Reused its session-map pattern (`transports: Record<string,
  StreamableHTTPServerTransport>`, `onsessioninitialized`/`onclose`).
- **`StreamableHTTPServerTransport`'s own Origin-validation options
  (`allowedOrigins`, `allowedHosts`, `enableDnsRebindingProtection`) are
  marked `@deprecated`** in this version, with the guidance "Use external
  middleware for origin validation instead." The SDK's own recommended
  helper, `createMcpExpressApp()`, only validates the `Host` header
  (`hostHeaderValidation` middleware) - it does **not** provide an Origin-header
  equivalent, despite the MCP 2025-11-25 spec's own "Security Warning"
  requiring Origin validation (RESEARCH.md B6). Wrote `src/originValidation.ts`
  by hand to close this gap. See FRICTION-LOG.md entry below.
- The SDK's own reference example (`simpleStreamableHttp.js`) collapses "no
  session id" (should be 400) and "unknown/expired session id" (spec says
  404, session-management rule #3-4) into a single 400 branch. Fixed in our
  own `src/app.ts` routing; matches the wording the transport's *internal*
  session-mismatch handler already uses elsewhere in the same package
  (`createJsonErrorResponse(404, -32001, 'Session not found')`), so the fix
  is consistent with the SDK's own internal convention, just not applied at
  the example's outer routing layer.
- `InMemoryEventStore` (for SSE resumability) only exists under the SDK's
  `examples/` tree, not as a public export - skipped resumability for now
  (spec-optional, MAY-level) rather than depending on example-internal code.
- Empirical smoke test: `npm run dev` boots the app for real (not just under
  supertest) and responds `200` to a live `curl` POST /mcp initialize call.
