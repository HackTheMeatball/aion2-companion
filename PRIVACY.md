# Privacy

**Short version:** no accounts, no analytics, no tracking, no cookies. Your progress stays in your browser.

## What is stored, and where

- **Your progress** (level, ticked quests and steps, stigma picks, settings) is saved in your browser's `localStorage`
  under the key `aion2-assassin-route-v4` on `aion2.ishkabytes.com`. It never leaves your device. When you import a
  file, the progress it replaces is kept under `aion2-assassin-route-v4:before-import`.
- **Keeping your progress:** when you come back with saved progress, the site asks your browser to keep its storage
  (`navigator.storage.persist()`), so it isn't cleared automatically (Safari can clear site data after 7 days without a
  visit). Your browser decides; Firefox may ask you. The time of the last request is stored under
  `aion2-assassin-route-v4:persist-asked` so it asks at most once a week. If saving ever fails in your browser, the page
  says so and offers Export.
- **Offline copy:** a service worker keeps a copy of the app, its icons and fonts in your browser's cache so it works offline.
  It contains no personal data.
- **Export progress** downloads a `.json` file to your device; **Import progress** reads a file you pick. Neither is
  uploaded anywhere.

Clearing this site's data in your browser deletes your progress — export a backup first.

**claude.ai version:** the artifact build keeps the same progress data in that artifact's own browser storage on claude.ai;
Anthropic's privacy policy covers claude.ai itself.

## Requests to other sites

- **Fonts** are served from this site; no request goes to Google or any other font service.
- **Hosting:** the site is served by GitHub Pages, which may log IP addresses for security and operations. See the
  [GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
- **Links** in the guide (Metabot, maps, sources) are only requested when you click them.
- **Report a problem** (footer) opens a new GitHub issue form with these fields filled in from the link: the app version,
  your level and current story quest in the guide, Basic/Advanced mode, which build you use (site or claude.ai) and your
  browser's user agent. Nothing else from your progress is included, and nothing is sent until you submit the issue on
  GitHub, where you can edit or delete any of it first. Issues are public.

## Changes

This page is updated before anything about what the site collects changes. If the site ever adds anything that collects
data, this page and, where the law requires it, a consent prompt come first.

## Contact

Questions or concerns: open an issue at <https://github.com/hackthemeatball/aion2-companion/issues>. Issues are public,
so leave out personal details.
