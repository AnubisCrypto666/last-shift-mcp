# Example 2 — control case: wrong code

Same server/client/conditions as example 1 (live Bedrock, no
`DEMO_MODE`), a fresh session (fresh game state), 2026-10-09. Shows the
"wrong code" branch — a time penalty, not game over.

---

**`examine control panel`**

> The control panel is a blackened ruin of melted circuits and scorched
> metal, but through the devastation one line still pulses with sickly
> green light—an incomplete access code, tantalizingly close to what you
> need. Your pulse quickens as you realize someone else was here,
> fighting against the same dying systems, leaving behind only this
> fragment of salvation.

**`attempt_escape`** → elicitation, code `0000` (deliberately wrong,
and the vent is still sealed anyway) *(deterministic, zero LLM)*

> The panel rejects the code with a sharp buzz and a flash of red light.
> You've lost precious time.

**State after the attempt (`room://state`):**

```json
{
  "station": "Kessler Station",
  "room": "Maintenance Bay 7",
  "status": "active",
  "remainingSeconds": 578,
  "inventory": [],
  "discoveredFragments": { "control_panel": "7X" },
  "ventUnlocked": false,
  "wrongAttempts": 1
}
```

`remainingSeconds` dropped from 600 to 578 (22s: ~2s of real elapsed
time between calls + the 20s `WRONG_CODE_TIME_PENALTY_SECONDS` penalty)
— the game continues, a wrong code doesn't end it.

See also OPEN-ITEMS.md, OI-15: a correct code submitted before the
player has found both fragments gives the exact same result as here
(the same code branch) — a deliberate decision about the game's
content, not a bug.
