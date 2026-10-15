# Daeva Companion (unofficial) — companion for AION 2

A fan-made companion for AION 2. Today it is the leveling guide for the **Asmodian Assassin**, Lv 1 → 45: what to do next in the story, which regional
quests are open, Sealed Dungeons and strongholds by level band, skill points, Daevanion boards and stigmas. Free-to-play
focused. Data is cross-checked: two independent sources, game-database values or the maintainer's in-game screens; anything
weaker is labelled *single source*, *inferred* or *disputed* in the app's Confidence card. Game data changes with patches,
so check in game. Progress is ticked by hand.

**Live:** <https://daevacompanion.com/>

Unofficial and fan-made: not affiliated with or endorsed by NCSoft (NC Corporation) or NC America. AION and AION 2 are
trademarks of NC Corporation; game names and images belong to NC. Most game data comes from
[Metabot](https://metabot.gg/en/aion-2); every source is credited in the app's *Sources* card and in
[`data/DATA_SOURCES.md`](data/DATA_SOURCES.md). Listing a source doesn't mean it endorses this guide.

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
2. Open <https://daevacompanion.com/> and click **Import progress**, pick that file, then **Replace**.

Both versions use the same save format, so this works in either direction.

## Development

Requirements: Node 22+. No runtime dependencies; dev dependencies are esbuild (bundles the app's modules into the
single-file page), ajv (validates the data against `data/schema/`) and Playwright (tests).

```sh
npm ci                                   # once
npx playwright install --with-deps chromium   # once, if you don't have Playwright's Chromium yet
npm run build                            # dist/ (site) + dist-artifact/index.html (claude.ai single file)
npm run serve                            # http://localhost:8080/  (claude.ai build at /artifact/)
npm test                                 # build, then every suite against dist/ (≈10–20 min)
npm run test:quick                       # build, then the suites with a smaller regression matrix and no screenshots
node tests/run.mjs --only e1,mig1        # selected suites (after a build)
npm run gen                              # validate data/**, run the cross-record checks, rewrite data/DATA_SOURCES.md
npm run test:data                        # schema suite only (no browser, ≈1 s)
```

```
src/index.html          the page shell (head + markup); the build inlines the styles and scripts it names
src/styles/*.css        styles (fonts.css: the @font-face rules; app.css; brand.css: header lockup), inlined verbatim
src/main.js             the app script (ES module entry), bundled by esbuild into one inline <script>
src/data/*.js           the data tables under their page names (compiled from data/, plus what stays code) and the text helpers
src/site.js             the standalone site's own script (storage persistence, service worker)
src/assets/             icons and self-hosted fonts
brand/                  the brand's source SVGs (icon, maskable icon, favicon, wordmark); tools/brand/ draws them
src/sw.js               service worker template (offline cache), filled in by the build
public/                 copied to the site root: CNAME, robots.txt, sitemap.xml, 404.html, favicon, manifest + icons
scripts/build.mjs       builds dist/ and dist-artifact/;  scripts/serve.mjs  local static server
data/                   the game data and guide text in format v2 (docs/DATA-FORMAT-V2.md; schemas in data/schema/) + DATA_SOURCES.md
tools/gen/              data generator (gen.mjs: validates data/ and compiles the module src/data/generated.js at build time)
tools/research/         the scripts that built the v1 data files (provenance)
tools/history/          one-time patch and conversion scripts (E2 / E4 passes, the v1 → v2 conversion; provenance, already applied)
tests/                  Playwright suites, fixtures, baselines (old app versions for migration tests), runner
docs/                   ARCHITECTURE.md, ISSUES.md, DEPLOY.md
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing anything that touches saved progress, and
[CLAUDE.md](CLAUDE.md) for the working rules. Deployment: [docs/DEPLOY.md](docs/DEPLOY.md). Known gaps:
[docs/ISSUES.md](docs/ISSUES.md). History: [CHANGELOG.md](CHANGELOG.md).

## License

Source-available, not open source. See [LICENSE](LICENSE) for the details.

- **Code:** [PolyForm Strict 1.0.0](https://polyformproject.org/licenses/strict/1.0.0): read it and use it for any
  noncommercial purpose; no redistribution, no modified versions.
- **Guide text, data selection, name (Daeva Companion) and artwork:** © 2026 hackthemeatball, all rights reserved. Game facts themselves are
  free for anyone.
- **Third-party:** game names and icons © NC Corporation. Data sources are credited in the app and in
  `data/DATA_SOURCES.md`. Short quotations in `data/claims.json` stay their owners' (thegameswiki: CC BY-NC-SA 4.0).
- Versions up to 0.1.1 were published under MIT; copies of those keep that license.

## Contributing

Bug reports and data corrections are welcome as [issues](https://github.com/hackthemeatball/daeva-companion/issues)
(they're public, so leave out personal details). Pull requests with code can only be merged with a written grant that lets
the maintainer use and relicense the contribution; open an issue first.
