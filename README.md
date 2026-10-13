# Aion 2 Companion · Asmodian Assassin Route

A leveling companion for the **Aion 2 Asmodian Assassin**, Lv 1 → 45: what to do next in the story, which regional quests
are open, Sealed Dungeons and strongholds by level band, skill points, Daevanion boards and stigmas. Free-to-play focused,
verified data only (two sources, game data, or your own in-game screens), progress ticked by hand.

**Live:** <https://aion2.ishkabytes.com/>

Fan-made and not affiliated with or endorsed by NCSoft. Game names and images belong to NCSoft. Most game data comes from
[Metabot](https://metabot.gg/en/aion-2); every source is credited in the app's *Sources* card and in
[`data/DATA_SOURCES.md`](data/DATA_SOURCES.md).

## Using it

- **Basic / Advanced** (top right): Basic keeps only the essentials.
- **Next up** always shows your next move. Space / Enter completes the top card; arrow keys move through the stack.
  *Pop out* opens it in a small always-on-top window (Chrome / Edge).
- **Level up** in the Journey card is the only thing that changes your level; ticking quests never does.
- Works offline after the first visit and can be installed as an app (browser menu → *Install* / *Add to Home Screen*).

### Your progress

Progress is saved **in this browser only** (`localStorage`), never sent anywhere. Use **Export progress** in the footer to
save a `.json` backup and **Import progress** to restore it (the previous state is kept one step back). See
[PRIVACY.md](PRIVACY.md).

### Moving from the claude.ai version

The guide was first published as a claude.ai artifact. Browsers keep each site's storage separate, so your ticks don't
carry over by themselves:

1. Open the claude.ai version and click **Export progress** (footer). Allow the download when asked.
2. Open <https://aion2.ishkabytes.com/> and click **Import progress**, pick that file, then **Replace**.

Both versions use the same save format, so this works in either direction.

## Development

Requirements: Node 22+ and Python 3.10+ (only for regenerating data). No runtime dependencies; Playwright is the only
dev dependency.

```sh
npm ci                                   # once
npx playwright install --with-deps chromium   # once, if you don't have Playwright's Chromium yet
npm run build                            # dist/ (site) + dist-artifact/index.html (claude.ai single file)
npm run serve                            # http://localhost:8080/  (claude.ai build at /artifact/)
npm test                                 # build, then every suite against dist/ (≈10–20 min)
npm run test:quick                       # build, then the suites with a smaller regression matrix and no screenshots
node tests/run.mjs --only e1,mig1        # selected suites (after a build)
npm run gen                              # regenerate the app's data block from data/*.json
```

```
src/index.html          the app (one file: HTML + CSS + JS); icons in src/assets/icons/
src/sw.js               service worker template (offline cache), filled in by the build
public/                 copied to the site root: CNAME, robots.txt, sitemap.xml, 404.html, favicon, manifest + icons
scripts/build.mjs       builds dist/ and dist-artifact/;  scripts/serve.mjs  local static server
data/                   research data (JSON) the app's data block is generated from + DATA_SOURCES.md
tools/gen/              data generator (gen.py → gen-block.js → apply.py into src/index.html)
tools/research/         the scripts that built data/*.json (provenance)
tools/history/          one-time patch scripts from the E2 / E4 passes (provenance, already applied)
tests/                  Playwright suites, fixtures, baselines (old app versions for migration tests), runner
docs/                   ARCHITECTURE.md, ISSUES.md, DEPLOY.md
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing anything that touches saved progress, and
[CLAUDE.md](CLAUDE.md) for the working rules. Deployment: [docs/DEPLOY.md](docs/DEPLOY.md). Known gaps:
[docs/ISSUES.md](docs/ISSUES.md). History: [CHANGELOG.md](CHANGELOG.md).

## License

Code: [MIT](LICENSE). Game names, icons and other game assets © NCSoft. Data is compiled from the sources credited in
the app and in `data/DATA_SOURCES.md`; see [LICENSE](LICENSE) for the details (including thegameswiki's CC BY-NC-SA).
