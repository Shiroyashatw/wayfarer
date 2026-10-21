/* 漫步勇者 · 0.1.0 肉鴿：局外成長（選角、魂晶解鎖與升級、每日挑戰）與主選單（run.js 之後載入） */
'use strict';
/* ================= 角色（昇華職業）================= */
/* 每個角色的起始武器（BASES.weapon 的索引）、副手（BASES.offhand，雙手武器沒有）、技能石（另外都有治癒）、解鎖要幾魂晶（0 是一開始就能玩） */
const RUN_CLS = {
  warlord: { w: 5, off: null, gems: ['power', 'slash2'], cost: 0 },
  elemental: { w: 4, off: null, gems: ['fire', 'iceshard'], cost: 0 },
  taoist: { w: 16, off: 6, gems: ['talisman', 'swordwave'], cost: 0 },
  guardian: { w: 1, off: 2, gems: ['bash', 'thrust'], cost: 60 },
  amazon: { w: 3, off: null, gems: ['double', 'poison'], cost: 80 },
  assassin: { w: 13, off: 0, gems: ['backstab', 'venomfang'], cost: 100 },
  necro: { w: 15, off: 4, gems: ['skeleton', 'weaken'], cost: 120 },
  destiny: { w: 0, off: 0, gems: ['power', 'fire'], cost: 150 }
};
const ASCI_ = Object.fromEntries(ASC.map(c => [c.k, c]));
const clsOpen = k => RUN_CLS[k].cost === 0 || (S.meta.unlock || []).includes(k);
/* 開局：照角色換武器、副手、技能石 */
function applyKit(k) {
  const kit = RUN_CLS[k];
  S.cls = k;
  S.asc = { cls: k, br: null, trials: 0, nodes: [] };
  S.eq.weapon = makeItem('weapon', 1, 0, kit.w);
  S.eq.offhand = kit.off == null ? null : makeItem('offhand', 1, 0, kit.off);
  S.gems = [];
  S.sk = [null, null, null, null, null, null];
  for (const g of [...kit.gems, 'heal']) giveGem(g);
}

/* ================= 局外升級（魂晶，永久） ================= */
const META_UP = [
  { k: 'pot', n: '行囊', d: '開局多 1 瓶生命藥水', c: 40, max: 3 },
  { k: 'gold', n: '盤纏', d: '開局多 50 金幣', c: 40, max: 3 },
  { k: 'hp', n: '體魄', d: '最大生命 +5%', c: 60, max: 4 },
  { k: 'reroll', n: '重抽', d: '每局可以重抽獎勵三選一 1 次', c: 80, max: 3 },
  { k: 'bless', n: '香火', d: '開局得到一個隨機的祝福', c: 100, max: 1 }
];
const metaLv = k => (S.meta.up && S.meta.up[k]) || 0;
/* 香火給的開局祝福 */
const START_BLESS = [
  ['土地公平安符', { lifePct: 8 }],
  ['關聖帝君', { physPct: 12 }],
  ['媽祖保佑', { resAll: 10 }],
  ['文昌帝君', { spellPct: 12 }],
  ['八家將護身', { armorPct: 15 }]
];
/* 開局套用局外升級 */
function applyMeta() {
  S.potions += metaLv('pot');
  S.gold += 50 * metaLv('gold');
  S.run.rerolls = metaLv('reroll');
  if (metaLv('hp')) S.run.bless.push({ n: '體魄', st: { lifePct: 5 * metaLv('hp') } });
  if (metaLv('bless')) {
    const [n, st] = START_BLESS[fl(Math.random() * START_BLESS.length)];
    S.run.bless.push({ n, st });
  }
}

/* ================= 每日挑戰 ================= */
/* 每天一個種子：全部玩家同樣的角色、地圖、怪物；一天只能挑戰一次，魂晶 ×1.5 */
const today = () => {
  const d = new Date(now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dailySeed = () => h(...today().split('-').map(Number));
const dailyCls = () => ASC[dailySeed() % ASC.length].k;
const dailyDone = () => !!S.meta.daily && S.meta.daily.d === today();

/* ================= 主選單 ================= */
function homeRender() {
  const el = $('home');
  if (!el || !S) return;
  el.hidden = !!S.run;
  if (S.run) return;
  const m = S.meta,
    dc = ASCI_[dailyCls()];
  el.innerHTML = `<div class="hm"><h1 class="hm-t">漫步勇者</h1><p class="sub">台灣妖怪肉鴿・v${VER}</p>
    <div class="hm-b"><button class="btn pri" data-act="clsPick">開始新局</button>
    <button class="btn" data-act="dailyGo" ${dailyDone() ? 'disabled' : ''}>每日挑戰・${dc.n}${dailyDone() ? '（今天挑戰過了）' : ''}</button>
    <div class="hm-r"><button class="btn" data-act="metaShop">局外升級</button><button class="btn" data-act="gacha">契靈祈願</button></div>
    <button class="btn" data-act="sheet" data-s="settings">設定</button></div>
    <div class="kv"><div><span>魂晶</span><b>${m.soul}</b></div><div><span>局數</span><b>${m.runs}</b></div><div><span>通關</span><b>${m.wins}</b></div></div></div>`;
}
/* 選角：8 個昇華職業，沒解鎖的顯示魂晶花費 */
function clsModal() {
  showModal(
    '選擇角色',
    `<div class="clsg">${ASC.map((c, i) => {
      const k = c.k,
        open = clsOpen(k),
        cost = RUN_CLS[k].cost;
      return `<button class="clsb${open ? '' : ' lock'}" data-act="mbtn" data-i="${i + 1}"><img src="${iconURL(c.ic)}" alt=""><b>${c.n}</b><small>${open ? RUN_CLS[k].gems.map(g => SKILLS[g].name).join('・') : `◆ ${cost} 魂晶解鎖`}</small></button>`;
    }).join('')}</div><p class="sub">魂晶 ${S.meta.soul}</p>`,
    [
      { label: '取消', fn: hideModal },
      ...ASC.map(c => ({
        label: '',
        hide: 1,
        fn: () => {
          const k = c.k;
          if (!clsOpen(k)) {
            const cost = RUN_CLS[k].cost;
            if (S.meta.soul < cost) return toast(`需要 ${cost} 魂晶`);
            S.meta.soul -= cost;
            S.meta.unlock = [...(S.meta.unlock || []), k];
            sfx('level');
            toast(`解鎖了 ${c.n}`);
            save();
            return clsModal();
          }
          showModal(
            c.n,
            `<p>${c.d}</p><p class="sub">起始技能：${RUN_CLS[k].gems.map(g => SKILLS[g].name).join('、')}、治癒</p><p class="sub">打倒第一章首領後選擇分支：${c.br.map(b => b.n).join('、')}</p>`,
            [
              { label: '返回', fn: clsModal },
              {
                label: '出發',
                pri: 1,
                fn: () => {
                  hideModal();
                  startRun({ cls: k });
                }
              }
            ]
          );
        }
      }))
    ]
  );
}
/* 局外升級的商店 */
function metaModal() {
  showModal(
    '局外升級',
    `<p class="sub">用魂晶買，之後每一局都有效。魂晶 <b style="color:#9fe7ff">◆ ${S.meta.soul}</b></p><div class="list">${META_UP.map(
      (u, i) => {
        const lv = metaLv(u.k),
          mx = lv >= u.max;
        return `<div class="srow2"><span class="t"><b>${u.n} ${lv}/${u.max}</b><small>${u.d}</small></span><button class="btn sm${mx || S.meta.soul < u.c ? '' : ' buy'}" data-act="mbtn" data-i="${i + 1}" ${mx || S.meta.soul < u.c ? 'disabled' : ''}>${mx ? '已滿' : `◆ ${u.c}`}</button></div>`;
      }
    ).join('')}</div>`,
    [
      { label: '關閉', pri: 1, fn: hideModal },
      ...META_UP.map(u => ({
        label: '',
        hide: 1,
        fn: () => {
          if (metaLv(u.k) >= u.max || S.meta.soul < u.c) return;
          S.meta.soul -= u.c;
          S.meta.up = { ...(S.meta.up || {}), [u.k]: metaLv(u.k) + 1 };
          sfx('coin');
          save();
          metaModal();
          homeRender();
        }
      }))
    ]
  );
}

/* ================= actions ================= */
Object.assign(A, {
  clsPick: () => !S.run && clsModal(),
  metaShop: () => metaModal(),
  dailyGo: () => {
    if (S.run || dailyDone()) return;
    const c = ASCI_[dailyCls()];
    showModal(
      '每日挑戰',
      `<p>今天的角色：<b>${c.n}</b>。所有玩家今天都是同一張地圖、同樣的怪物。</p><p class="sub">一天只能挑戰一次，結算的魂晶 ×1.5。</p>`,
      [
        { label: '取消', fn: hideModal },
        {
          label: '出發',
          pri: 1,
          fn: () => {
            hideModal();
            S.meta.daily = { d: today(), prog: 0 };
            startRun({ cls: c.k, seed: dailySeed(), daily: true });
          }
        }
      ]
    );
  }
});
