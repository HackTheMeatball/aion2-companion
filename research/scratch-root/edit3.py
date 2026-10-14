import re
p='assassin-route.html'; s=open(p).read()
def r(a,b):
    global s
    assert s.count(a)==1,a[:70]; s=s.replace(a,b)
rot0=s.index('      <section class="card tcard">\n        <div class="ns-head">\n          <h2>Rotation</h2>')
dv0=s.index('      <section class="card tcard" id="dvBox">')
st0=s.index('      <section class="card tcard">\n        <div class="ns-head">\n          <h2>Stats</h2>')
end=s.index('      </section>\n',st0)+len('      </section>\n')
assert s[end:].startswith('      </div>\n')
rot=s[rot0:dv0]; dv=s[dv0:st0]; stats=s[st0:end]
s=s[:rot0]+dv+rot+s[end:]
inner=stats[stats.index('        <div class="tiers"'):stats.rindex('      </section>')]
drawer=f'''<aside class="statdrawer" id="statDrawer">
  <button type="button" class="sd-tab" id="sdTab" aria-expanded="false" aria-controls="sdPanel" title="Stat priority"><span class="sd-chev">‹</span><span class="sd-lbl">Stats</span></button>
  <div class="sd-panel" id="sdPanel">
    <div class="sd-head"><h2>Stat priority</h2><button type="button" class="sd-close" id="sdClose" aria-label="Close">×</button></div>
{inner}  </div>
</aside>
'''
r('\n<script>\n', '\n'+drawer+'<script>\n')
r('''  document.getElementById("dvRemain").innerHTML = total ? "Points left should match the game's remaining points." : "Enter the board's total points.";''',
  '''  document.getElementById("dvRemain").innerHTML = dvSplitTxt(total);''')
r('/* Live refresh while typing a cost (no re-render, so the box keeps focus). */',
'''/* Board total = 4 per level past 11 + 1 per Daevanion Crystal used (formula confirmed in game at Lv 16 and 17). */
function dvSplitTxt(total) {
  if (!total) return "Enter the board's total points.";
  const fromLv = Math.max(0, 4 * (state.level - 11)), cr = total - fromLv;
  if (cr < 0) return `<b>${total}</b> total, but Lv ${state.level} alone gives ${fromLv}. Check your level or the total.`;
  return `<b>${total}</b> total = <b>${fromLv}</b> from levels + <b>${cr}</b> from crystals.`;
}
/* Live refresh while typing a cost (no re-render, so the box keeps focus). */''')
r('''  document.getElementById("dvBig").innerHTML = `<b>${total ? left : "–"}</b><span>pts left</span>`;
  document.querySelectorAll("#dvNextList .dvrow")''','''  document.getElementById("dvBig").innerHTML = `<b>${total ? left : "–"}</b><span>pts left</span>`;
  document.getElementById("dvRemain").innerHTML = dvSplitTxt(total);
  document.querySelectorAll("#dvNextList .dvrow")''')
r('/* +/− steppers next to number boxes','''/* Stat priority drawer: a tab pinned to the right edge; open state remembered. */
(() => {
  const d = document.getElementById("statDrawer"), tab = document.getElementById("sdTab");
  const set = o => { d.classList.toggle("open", o); tab.setAttribute("aria-expanded", String(o)); state.statOpen = o; save(); };
  if (state.statOpen) { d.classList.add("open"); tab.setAttribute("aria-expanded", "true"); }
  tab.addEventListener("click", () => set(!d.classList.contains("open")));
  document.getElementById("sdClose").addEventListener("click", () => set(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && d.classList.contains("open")) set(false); });
})();
/* +/− steppers next to number boxes''')
a=s.index("/* Tiles: four skinny columns above the milestones"); b=s.index(".tcard .ns-head { display: flex; flex-wrap: nowrap;")
s=s[:a]+"""/* Tiles: three columns above the milestones (Skills, Daevanion, Rotation); one column when the main column is narrow. */
#main { container-type: inline-size; }
#main .top-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@container (max-width: 680px) { #main .top-grid { grid-template-columns: minmax(0, 1fr); } }
.top-grid .tcard { padding: 16px 14px; }
/* Stat drawer: tab pinned to the right edge, panel slides out */
.statdrawer { position: fixed; top: 50%; right: 0; transform: translateY(-50%); z-index: 50; display: flex; align-items: center; pointer-events: none; }
.sd-tab { pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 6px; border-radius: 10px 0 0 10px; border: 1px solid var(--line); border-right: 0; background: var(--panel); color: var(--muted); font: 600 10px var(--mono); letter-spacing: .14em; text-transform: uppercase; cursor: pointer; }
.sd-tab:hover { color: var(--fg); }
.sd-tab .sd-chev { font-size: 14px; transition: transform .2s; }
.sd-tab .sd-lbl { writing-mode: vertical-rl; transform: rotate(180deg); }
.statdrawer.open .sd-chev { transform: rotate(180deg); }
.sd-panel { pointer-events: auto; width: 0; overflow: hidden auto; background: var(--panel); border: 1px solid var(--line); border-right: 0; border-radius: 12px 0 0 12px; transition: width .2s; max-height: 80vh; box-shadow: -8px 0 24px #0008; box-sizing: border-box; }
.statdrawer:not(.open) .sd-panel { border-width: 0; box-shadow: none; padding: 0; }
.statdrawer.open .sd-panel { width: 270px; padding: 14px 16px; }
.sd-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.sd-head h2 { margin: 0; white-space: nowrap; }
.sd-close { all: unset; cursor: pointer; color: var(--muted); font-size: 18px; line-height: 1; padding: 0 4px; }
.sd-close:hover { color: var(--fg); }
.sd-panel .tier { grid-template-columns: minmax(0, 1fr); gap: 4px; }
.sd-panel .tiers { min-width: 238px; }
"""+s[b:]
s=re.sub(r"@container \(min-width: 761px\) \{.*?\n\}\n", "", s, flags=re.S)
# journey: next-unlock box flush with the card's left edge
r(".unlock { margin: 8px 0 0 24px;", ".unlock { margin: 8px 0 0 0;")
r(".story li.tipbox { margin: 8px 0 0 24px;", ".story li.tipbox { margin: 8px 0 0 0;")
open(p,'w').write(s)
