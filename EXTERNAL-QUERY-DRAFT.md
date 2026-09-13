Note: this draft is self-contained on purpose — it does not assume you have
read anything else about this project. Paste it whole into a strong external
model as a single query.

---

I'm entering a hackathon solo and want your help choosing a project
direction before I brainstorm my own ideas — I want an outside read on the
best risk-adjusted direction first, uncontaminated by my own pet ideas.

## Who I am

Solo developer. My workflow: I (a coding-agent-driven developer, "Claude
Code" as architect/backend/integration/testing/writing) do all backend,
architecture, integrations, and submission writing; all frontend/UI work is
delegated to a separate frontend-specialized coding model (Kimi K3) and
verified before integration. I don't write code by hand myself — if I catch
myself doing that, it means the instruction to the agent was underspecified.

Track record: in my previous hackathon (Build with DataHub: The Agent
Hackathon, solo, ~3,000 participants, $20,500 pool), I won a secondary
"Most Valuable Feedback Survey Prize" and — separately from any prize — filed
a bug report against the sponsor's open-source project (DataHub, 12.7k GitHub
stars) that a maintainer confirmed, fixed, and merged upstream. I did not win
the grand prize or the track prize. My core competency demonstrated there:
building against MCP (Model Context Protocol) servers, diagnosing real
protocol/tooling bugs while doing it, and writing technical documentation
(a "friction log" of every problem hit) that converts directly into
upstream contributions and judge-visible bonus points.

## Hard constraints

- **Hackathon:** "Build, Ship, Shape: Amazon Developer Hackathon" (Devpost),
  $138,000 cash prize pool ($190K including AWS credits), ~5,100 registered
  participants.
- **Deadline:** October 23, 2026, 12:00pm Pacific Time (hard). My own target
  ship date is October 18, 2026 — I ship when the submission is complete,
  not on the deadline itself, per a rule from my last hackathon.
- **Time remaining:** roughly 35 days to my target ship date, ~40 to the
  hard deadline. I'm budgeting the actual coding effort at roughly 25 of
  those days, with the rest going to research (mostly done), polish,
  submission materials, and a deliberate buffer.
- **Track chosen, not up for debate: Alexa+.** Requirement (quoted from the
  official rules): *"Build a working Agent Skill or a self-hosted MCP
  server, implementing MCP spec version (minimum acceptable version is
  2025-11-25). Optionally, developers can simulate the Alexa+ experience in
  a web app using their own agentic tools."* The server must support
  Streamable HTTP transport per the 2025-11-25 MCP spec.
- **Two additional "mini challenges" are available on top of the primary
  track** (rules confirm a project can combine one primary-track prize + one
  mini-challenge prize). They have different, asymmetric coupling
  requirements to the primary-track project — important not to blur:
  - **AWS Builder ($5,000) — NOT independent.** Rules, verbatim: "Any
    primary track project that incorporates AWS services ... with
    documented integrations." The AWS integration must live inside the same
    Alexa+ project's own code (Bedrock, AgentCore, Strands SDK, Kiro,
    SageMaker, etc. are the named examples; "and more" is explicit). I have
    requested $150 in AWS credits via the hackathon's credit request form;
    approval is pending, not yet confirmed.
  - **Open Source ($5,000) — independent.** Rules, verbatim: "Create a new
    open-source project or contribute to an existing public repository
    during the hackathon window, **alongside** a primary track submission."
    The contribution is submitted alongside the primary-track project, not
    required to be part of it — it can be a wholly unrelated PR, branch, or
    fork against any public repo. PRs do not need to be merged.
- **Judging: four equally-weighted criteria** (official wording): "Tech
  Implementation" (effective, non-decorative use of the required tech —
  code must actually call it, not just mention it in the README), "Design"
  (a complete, coherent, intuitive experience for the target platform),
  "Potential Impact" (a credible case the project could serve a real
  audience beyond the hackathon), "Quality of the Idea" (creativity +
  genuine understanding of the developer ecosystem and end-user needs for
  the chosen track). Two-stage judging: Stage 1 is pass/fail on relevance;
  Stage 2 scores the four criteria. A documented "friction log" (problems
  hit while building, with steps/expected/actual/severity/workaround/
  suggestion) earns Stage 1 reviewers a discretionary bonus of **up to 10%**
  applied to the Stage 2 score.
- **Submission requirements:** public repo with a detectable open-source
  license visible in the GitHub "About" section; demo video under 3 minutes
  (judges are told they don't have to watch past 3 minutes); a mandatory
  "Product Feedback" write-up covering every tool/API/SDK used (what it's
  for, what worked, what didn't, onboarding experience, would-you-use-it-
  again); AWS Builder's disclosure piggybacks on that same field.

## What "self-hosted MCP server for Alexa+" actually means technically —
## including a hard limitation you must factor into risk, not smooth over

I confirmed directly against Amazon's developer documentation (not
inferring): **the official Alexa+ MCP Toolkit / Category SDK — the actual
mechanism by which production Alexa+ discovers and calls a self-hosted MCP
server — is gated behind a private, invite-only partner program** ("available
to select partners only," requiring a named Amazon Alexa Solutions Architect
relationship, private tooling distribution, no published timeline or
hackathon-specific access path, and the word "hackathon" appears nowhere in
that documentation tree).

**However, the hackathon's own rules do not require that gate** — they
explicitly accept a self-hosted, spec-compliant MCP server demoed via a
simulated/self-built web-app client standing in for Alexa+, as an
official, non-penalized option ("Optionally, developers can simulate the
Alexa+ experience in a web app"). So the realistic, achievable scope is: a
genuinely spec-compliant MCP server (2025-11-25, Streamable HTTP — single
`/mcp` endpoint, session management via `MCP-Session-Id`, proper
`MCP-Protocol-Version` header handling, origin validation, etc. — this part
is well-specified and buildable with standard SDKs, not exotic), demoed
through a web client that plays the role Alexa+ would play in production.

**Explicit uncertainty you should weight into your risk assessment, not
resolve for me with false confidence:** since the hackathon's project
gallery is currently empty (no submissions published yet, ~2 weeks into an
8-week window), there is no precedent yet for how generously judges will
score a "simulated Alexa+ client" versus something that looks and feels
closer to a real assistant integration. The rules text supports the
simulated path as fully legitimate, but this is untested in practice for
this specific hackathon.

## What past Amazon/Alexa hackathon judges have rewarded (researched
## directly, not assumed)

- **Deep, non-decorative use of the required tech** — the flagship past
  winner I found (an interactive detective game called "Parable Rhythm,"
  overall 1st place in AWS's PartyRock Generative AI Hackathon, solo
  builder) was praised specifically for using "every component" of the
  required platform; this hackathon's own rules explicitly penalize code
  that merely name-drops the required tech in a README instead of calling
  it.
- **A creative/narrative hook beats a generic utility.** Games, interactive
  fiction, and playful framing recur far more than plain productivity tools
  among winners I found across multiple Amazon-sponsored hackathons; "Quality
  of the Idea" (creativity) is scored as an independent axis, not a
  tiebreaker.
- **Tight, fully-shipped MVP beats broad, half-finished scope.** The
  PartyRock winner's own stated strategy was avoiding "feature vortex."
- **Demo-video craft is scored, not incidental** — this hackathon hard-caps
  video at 3 minutes and tells judges explicitly they don't have to watch
  past that; "lead with your best material" is the operative framing.
- **Written narrative content (feedback, blog-style writeups, friction logs)
  is a separate, real scoring surface**, not decoration — the PartyRock
  winner separately won a "Bonus Blog Post" award, and this hackathon's
  analogue is the mandatory Product Feedback field plus the optional
  friction log (worth up to 10%).
- Older Alexa-specific hackathon winners skewed toward kids/education,
  social/multiplayer games, and visually distinctive skills using Amazon's
  presentation layer of the day (APL) — general signal that jury taste in
  this sponsor's ecosystem rewards playful, visually/interactionally
  distinctive demos over purely backend-clever ones.

## The question

Given all of the above — my strengths (MCP-server engineering, protocol-level
debugging, technical writing that converts into upstream OSS contributions
and judge-visible bonuses), the real technical ceiling and gap of the Alexa+
track (a genuinely spec-compliant MCP server is very achievable; a
*production* Alexa+ connection is not, within this timeframe, for a
non-partner), the goal of naturally qualifying for AWS Builder (which
requires the AWS integration to live inside this same project) while also
picking up Open Source cheaply (which does not need to touch this project at
all), and the demonstrated taste
of this sponsor's judges (deep real tool use, creative/narrative framing,
tight scope, strong demo craft, valuable written self-reporting) —

**what direction or type of project for a self-hosted Alexa+ MCP server would
give the best risk-adjusted chance of winning within a 25-day build,
including how confident I should be in that direction given the specific
uncertainties named above (especially the untested judge tolerance for a
simulated-client demo instead of production Alexa+ plumbing)?**

Please don't just name a single idea — give me a few candidate directions if
you see meaningfully different risk/reward tradeoffs, and be explicit about
what could go wrong with each.
