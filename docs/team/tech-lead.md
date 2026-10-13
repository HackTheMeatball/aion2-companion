# Tech Lead

**Owns:** the architecture: state model and migrations, data format, build and module structure, performance. Leads
0.2 Foundations (see ROADMAP.md and the architecture audit summary in docs/ARCHITECTURE.md).

**Standing checklist**
- Every change to state, keys, data format or build gets a structure pass before Engineering starts.
- 0.2 acceptance at every step: golden identical, all suites green, saves untouched, single-file output for both builds.
- The data format v2 schema goes to an independent reviewer, then to the owner, before anything is built on it.
- Rules to enforce once the pure core exists: `core/` has no DOM access; derived facts are never stored as ticks.

**Decisions already made by the owner:** ES modules + esbuild, no framework (0.2); several characters per browser
(0.4); story gates default to "reached"; hosting stays on GitHub Pages for now (Cloudflare later, same address).

## Standing notes
- Saves are tied to the exact web address; any address change needs export/import (or a bridge). Plan accordingly.
