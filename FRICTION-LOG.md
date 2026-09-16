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
- **Suggestion** — what upstream could fix, split into two explicitly labeled
  parts so we don't repeat the deadreckon mistake (see
  LESSONS-deadreckon.md: we diagnosed the mechanism correctly there but
  proposed a patch that removed the symptom instead of the cause, so the
  maintainer closed it and wrote their own version):
  - **Mechanism (confirmed)** — what is actually wrong and why, backed by a
    reproduction. This part we stand behind.
  - **Proposed fix (our suggestion, not confirmed)** — one way to fix it.
    Flagged explicitly as a proposal, not a diagnosis — the maintainer may
    reasonably choose a different fix for the same confirmed mechanism.

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
- **Mechanism (confirmed):** `allowedOrigins`, `allowedHosts`, and
  `enableDnsRebindingProtection` are marked `@deprecated` on
  `StreamableHTTPServerTransportOptions`, each pointing at "use external
  middleware" instead. `createMcpExpressApp()` — the one helper the SDK
  itself ships as the "external" path — only wires `hostHeaderValidation`/
  `localhostHostValidation` (Host header). Grepped the full installed
  package tree for any Origin-header middleware; none exists. This is a
  verified absence, not a guess: the deprecation notice names a replacement
  that isn't in the package.
- **Proposed fix (our suggestion, not confirmed):** ship an
  `originValidation()` middleware in `server/express.js`, mirroring the
  shape of `hostHeaderValidation`, and wire it into `createMcpExpressApp()`
  the same way Host validation is wired in. This is one plausible fix, not
  the only one — the maintainers might instead prefer to un-deprecate the
  transport-level option, fold Origin+Host into one combined check, or
  simply fix the TSDoc to stop pointing at a nonexistent replacement.
  Filing this as an issue describing the confirmed gap, not as a PR
  presuming our fix is the one they'll want — the deadreckon lesson is to
  let the maintainer own the fix shape when we're not certain of it.

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
- **Mechanism (confirmed):** the example's outer routing has exactly two
  branches guarding a fresh `initialize` call and everything else — it never
  separately tests "session id present but not in the transports map." Read
  directly in the shipped source
  (`dist/esm/examples/server/simpleStreamableHttp.js`), and confirmed against
  the transport's *own* internal convention for the same situation
  elsewhere in the package (`createJsonErrorResponse(404, -32001, 'Session
  not found')`, in `webStandardStreamableHttp.js`) — the example's outer
  layer disagrees with the transport's own inner layer on what an unknown
  session id should return. Reproduced independently in our own
  `server/test/app.test.ts`.
- **Proposed fix (our suggestion, not confirmed):** split the example's
  branch into "no session id" (400) and "session id present but unknown"
  (404) — the exact restructuring we applied in `server/src/app.ts`. Flagged
  as a proposal rather than a settled diagnosis-plus-patch: it's possible
  the example was deliberately simplified for readability and the
  maintainers consider strict 404-precision out of scope for demo code, in
  which case the right fix might be a comment/caveat instead of a behavior
  change. The mechanism (the two situations are conflated) is what we're
  sure of; which fix they'd want for *example* code specifically is not
  ours to presume.

## 2026-09-16 — `@modelcontextprotocol/express` v2: undocumented `allowedOrigins` option, surprising implicit default

- **Action attempted:** Migrate `server/` from `@modelcontextprotocol/sdk`
  (v1) to the v2 package family, specifically wiring Origin-header
  validation via `@modelcontextprotocol/express`'s `createMcpExpressApp()`
  (the v2 replacement for the gap logged in the 2026-09-15 entry above).
- **Steps:** Read `@modelcontextprotocol/express`'s README top to bottom
  first (the only usage doc available without going to source). Its
  "Exports" list and "Usage" section show `createMcpExpressApp(options?)`
  with exactly one worked example (`{ host: '0.0.0.0', allowedHosts: [...] }`)
  - `allowedOrigins` is never mentioned anywhere in the README. Concluded
  from this that Origin validation still had to be hand-wired (as in v1),
  and wrote a separate middleware wrapping `@modelcontextprotocol/node`'s
  `originValidation()` guard function, mounted via `app.use()` after
  `createMcpExpressApp()`.
- **Expected result:** A request with an explicitly allow-listed Origin
  hostname should pass.
- **Actual result:** Every such request was rejected with `403` and body
  `{"error":{"message":"Invalid Origin: allowed.example"}}` - even for a
  hostname we had just put in the allow-list ourselves. Root cause, found
  by reading `node_modules/@modelcontextprotocol/express/dist/index.mjs`
  directly (not documented in the README): `createMcpExpressApp()` accepts
  an `allowedOrigins` option, and when it's *not* passed, silently wires
  `localhostOriginValidation()` as middleware by default (mirroring what it
  already does for `allowedHosts`/`host`). Our own hand-wired Origin
  middleware, mounted second, never got a chance to run - the app's own
  built-in localhost-only guard rejected the request first. Confirmed the
  fix by passing `allowedOrigins` straight into `createMcpExpressApp()`
  instead: `createMcpExpressApp({ allowedOrigins: [...] })` - all 11 tests
  pass, including one added specifically to cover this case.
- **Severity:** minor (an hour of debugging, not a design blocker), but a
  real trap: a developer following only the README - the normal path - has
  no way to discover `allowedOrigins` exists, nor that its absence isn't
  neutral (it's a live, silently-applied restriction), until they either
  read the source or hit exactly this symptom.
- **Workaround:** removed the redundant hand-wired middleware entirely and
  passed `allowedOrigins` directly into `createMcpExpressApp()` - simpler
  than the original approach, not just a fix.
- **Mechanism (confirmed):** `createMcpExpressApp()`'s implementation
  (`packages/express/src/index.ts`, compiled to `dist/index.mjs`) mirrors its
  own `allowedHosts`/`host` Host-validation pattern for Origin validation
  (`if (allowedOrigins) ... else if (host is localhost) app.use(localhostOriginValidation())`)
  - but only the Host-validation half of this symmetry is documented in the
  README's "Usage" section and JSDoc examples. The Origin half is
  functionally complete but has zero prose or example coverage.
- **Proposed fix (our suggestion, not confirmed):** add an `allowedOrigins`
  usage example to the README's "Usage" section, parallel to the existing
  `allowedHosts` one, and a sentence next to the `host` option's docs
  stating explicitly that omitting `allowedOrigins` applies
  `localhostOriginValidation()` by default when `host` is a loopback
  address - exactly as already documented for `allowedHosts`. This is a
  documentation-only fix as far as we can tell; we're not proposing any
  behavior change, since the implicit localhost default is a reasonable,
  safe choice - the gap is purely that it isn't written down anywhere a
  reader would see it before hitting the symptom.
