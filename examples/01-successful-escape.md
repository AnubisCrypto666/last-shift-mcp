# Example 1 — successful escape

A real playthrough of `last-shift-mcp`, server without `DEMO_MODE`
(live Amazon Bedrock, model `eu.anthropic.claude-haiku-4-5-20251001-v1:0`,
region `eu-north-1`), client `@modelcontextprotocol/client` over
Streamable HTTP against a locally running server. `examine_room`'s
narration here is entirely live-generated — unedited, the literal text
returned by Bedrock. `use_item`/`attempt_escape` are deterministic by
design (`server/src/room/useItem.ts`, `attemptEscape.ts`) — zero LLM
in those two calls, 2026-10-09.

---

**`examine control panel`**

> The control panel is a blackened ruin of melted circuits and shattered
> displays, but through the char and devastation, a single line of text
> still pulses with sickly green light—an incomplete access code,
> tantalizingly incomplete. Your pulse quickens as you realize it might
> be the key to something, if only you could fill in the missing pieces
> before the station tears itself apart.

**`examine toolbox`**

> The toolbox is jammed tight beneath the bench, its metal lid dented and
> scarred from years of hard use. Inside, a multitool lies heavy in your
> palm, still radiating warmth from whoever held it during the last
> shift—maybe minutes ago, maybe longer, but definitely not long enough.

**`use multitool on vent`** *(deterministic, zero LLM)*

> You wedge the multitool into the seam and force the vent panel open.
> Wiring spills out - and scratched into the metal behind it, a second
> code fragment.

**`examine vent`** *(after unlocking)*

> The vent panel yawns open like a wound, its exposed wires coiled and
> writhing in the emergency lighting. Behind the tangle of circuitry,
> scratched into the metal with desperate, jagged strokes, you find
> another fragment of the code you need.

**`attempt_escape`** → elicitation, code `7XQ2` *(deterministic, zero LLM)*

> The lock clunks. The vent seal releases. You're out - Maintenance Bay
> 7 falls silent behind you.

**Final state (`room://state`):**

```json
{
  "station": "Kessler Station",
  "room": "Maintenance Bay 7",
  "status": "escaped",
  "remainingSeconds": 596,
  "inventory": ["multitool"],
  "discoveredFragments": { "control_panel": "7X", "vent": "Q2" },
  "ventUnlocked": true,
  "wrongAttempts": 0
}
```
