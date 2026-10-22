/* 圖示總表：在遊戲頁面（本機）用 javascript_exec 載入，畫出每件道具的圖示＋名字＋圖示代號，截圖逐一看。
     eval(await (await fetch('/.claude/skills/icon-check/sheet.js')).text()); await iconSheet()          全部道具
     await iconSheet({ q: '弓' })        只看名字／標籤／代號含關鍵字的
     await iconSheet({ keys: 'gear_weapon_' })   看候選圖示（代號開頭），挑一張換上去
     iconSheet(false)                    關掉
   大圖要等載完（artIconURL 會先回 null），會自動等到圖都拿得到（最多 10 秒）。 */
window.iconSheet = async function (o = {}) {
  const old = document.getElementById('iconsheet');
  if (old) old.remove();
  if (o === false) return 'closed';
  /* 等大圖載完：每 0.3 秒試一次，全部拿得到圖（或等滿 10 秒）才畫 */
  const want = o.keys ? Object.keys(ART).filter(k => k.startsWith(o.keys)) : ITEMS.filter(i => !i.core).map(i => i.ic.replace(/^a:/, ''));
  for (let t = 0; t < 33 && want.some(k => !k.startsWith('p:') && ART[k] && !artIconURL(k)); t++) await new Promise(r => setTimeout(r, 300));
  const d = document.createElement('div');
  d.id = 'iconsheet';
  d.style.cssText =
    'position:fixed;inset:0;z-index:999;background:#1b1a20;color:#fff;display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:4px;padding:6px;align-content:start;overflow:auto;font:11px sans-serif';
  const cell = (src, a, b) =>
    `<div style="text-align:center"><img src="${src || ''}" style="width:40px;height:40px;image-rendering:pixelated;background:#2a2930;border-radius:4px"><br>${a}<br><span style="color:#999;font-size:9px">${b}</span></div>`;
  let html = '';
  if (o.keys) {
    html = Object.keys(ART)
      .filter(k => k.startsWith(o.keys))
      .map(k => cell(artIconURL(k), '', k))
      .join('');
  } else {
    const q = o.q || '';
    html = ITEMS.filter(i => !i.core)
      .filter(i => !q || (i.n + i.id + i.tags.join(' ') + i.ic).includes(q))
      .map(i => cell(itemIcon(i.id), i.n + i.star + '★', i.ic))
      .join('');
    if (!q) html += CLASSES.map(c => cell(artIconURL(c.ic), c.n, c.ic)).join('');
  }
  d.innerHTML = html;
  document.body.appendChild(d);
  return d.childElementCount + ' 格';
};
