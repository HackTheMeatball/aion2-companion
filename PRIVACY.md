# Privacy

**Short version:** no accounts, no analytics, no tracking, no cookies. Your progress stays in your browser.

## What is stored, and where

- **Your progress** (level, ticked quests and steps, stigma picks, settings) is saved in your browser's `localStorage`
  under the key `aion2-assassin-route-v4` on `aion2.ishkabytes.com`. It never leaves your device. When you import a
  file, the progress it replaces is kept under `aion2-assassin-route-v4:before-import`.
- **Offline copy:** a service worker keeps a copy of the app and its icons in your browser's cache so it works offline.
  It contains no personal data.
- **Export progress** downloads a `.json` file to your device; **Import progress** reads a file you pick. Neither is
  uploaded anywhere.

Clearing this site's data in your browser deletes your progress — export a backup first.

## Requests to other sites

- **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`): the page loads its three fonts from Google, which
  sees your IP address and browser user agent like any web request. See
  [Google's privacy policy](https://policies.google.com/privacy). If it is blocked, the page falls back to system
  fonts.
- **Hosting:** the site is served by GitHub Pages, which may log IP addresses for security and operations. See the
  [GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
- **Links** in the guide (Metabot, maps, sources) are only requested when you click them.

## Contact

Questions or concerns: open an issue at <https://github.com/hackthemeatball/aion2-companion/issues>.
