#!/bin/bash
# SessionStart hook (.claude/settings.json): install npm dependencies in Claude Code cloud sessions.
# Local sessions exit immediately. Cloud VMs ship Chromium (PLAYWRIGHT_BROWSERS_PATH), so browsers aren't downloaded.
# Never fails the session: errors are reported, then exit 0.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}" || exit 0
stamp=node_modules/.lock-hash
want=$(sha256sum package-lock.json | cut -d' ' -f1)
if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$want" ]; then
  echo "cloud-setup: dependencies already installed"
  exit 0
fi
if PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --no-audit --no-fund >/tmp/cloud-setup-npm.log 2>&1; then
  echo "$want" > "$stamp"
  echo "cloud-setup: npm ci done"
else
  echo "cloud-setup: npm ci FAILED (see /tmp/cloud-setup-npm.log); run it manually before testing"
fi
exit 0
