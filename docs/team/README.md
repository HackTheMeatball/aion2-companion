# Team

How work on this project is organised. The owner sets direction and makes the calls listed in
[DECISIONS.md](../DECISIONS.md); the CEO (the coordinating AI session) plans, staffs and ships. Departments are staffed by
AI agents for each piece of work. Agents keep no memory between runs, so **each department's charter below is its
memory**: every agent working for a department reads its charter, [CLAUDE.md](../../CLAUDE.md) and
[ROADMAP.md](../../ROADMAP.md) first, and updates the charter's *Standing notes* when it learns something future runs need.

| Department | Charter | Runs |
|---|---|---|
| Engineering | [engineering.md](engineering.md) | every feature and fix |
| QA & Release | [qa-release.md](qa-release.md) | every pull request and release |
| Tech Lead | [tech-lead.md](tech-lead.md) | every change to structure, data format or state; owns 0.2 Foundations |
| Product Design | [design.md](design.md) | every visible change, before it reaches the owner |
| Data & Research | [data-research.md](data-research.md) | every data change, every class, every game patch |
| Support & feedback | [support.md](support.md) | once per release, and when the owner asks |

One-off projects (consultants) report to the CEO and end with a written report in the scratchpad or `docs/`; their
recommendations become roadmap items or charter rules.

## Parallel sessions

Work can run as several Claude Code cloud sessions (or threads of a Claude Code Project) at once, each on its own
branch. Every session starts from `docs/team/PROJECT-INSTRUCTIONS.md` and `docs/team/HANDOFF.md`; a SessionStart hook
(`scripts/cloud-setup.sh`) installs dependencies. One repository per session.

## Models per session

Pick the model when you start a session. Rule of thumb: **Opus** for the CEO chat, Tech Lead code (core, data build, the
0.3 engine) and reviews of large code changes; **Sonnet** for research reports, CSS/design changes, CI tweaks and
docs reviews; **Haiku** for mechanical docs (templates, label lists). Agents the CEO starts get a model per task the same
way. Archive finished sessions.

## How a change flows

1. **Problem and acceptance** (CEO, with the owner when it's a product call).
2. **Design pass** (Product Design) for anything the user will see; **data pass** (Data & Research) for anything that
   states a game fact; **structure pass** (Tech Lead) for anything touching state, keys, data format or the build.
3. **Build** (Engineering) on a branch, never on `main`.
4. **Verify** (QA & Release): full `npm test`, golden diff reviewed, then a pull request.
5. **Merge** per the owner's rule: the team merges fixes, docs, tests and invisible changes once CI is green; anything
   the user would see in the app waits for the owner's approval in the PR (screenshots and a description in the body).
6. **Release**: version bump + CHANGELOG section; CI tags and publishes.

## Shared rules for every agent

- Work in a git worktree on its own branch; never touch another department's worktree or the main working tree unless
  told to. Never kill processes you didn't start (no broad `pkill`).
- Web: find pages with WebSearch and read them with shell `curl`; WebFetch only for URLs already seen (it prompts the
  owner otherwise).
- Keep monetization plans out of public files (repo, issues, commit messages).
- Report what you could not verify, plainly.
