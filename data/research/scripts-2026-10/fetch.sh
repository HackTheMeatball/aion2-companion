#!/bin/bash
# usage: fetch.sh URL  -> cache file path printed; stops (exit 9) on 403/429/challenge
S=/tmp/claude-0/-home-user-daeva-companion/e25e447d-251e-5805-b703-b3ec59ecec09/scratchpad
u="$1"; k=$(echo -n "$u" | md5sum | cut -c1-16); f=$S/cache/$k.html
[ -f $S/STOP ] && { echo STOPPED; exit 9; }
if [ -s "$f" ]; then echo "$f CACHED"; exit 0; fi
# spacing: >=6s since last request
last=$(cat $S/last 2>/dev/null || echo 0); now=$(date +%s); w=$((6-(now-last))); [ $w -gt 0 ] && sleep $w
date +%s > $S/last
code=$(curl -sS -A "DaevaCompanionResearch/0.1 (+https://daevacompanion.com)" -m 40 -o "$f.tmp" -w '%{http_code}' "$u")
echo "$(date -u +%FT%TZ) $code $u" >> $S/requests.log
if [ "$code" = 403 ] || [ "$code" = 429 ] || grep -qi -E "just a moment|cf-challenge|captcha" "$f.tmp" 2>/dev/null && [ "$code" != 200 ]; then touch $S/STOP; echo "BLOCKED $code $u"; exit 9; fi
if [ "$code" != 200 ]; then mv "$f.tmp" "$f.$code"; echo "HTTP $code $u"; exit 2; fi
mv "$f.tmp" "$f"; echo "$f NEW"
