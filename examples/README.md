# Examples — "The Last Shift"

Real playthrough samples of `last-shift-mcp`, not invented text.
Generated 2026-10-09, server without `DEMO_MODE` (live Amazon
Bedrock), client over `@modelcontextprotocol/client`/Streamable HTTP
against a locally running server — the same production code that
handles every real session.

- [`01-successful-escape.md`](01-successful-escape.md) — full
  playthrough: both code fragments, a successful escape.
- [`02-wrong-code.md`](02-wrong-code.md) — control case: wrong code,
  time penalty, the game continues.
- [`03-decline.md`](03-decline.md) — control case: the player backs
  out of `attempt_escape` through elicitation, zero penalty.

## Bedrock usage for generating these examples

This session's limit: at most 10 live Bedrock calls total. **5 of 10
used** — only `examine_room` calls Bedrock (`use_item`/`attempt_escape`
are deterministic, zero LLM):

| # | Call | Input tokens | Output tokens | Total |
|---|---|---|---|---|
| 1 | Example 1, `examine control panel` | 169 | 85 | 254 |
| 2 | Example 1, `examine toolbox` | 168 | 67 | 235 |
| 3 | Example 1, `examine vent` (after unlocking) | 171 | 61 | 232 |
| 4 | Example 2, `examine control panel` | 169 | 79 | 248 |
| 5 | Example 3, `examine toolbox` | 168 | 64 | 232 |
| | **Total** | **845** | **356** | **1201** |

Token counts are real, read directly from the `usage` field of the
Bedrock Converse API response (`BedrockRuntimeClient`/`ConverseCommand`)
for each of the five calls — not estimated.

**Estimated cost — this is an estimate, not an AWS bill.** The current
per-token rate for model `eu.anthropic.claude-haiku-4-5-20251001-v1:0`
in `eu-north-1` was not verified in this session (no pricing-page
access at that step). At illustrative, order-of-magnitude rates of
around $1 / million input tokens and $5 / million output tokens
(typical for Haiku-class Bedrock models, not a confirmed current rate
for this specific model/region) — the cost of these 845 input and 356
output tokens comes out to roughly **$0.003**, under a cent regardless
of whether the real rate differs from this illustration by several
times over. For comparison: the AWS account has a budget alert set at
$5/month (SESSION-REPORT-amazon-prep.md) — this usage is several
orders of magnitude below that threshold.

## Security

Checked by hand: none of the three example files contain keys,
tokens, AWS account identifiers, or any other credentials — only
narration text, command names, and game state as JSON (fields already
documented in `room://state`: station/room name, status, clock,
inventory, fragments, wrong-attempt counter).
