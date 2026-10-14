# Deploying

Two targets, built from the same source by `npm run build`.

## GitHub Pages (daevacompanion.com)

Every push to `main` runs `.github/workflows/ci.yml`: the **test** job (`npm ci`, Playwright's Chromium, `npm test`),
then, only if it passes, the **deploy** job builds `dist/` and publishes it with `actions/configure-pages`,
`actions/upload-pages-artifact` and `actions/deploy-pages`. The **smoke** job then checks the live site really serves
that build (see *Smoke check* below). Only after it passes, the **release** job tags and publishes a GitHub Release for
every CHANGELOG version that has none yet (see *Releases* below). Pull requests and
other branches only run the tests.

Runners are pinned to `ubuntu-24.04` rather than `ubuntu-latest`, so a GitHub image change can't silently change test
results. Move to a newer image on purpose, in its own commit, with a green run.

## Releases

1. In one commit: set `version` in `package.json` (`npm version X.Y.Z --no-git-tag-version`) and add a
   section at the top of CHANGELOG.md in the house format (docs/team/qa-release.md, "Changelog format").
2. Push to `main`. The test job fails early if the version has no CHANGELOG section or any section breaks the format
   (`node scripts/release-notes.mjs`).
3. After the deploy, the release job creates tag `vX.Y.Z` and the GitHub Release (title "X.Y.Z — summary", notes =
   that CHANGELOG section, marked latest). Older CHANGELOG versions without a tag are backfilled at the commit that first set them in
   `package.json`. Don't create tags or releases by hand.

### One-time setup (repository settings)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Custom domain:** `daevacompanion.com` → Save. (`public/CNAME` carries the same name; with Actions deploys the
   setting in the UI is what counts.) DNS (Cloudflare, grey cloud / DNS only): `CNAME @ → hackthemeatball.github.io` and `CNAME www → hackthemeatball.github.io`
   for daevacompanion.com. Since 2026-10-14 the old address aion2.ishkabytes.com and daevapath.com forward here with
   Cloudflare Redirect Rules (proxied records).
3. Wait for the DNS check to pass, then tick **Enforce HTTPS** (the certificate can take a few minutes to an hour).
4. Optional, recommended: verify `daevacompanion.com` under **Settings → Pages → Verified domains** (account settings) so
   nobody else can claim the subdomain.
5. The `github-pages` environment is created by the first deploy. If it has deployment-branch rules, allow `main`.

### Smoke check (CI)

`scripts/smoke.mjs` runs in the **smoke** job after every deploy. The deploy job passes its `dist/build.json` as a job
output (`build_json`); the script:

1. polls `https://daevacompanion.com/build.json` every 10 s for up to 5 min, each request with a fresh `?smoke=…` query
   and `Cache-Control: no-cache` (so neither the Pages CDN nor a proxy can answer from cache), until it equals that
   build.json (compared as parsed JSON);
2. fetches the page the same way and checks the footer version link (`#verLink`, filled in at build time) reads
   `v<package.json version>`.

Either failure is an `::error` annotation on the run (titles start with "Smoke:") and fails the job, so **release**
doesn't run: no tag or GitHub Release for a version that isn't live. A failed smoke means the site is still on the old
build or a stale CDN copy: check the deploy job and `/build.json`, then re-run the failed jobs (re-running smoke alone
is enough if the deploy did go live late).

Run it by hand: `node scripts/smoke.mjs --expect '{"build":"<id>"}'` against the live site (default `--expect` is the
local `dist/build.json`), or `npm run build && npm run serve`, then
`node scripts/smoke.mjs --url http://localhost:8080 --timeout 0`. Options: `--url`, `--expect`, `--version`,
`--timeout` (s), `--interval` (s). Behind a proxy, Node 22's `fetch` needs `NODE_USE_ENV_PROXY=1`.

### Checking a deploy

- The run's **deploy** job links the live URL.
- `https://daevacompanion.com/build.json` shows the build id; the service worker cache is named `aion2-route-<id>`.
- Returning visitors get the new page on their next load (network-first); the service worker swaps the icon cache at
  the same time.

### Rolling back

Revert the commit on `main` and push; the workflow redeploys the previous state. (Or re-run an older successful
workflow run's deploy job.) Saved progress is unaffected either way.

## claude.ai artifact

`dist-artifact/index.html` is the single-file build for the existing claude.ai artifact: no document skeleton, icons
referenced as `/_blob/<id>` (the artifact's uploaded assets, ids in `scripts/artifact-blobs.json`), no service worker
or manifest. Publish it to the **same artifact URL** as an update so its users keep their progress (claude.ai storage
is per artifact). If an icon is added or changed, upload it to the artifact's asset store and put its new id in
`scripts/artifact-blobs.json` before building.

Preview locally: `npm run build && npm run serve`, then open `http://localhost:8080/artifact/` (the server maps
`/_blob/<id>` to the local icons).
