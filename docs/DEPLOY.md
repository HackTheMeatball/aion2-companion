# Deploying

Two targets, built from the same source by `npm run build`.

## GitHub Pages (aion2.ishkabytes.com)

Every push to `main` runs `.github/workflows/ci.yml`: the **test** job (`npm ci`, Playwright's Chromium, `npm test`),
then, only if it passes, the **deploy** job builds `dist/` and publishes it with `actions/configure-pages`,
`actions/upload-pages-artifact` and `actions/deploy-pages`. After a successful deploy, the **release** job tags and
publishes a GitHub Release for every CHANGELOG version that has none yet (see *Releases* below). Pull requests and
other branches only run the tests.

Runners are pinned to `ubuntu-24.04` rather than `ubuntu-latest`, so a GitHub image change can't silently change test
results. Move to a newer image on purpose, in its own commit, with a green run.

## Releases

1. In one commit: set `version` in `package.json` (`npm version X.Y.Z --no-git-tag-version`) and add a
   `## X.Y.Z (beta) — YYYY-MM-DD · summary` section at the top of CHANGELOG.md.
2. Push to `main`. The test job fails early if the version has no CHANGELOG section
   (`node scripts/release-notes.mjs`).
3. After the deploy, the release job creates tag `vX.Y.Z` and the GitHub Release (notes = that CHANGELOG section,
   marked latest). Older CHANGELOG versions without a tag are backfilled at the commit that first set them in
   `package.json`. Don't create tags or releases by hand.

### One-time setup (repository settings)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Custom domain:** `aion2.ishkabytes.com` → Save. (`public/CNAME` carries the same name; with Actions deploys the
   setting in the UI is what counts.) DNS already has `CNAME aion2 → hackthemeatball.github.io`.
3. Wait for the DNS check to pass, then tick **Enforce HTTPS** (the certificate can take a few minutes to an hour).
4. Optional, recommended: verify `ishkabytes.com` under **Settings → Pages → Verified domains** (account settings) so
   nobody else can claim the subdomain.
5. The `github-pages` environment is created by the first deploy. If it has deployment-branch rules, allow `main`.

### Checking a deploy

- The run's **deploy** job links the live URL.
- `https://aion2.ishkabytes.com/build.json` shows the build id; the service worker cache is named `aion2-route-<id>`.
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
