/* 介面檢查：在瀏覽器（手機尺寸 375×812）打開面板後執行，回傳跑版與字太小的地方。
   用法：把整段貼進 javascript_exec，再跑 audit('面板名稱') */
window.audit = function (label) {
  const W = innerWidth,
    res = { label, overflowX: [], offscreen: [], tinyText: [], smallTap: [], tallCards: [], emptyFrames: [], textChars: 0, foldChars: 0, pri: 0 };
  const roots = [
    ...document.querySelectorAll(
      '#home:not([hidden]), #runmap:not([hidden]), #sheet:not(.off), #ascView:not([hidden]), #gacha:not([hidden]), #battle:not([hidden]), #modal:not([hidden])'
    )
  ];
  const root = roots.pop() || document.body;
  res.textChars = (root.innerText || '').replace(/\s+/g, '').length;
  const H = innerHeight;
  root.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // 收起來的 details 內容（Chrome 裡仍然有大小）不算
    const fold = el.closest('details:not([open])');
    if (fold && !el.closest('summary')) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') return;
    const name =
      el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '');
    if (el.closest('[style*="overflow-x:auto"], .hscroll') === null && (r.right > W + 1 || r.left < -1))
      res.offscreen.push(name + ' ' + Math.round(r.left) + '~' + Math.round(r.right));
    // 角標（position:absolute）故意掛在外面，不算跑版
    const flowOut = [...el.children].some(c => {
      const q = c.getBoundingClientRect();
      return getComputedStyle(c).position !== 'absolute' && (q.right > r.right + 2 || q.left < r.left - 2);
    });
    if (el.scrollWidth > el.clientWidth + 2 && !/(auto|scroll|hidden)/.test(cs.overflowX) && el.clientWidth > 0 && flowOut)
      res.overflowX.push(name + ' ' + el.scrollWidth + '>' + el.clientWidth);
    const txt = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    // 例外（見設計規範）：圖示角標與條上的數字最小 9px；篩選標籤最矮 32px；列表第二行摘要可以截斷
    const badge = cs.position === 'absolute';
    if (txt && parseFloat(cs.fontSize) < (badge ? 9 : 11)) res.tinyText.push(name + ' ' + cs.fontSize);
    if (txt && cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth && !el.matches('.irow small'))
      res.overflowX.push(name + ' 被截斷');
    const minTap = el.hasAttribute('aria-pressed') ? 32 : 38;
    if ((el.tagName === 'BUTTON' || el.dataset.act) && (r.height < minTap || r.width < minTap))
      res.smallTap.push(name.slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    if (el.matches('.btn.pri') && !el.disabled) res.pri++;
    // 第一屏的字數（設計規範第 7 節：≤ 150）
    if (txt && r.top < H && r.bottom > 0)
      res.foldChars += [...el.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent.replace(/\s+/g, ''))
        .join('').length;
    // 卡片太高（第 6 節：≤ 160px）
    if (el.matches('.card, .icard, .pcard') && r.height > 160) res.tallCards.push(name.slice(0, 40) + ' ' + Math.round(r.height));
    // 大框小圖：可點的框裡只有一張圖，圖的面積不到框的一半
    if ((el.tagName === 'BUTTON' || el.dataset.act) && r.width * r.height > 2500) {
      const im = el.querySelector('img, canvas');
      if (im) {
        const q = im.getBoundingClientRect();
        if (q.width * q.height < r.width * r.height * 0.25 && !el.innerText.trim().length)
          res.emptyFrames.push(name.slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
    }
  });
  const top = a => [...new Set(a)].slice(0, 8);
  for (const k of ['overflowX', 'offscreen', 'tinyText', 'smallTap', 'tallCards', 'emptyFrames']) res[k] = { n: res[k].length, eg: top(res[k]) };
  return res;
};
