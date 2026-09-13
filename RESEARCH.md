# Research — Build, Ship, Shape: Amazon Developer Hackathon (Alexa+ track)

Compiled 2026-09-13. Sources are quoted, not paraphrased, wherever the exact
wording matters for a decision. Anything not confirmed by a source is listed
in **Uncertainties** at the end — not guessed at above it.

**Calibration check on timing.** Today is 2026-09-13. To the target ship date
(Oct 18) that's **35 days**; to the hard deadline (Oct 23, 12:00pm Pacific)
that's **40 days**. The brief's working assumption of "25 dni" for the actual
build is smaller than either — consistent with PLAYBOOK.md's phase split
(10% research/selection already underway, 40% core + 25% polish ≈ 25 days of
a 35-day runway, 15% submission + 10% buffer at the end). Flagging the gap so
it's a deliberate buffer, not an arithmetic error.

Also: registered participants are **5,088** (from the gallery page's nav
count), not ~3,900 as assumed in the brief. Doesn't change strategy, but
correcting it for the odds calibration in LESSONS-deadreckon.md's style.

---

## B4 — Hackathon page: Overview, Rules, Resources

Sources: `https://amazonappdev2026.devpost.com/` (Overview), `.../rules`
(Rules), `.../resources` (Resources).

### Prize pool

Two figures both appear, for different totals:
- **"$138,000 in prizes"** — cash only (Overview, Prizes section heading).
- **"Compete for a share of $190K value of cash and AWS credits"** — cash +
  AWS credits combined (Overview, "Why join?").

### Tracks and prizes (exact, from Rules §8 prize table)

Four **primary tracks**, one winner slot each place:

| Track | 1st | 2nd | 3rd |
|---|---|---|---|
| Fire TV | $25,000 + $15,000 AWS credits | $15,000 + $5,000 AWS credits | $4,000 + $1,000 AWS credits |
| **Alexa+** | $25,000 + $15,000 AWS credits | $15,000 + $5,000 AWS credits | $4,000 + $1,000 AWS credits |
| Bee | $12,000 | $8,000 | — |
| Ring | $12,000 | $8,000 | — |

Two **mini challenges** ("stack these onto your primary track"), $5,000 cash +
$5,000 AWS credits each, 1 winner:
- **AWS Builder**
- **Open Source**

Stacking rule (Overview): *"Pick a primary track and ship a working demo. You
can layer a mini challenge onto the same project for extra ways to win, but
each project can only win one track prize and one mini challenge prize."*
Rules §8: *"A project can only win one (1) track prize and one (1) mini
challenge prize."*

**AWS Builder is not a standalone track.** Rules §4: *"AWS Builder (Mini
Challenge): Any primary track project that incorporates AWS services (i.e.
Amazon Bedrock, AgentCore, Strands SDK, Kiro Crew, SageMaker, etc.) with
documented integrations."* It requires an underlying primary-track entry — it
cannot be won on its own. Note: *"Building with Kiro Crew qualifies on its own
as a development tool used during the hackathon — a submission does not need
to also call a runtime AWS service."*

### Alexa+ track — exact wording (two phrasings, both official)

Overview, "What to Build":
> "Build a self-hosted MCP server (spec 2025-11-25 or later, Streamable HTTP)
> or an Agent Skill. MCP is the open standard that powers Alexa+ integrations.
> New to MCP? Build a simulated Alexa+ experience in a web app using your
> preferred agentic tool."

Rules §4 (more formal):
> "Alexa+: Build a working Agent Skill or a self-hosted MCP server,
> implementing MCP spec version (minimum acceptable version is 2025-11-25).
> Optionally, developers can simulate the Alexa+ experience in a web app using
> their own agentic tools."

Resources page, Alexa+ section (only two links given — no toolkit docs, no
starter repo):
> "Build a working MCP (Model Context Protocol) integration on the open
> standards for Agent Skills and Streamable HTTP transports. You can simulate
> an Alexa+ experience using your preferred agentic tools via a web app."
> - "Build with Agent Skills" → `apps.extensions.modelcontextprotocol.io/api/#build-with-agent-skills`
> - "Streamable HTTP transport" → `modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http`

**This is the resolution to B5's core question — see that section.** The
hackathon's own bar, in its own words, is generic MCP-spec compliance plus an
*optional* web-app simulation — not certified integration with production
Alexa+.

### Open Source mini challenge — exact wording

Overview: *"Ship a new open-source project (include an open-source license)
or a contribution (a branch, a fork, or a pull request) to a public repository
during the hackathon window, alongside your primary-track submission. PRs
don't need to be merged; a forked, unmerged version is fine."*

Rules §4 adds required submission fields: *"contribution URL, project
repository URL, GitHub username, and a description of what you did, how it
works, and why it matters."*

### Deadline (exact, three ways it's stated)

Rules §1: *"Submission Period: Monday, August 31, 2026 (10:15 am Pacific
Time) – Friday, October 23, 2026 (12:00 pm Pacific Time)."* Judging Nov 9–20,
2026. Winners announced "on or around" Dec 3, 2026.

### Judging criteria — verbatim, equally weighted, two-stage

Rules §6: Stage One is pass/fail ("reasonably fits the theme and reasonably
applies the required APIs/SDKs"). Stage Two scores on four **equally
weighted** criteria (Overview's phrasing, fullest available):

> "**Tech Implementation** — How well is the project built, and how
> effectively does it use the required tech? ... **Design** — Does the
> project deliver a complete, coherent product experience? Is the interaction
> model intuitive and well-considered for the target device or platform?
> **Potential Impact** — Does the project make a credible, specific case for
> solving customer needs? Could it realistically serve an audience beyond the
> hackathon? **Quality of the Idea** — Is this a creative, imaginative use of
> the required tools? Does the team demonstrate a genuine understanding of the
> developer ecosystem and the end-user needs within their chosen track?"

**Friction log bonus, exact mechanism** (Rules §6): *"During Stage 1
downselection, Amazon's internal review team assesses each submission's
friction log entries (if provided) and passes a recommended bonus — up to
10% — to the Stage 2 judging panel along with the shortlisted projects. The
Stage 2 panel applies this bonus to the submission's final spreadsheet
score."* This confirms PLAYBOOK.md's rule 4/6 origin precisely — it's Stage 1
signal that buys a Stage 2 score bump, not a separate prize.

### Submission requirements

- Public repo, "must contain all necessary source code, assets, and
  instructions required for the project to be functional." License: *"an open
  source license file. This license should be detectable and visible at the
  top of the repository page (in the About section)."* No specific license
  mandated — any OSI-style license file that GitHub's About sidebar can
  detect.
- Track-specific: *"For Alexa+, Bee, and Ring: The repository must demonstrate
  use of your track's required technology at runtime in your code — imported
  and actually called ..., not just named in the README."*
- Demo video: **under 3 minutes**, public on YouTube/Vimeo. *"Judges are not
  required to watch beyond three minutes."*
- **Mandatory field, word-for-word (Rules §5):**
  > "Include Product Feedback for each tool, API, or SDK used in your project,
  > tell us: Which developer tools, apis and SDKs did you use and for what?
  > What worked well? ... What needs work? ... How was your onboarding
  > experience (getting from zero to hello world) ... Would you build with
  > these devices and services again? Yes/No and please tell us why"

  AWS Builder disclosure piggybacks on this same field: *"For AWS Builder
  (Mini Challenge): Describe which AWS service(s) you used and how, in your
  Product Feedback answer."*
- Optional but scored: Feature Requests, and Friction Log entries (see above).
- Testing: judges may evaluate from text/video alone without running the
  project; if private, credentials must be supplied.
- Physical hardware clause (general, all tracks): Amazon reserves the right
  to demand physical hardware access for proprietary devices "not widely
  available to the public" — a reserved right, not a blanket requirement.
- Solo participation is explicitly permitted (Rules §3 lists "Individuals" as
  an eligible entrant category, no minimum team size).

### Resources page highlights

- **Amazon Devices Builder Tools** — described as *"an MCP server and Agent
  Skills that bring Amazon device knowledge into your AI coding assistant...
  right where you already write code."* Doc URL is version-pinned to Vega
  0.24 (`developer.amazon.com/docs/vega/0.24/mcp-server`), and its own
  blurb under the Fire TV section is explicit that it teaches *"Fire OS and
  Vega OS"* — **it is not described anywhere as covering Alexa+.** Treat it
  as a Fire TV/Vega tool we're also using per the original brief, not as
  something that helps with the Alexa+ track's actual subject matter.
- AWS credits: **$150**, via Google Form (already in progress per
  `SESSION-REPORT-amazon-prep.md`).
- No `llms.txt` documentation index link found on the Resources page itself
  (the brief's separately-supplied URL, `developer.amazon.com/docs/llms.txt`,
  wasn't independently re-confirmed in this pass — worth a direct check
  before relying on it).
- Open Source mini challenge points participants at Hacktoberfest
  (`hacktoberfest.com`) as a resource, alongside "contribute to a public
  repo" — reinforces that AmazonAppDev's own 25 repos (Fire TV/Vega, MIT /
  MIT-0) are a legitimate, sponsor-blessed target for that contribution, not
  just a fallback.

---

## B5 — The MCP contract for Alexa+ (the critical question)

Sources: `developer.amazon.com/docs/alexaplus/add-ons/{home,
mcp-toolkit-overview, mcp-toolkit-quickstart, mcp-toolkit-certify,
mcp-toolkit-authentication, mcp-toolkit-client-lifecycle,
test-with-web-simulator, alexa-plus-add-on-development-stages,
set-up-your-development-environment, get-support-from-amazon}.html`.

### The gate: official MCP Toolkit is partner-only, no hackathon path

> "**Important:** At this time, Category SDK and MCP Toolkit are available to
> select partners only." — `home.html`

The only access path documented anywhere:

> "After you decide to proceed, you request access to the Private Preview.
> After approval, you receive credentials and install the tooling,
> specifically the Alexa-AI command line interface (CLI) with an Add-on Agent
> Skill." — `alexa-plus-add-on-development-stages.html`, Stage 1

No form, timeline, email, or eligibility bar is given for that request. The
word "hackathon" does not appear anywhere in this documentation tree. Setup
instructions assume a pre-existing relationship: *"Log in to the AWS account
that you provided to the **Alexa Solutions Architect**"* (`set-up-your-
development-environment.html`), and support routes through *"your assigned
Alexa+ Solutions Architect (SA)"* (`get-support-from-amazon.html`). The CLI
itself installs from Amazon's private AWS CodeArtifact/CodeCommit via an IAM
role assumption — not a public npm package.

**Conclusion: getting into the actual partner program within the hackathon
window is not a realistic, plannable path.** There's no documented mechanism,
no stated SLA, and the tooling distribution itself assumes an existing SA
relationship.

### The resolution: the hackathon doesn't require that gate

This is why B4's Alexa+ track wording matters so much: the hackathon rules
never ask for certified partner integration. They ask for a **spec-compliant
self-hosted MCP server (2025-11-25+, Streamable HTTP) or an Agent Skill**,
with an explicit, named, non-penalized fallback: *"Optionally, developers can
simulate the Alexa+ experience in a web app using their own agentic tools."*
Nothing in the rules or judging criteria states that a live call from
production Alexa+ scores higher than a simulated one — "Tech Implementation"
asks how well the required tech (MCP/Streamable HTTP) is used, not whether
Amazon's proprietary orchestrator specifically dialed into it.

**Practical reading: build a real, spec-compliant MCP server, and demo it
through a self-built (or generic MCP Inspector-style) client / web app that
plays the role of "Alexa+ asking it things" — because the actual Alexa+
cannot reach it without partner status we don't have and can't obtain in
time.** This is a defensible, judge-visible framing exactly in the
PLAYBOOK.md §5 spirit ("ograniczenie jako teza, nie jako wymówka") — state
plainly in the README that production Alexa+ access is partner-gated, cite
the doc quote above, and show the honest substitute.

**Naming collision to watch:** the term "Agent Skill" is overloaded across
two unrelated things:
1. Amazon's own onboarding artifact — the *"Add-on Agent Skill"* the private
   CLI installs, used to walk a partner through onboarding inside their own
   coding agent (per `alexa-plus-add-on-development-stages.html`).
2. The generic, community MCP "Agent Skills" spec the Resources page links to
   (`apps.extensions.modelcontextprotocol.io/api/#build-with-agent-skills`),
   which is what "or an Agent Skill" in the track requirement likely refers
   to — a packaging format for skills, not Amazon's partner tooling.

These are not confirmed to be the same thing, and the Resources page's link
points at the generic one. Don't conflate them in the spec doc.

### Discovery, invocation, auth (for context — applies if we ever do get
production access, and describes what "real" Alexa+ integration looks like
mechanically)

- Deploy-time registration via a CLI-pushed `addon.json` manifest
  (`integrations[].config.endpoints.default.uri` → your server). At runtime,
  *"Alexa+ routes the request through your add-on to your MCP server using
  streamable HTTP"* (`mcp-toolkit-overview.html`). Tool selection is via
  natural-language/intent routing by Alexa+'s own reasoning layer, not fixed
  slots.
- Auth is a two-tier OAuth 2.1 model: Tier 1 `client_credentials` (service/
  M2M), Tier 2 `authorization_code` + PKCE (user consent), bearer token only
  in the `Authorization` header, RFC 9728 Protected Resource Metadata
  required. Explicitly unsupported: Dynamic Client Registration, CIMD, OIDC,
  step-up auth, `WWW-Authenticate` on 401.
- Round-trip latency requirement: **under 500ms**, and *"Tool signatures and
  descriptions are locked after publication"* (resubmission needed to
  change them).

None of this is buildable/testable by us without partner access — it's
recorded here so the spec doc doesn't have to re-derive it if credits/access
ever do come through, and so the plan-pracy doc can cite it precisely when
explaining why we're not attempting it.

### Simulator vs. physical device (applies to the "real Alexa+" path, not our
actual plan, but resolves the brief's literal question)

A web simulator exists, device-free, with text-only multi-turn conversation,
visual preview for Echo Show sizes, and "Isolation" vs "Global" routing
modes. It can optionally route to a physical device for voice/latency
validation. However, Amazon's own pre-submission checklist for
*certification* (not the hackathon) says: *"Complete on-device testing for
the applicable device modalities."* That's an unresolved tension in Amazon's
own docs (simulator sufficient for dev, but device required before
certifying) — irrelevant to us since we're not pursuing certification, but
worth knowing it exists in case anyone asks why we didn't get "properly"
certified.

---

## B6 — MCP spec 2025-11-25, Streamable HTTP: what our server must satisfy

Source: `modelcontextprotocol.io/specification/2025-11-25/basic/transports`.

- **Single endpoint**, e.g. `/mcp`, **MUST** support both POST and GET.
  Client-initiated DELETE for session termination is optional both ways.
- **Headers:** client **MUST** send `Accept: application/json,
  text/event-stream` on POST, `Accept: text/event-stream` on GET. Server
  response is either `Content-Type: application/json` (single object) or
  `Content-Type: text/event-stream` (SSE) — client must handle both. Every
  request after initialization **MUST** carry `MCP-Protocol-Version:
  2025-11-25`; if absent, server **SHOULD** assume `2025-03-26` for backward
  compatibility. Invalid/unsupported version → **MUST** respond `400`.
- **Sessions:** server **MAY** assign an `MCP-Session-Id` on the
  `InitializeResult` response (cryptographically secure, visible-ASCII only).
  Client **MUST** echo it on every subsequent request. Missing session ID on
  a non-init request → server **SHOULD** `400`. Server may kill a session any
  time → **MUST** then `404` on that ID; client **MUST** re-`initialize`
  fresh on `404`.
- **SSE resumability:** servers may tag SSE events with an `id`, globally
  unique per session/stream; client reconnects via GET + `Last-Event-ID` to
  resume; server must not replay across a different stream than the original.
- **Security (explicit MUST/SHOULD block):** validate `Origin` on every
  connection to prevent DNS rebinding (invalid → `403`); when running
  locally, bind to `127.0.0.1` not `0.0.0.0`; implement real authentication
  on all connections.
- **Backwards compat:** to support pre-2025-11-25 clients, a server can keep
  hosting the old separate SSE+POST endpoints alongside the new single MCP
  endpoint — not required for us since our only intended client is a
  self-built demo client / MCP Inspector, both of which speak current spec.

This confirms the "spec 2025-11-25 or later, Streamable HTTP" requirement in
the hackathon rules is satisfiable by any standard current-generation MCP
server SDK (e.g. the official TypeScript/Python SDKs already implement this
transport) — it is not exotic engineering, it's picking the right SDK/
transport mode and getting the headers/session lifecycle right.

---

## B7 — Gallery + prior winners: what not to repeat, what judges reward

### This hackathon's own gallery: empty

`amazonappdev2026.devpost.com/project-gallery` (fetched 2026-09-13, ~2 weeks
into the 8-week submission window): *"The hackathon managers haven't
published this gallery yet, but hang tight!"* **Zero visible submissions.**
5,088 registered participants confirmed via the Participants nav count. No
duplication risk assessable yet — worth re-checking closer to our own
target ship date (Oct 18) in case it opens.

### Prior Amazon-sponsored hackathon winners

**Parable Rhythm** — Overall 1st Place + Experimental Entertainment 1st +
Bonus Blog Post, **PartyRock Generative AI Hackathon by AWS** (2024, 7,650
registrants, 1,200+ projects). Solo builder (AWS-certified architect), a
no-code interactive detective game built entirely on PartyRock's
Bedrock/Claude-backed widgets (chatbot "Inspector Ray," text-gen for case
data, image-gen for crime scenes). Judge Jeff Barr (AWS Chief Evangelist):
*"This project immerses you in a captivating interactive story using
PartyRock's generative capabilities. Just incredible stuff."* Sources:
[Devpost](https://devpost.com/software/test-kbdsc2),
[winner interview](https://info.devpost.com/blog/user-story-param),
[AWS announcement](https://aws.amazon.com/blogs/aws/congratulations-to-the-partyrock-generative-ai-hackathon-winners).

Other winners found, for pattern-triangulation:
- **FBF: Farm, Build, Fight!** and **Blitzer** — AWS Game Builder Challenge;
  Unity + Amazon Q Developer + Cognito + DynamoDB + Bedrock-driven NPCs.
- **Loop It!** — Grand Prize, Alexa Skills Challenge: Multimodal (2018-19),
  an audio-looping creation skill.
- Category winners across Alexa Multimodal (2018-19) and Beyond Voice (2020)
  skew toward kids/education (Pirate Maths, LEVOOBA Kids), social games (The
  Werewolves Game, Voice Blast), and visual/habit skills using APL (The Happy
  Index). Galleries:
  [Multimodal winners](https://alexamultimodal.devpost.com/project-gallery?filter=winners),
  [Beyond Voice winners](https://alexabeyondvoice.devpost.com/project-gallery?filter=winners).

Published rubrics for those older Alexa challenges match the same four-axis
shape as this hackathon's (idea/creativity, UX quality, potential impact,
submission quality) — the 2018-19 Multimodal challenge additionally had a
second-round "Customer Engagement" criterion based on live Alexa Store
ratings, which doesn't apply here (this hackathon isn't publishing to the
Skills Store).

### Repeated winning patterns (source: synthesis across the above)

1. **Deep, non-decorative use of the specific required tech.** Parable
   Rhythm used "every component" of PartyRock; this hackathon's own rules
   explicitly penalize code that only *mentions* the required tech in a
   README instead of calling it.
2. **A creative/narrative hook beats a generic utility** — games, interactive
   fiction, playful framing recur across winners far more than plain
   productivity tools. "Quality of the Idea" / creativity is a named,
   independent axis in every rubric found, not a tiebreaker.
3. **Tight, shipped MVP over feature breadth.** Explicit strategy from the
   PartyRock winner: avoid the "feature vortex."
4. **Demo-video craft is scored, not incidental.** This hackathon hard-caps
   at 3 minutes and tells judges they don't have to watch past that — "lead
   with your best material" is the operative framing, matching
   LESSONS-deadreckon.md's 2:49-at-3:00 result.
5. **Written narrative content is a separate, real prize surface.** Parable
   Rhythm won a distinct "Bonus Blog Post" award; this hackathon's analogue
   is the mandatory Product Feedback field plus the optional friction log —
   both are graded, not decorative, and both are cheap given work already
   captured in NOTES.md/FRICTION-LOG.md as it happens.
6. **Explicit "beyond the hackathon" credibility framing** is its own scored
   axis ("Potential Impact") — worth a deliberate sentence in the README, not
   just implied by the demo.

---

## Uncertainties (explicit — not resolved by documentation, don't smooth over)

1. **Whether judges will treat "spec-compliant MCP server + self-built/
   simulated Alexa+-style client" as fully satisfying the Alexa+ track**, or
   whether they expect something closer to real Alexa+ plumbing despite the
   rules' own "optionally simulate" language. The rules text supports our
   reading, but the gallery is empty — no precedent yet exists to confirm how
   generously this gets judged in practice. This is the single largest
   remaining risk for Bramka 1 and should be the first thing re-checked if
   the gallery opens before we ship.
2. **Whether the two uses of "Agent Skill" in the Alexa+ docs (Amazon's
   partner-only onboarding CLI artifact vs. the generic MCP Apps "Agent
   Skills" spec linked from Resources) are actually the same mechanism or
   two unrelated things sharing a name.** Not resolved from documentation.
3. **MCP protocol version inconsistency inside Amazon's own docs:** prose
   states "2025-11-25" twice, but the worked JSON example on the Client
   Lifecycle page hardcodes `"protocolVersion": "2025-03-26"`. Doesn't affect
   us directly (we're not calling Amazon's orchestrator), but flagged in case
   it resurfaces.
4. **No certification or Private Preview approval SLA is published anywhere**
   — moot for our plan since we're not pursuing partner access, but confirms
   that path was correctly ruled out for a 25-40 day window.
5. **No stated team-size cap** in the rules — solo is explicitly fine, and no
   upper bound is stated either, so this isn't a constraint either way.
6. **`developer.amazon.com/docs/llms.txt`** (the full doc index mentioned in
   the brief) was not independently re-fetched in this pass — worth a direct
   check before depending on it as a research shortcut later.
