# Friction Log

Every friction point is logged the moment it is hit, not reconstructed later.
Format required by the hackathon rules (up to 10% scoring bonus for this).

Each entry:

- **Action attempted** — what we were trying to do
- **Steps** — exact steps taken
- **Expected result** — what the docs/tool implied should happen
- **Actual result** — what actually happened (exact error text if any)
- **Severity** — blocker / major / minor / cosmetic
- **Workaround** — what we did to get unstuck, if anything
- **Suggestion** — what upstream could fix

---

## 2026-09-15 — Deprecated Origin-validation options, no replacement in the recommended helper

- **Action attempted:** Implement Origin-header validation on our Streamable
  HTTP server per the MCP 2025-11-25 spec's "Security Warning" ("Servers
  MUST validate the Origin header on all incoming connections to prevent
  DNS rebinding attacks"), using `@modelcontextprotocol/sdk@1.30.0`.
- **Steps:** Looked for the option on `StreamableHTTPServerTransport`
  (`allowedOrigins`, `enableDnsRebindingProtection`); then checked the SDK's
  own `createMcpExpressApp()` helper, since the transport option's TSDoc says
  "Use external middleware for origin validation instead."
- **Expected result:** Either the transport option works out of the box, or
  `createMcpExpressApp()` (the SDK's own suggested replacement path) ships
  an Origin-validation middleware alongside its existing Host-header one.
- **Actual result:** `allowedOrigins` / `allowedHosts` / `enableDnsRebindingProtection`
  are all marked `@deprecated` on `StreamableHTTPServerTransport` with no
  functional replacement shipped in the package. `createMcpExpressApp()`
  only applies `hostHeaderValidation` (validates the `Host` header) - there
  is no equivalent Origin-header middleware anywhere in the package, despite
  the deprecation notice pointing at "external middleware" as if one exists.
  A server built by following the SDK's own recommended path is left without
  the Origin-header check its own spec (which the SDK otherwise implements
  faithfully - session lifecycle and protocol-version validation are both
  correct) explicitly requires.
- **Severity:** minor (workaround is ~15 lines of code, not a blocker) but a
  real spec-compliance gap for anyone following the SDK's own guidance
  literally without independently re-reading the transport spec.
- **Workaround:** wrote `server/src/originValidation.ts` by hand - Express
  middleware checking `req.headers.origin` against an allow-list, mounted
  before the MCP routes. ~15 lines, matches the JSON error-response shape
  the SDK's own middleware uses for consistency.
- **Suggestion:** either un-deprecate the transport-level Origin option, or
  ship an `originValidation()` middleware in `server/express.js` alongside
  `hostHeaderValidation`/`localhostHostValidation` - the "use external
  middleware" TSDoc note currently points at something that doesn't exist in
  the package. Candidate for an issue against `modelcontextprotocol/typescript-sdk`.

## 2026-09-15 — Reference example conflates "missing session id" (400) with "unknown session id" (404)

- **Action attempted:** Base our own `/mcp` POST routing on the SDK's shipped
  reference implementation (`dist/esm/examples/server/simpleStreamableHttp.js`)
  rather than reinvent session routing from scratch.
- **Steps:** Read the example's branching logic for POST `/mcp`: reuse
  transport if `sessionId && transports[sessionId]`; else start a new
  session if `!sessionId && isInitializeRequest(...)`; else respond 400.
- **Expected result:** A request carrying a session id the server doesn't
  recognize (expired/unknown) should get `404 Not Found`, per the MCP spec's
  own Session Management rules #3-4 (RESEARCH.md B6) - and per the wording
  the transport's *internal* session-mismatch handler already uses elsewhere
  in the very same package (`createJsonErrorResponse(404, -32001, 'Session
  not found')`).
- **Actual result:** The example's outer routing never distinguishes "no
  session id at all" from "session id present but unknown" - both fall into
  the same generic `400 Bad Request: No valid session ID provided` branch,
  because the condition only checks `!sessionId && isInitializeRequest`.
- **Severity:** minor - doesn't break single-session demo usage (which is
  presumably why it wasn't caught), but is incorrect per the example's own
  package's spec and could confuse a client implementing retry-on-404
  reconnect logic per the spec.
- **Workaround:** restructured our own `server/src/app.ts` routing to check
  `sessionId` presence and validity as two separate branches, returning 404
  for "present but unknown" and 400 only for "absent, non-init request" -
  confirmed by dedicated unit tests (`server/test/app.test.ts`).
- **Suggestion:** fix the branching in
  `src/examples/server/simpleStreamableHttp.ts` (and any other examples
  sharing the same pattern) to return 404 for an unrecognized session id.
  Candidate for a small PR against `modelcontextprotocol/typescript-sdk`.
