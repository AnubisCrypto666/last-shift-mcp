# The Last Shift

A self-hosted MCP server (MCP spec 2025-11-25, Streamable HTTP) built
for the Alexa+ track: a time-pressured escape-room story. The player is trapped in Maintenance Bay 7
on Kessler Station, with a 600-second clock counting down, and has to
examine the room, find two code fragments, and escape before time
runs out.

Submission for **Build, Ship, Shape: Amazon Developer Hackathon** —
Alexa+ track (primary), plus the AWS Builder mini challenge.

Demo video (2:43): https://youtu.be/Z8ErQlyZdyo

The server exposes three tools (`examine_room`, `use_item`,
`attempt_escape`) and two resources (`room://state` — the game's
structured state as JSON; `ui://room-map` — an MCP Apps resource
rendering the room map with a live countdown in a sandboxed iframe on
the client). The decisive action, `attempt_escape`, is gated by MCP
elicitation — the server asks for the escape code as a structured
input before deciding success or failure; a wrong code costs time
instead of ending the game. A correct code submitted before the
player has found both fragments is treated exactly like a wrong one —
that is a deliberate decision about the game's content (OPEN-ITEMS.md,
OI-15), not a bug. `examine_room`'s narration tries MCP sampling first
(for hosts that declare that capability), and otherwise calls Amazon
Bedrock directly — which is the only narration path that actually
fires for Alexa+, since, according to Amazon's documentation
(`mcp-toolkit-client-lifecycle.html`, last updated Jul 10, 2026;
checked 2026-09-17), Alexa+'s own `initialize` never declares
`sampling`.

104/104 tests (99 server, 5 client), covering session lifecycle,
Origin/CORS validation, elicitation and sampling end-to-end through
`InMemoryTransport`, and
tool-schema error paths.

## Getting started (from a clean clone)

Two terminals: one for the server, one for the browser client.

Tested with Node.js v24.14.0 (no minimum version is enforced).

**Terminal 1 — server:**
```
cd server
npm install
MCP_ALLOWED_ORIGINS=localhost npm run dev
```
Listens on `http://127.0.0.1:3000/mcp` (override the port with
`MCP_PORT`). `server/src/index.ts` does not load `.env` automatically
(no `dotenv`, no `--env-file`) — environment variables must be passed
to the actual shell running `npm run dev`; copying `.env.example` to
`.env` by itself changes nothing. Full variable list:
`.env.example` at the repo root. Two worth knowing about:
- `DEMO_MODE=recorded` — `examine_room` returns pre-written, fixed
  narration text instead of calling Bedrock (used for this project's
  own demo video, see "Demo honesty" below).
- `BEDROCK_MODEL_ID` / `AWS_REGION` — only matter if you have your own
  AWS credentials configured locally and want live Bedrock narration;
  without `DEMO_MODE=recorded` and without working AWS credentials,
  `examine_room` still returns `200` and gracefully falls back to a
  fixed base description (verified live, OPEN-ITEMS.md OI-02) — it
  never hard-fails.

Without `MCP_ALLOWED_ORIGINS` set, the server only accepts requests
with no `Origin` header (e.g. `curl`) — every browser request (which
always sends `Origin`) gets rejected with `403 Invalid Origin`, shown
by the browser as a generic CORS error in the console ("blocked by
CORS policy... No 'Access-Control-Allow-Origin' header"), not as a
plain 403 — easy to mistake for a code bug when it's just a missing
environment variable.

**Terminal 2 — client:**
```
cd client
npm install
npm run dev
```
Serves `http://localhost:5173`. The dev server is pinned to this port
with `strictPort` (`client/vite.config.ts`) — if something else is
already listening on 5173 (for example a leftover `vite` process from
an earlier run), it refuses to start with `Error: Port 5173 is already
in use` instead of silently moving to 5174. Find and close whatever is
holding the port (e.g. `lsof -i :5173`, then `kill` the PID it shows),
then run `npm run dev` again.

Then open `http://localhost:5173` in a browser.

## Protocol compliance

**MCP 2025-11-25 (Streamable HTTP).** Covered by the end-to-end tests
summarized above and checked with the official MCP Inspector: the CLI
with `--strict` reported 0 schema issues, and the server was exercised
manually in the Inspector GUI (OPEN-ITEMS.md, OI-01). We have not
audited this spec requirement by requirement, so we don't claim full
MUST compliance. One MUST we know is not met, named here directly: the
spec's elicitation section requires servers to bind elicitation
requests to user identity and not to associate elicitation state with
session IDs alone (Client Features → Elicitation, "Statefulness" and
"Security Considerations"). This server has no authentication (see
below), so there is no user identity to bind to — game state,
including the state that `attempt_escape`'s elicitation depends on, is
tied to the MCP session only. Known departures from SHOULD
recommendations are listed below.

**MCP Apps 2026-01-26 extension (host↔view, `ui://room-map`).**
Implemented and verified end-to-end (tests + an author's playtest on
2026-10-05, real Bedrock, Chrome — OPEN-ITEMS.md OI-14): a full
`ui/initialize` → `ui/notifications/initialized` handshake (the view
receives no notification before that completes, per the "Sandbox
proxy" section's MUST NOT); `ui/notifications/tool-input` sent before
`ui/notifications/tool-result` on every tool call (both notifications
are MUST); `tool-result` carries real `structuredContent` matching the
tool's declared `outputSchema`. By default the client keeps one view
for the whole session, updated only through this channel
(`?refresh=on` additionally turns on a diagnostic mode simulating a
host that remounts the view on every call — both modes are tested).
The name of the tool currently being called reaches the view through
`McpUiHostContext.toolInfo` (`ui/notifications/host-context-changed`);
the `toolInfo.id` field carries a local, incrementing counter, not a
real `tools/call` request id — the MCP client's public API
(`Client.callTool()`) never exposes one.

We do not claim full MUST compliance with this extension — one MUST
remains unimplemented, named here directly, not disguised as N/A:
- **`ui/notifications/tool-cancelled` (MUST, conditional) —
  unimplemented.** The game has no mechanism for interrupting a
  `tools/call` mid-execution (the client exposes no "cancel" action) —
  the condition for this notification never arises in this client,
  because the cancellation mechanism itself doesn't exist.
- **`ui/resource-teardown` (MUST, conditional) — not applicable.** The
  host never tears the view down programmatically during a game
  session — the only way a session ends is the browser tab closing,
  which ends it without sending this notification (once the page is
  gone, there's nothing left to send it).
- **`ui/notifications/tool-input-partial` (MAY) — skipped.** The game
  doesn't stream tool arguments; this is a MAY recommendation, not a
  MUST.

Separately, deliberate departures from **SHOULD** recommendations (not
MUST — these don't affect the declarations above), out of scope for
the hackathon:
- **Authentication** — the server doesn't implement the OAuth 2.1 the
  transport spec recommends (SHOULD), nor what the Alexa+ partner
  program would require for production integration; this is one gap,
  both protocol-level and architectural, not two separate issues.
- **No SSE priming event** (resumability after a dropped connection) —
  addresses unstable networks, not relevant to this demo.

All of the above are documented with reasoning in `OPEN-ITEMS.md`
(OI-12, OI-13, OI-14).

## Demo honesty

This project's demo video is recorded with `DEMO_MODE=recorded` (see
`server/src/room/descriptions.ts`, `recordedFixture()`): the
`examine_room` narration lines are written in advance, not generated
live by a model during recording. That's a deliberate choice, not a
missing feature — live generation through Amazon Bedrock is a real,
working path, verified live (OPEN-ITEMS.md, OI-02) and shown
separately in [`examples/`](examples/) (three real playthroughs with
live Bedrock, including two control cases: a wrong code and a
decline). Reason: a recording should read the same on every playback,
regardless of what a model would answer on any given run.

`DEMO_MODE` is checked in exactly one place in the entire codebase
(`server/src/room/examineRoom.ts`, `isRecordedDemoMode`) — only the
`examine_room` narration has a "recorded" version. `use_item` and
`attempt_escape` never check this flag at all; they return the same,
inherently deterministic text regardless of mode
(`server/src/room/useItem.ts`, `attemptEscape.ts`) — not staged for
the recording, the same for every player, in every session. Command
order, game state, the live clock, and the elicitation flow in the
video are the same code and the same behavior anyone gets running the
server without this variable set.

## AWS usage

**Service and API.** Amazon Bedrock Runtime, via the Converse API
(`BedrockRuntimeClient` / `ConverseCommand`, from
`@aws-sdk/client-bedrock-runtime`) — not a model-specific request
body, so the same call shape works across Bedrock's Converse-compatible
models.

**Model and region.** `eu.anthropic.claude-haiku-4-5-20251001-v1:0` (a
cross-region EU inference profile), region `eu-north-1` — verified
live (OPEN-ITEMS.md, OI-02, audit D2, 2026-09-23) and used again for
the live calls behind `examples/`.

**Where it's called.** `server/src/bedrock.ts`,
`createBedrockNarrativeGenerator()` — the only place in the codebase
that talks to Bedrock. It's the fallback narration path for
`examine_room` when the connected MCP client hasn't declared the
`sampling` capability (`server/src/room/examineRoom.ts`) — which is
every real Alexa+ client, since, according to Amazon's documentation
(`mcp-toolkit-client-lifecycle.html`, last updated Jul 10, 2026;
checked 2026-09-17), Alexa+'s own `initialize` never declares
`sampling`.

**`DEMO_MODE=recorded` vs. live.** `DEMO_MODE` is checked in exactly
one place in the codebase (`examineRoom.ts`, `isRecordedDemoMode`).
Set to `recorded`, `examine_room` returns pre-written fixture text and
`bedrock.ts` is never called — zero Bedrock usage, zero cost. Without
it (the live path), every `examine_room` call that reaches the
Bedrock branch makes exactly one `ConverseCommand` call.

**Credentials.** Never read, printed, or stored anywhere in this
repo. `BedrockRuntimeClient` in `server/src/bedrock.ts` is constructed
with only a `region` — no explicit credentials in code — so it relies
entirely on the AWS SDK's own default credential provider chain (for
example a local `aws configure` profile, environment variables, or an
IAM role), configured outside this project. `.env.example` has zero
credential fields; only `BEDROCK_MODEL_ID` and `AWS_REGION`
(non-secret configuration) are listed there.

**Measured usage.** The only recorded, measured Bedrock usage in this
repo is the five live calls behind `examples/` (see
[`examples/README.md`](examples/README.md)): **845 input tokens, 356
output tokens, 1,201 total**, read directly from the Converse API's
own `usage` field — not estimated.

**Estimated cost — an estimate, not a bill.** The actual, current
per-token rate for this model/region was not verified. At
illustrative rates of roughly $1/million input tokens and $5/million
output tokens (a typical order of magnitude for Haiku-class Bedrock
models, not a confirmed rate for this specific model/region), that
usage comes out to about **$0.003** — a fraction of a cent, however
far off the illustrative rate turns out to be from the real one.

## Known issues

- **`?refresh=on` is a diagnostic mode, not a bug trigger.** Using it
  makes the browser console print a benign "AppBridge received a
  second ui/initialize" warning after every command — expected in
  that mode, because it remounts the view on each tool call
  (OPEN-ITEMS.md, OI-14). The default mode (no `?refresh` parameter)
  doesn't produce this warning.
- **No fullscreen/expand control, and no accessibility pass yet** on
  the room panel (contrast, touch target sizing) — tracked as
  OPEN-ITEMS.md OI-04, steps 5-6, not done.
- **Live Bedrock narration needs your own AWS setup.** Without your
  own AWS credentials and Bedrock model access configured locally (see
  `.env.example`), `examine_room` degrades gracefully to a fixed base
  description instead of live text — it never errors out, but you
  won't see live-generated narration unless you configure this
  yourself.

## Project status

See `OPEN-ITEMS.md` for the current state of open items, and
`raport-sesji/` for session history — both are internal working notes
in Polish, not part of the submission materials, and every claim this
README makes about the project stands on its own without needing
them.

## License

MIT — see [`LICENSE`](LICENSE).
