# 0.4 S0: Sync design (docs only; old Y0)

Planned in the 0.4 planning pass (#135, ROADMAP "0.4", "Alongside 0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §1
("Change times and `merge()`"), docs/DATA-FORMAT-V2.md §13, PRIVACY.md and the P3c plan
(`docs/plans/0.4/P3c-save-v5.md`, the v5 save) first. Docs only.

## Problem

Progress lives in one browser's storage; iPhone Safari can clear it after weeks unused. The sync client (0.6 lane C)
and server (0.7) need a design, and the owner needs a hosting and cost decision before 0.6, not during it.

## Result

`docs/design/sync.md`:

1. **Model:** no accounts; a sync code made on the device; end-to-end encryption (the key is derived from the code on
   the device; name the algorithms and the key derivation with their parameters); the server stores ciphertext only.
   What happens when the code is lost ("lose the code = lose the cloud copy"), and how a second device joins.
2. **Merge:** sync sends whole v5 saves (P3c) and merges with `merge()` per slot id, per-item change times; view
   settings and `backup` stay on the device (`syncedPart`, `src/core/sync.js`).
3. **Privacy requirement (review note 5 on #134):** the player name and the save label (`<name>-<class>-lvl<level>`)
   travel only inside the encrypted payload. The server sees an opaque sync id, ciphertext, its size and times; no name,
   label, class, level or pack id in a URL, header, file or object name, log line or metric. PRIVACY.md changes listed.
4. **Server:** the API (put / get / delete with the sync id), size limits, retention (how long an unused copy is kept),
   abuse limits, deletion on request.
5. **Hosting options for the owner:** two or three (for example a serverless function with a key-value store), each
   with what it costs at the expected scale and the account the owner would create. **No price from memory:** each
   price is "to check" with the provider's pricing page URL, unless a cloud research session fetched it under the
   fetching rules.
6. **Owner decisions** as a short table with a recommendation each: hosting, money, retention, whether sync ships in
   the artifact build (claude.ai) or the site only.
7. **Tests the build items will need** (client: merge over the wire, wrong code, offline; server: ciphertext only, no
   name in logs).

## Appetite

M, docs only (about 200–300 lines).

## No-gos

- No code, no account created, no service contacted, no web fetch from a bot run.
- No change to the v5 save shape (P3c owns it; a needed change is a finding for the planner).
- No analytics, no accounts, no email.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `docs/design/sync.md` covers 1–7, each as its own section.
- [ ] Section 3 states the privacy requirement in the words above, and lists every place a name or label could leak
      (URL, header, object name, log, metric, error report) with how the design prevents it.
- [ ] Every price is either "to check" with a URL, or sourced from a fetch log of a research session.
- [ ] The owner decision table has a recommendation per row and marks which row blocks 0.6 lane C.
- [ ] Only docs changed; `npm test` green.

## Files (owns)

`docs/design/sync.md` (new).

## Lanes, model, order

Lanes: none. Model: Opus (security, saves, crypto). After: nothing (it reads P3c's plan, not its code). Beside P3c
(wave 3). Its owner decisions go to the tracker as a To-do only when 0.6 lane C is next.

- [next] #? opus lanes:none
