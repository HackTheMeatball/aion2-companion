# Support templates

Extends [support.md](support.md) (owner, labels, routing). Read that first. This file adds the triage sort and the weekly
status note. Issues are public: never ask for account details, passwords, emails, character names or screenshots that show
them. Never promise dates or features; never mention monetization.

## 1. Triage template

Sort every report into one type. Label it, then ask only for what that type needs.

| Type | Label | Signs | Ask for | Goes to |
|---|---|---|---|---|
| Save problem | `bug` | Progress lost, ticks reverted, wrong level after reload, import/export failed | Version, build (site or artifact), browser and device, whether the browser clears site data on exit or is in private mode, what they did just before. Ask them to use **Export** first if the page still loads. | Engineering. Treat as urgent (CLAUDE.md: never break saved progress). |
| Wrong guide data | `data` | A level gate, quest giver, location, skill value or order is wrong | The step or quest name, their level, what the game shows, and a source if they have one (a link or "in-game screen"). | Data & Research, with the reporter's source. |
| Display bug | `bug` or `ux` | Layout broken, text cut off, wrong colour, a card missing, slow | Version, build, browser, device and window size, mode (Basic or Advanced), and the page section. A screenshot of the guide is fine if it shows no account info. | Engineering (reproduce at the reported version, level and story quest). |
| Request | `feature` | New feature, another class, a different layout | What they are trying to do, not the solution. | CEO, for the roadmap. |

If a report fits two types, file the more urgent one and note the other in the text.

**Reply skeleton (public, plain, short)**
1. Thank them in one sentence.
2. Say which type you filed it as.
3. Ask for the missing items, as a short list.
4. Say what happens next ("Data will check this against the game database"). No dates.

**Do not ask for:** login or account details, character or server names, payment info, real names, emails, or anything
private. If a reporter posts any of it, ask them to edit it out and tell the owner.

The app pre-fills version, level, story quest, mode, build and browser from *Report a problem*. Check these before asking
again.

## 2. Weekly status template (for the owner)

Send once a week, or once per release. Keep it to one screen.

```
Support status, week of YYYY-MM-DD (app vX.Y.Z)

Counts (new / open / closed this week)
- Save problem:    n / n / n
- Wrong data:      n / n / n
- Display bug:     n / n / n
- Request:         n / n / n

Urgent (needs the owner today)
- #N one line. Or "none".

Waiting on the reporter (needs-info)
- #N one line.

Data corrections sent to Data & Research
- #N one line, with the source given.

Ideas worth a decision
- #N one line, and why.

Needs an in-game check by the owner
- #N one line. Or "none".

Notes
- Anything unusual: repeat reports, one browser affected, a patch effect (see patch-watch.md).
```

Rules: counts come from GitHub labels, not memory. Save problems are always listed, even when closed. Do not name
reporters beyond their GitHub handle.
