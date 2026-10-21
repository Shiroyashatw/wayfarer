/* 漫步勇者 · 0.1.0 肉鴿：事件節點（台灣民俗主題）。run.js 的 eventNode 依種子抽一個（同一局不重複）。
   每個事件：k 代號、n 名稱、ch 出現在哪幾章、t 描述、opts(c) 回傳選項 [{label, dis, go}]；
   go() 回傳結果文字，或 { fight: {es, bg}, msg } 開打（打贏照一般戰鬥給獎勵）。c 是 { lv, st, r }（怪物等級、目前屬性、亂數） */
'use strict';
/* ================= 祝福：這一局的永久加成（S.run.bless，runStats 加進屬性） ================= */
function bless(n, st) {
  S.run.bless = S.run.bless || [];
  S.run.bless.push({ n, st });
  return `<p class="c-gold">得到祝福「${n}」：${Object.entries(st)
    .map(([k, v]) => (STATN[k] ? STATN[k](v) : k))
    .join('、')}（這一局都有效）</p>`;
}
/* 這一局的加成：每升一級自帶的成長（像自動點了小天賦：傷害 +5%、生命 +2%）＋事件的祝福 */
const RUN_LV = { physPct: 5, spellPct: 5, elePct: 5, lifePct: 2 };
function runStats(A) {
  if (!S.run) return;
  for (const k in RUN_LV) A(k, RUN_LV[k] * (S.lv - 1));
  for (const b of S.run.bless || []) for (const k in b.st) A(k, b.st[k]);
}
const heal = pct => {
  const st = stats(),
    n = Math.round(st.maxhp * pct);
  S.hp = Math.min(st.maxhp, S.hp + n);
  return n;
};
const pay = g => (S.gold -= g);
/* 事件裡出現的怪物：跟菁英同一套（稀有、詞綴數＝章數、生命 ×0.75、攻擊 ×0.85） */
function evFoe(b, lv, mods = 2) {
  const e = makeEnemy(b, lv, 2, rollMods(fl(Math.random() * 1e9), Math.min(mods, S.run.ch + 1)));
  e.maxhp = e.hp = Math.round(e.maxhp * 0.75);
  e.atk = Math.round(e.atk * 0.85);
  return e;
}
/* ================= 事件表 ================= */
const EVENTS = [
  {
    k: 'tudi',
    n: '土地公廟',
    ch: [0, 1, 2],
    t: '路邊一間小小的土地公廟，香爐裡還有幾支沒燒完的香。',
    opts: c => [
      {
        label: '擲筊求財',
        go: () => {
          if (c.r() < 0.5) {
            const g = 30 + c.lv * 6;
            S.gold += g;
            return `<p>聖筊！土地公答應了。得到 <b class="c-gold">${g} 金幣</b>。</p>`;
          }
          return '<p>笑筊……土地公笑而不答。</p>';
        }
      },
      { label: '上香祈福：回復 30% 生命', go: () => `<p>心裡平靜了下來。回復 ${heal(0.3)} 生命。</p>` },
      {
        label: '求平安符（30 金）',
        dis: S.gold < 30,
        go: () => (pay(30), bless('土地公平安符', { lifePct: 8 }))
      }
    ]
  },
  {
    k: 'hongbao',
    n: '路邊紅包',
    ch: [0, 1, 2],
    t: '路中間躺著一個鼓鼓的紅包，四周一個人也沒有。',
    opts: c => [
      {
        label: '撿起來',
        go: () => {
          const g = 40 + c.lv * 5;
          S.gold += g;
          if (c.r() < 0.4) {
            const b = {
              name: '冥婚新娘',
              bg: 'cave',
              spr: 'a_guixinniang',
              hp: 60,
              atk: 12,
              arm: 20,
              el: 'fire',
              res: [20, 30, 20],
              xp: 30,
              gold: 30
            };
            return {
              msg: `得到 ${g} 金幣……身後傳來嗩吶聲，一位新娘幽幽地說：「夫君。」`,
              fight: { es: [evFoe(b, c.lv)], bg: 'cave' }
            };
          }
          return `<p>沒什麼事發生，得到 <b class="c-gold">${g} 金幣</b>。</p>`;
        }
      },
      { label: '當作沒看到', go: () => '<p>你繞過紅包，快步離開。</p>' }
    ]
  },
  {
    k: 'fortune',
    n: '算命仙',
    ch: [0, 1, 2],
    t: '戴墨鏡的算命仙招手：「少年仔，你的命格不簡單。」',
    opts: () => [
      {
        label: '請他指點（30 金）：多一次天賦三選一',
        dis: S.gold < 30,
        go: () => {
          pay(30);
          S.run.extraPicks = (S.run.extraPicks || 0) + 1;
          return '<p>「往這個方向走就對了。」得到一次天賦三選一。</p>';
        }
      },
      { label: '不用了', go: () => '<p>「有緣再見。」</p>' }
    ]
  },
  {
    k: 'guangong',
    n: '關公廟',
    ch: [0, 1, 2],
    t: '紅臉的關聖帝君手持青龍偃月刀，神威凜凜。',
    opts: c => [
      { label: '拜關公', go: () => bless('關聖帝君', { physPct: 12 }) },
      {
        label: '求籤（10 金）',
        dis: S.gold < 10,
        go: () => {
          pay(10);
          if (c.r() < 0.5) {
            const g = 25 + c.lv * 4;
            S.gold += g;
            return `<p>上上籤！得到 ${g} 金幣。</p>`;
          }
          return `<p>中籤。回復 ${heal(0.2)} 生命。</p>`;
        }
      }
    ]
  },
  {
    k: 'smith',
    n: '老鐵匠',
    ch: [0, 1, 2],
    t: '打鐵鋪裡火光四射，老師傅抬頭看了你的武器一眼。',
    opts: () => {
      const w = S.eq.weapon;
      return [
        {
          label: '磨利武器（30 金）：品質 +8%',
          dis: S.gold < 30 || !w || !hasQ(w),
          go: () => {
            pay(30);
            w.q = Math.min(30, (w.q || 0) + 8);
            return `<p>${itemName(w)} 的品質提高到 ${w.q}%。</p>`;
          }
        },
        {
          label: '重新鍛造（40 金）：重洗武器詞綴',
          dis: S.gold < 40 || !w || w.r !== 2,
          go: () => {
            pay(40);
            S.cur.chaos = (S.cur.chaos || 0) + 1;
            craft(w, 'chaos');
            return `<p>重新鍛造完成：${itemName(w)}。</p>`;
          }
        },
        { label: '離開', go: () => '<p>你向老師傅點點頭，走出鐵匠鋪。</p>' }
      ];
    }
  },
  {
    k: 'mosina',
    n: '迷霧中的呼喚',
    ch: [0],
    t: '山裡起了濃霧，有個聲音一直叫你的名字，聽起來好像是認識的人……',
    opts: c => [
      {
        label: '跟著聲音走',
        go: () => {
          if (c.r() < 0.5) {
            const it = makeItem(DROPS[fl(c.r() * DROPS.length)], c.lv, 2);
            giveItem(it);
            return `<p>霧散了，腳邊有一件被遺忘的裝備：${itemName(it)}。</p>`;
          }
          const n = Math.round(stats().maxhp * 0.2);
          S.hp = Math.max(1, S.hp - n);
          return `<p>你在山裡繞了好幾圈才走出來，累得半死。失去 ${n} 生命。</p>`;
        }
      },
      { label: '摀住耳朵離開', go: () => '<p>魔神仔的聲音漸漸遠去。</p>' }
    ]
  },
  {
    k: 'spring',
    n: '溫泉',
    ch: [0],
    t: '山谷裡冒著白煙，是一處野溪溫泉。',
    opts: () => [
      { label: '泡溫泉：回復 50% 生命', go: () => `<p>全身都放鬆了。回復 ${heal(0.5)} 生命。</p>` },
      {
        label: '買溫泉蛋（10 金）：藥水 +2',
        dis: S.gold < 10,
        go: () => {
          pay(10);
          S.potions += 2;
          return '<p>得到 2 瓶生命藥水。</p>';
        }
      }
    ]
  },
  {
    k: 'mazu',
    n: '媽祖遶境',
    ch: [0, 1],
    t: '鑼鼓喧天，媽祖的神轎從你面前經過，信徒排著隊鑽轎底。',
    opts: () => [
      { label: '鑽轎底', go: () => bless('媽祖保佑', { resAll: 10 }) },
      { label: '跟著走一段', go: () => `<p>沾了一路的福氣。回復 ${heal(0.25)} 生命。</p>` }
    ]
  },
  {
    k: 'nightmarket',
    n: '夜市',
    ch: [1],
    t: '燈火通明的夜市，香味從四面八方飄過來。',
    opts: c => [
      {
        label: '香雞排（20 金）：回復 40% 生命',
        dis: S.gold < 20,
        go: () => (pay(20), `<p>酥脆多汁！回復 ${heal(0.4)} 生命。</p>`)
      },
      {
        label: '套圈圈（15 金）',
        dis: S.gold < 15,
        go: () => {
          pay(15);
          if (c.r() < 0.4) {
            const it = makeItem(DROPS[fl(c.r() * DROPS.length)], c.lv, 2);
            giveItem(it);
            return `<p>套中了！得到 ${itemName(it)}。</p>`;
          }
          return '<p>差一點點……老闆笑著說下次再來。</p>';
        }
      },
      {
        label: '珍珠奶茶（15 金）：魔力全滿、魔力藥水 +1',
        dis: S.gold < 15,
        go: () => {
          pay(15);
          S.mp = stats().maxmp;
          S.ethers++;
          return '<p>半糖少冰，剛剛好。</p>';
        }
      }
    ]
  },
  {
    k: 'bajia',
    n: '廟會八家將',
    ch: [1],
    t: '八家將踩著七星步走過來，臉上的彩繪在火光下格外嚇人。',
    opts: () => {
      const gs = S.gems.filter(g => g.lv < GEM_MAX && S.sk.includes(g.id));
      return [
        {
          label: '看完整場陣頭：一顆技能石 +1 級',
          dis: !gs.length,
          go: () => {
            const g = gs[fl(Math.random() * gs.length)];
            g.lv++;
            return `<p>你學到了步法的訣竅。${SKILLS[g.k].name} 升到 Lv${g.lv}。</p>`;
          }
        },
        { label: '拿香跟拜', go: () => bless('八家將護身', { armorPct: 15 }) }
      ];
    }
  },
  {
    k: 'joss',
    n: '金紙爐',
    ch: [1, 2],
    t: '廟前的金爐火正旺，旁邊堆著一疊疊金紙。',
    opts: () => [
      {
        label: '燒金紙（25 金）：祈願石 +2',
        dis: S.gold < 25,
        go: () => {
          pay(25);
          giveCur('wish', 2);
          return '<p>火光中好像看到契靈的影子。得到 2 個祈願石（帶回主選單用）。</p>';
        }
      },
      { label: '離開', go: () => '<p>你雙手合十拜了拜。</p>' }
    ]
  },
  {
    k: 'ferry',
    n: '冥河渡口',
    ch: [2],
    t: '黑色的河水無聲流過，擺渡人伸出枯瘦的手：「渡資。」',
    opts: c => [
      {
        label: '付渡資（50 金）：生命全滿',
        dis: S.gold < 50,
        go: () => (pay(50), `<p>渡過冥河，身上的傷都好了。回復 ${heal(1)} 生命。</p>`)
      },
      {
        label: '硬闖過去',
        go: () => {
          const w = WATCHERS[fl(c.r() * WATCHERS.length)],
            b = {
              name: w.n,
              bg: 'cave',
              spr: w.spr,
              pal: w.pal,
              hp: 70,
              atk: 13,
              arm: 28,
              el: w.el,
              res: [30, 30, 30],
              xp: 40,
              gold: 40
            },
            e = evFoe(b, c.lv, 2);
          e.name = `渡口守衛・${w.n}`;
          return { msg: '擺渡人冷笑一聲，岸邊站起一個守衛。', fight: { es: [e], bg: 'cave' } };
        }
      }
    ]
  },
  {
    k: 'mengpo',
    n: '孟婆湯',
    ch: [2],
    t: '橋頭的老婆婆遞來一碗湯：「喝了就不痛了。」',
    opts: () => [
      {
        label: '喝下：忘掉最後一個天賦，重新三選一',
        dis: S.tree.length <= 1,
        go: () => {
          const id = S.tree.pop();
          S.run.extraPicks = (S.run.extraPicks || 0) + 1;
          clampHP();
          return `<p>你忘了「${TREE.byId[id].n}」……但好像想起了別的東西。得到一次天賦三選一。</p>`;
        }
      },
      { label: '倒掉', go: () => '<p>孟婆搖搖頭，沒有說話。</p>' }
    ]
  }
];
const EVI = Object.fromEntries(EVENTS.map(e => [e.k, e]));
