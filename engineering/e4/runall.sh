#!/bin/bash
# Run every suite against the current assassin-route.html. Usage: bash polish/e4/runall.sh [outdir]
cd /tmp/claude-0/-home-claude/3de1c16d-f486-54fd-a3e3-19bf8a09de56/scratchpad
O=${1:-polish/e4/run}; mkdir -p $O
export NODE_PATH=$(npm root -g)
bash polish/qa/map.sh assassin-route.html qa-cur.html
bash polish/qa/map.sh backup-v285-before-polish.html qa-v285.html
bash icons/map.sh
bash polish/e2/map-pre.sh
node polish/e1/e1test.js $PWD/test-icons.html polish/e1/fixture-v285.json > $O/e1.out 2>&1 &
node polish/e2/e2test.js $PWD/test-icons.html > $O/e2.out 2>&1 &
node polish/e3/e3test.js > $O/e3.out 2>&1 &
node polish/e1/migtest.js $PWD/qa-v285.html $PWD/test-icons.html polish/e1/fixture-v285.json > $O/mig1.out 2>&1 &
node polish/e2/migtest-e2.js $PWD/test-pre.html $PWD/test-icons.html polish/e1/fixture-v285.json > $O/mig2.out 2>&1 &
[ -f polish/e4/e4test.js ] && node polish/e4/e4test.js > $O/e4.out 2>&1 &
wait
for f in e1 e2 e3 e4 mig1 mig2; do [ -f $O/$f.out ] && echo "$f: $(grep -c '^ok' $O/$f.out) ok, $(grep -c '^FAIL' $O/$f.out) FAIL · $(tail -1 $O/$f.out)"; done
