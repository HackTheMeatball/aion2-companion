# Design tokens (#96): before/after pixel result

`node tests/support/tokens-shots.mjs <batch>`. Before = build of `origin/main` 043b608 (worktree `tests/out/main-wt`),
after = branch `claude/issue-96-20261016-0702`. Full-page screenshots, exact pixel compare (a mismatch is re-shot up
to 3 times, both sides; a real CSS difference differs on every attempt).

## Batch 1: `^site-390-` (24 cases): 24 identical, 0 differ, 0 re-shot

site-390-{light,dark}-{basic,advanced}-{lv12,lv27,lv45,fresh,lv27-drawer,lv27-open}: all identical.

## Batch 2: `^site-1100-` (24 cases): 24 identical, 0 differ, 0 re-shot

site-1100-{light,dark}-{basic,advanced}-{lv12,lv27,lv45,fresh,lv27-drawer,lv27-open}: all identical.

## Batch 3: `^artifact-390-` (24 cases): 24 identical, 0 differ, 0 re-shot

artifact-390-{light,dark}-{basic,advanced}-{lv12,lv27,lv45,fresh,lv27-drawer,lv27-open}: all identical.

## Batch 4: `^artifact-1100-` (24 cases): 24 identical, 0 differ, 0 re-shot

artifact-1100-{light,dark}-{basic,advanced}-{lv12,lv27,lv45,fresh,lv27-drawer,lv27-open}: all identical.

## Total (2026-10-16)

96 / 96 pixel-identical, 0 differ, 0 needed a re-shot, so there was no noise to list.
