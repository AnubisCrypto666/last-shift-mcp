# Example 3 — control case: decline

Same server/client/conditions as examples 1-2 (live Bedrock, no
`DEMO_MODE`), a fresh session, 2026-10-09. Shows the "player backs
out" branch of elicitation — zero time penalty, unlike a wrong code
(example 2).

---

**`examine toolbox`**

> Your fingers find a dented toolbox wedged beneath the bench, and when
> you pry it open, the multitool inside is still warm—someone used it
> recently, maybe minutes ago. The heat of it against your palm is the
> only reminder that time on this dying station is not abstract.

**`attempt_escape`** → elicitation, player answers `decline`
*(deterministic, zero LLM)*

> You hesitate, code half-entered, then pull your hand back. The
> countdown keeps going.

**State after declining (`room://state`):**

```json
{
  "station": "Kessler Station",
  "room": "Maintenance Bay 7",
  "status": "active",
  "remainingSeconds": 599,
  "inventory": ["multitool"],
  "discoveredFragments": {},
  "ventUnlocked": false,
  "wrongAttempts": 0
}
```

`wrongAttempts` stays at `0` and `remainingSeconds` only drops by the
real elapsed time between calls (1s) — `decline` is not treated like a
wrong code, per `applyAttemptEscape` (`attemptEscape.ts`): backing out
returns before the code is even checked, so the time-penalty branch
never runs.
