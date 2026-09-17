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

## 2026-09-16 — Step 3: `@modelcontextprotocol/ext-apps` + Inspector empirical check

**This is the biggest finding of the project so far — it revises step 2's
foundation, not just step 3's question.**

**Question 1: does ext-apps have a server-side helper for `ui://` resources?**
Yes, and it's well-built. `@modelcontextprotocol/ext-apps@2.0.0` exports a
`./server` subpath (`node_modules/@modelcontextprotocol/ext-apps/dist/src/server/index.d.ts`)
with `registerAppTool()` and `registerAppResource()` — documented wrappers
around `registerTool`/`registerResource` that normalize `_meta.ui.resourceUri`,
default the MIME type to `text/html;profile=mcp-app`, support CSP domain
allowlisting for the rendered iframe, and a `getUiCapability()` helper for
capability negotiation (`EXTENSION_ID = "io.modelcontextprotocol/ui"`). This
is exactly the mechanism RESEARCH.md's B5-bis described from the outside
(`ui://` resource → sandboxed iframe → postMessage) — confirmed from the
inside now, with a real, documented API, not just a spec description.

**Question 2: does MCP Inspector support previewing/rendering `ui://`
resources?** Very likely yes — `npm view @modelcontextprotocol/inspector
dependencies` shows Inspector (`2.6.0`) directly depends on
`@modelcontextprotocol/ext-apps` (`^1.7.4`). Not independently confirmed by
launching the UI yet (that's an interactive check, not scriptable from here) -
worth a quick manual look once we're actually building the ui://room-map
resource, but the dependency alone is strong evidence.

**The complication neither RESEARCH.md nor plan-pracy anticipated:** ext-apps
targets a *different, newer package family* than the one we scaffolded the
server on in step 2. `ext-apps`'s `package.json` peer-deps on
`@modelcontextprotocol/{core,client,server}@^2.0.0` — NOT
`@modelcontextprotocol/sdk` (the monolithic package we used, `1.30.0`, still
`latest` on npm with 79 published versions). These are two separate,
independently-versioned package lines. `@modelcontextprotocol/server@2.0.0`'s
own README states, verbatim: *"v2 is the stable release line... This is v2
of the MCP TypeScript SDK. It replaces the monolithic `@modelcontextprotocol/sdk`
package from v1."* An official migration guide exists
(`github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md`).

**Confirmed empirically, not guessed:** wrote a throwaway probe file calling
`registerAppTool()` against our existing v1-`sdk`-based `McpServer` (with
`@modelcontextprotocol/server@2.0.0` additionally installed just for its
types). `tsc` fails:
```
Type 'McpServer' is not assignable to parameter of type 'Pick<McpServer, "registerTool">'.
  ... Types of parameters 'ctx' and 'extra' are incompatible.
    Property 'mcpReq' is missing in type 'RequestHandlerExtra<...>' but required in type 'BaseContext'.
```
Not a shallow mismatch — v1 and v2's `registerTool` callback shapes are
genuinely incompatible (`ServerContext` vs `RequestHandlerExtra`). ext-apps
cannot be used against our current v1-based server, full stop; probe file
and the extra optional dependency were removed after confirming this
(`git log` won't show the dead end, but it's recorded here per the "log
friction the moment it's hit" rule).

**Also confirmed while checking version compatibility (worth knowing,
resolves a real worry before it became one):** v2's own
`LATEST_PROTOCOL_VERSION` constant is `'2025-11-25'` (source map:
`export const LATEST_PROTOCOL_VERSION = '2025-11-25'; export const
SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, '2025-06-18',
'2025-03-26', '2024-11-05', '2024-10-07'];`) — matching exactly the
hackathon's "minimum acceptable version is 2025-11-25" requirement and
RESEARCH.md B5/B6. The README's "implementing the 2026-07-28 MCP spec"
banner refers to forward-looking `_meta` envelope conventions the v2 SDK
anticipates, not a bump to the negotiated protocol version string — first
read of the grep output made this look like a version-support gap; the
source map resolved it as a false alarm. Recorded so the same false worry
doesn't get re-litigated later.

**Bonus finding while comparing package surfaces:** v2's
`@modelcontextprotocol/server` exports `validateOriginHeader`,
`originValidationResponse`, `localhostAllowedOrigins`, and a
`OriginValidationResult` type directly — i.e. **v2 already ships the
Origin-validation middleware v1 is missing** (see FRICTION-LOG.md's first
2026-09-15 entry). If we migrate, our own hand-written
`src/originValidation.ts` likely becomes deletable in favor of the SDK's own
utility — one more point in favor of migrating, independent of the ext-apps
question.

**Decision needed, not made unilaterally:** migrating `server/` from
`@modelcontextprotocol/sdk` (v1) to `@modelcontextprotocol/server` +
`@modelcontextprotocol/core` (v2) is real, bounded rework (redo the
transport wiring from step 2; likely *simplifies* Origin validation; test
suite's assertions/shape carry over conceptually) — but it is a scope change
to already-committed work, not something to do silently. Surfaced to the
user for a decision before touching `server/` further.

## 2026-09-16 — Migration executed: `server/` now on v2

User decision: migrate now (11 days to Gate 1 at ~a day of rework is the
cheapest point to do this; later means more code standing on v1).

**What changed:**
- `package.json`: removed `@modelcontextprotocol/sdk`; added
  `@modelcontextprotocol/{core,server,express,node}` + `ext-apps`, all
  pinned to `2.0.0`.
- `src/mcpServer.ts`: `McpServer` now imported from
  `@modelcontextprotocol/server` instead of `@modelcontextprotocol/sdk/server/mcp.js`.
  Same `{ name, version }` constructor shape - no behavior change.
- `src/app.ts`: `StreamableHTTPServerTransport` (from
  `@modelcontextprotocol/sdk/server/streamableHttp.js`) →
  `NodeStreamableHTTPServerTransport` (from `@modelcontextprotocol/node`).
  Same options shape (`sessionIdGenerator`, `onsessioninitialized`,
  `enableJsonResponse`) - `allowedOrigins`/`allowedHosts`/
  `enableDnsRebindingProtection` are gone entirely in v2 (not just
  deprecated), replaced by standalone guard functions. `isInitializeRequest`
  now imported directly from `@modelcontextprotocol/server` (no `/types.js`
  subpath needed). Our own session-routing logic (400 for no session id,
  404 for unknown session id - the fix from the 2026-09-15 entry above) is
  unchanged; it's our own outer-routing responsibility in both v1 and v2.
- `src/originValidation.ts`: **deleted.** Origin validation is now
  `createMcpExpressApp({ allowedOrigins: [...] })`'s built-in option - see
  the FRICTION-LOG.md entry for how finding this took an extra debugging
  round (the option exists but isn't documented in the package README).
  One semantic change worth remembering: v2's Origin allow-list holds
  **hostnames** (`"allowed.example"`), not full origin strings
  (`"https://allowed.example"`) - `AppOptions.allowedOrigins` in our own
  code now documents this explicitly.
- `test/app.test.ts`: Origin-validation tests updated for the hostname-only
  allow-list; added one new test for a malformed `Origin` header (v2's
  `validateOriginHeader` parses and denies on failure - stricter/more
  correct than our v1 hand-rolled version, which never validated the header
  was even a well-formed URL).

**Confirmed working, not assumed:** `npx tsc --noEmit` clean, all 11 unit
tests pass (10 carried over conceptually + 1 new), and a live `npm run dev`
+ `curl` smoke test against `/mcp` still returns `200` on a real
`initialize` call - exactly the same empirical bar step 2 was held to.

**Net effect:** the migration didn't just unblock `ext-apps` for step 4 -
`app.ts` is now *shorter* than the v1 version (no hand-written
`originValidation.ts` file at all), and the FRICTION-LOG.md v1 Origin gap
entry stands even more clearly confirmed by contrast with how v2 solved the
same problem.

## 2026-09-17 — Step 4.2/4.3: examine_room + recorded demo mode

`ctx.mcpReq.requestSampling()` and `ctx.mcpReq.elicitInput()` (v2's
convenience methods, found while reading `BaseContext`/`ServerContext` in
`createMcpHandler-*.d.mts`) are marked `@deprecated` - but the deprecation
is about the *2026-07-28* era's different multi-round-trip model
(`inputRequired(...)` results replace the 2025 push-style server→client
request). Both explicitly "remain functional... only works on the legacy
path" for 2025-11-25-era connections, which is our target. Using them
deliberately, not by accident - worth remembering if a future SDK bump ever
makes the deprecation warning louder than a comment.

Confirmed live, not just under test: with `DEMO_MODE` unset and no AWS
credentials configured locally, `examine_room` tries Bedrock, the call
fails (no credentials), and the tool still returns `200` with the plain
base description - the three-tier fallback (sampling → Bedrock → base
text) degrades gracefully end-to-end, not just when a mock is injected in
tests. This is the literal Gate 1 requirement from plan-pracy section 5
("fallback Bedrock zwraca realny tekst gdy sampling nie jest zadeklarowany")
holding up against a real (uncredentialed) AWS call, ten days before the
gate date.

`result.content` on a sampling `CreateMessageResult` turned out to be a
union of a single content block *or* an array of them (tsc caught this
immediately - not documented anywhere obvious, just how the type resolved)
- handled by normalizing to the first element either way.

## 2026-09-17 — Step 4.6: ui://room-map, and Component 1 is now complete

`registerAppResource` from `@modelcontextprotocol/ext-apps/server` (the
exact helper the step 3 investigation found) type-checked against our v2
server on the first try - no friction, which is itself worth recording as
a contrast to step 3's discovery that it was flatly incompatible with the
v1 foundation. The migration decision paid off exactly as expected.

Linked `examine_room`, `use_item`, and `attempt_escape` to the resource via
`_meta: { ui: { resourceUri: ROOM_MAP_URI } }` on each tool's config -
plain fields on the base SDK's `ToolConfig`, no need to switch those three
tools to `registerAppTool` itself (that wrapper mainly normalizes the
deprecated `_meta["ui/resourceUri"]` key for older hosts, which doesn't
apply to a single modern host we're building ourselves). Confirmed via a
`tools/list` assertion that the metadata is actually on the wire, not just
assumed from reading the tool's registration code.

The countdown ticks client-side from a JS seed embedded in the HTML at
resource-read time (`remainingSeconds`) rather than depending on any
postMessage round-trip - the sandboxed-iframe/postMessage HOST mechanics
are the client's job (plan-pracy Component 2, Kimi K3), not the server's;
the resource only needs to hand over valid, self-contained HTML.

**All of plan-pracy section 2, Component 1 (the MCP server) is now built
and passing:** room://state, examine_room (sampling→Bedrock→base
fallback), recorded demo mode, use_item, attempt_escape (elicitation),
ui://room-map. 70 tests, confirmed live via a full init→tools/list→resources/read
sequence against the real running dev server, ten days before Gate 1
(2026-09-27).

## 2026-09-17 — OI-01: MCP Inspector verification via CLI mode

`npx @modelcontextprotocol/inspector --cli <url> --method <m>` runs a real,
independent MCP client (not our own test harness) against the live dev
server. Checked the exact flag surface via `--cli --help` rather than
guessing (flags differ from the GUI's implicit config) - confirmed
`--method`, `--tool-name`, `--tool-arg`, `--uri`, `--app-info`, `--strict`.

Confirmed against the real running server (`npm run dev`, `http://127.0.0.1:3000/mcp`):
- `tools/list` - all three tools present (`examine_room`, `use_item`,
  `attempt_escape`), full input schemas, each carrying
  `_meta.ui.resourceUri: "ui://room-map"`.
- `resources/list` - both resources present: `room://state`
  (`application/json`) and `ui://room-map` (`text/html;profile=mcp-app`).
- `resources/read --uri "ui://room-map"` - returns real, complete HTML
  (room panel, inventory panel, fragments panel, vent status, a
  client-side ticking countdown script), not an error or an empty shell.
- `tools/call --tool-name examine_room --tool-arg target=toolbox` -
  succeeds, returns real narration text (base description path, no AWS
  credentials locally, consistent with the 2026-09-17 fallback finding
  above).
- `--app-info --method tools/list` - a purpose-built probe for exactly
  this: confirms `hasApp: true` and the resolved `resourceUri`/
  `resourceMimeType` for all three tools in one pass.
- `--strict --method tools/list` - exit 0, no schema-portability issues
  reported.

**One nuance worth recording, not a defect:** room state is scoped
per-session by design (`src/mcpServer.ts` comment, confirmed at
`registerRoomServer`: a fresh `RoomState` per session). Each separate
`inspector --cli` invocation opens its own session, so a side effect from
one invocation (e.g. `examine_room target=toolbox` adding the multitool)
is not visible in a `resources/read` from a *different* invocation - this
is expected session isolation, not evidence against state persistence.
Within-session persistence after a tool call is already covered by the
HTTP integration tests (Step 4.6, 70/70), which is why this CLI pass
didn't try to prove it again by chaining requests within one process (the
CLI itself has no multi-method-per-session mode).

**Not covered by CLI, left to the owner's own visual check in the
Inspector GUI (`http://127.0.0.1:6274`):** whether `ui://room-map` is
actually *rendered* as a preview panel in the Inspector UI, versus shown
as a raw HTML string in a text box. The CLI can only confirm the bytes are
correct HTML with the right MIME type - rendering is a GUI-only question.

## 2026-09-17 — `_meta.ui.resourceUri` confirmed against Amazon's own spec

Amazon's Alexa+ MCP add-on docs
(`developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-client-lifecycle.html`,
page footer dated 2026-07-10) document the exact nested shape for a tool
response's UI hook, verbatim from their sample payload:

```json
"_meta": { "ui": { "resourceUri": "ui://hotel-search", "invoking": "...", "invoked": "..." } }
```

with the accompanying sentence: *"Alexa+ renders your custom visuals for
your MCP App UI as long as you have `resourceUri` defined in the tool
response. If there's no UI customization detected through `resourceUri`
definitions, Alexa+ uses the data-only flow."* No legacy/alternate key is
mentioned anywhere on that page.

Our three tools already use exactly this shape (`_meta: { ui: { resourceUri:
ROOM_MAP_URI } }`, confirmed on the wire via `tools/list` and covered by
`test/room/uiRoomMapResource.test.ts`) - no code change needed. Cross-checked
against the *other* possible source of a "legacy key", `@modelcontextprotocol/ext-apps`'s
own `registerAppTool` doc comments (`node_modules/@modelcontextprotocol/ext-apps/dist/src/server/index.d.ts`,
lines ~74-91): that package does define a deprecated back-compat key,
`_meta["ui/resourceUri"]` (a single flattened key with a literal slash),
converted automatically by `registerAppTool()` for older hosts - but this is
an `ext-apps` package convention, not something Amazon's docs mention or
require. We don't use `registerAppTool()` for these three tools (plain
`registerTool` with `_meta` set directly, per the Step 4.6 note above), so
this legacy key never enters our code either way. Two independent sources
(Amazon's docs, ext-apps's own back-compat comment) agree
`_meta.ui.resourceUri` is the modern, preferred, non-deprecated shape.

Also confirmed while fetching the same page: the documented Alexa+
`initialize` request declares `"capabilities": { "roots": { "listChanged":
true } }` - no `sampling` key. Implication captured under the 2026-09-17
plan-pracy correction entry below.

## 2026-09-17 — Real Alexa+ never declares `sampling` (spec correction)

Source: `developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-client-lifecycle.html`
(page footer: "Last updated: Jul 10, 2026"), verified directly via fetch
today, cross-checked independently by an external model consultation and
found to agree. Verbatim "MCP initialize request payload" example, the
documented shape of a real Alexa+ client's handshake:

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "id": "4e3bdaee-0",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": { "roots": { "listChanged": true } },
    "clientInfo": { "name": "Alexa+ MCP Client", "version": "1.0.0" }
  }
}
```

`capabilities` contains only `roots` - no `sampling` key anywhere on the
page's client-side examples. Conclusion, not an assumption: a real Alexa+
client will never declare the `sampling` capability, so `examine_room`'s
sampling branch (`supportsSampling` in `src/room/examineRoom.ts`) will
never actually trigger against production Alexa+. The Bedrock path is not
a fallback-of-last-resort relative to Alexa+ - it's the path that actually
represents Alexa+'s real behavior. Sampling stays valuable and stays in
the code, but its honestly-described role changes: it's a feature for
*other* MCP hosts that do declare the capability (Claude Desktop, ChatGPT,
etc.), not evidence of fidelity to the Alexa+ mechanism specifically.

This is a fact correction to plan-pracy-ostatnia-szychta.md (sections 2
and 4) and to OPEN-ITEMS.md's OI-08 card, not a code change - the sampling
branch, its unit test, and its future dual-path demo value are all
unaffected. Material for README "Demo honesty" / known-issues in Phase 3:
explaining *why* the demo leads with Bedrock rather than sampling for the
Alexa+-facing narrative, backed by Amazon's own documented client
capabilities rather than our own guess.
