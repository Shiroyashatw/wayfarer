/* 塞令老師 · 遊戲表格：版本、回合表、經濟、背包等級（設定值都放這裡，方便調平衡） */
'use strict';
const SLOT = new URLSearchParams(location.search).get('p') || '';
const KEY = 'serling_v1' + (SLOT ? '_p' + SLOT : '');
/* ================= 一局 ================= */
const START_HP = 50, // 生命（0.1.10 從 20 加到 40，build 有時間成形；0.1.29 6 人一場要打更久，加到 50）
  START_GOLD = 10, // 1-1 開打前的金幣（商店 5 件 1★）
  BASE_INCOME = 5, // 每回合基礎收入
  INTEREST_MAX = 5, // 利息上限（每 10 金 +1）
  BENCH_N = 6, // 暫存區格數
  SHOP_N = 5, // 商店格數
  REROLL = 1, // 刷新商店
  BASE_HP = 60, // 角色基礎生命（戰鬥）
  FATIGUE_T = 20, // 幾秒後開始疲勞
  MAX_T = 60; // 戰鬥最長秒數
/* 0.1.29 一場 6 人：你＋5 位對手，真人快照最多 2 位、其他（至少 3 位）是機器人 */
const LOBBY_N = 6,
  GHOST_MAX = 2,
  /* 0.1.72 菁英機器人的牌階：即時機器人、開服種子都用這個強度（買法全部照評估） */
  BOT_RATING = 2100,
  /* 0.1.73 菁英機器人每回合多拿的金幣：0.1.72 是 +5（太強），改成 0，跟玩家一樣的錢、只靠買法取勝 */
  BOT_GOLD = 0;
/* 連勝／連敗獎勵：2 連 +1、4 連 +2、6 連以上 +3 */
const streakBonus = n => (n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
/* 背包等級：大小、升級花費、商店機率（1★～5★，%）、t2：商店直接出 Ⅱ 階的機率（%）。
   0.1.12 拿掉 0.1.9 的「X-Y 才開放」，改成費用曲線：第一級 14 金（開局只有 10 金，1-1 升不了），越後面越貴，要在買道具和存錢升背包之間取捨 */
const BAGLV = [
  null,
  { w: 3, h: 3, cost: 0, odds: [100, 0, 0, 0, 0] },
  { w: 3, h: 4, cost: 14, odds: [75, 25, 0, 0, 0] },
  { w: 4, h: 4, cost: 18, odds: [55, 35, 10, 0, 0] },
  { w: 4, h: 5, cost: 24, odds: [40, 35, 20, 5, 0] },
  { w: 5, h: 5, cost: 30, odds: [25, 35, 28, 10, 2], t2: 5 },
  { w: 5, h: 6, cost: 36, odds: [15, 30, 30, 20, 5], t2: 10 },
  { w: 6, h: 6, cost: 44, odds: [10, 25, 30, 25, 10], t2: 18 },
  /* 0.1.8 後期還能成長：再大一級、商店更常出高星與直接 Ⅱ 階 */
  { w: 6, h: 7, cost: 54, odds: [5, 15, 30, 30, 20], t2: 28 }
];
const BAG_MAX = BAGLV.length - 1;
/* 回合表（前短後長）：pve 野怪、elite 菁英、boss 首領、pvp 打對手快照；loss 是輸了扣的生命。
   每回合開打前本來就能逛商店，0.1.1 起拿掉商店關（改成菁英關，打完道具三選一），0.1.4 起也拿掉開局回合，1-1 直接打野怪 */
const ROUNDS = (() => {
  const out = [],
    add = (st, i, type, loss = 0) => out.push({ id: `${st}-${i}`, st, type, loss });
  add(1, 1, 'pve', 1);
  add(1, 2, 'pve', 1);
  add(1, 3, 'pve', 1);
  add(1, 4, 'elite', 2);
  /* 第 2 階段 PvP 與 PvE 穿插：檢驗構築 → 喘口氣補經濟 → 第二輪 PvP → 菁英 → 首領（核心三選一） */
  add(2, 1, 'pvp', 2);
  add(2, 2, 'pve', 1);
  add(2, 3, 'pvp', 2);
  add(2, 4, 'elite', 2);
  add(2, 5, 'boss', 2);
  /* 0.1.29 6 人一場：中後期扣血調低（之前 3 階段 3～4、5 階段起 6），一局平均能打到 8 階段以後 */
  [1, 2, 3].forEach(i => add(3, i, 'pvp', 2));
  add(3, 4, 'elite', 2);
  [5, 6].forEach(i => add(3, i, 'pvp', 3));
  [1, 2, 3].forEach(i => add(4, i, 'pvp', 3));
  /* 0.1.10 4-4 改成首領：打完副核心三選一（2-5 是專屬核心） */
  add(4, 4, 'boss', 3);
  [5, 6, 7].forEach(i => add(4, i, 'pvp', 3));
  /* 0.1.29 延長到 10-7：5～6 階段扣 4、7～8 扣 5、9～10 扣 6 */
  for (let st = 5; st <= 10; st++) {
    const l = st >= 9 ? 6 : st >= 7 ? 5 : 4;
    [1, 2, 3].forEach(i => add(st, i, 'pvp', l));
    add(st, 4, 'elite', l - 1);
    [5, 6, 7].forEach(i => add(st, i, 'pvp', l));
  }
  return out;
})();
const RTYPE = { pve: '野怪', elite: '菁英', boss: '首領', pvp: '對戰' };
/* 回合列的短名與顏色分類 */
const RSHORT = { pve: '野怪', elite: '菁英', boss: '首領', pvp: '對戰' };
/* 0.1.19 戰鬥中的生命倍率（照階段）：合成 ×3／×9 之後傷害長很快，對戰只打 3～4 秒；
   兩邊（玩家、對手快照、怪物）的生命都乘上這個，打久一點，持續傷害、回復、慢速武器、疲勞才有作用 */
const HP_ST = [1, 1.5, 2.6, 3.6, 4.4, 5.1, 5.8, 6.5, 7.2, 7.9, 8.6];
const hpMul = st => HP_ST[Math.min(HP_ST.length - 1, st)] || 1;
/* 名次加減分（分數不給玩家看，只顯示牌階） */
/* 0.1.29 6 人：前 3 名加分、後 3 名扣分（打不贏機器人就會掉分） */
const PLACE_PTS = [0, 45, 25, 10, -10, -25, -40];
/* 0.1.6 牌階：8 階 × 一二三（三最高），每一級 50 分；1000 分是銅牌一。
   前 PLACE_N 場是定級賽（加減分 ×2、還不顯示牌階） */
const RANKS = ['鐵牌', '銅牌', '銀牌', '金牌', '白金', '鑽石', '大師', '菁英'],
  RANK_BASE = 850,
  RANK_STEP = 50,
  PLACE_N = 5;
const rankOf = rating => Math.max(0, Math.min(RANKS.length * 3 - 1, fl((rating - RANK_BASE) / RANK_STEP)));
const rankName = i => RANKS[fl(i / 3)] + '一二三'[i % 3];
/* 這一級裡走到哪（0～1），最高一級沒有上限就一直是 1 */
const rankProg = rating => {
  const i = rankOf(rating);
  return i === RANKS.length * 3 - 1 ? 1 : Math.max(0, Math.min(1, (rating - RANK_BASE - i * RANK_STEP) / RANK_STEP));
};
const placed = () => (S.games || 0) >= PLACE_N;
/* 頭像（PNG 像素圖，0.1.17 換成玩家形象：docs/頭像圖表.md 的 sheet_avatar_1，男 4、女 12） */
/* 0.1.62 只留會動的頭像（0.1.64 共 12 位）（AVANIM）；舊的靜態頭像拿掉（存檔、快照裡的舊頭像會換成第一個）。av_knight 的圖還留著給召喚的戰士用 */
const AVATARS = [
  ['av_zhaoyun', '趙雲'],
  ['av_lubu', '呂布'],
  ['av_musashi', '宮本武藏'],
  ['av_kojiro', '佐佐木小次郎'],
  ['av_diaochan', '貂蟬'],
  ['av_xishi', '西施'],
  ['av_guifei', '楊貴妃'],
  ['av_zhaojun', '王昭君'],
  ['av_pirate', '海盜船長'],
  ['av_elf', '精靈弓手'],
  ['av_fox', '狐妖'],
  ['av_idol', '偶像歌手']
];
/* 不在清單裡的頭像（舊快照、排行榜）照字串平均換成現在的頭像 */
const avFallback = k =>
  AVATARS[[...String(k || '')].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7) % AVATARS.length][0];
/* 0.1.62 會動的頭像：戰鬥中武器出手時播攻擊動畫（art/anim/圖名_atk.png，4×4、每格 64×64）
   f 播哪幾格（1 起算，跳過重複的站姿和畫壞的格子），s 揮出那幾格（播快一點）；第 1 格是平常的站姿（0.1.68 可以用 i 指定別格） */
const AVANIM = {
  av_diaochan: { f: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 14, 15], s: [8, 9, 10] },
  av_xishi: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16], s: [6, 7, 8] },
  av_guifei: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16], s: [7, 8, 9] },
  av_zhaojun: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12], s: [6, 7, 8] },
  av_zhaoyun: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14], s: [6, 7, 8] },
  /* 0.1.68 第一版的眼罩在第 5～8 格之間換邊：只用眼罩在同一邊的 8～16 格，站姿用第 16 格（i），16→12 站著、11 舉刀、8～10 劈出 */
  av_pirate: { i: 16, f: [16, 15, 14, 13, 12, 11, 8, 9, 10, 12], s: [8, 9, 10] },
  av_elf: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], s: [9, 10, 11] },
  av_fox: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14], s: [5, 6, 7] },
  av_idol: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12], s: [6, 7, 8] },
  av_lubu: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14], s: [7, 8, 9] },
  av_musashi: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13], s: [7, 8, 9] },
  av_kojiro: { f: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13], s: [6, 7, 8] }
};
/* 隨機名字（機器人對手、新玩家的預設名字）：形容詞＋角色 */
const NAME_A = [
    '迷路的',
    '暴躁的',
    '愛睡覺的',
    '貪吃的',
    '傲嬌的',
    '無敵的',
    '害羞的',
    '狂暴的',
    '慵懶的',
    '神秘的',
    '幸運的',
    '倒楣的',
    '閃亮的',
    '憂鬱的',
    '熱血的',
    '路過的'
  ],
  NAME_B = [
    '史萊姆',
    '勇者',
    '法師',
    '盜賊',
    '騎士',
    '獵人',
    '鐵匠',
    '商人',
    '劍士',
    '咕咕雞',
    '哥布林',
    '吟遊詩人',
    '小精靈',
    '魔王',
    '牧師',
    '浪人'
  ];
const randName = (r = Math.random) => NAME_A[fl(r() * NAME_A.length)] + NAME_B[fl(r() * NAME_B.length)];
/* 0.1.52 賽制：每局開場隨機一種（w 是權重），公開後才選職業。ban：這個賽制排除的核心效果（有這些欄位的核心不會出現在首領三選一）
   設計原則（企劃書）：改玩法節奏，不加數值；規則先公開再選職業；衝突的核心直接排除；隨機要好預測 */
/* 0.1.59 新增詛咒寶藏、七十二變、星象輪轉、法老王的遺物、遺產市集（權重：標準 20、其他各 10）；0.1.60 標準降到 5（約 6%） */
const MODES = [
  /* 0.1.69 標準不上轉盤（w 0），留著給測試、舊快照用 */
  { k: 'std', n: '標準', w: 0, ic: 'cur_regal', d: ['沒有特殊規則'] },
  {
    k: 'gale',
    n: '狂風市集',
    w: 10,
    ic: 'asc_s_wind',
    d: ['商店不能刷新', '每買一件，商店整排換新', '道具價格 -1 金（最低 1 金）', '這回合買的道具賣出 0 金'],
    ban: ['freeRoll', 'rollCap']
  },
  {
    k: 'sigil',
    n: '印記',
    w: 10,
    ic: 'asc_s_rune',
    d: [
      '每件道具隨機帶一個印記：力量、迅捷、守護、生命、幸運',
      '背包裡同一個印記湊 2／4／6 件，那個印記有效果',
      '合成時三件的印記不一樣，可以選要留哪個'
    ]
  },
  {
    k: 'caravan',
    n: '流浪商隊',
    w: 10,
    ic: 'gear_chest_0',
    d: ['每回合商店旁多一位特別商人（每回合換人）', '每位商人每回合可以交易一次']
  },
  {
    k: 'curse',
    n: '詛咒寶藏',
    w: 10,
    ic: 'sk_doom',
    d: [
      '商店的每一格有 20% 是詛咒寶藏：高一星、超便宜（2★ 1 金、3～5★ 2 金）',
      '詛咒寶藏帶一個祝福和一個詛咒，放在背包裡才生效',
      '星級越高，詛咒越重（2★ ×1.5、3★ ×2、4★ ×2.5、5★ ×3）',
      '合成時祝福和詛咒都會疊加：材料裡有幾件就疊幾層（最多 3 層）'
    ]
  },
  {
    k: 'shape',
    n: '七十二變',
    w: 10,
    ic: 'sup_ln_chaos',
    d: ['這局每件道具的形狀都隨機換過（大家一樣）', '1★ 道具最多 3 格', '道具詳細、商店都看得到這局的形狀']
  },
  {
    k: 'astro',
    n: '星象輪轉',
    w: 10,
    ic: 'msk_doom',
    d: ['每個階段有一條全場規則（雙方、怪物都適用）', '下一個階段的規則提前公開']
  },
  {
    k: 'relic',
    n: '法老王的遺物',
    w: 10,
    ic: 'gear_amulet_0',
    d: [
      '2-5、4-4 首領與 6-4 菁英之後，法老王的寶庫打開',
      '生命最低的人先挑：比你低的對手先拿走，你從剩下的挑一件',
      '遺物不佔格子，整局有效'
    ]
  },
  {
    k: 'legacy',
    n: '遺產市集',
    w: 10,
    ic: 'sk_ancestral',
    d: ['有人淘汰時，他背包的道具分給還活著的人', '分到的道具放在商店上方的遺產攤位：半價、保留階數', '遺產只放 2 回合']
  },
  {
    k: 'dual',
    n: '雙修',
    w: 10,
    ic: 'tree_n115',
    d: ['第二個核心（4-4 首領）不是自己職業的：隨機 4 個別的職業的核心，四選一', '可以刷新 2 次']
  },
  {
    k: 'tarot',
    n: '塔羅牌陣',
    w: 10,
    ic: 'tree_n118',
    d: [
      '第 1、3、5 階段開頭，從 4 張塔羅牌選 1 張，生效兩個階段',
      '每張牌是正位或逆位，效果不同；選過的牌不會再出現',
      '4 張裡至少 1 張戰鬥效果、1 張不是'
    ]
  }
];
/* 0.1.69 塔羅牌陣：第幾階段開頭抽（每張管到下一次抽之前）、幾選一；
   TAROT 每張牌的正位 u、逆位 v：c 是類型（fight 戰鬥、syn 羈絆、life 生存、pet 寵物算戰鬥；eco 經濟、build 構築不算），d 是說明 */
const TAROT_AT = [1, 3, 5],
  TAROT_N = 4,
  TAROT_FIGHT = ['fight', 'syn', 'life', 'pet'];
const TAROT = [
  {
    k: 'fool',
    n: '愚者',
    u: { c: 'eco', d: '商店多 1 格，星級完全隨機（1～5★）' },
    v: { c: 'build', d: '每回合開始，複製背包裡隨機 1 件 4★ 以下的道具（複製品賣 0 金）' }
  },
  { k: 'magician', n: '魔術師', u: { c: 'build', d: '合成只要 2 件' }, v: { c: 'fight', d: '開戰時所有武器充能 50%' } },
  {
    k: 'priestess',
    n: '女祭司',
    u: { c: 'build', d: '合成直接升兩階（最多到 Ⅲ 階）' },
    v: { c: 'eco', d: '每回合第一次購買只要 1 金（賣價最多是付的錢）' }
  },
  {
    k: 'empress',
    n: '女皇',
    u: { c: 'pet', d: '寵物傷害 +10%，這張牌期間每打一回合再 +5%' },
    v: { c: 'life', d: '每秒回復、藥水回復 +50%' }
  },
  { k: 'emperor', n: '皇帝', u: { c: 'fight', d: '背包裡最大的一把武器傷害 ×2' }, v: { c: 'eco', d: '每回合 +2 金' } },
  {
    k: 'hierophant',
    n: '教皇',
    u: { c: 'build', d: '商店每次至少 1 格是你職業的武器' },
    v: { c: 'build', d: '商店每次至少 1 格是背包裡已經有的道具' }
  },
  {
    k: 'lovers',
    n: '戀人',
    u: { c: 'fight', d: '最強的兩把武器互相帶動：一把出手，另一把充能 +50%' },
    v: { c: 'fight', d: '最強的兩把武器傷害 ×1.6、攻速 -20%' }
  },
  {
    k: 'chariot',
    n: '戰車',
    u: { c: 'fight', d: '開戰前 4 秒攻速 +60%' },
    v: { c: 'fight', d: '開戰前 3 秒武器不出手，之後攻速 +35%' }
  },
  {
    k: 'strength',
    n: '力量',
    u: { c: 'syn', d: '羈絆門檻 -1 件（1／3／5 件就開）' },
    v: { c: 'syn', d: '只有件數最多的那一系羈絆有效，效果 ×2' }
  },
  {
    k: 'hermit',
    n: '隱者',
    u: { c: 'fight', d: '背包 5 件以下時，武器傷害 +50%' },
    v: { c: 'fight', d: '背包每有 1 件道具，武器傷害 +4%' }
  },
  {
    k: 'wheel',
    n: '命運之輪',
    u: { c: 'eco', d: '每回合免費刷新 2 次' },
    v: { c: 'build', d: '每回合打完，道具四選一；但不能刷新商店' }
  },
  {
    k: 'justice',
    n: '正義',
    u: { c: 'fight', d: '受到的攻擊傷害反彈 15%' },
    v: { c: 'life', d: '輸了扣的生命減半' }
  },
  {
    k: 'hanged',
    n: '倒吊人',
    u: { c: 'eco', d: '不能買，每回合收入 ×2' },
    v: { c: 'eco', d: '不能賣，商店價格 -1 金（最低 1 金）' }
  },
  {
    k: 'death',
    n: '死神',
    u: { c: 'build', d: '每回合可以獻祭 1 件道具，換永久生命（星級 × 階數 × 15）' },
    v: { c: 'life', d: '第一次被淘汰時留 1 生命' }
  },
  {
    k: 'temperance',
    n: '節制',
    u: { c: 'life', d: '每秒回復最大生命的 2%' },
    v: { c: 'fight', d: '武器攻速 -20%、傷害 +40%' }
  },
  {
    k: 'devil',
    n: '惡魔',
    u: { c: 'eco', d: '每回合扣 2 生命，換 5 金（生命最少剩 1）' },
    v: { c: 'fight', d: '吸血 +10%，但每秒回復、藥水回復沒有效果' }
  },
  {
    k: 'tower',
    n: '高塔',
    u: { c: 'fight', d: '開戰時封鎖敵人最強的一把武器 4 秒' },
    v: { c: 'fight', d: '自己最強的一把武器整場不出手，其他武器傷害 +30%' }
  },
  {
    k: 'star',
    n: '星星',
    u: { c: 'eco', d: '商店出高星的機率跟背包高一級一樣' },
    v: { c: 'build', d: '合成出來的道具開一條隨機詞綴' }
  },
  {
    k: 'moon',
    n: '月亮',
    u: { c: 'fight', d: '開戰時複製敵人最強的一把武器（幻影，傷害 50%）' },
    v: { c: 'fight', d: '敵人的第一次攻擊打到幻影（不受傷）' }
  },
  {
    k: 'sun',
    n: '太陽',
    u: { c: 'eco', d: '打贏多拿 2 金' },
    v: { c: 'life', d: '生命比對手高時，受到的傷害 -20%' }
  },
  {
    k: 'judgement',
    n: '審判',
    u: { c: 'build', d: '商店固定出現一格你賣掉過最高星的道具' },
    v: { c: 'fight', d: '生命低於 30% 時，武器傷害 +40%' }
  },
  {
    k: 'world',
    n: '世界',
    u: { c: 'syn', d: '每一系羈絆都多算 2 件（至少要有 1 件）' },
    v: { c: 'syn', d: '每開一個羈絆門檻，武器傷害 +8%、攻速 +5%' }
  }
];
const TAROTI = Object.fromEntries(TAROT.map((x, i) => [x.k, i]));
/* 牌的代號：'fool'（正位）、'fool_r'（逆位） → [牌, 正逆位的效果] */
const tarOf = key => {
  if (!key) return null;
  const r = key.endsWith('_r'),
    T = TAROT[TAROTI[r ? key.slice(0, -2) : key]];
  return T ? { T, r, e: r ? T.v : T.u } : null;
};
/* 0.1.69 雙修：第二個核心幾選一、可以刷新幾次 */
const DUAL_N = 4,
  DUAL_RE = 2;
const MODEI = Object.fromEntries(MODES.map(m => [m.k, m]));
/* 0.1.52 印記：湊到 SG_AT 件分別是 1／2／3 級；c 是顏色、s 是格子上的一個字 */
const SG_AT = [2, 4, 6];
const SIGILS = [
  {
    k: 'might',
    n: '力量',
    s: '力',
    c: '#ff8a5a',
    t: ['力量道具每第 4 次攻擊變「重擊」（傷害 ×2）', '重擊時讓敵人暈眩 0.3 秒', '重擊時，其他力量道具立刻跟著出手一次']
  },
  {
    k: 'swift',
    n: '迅捷',
    s: '迅',
    c: '#7ad3ff',
    t: ['迅捷道具出手時，下一件迅捷道具充能 +20%（接力）', '接力的充能改成 +35%', '接力時 25% 機率再往下接一次']
  },
  {
    k: 'guard',
    n: '守護',
    s: '守',
    c: '#d8cfb8',
    t: [
      '開戰時每件守護道具給 15 護盾',
      '護盾被打破時，對敵人反彈 20 傷害',
      '每次獲得護盾，你最強的武器立刻出手一次（每秒最多一次）'
    ]
  },
  {
    k: 'life',
    n: '生命',
    s: '命',
    c: '#7bd36b',
    t: ['生命道具命中時吸血 5%', '回復超過上限的部分變成護盾', '生命低於 30% 時，生命道具攻速 ×2']
  },
  {
    k: 'luck',
    n: '幸運',
    s: '運',
    c: '#ffd76a',
    t: [
      '幸運道具每次攻擊 10% 機率「幸運一擊」（傷害 ×3）',
      '打贏時 30% 機率多拿 2 金',
      '每場開戰時擲骰：隨機一把還沒到 Ⅲ 階的武器這場升一階'
    ]
  }
];
const sgLv = n => SG_AT.filter(x => n >= x).length;
/* 0.1.52 流浪商隊的商人：c 是價錢（血契是生命） */
const VANS = [
  { k: 'alch', n: '煉金商', ic: 'asc_alchemist_c', d: '2 件同星級的 Ⅰ 階道具，換 1 件高一星的隨機道具', c: 0 },
  { k: 'smith', n: '鐵匠', ic: 'it_anvil', d: '一件 Ⅱ 階以上的道具開一條隨機詞綴', c: 4 },
  { k: 'gamble', n: '賭徒', ic: 'gear_chest_1', d: '開福袋：隨機一件 1～4★ 道具', c: 3 },
  { k: 'morph', n: '變形師', ic: 'sin_pride_mirror', d: '一件道具變成同星級、同類型的另一件（保留階數）', c: 2 },
  { k: 'twin', n: '雙胞胎', ic: 'it_c_alchemy', d: '這回合下一件買的道具，送一件一樣的', c: 0 },
  {
    k: 'blood',
    n: '血契商人',
    ic: 'it_bloodrune',
    d: '付 6 生命，換一件比商店高一星的道具（選武器、防具或飾品）',
    c: 6
  }
];
const VANI = Object.fromEntries(VANS.map(v => [v.k, v]));
/* 0.1.59 詛咒寶藏：w 是只能給武器（沉睡）；v 是每層的數值。
   0.1.60 改成一個祝福＋一個詛咒（之前只有詛咒、半價，玩家很少買）：價格照星級固定（CURSE_PRICE，Ⅱ 階 ×3），
   詛咒照星級加重（CURSE_STAR），祝福不分星級 */
const CURSE_P = 20,
  CURSE_MAX = 3,
  CURSE_PRICE = [0, 1, 1, 2, 2, 2],
  CURSE_STAR = [0, 1, 1.5, 2, 2.5, 3];
const CURSES = [
  { k: 'drain', n: '吸金', v: 1, d: v => `每回合收入 -${v} 金` },
  { k: 'rust', n: '鏽蝕', v: 10, d: v => `相鄰道具攻速 -${v}%` },
  { k: 'frail', n: '虛弱', v: 20, d: v => `生命 -${v}` },
  { k: 'envy', n: '嫉妒', v: 10, d: v => `同一排其他武器傷害 -${v}%` },
  { k: 'sleep', n: '沉睡', v: 3, w: 1, d: v => `這件開戰後 ${v} 秒才開始出手` }
];
const CURSEI = Object.fromEntries(CURSES.map((c, i) => [c.k, i]));
/* 0.1.60 祝福：w 是只能給武器（含寵物）、a 是武器或盾（有冷卻的） */
const BLESS = [
  { k: 'sharp', n: '鋒利', v: 30, w: 1, d: v => `這件傷害 +${v}%` },
  { k: 'quick', n: '輕巧', v: 25, a: 1, d: v => `這件攻速 +${v}%` },
  { k: 'keen', n: '致命', v: 15, w: 1, d: v => `這件暴擊率 +${v}%` },
  { k: 'leech', n: '嗜血', v: 8, w: 1, d: v => `這件吸血 +${v}%` },
  { k: 'stout', n: '堅固', v: 40, d: v => `生命 +${v}` },
  { k: 'rally', n: '鼓舞', v: 12, d: v => `相鄰道具攻速 +${v}%` }
];
/* 這件身上的詛咒、祝福數值（層數 × 每層；詛咒再照星級加重） */
const cuV = o => (o.cu && CURSES[o.cu[0]] ? Math.round(CURSES[o.cu[0]].v * o.cu[1] * CURSE_STAR[ITEMI[o.id].star]) : 0);
const blV = o => (o.bl && BLESS[o.bl[0]] ? BLESS[o.bl[0]].v * o.bl[1] : 0);
/* 0.1.59 星象輪轉：每個階段一條全場規則（astroF 套在雙方的戰鬥數值上；豐收月只影響金幣） */
const ASTROS = [
  { k: 'fire', n: '火焰月', d: '所有燃燒 ×2' },
  { k: 'toxin', n: '毒霧月', d: '所有中毒、劇毒 ×2' },
  { k: 'frost', n: '寒冬月', d: '凍結、冰緩機率 ×1.5' },
  { k: 'blood', n: '血月', d: '所有吸血 ×2' },
  { k: 'mirror', n: '鏡月', d: '所有反彈傷害 ×2' },
  { k: 'wind', n: '疾風月', d: '所有武器、盾的冷卻 -20%' },
  { k: 'iron', n: '鐵壁月', d: '護甲 ×2、盾的格擋 +50%' },
  { k: 'fury', n: '狂暴月', d: '所有武器暴擊率 +15%' },
  { k: 'harvest', n: '豐收月', d: '打贏多拿 1 金' }
];
const ASTROI = Object.fromEntries(ASTROS.map(a => [a.k, a]));
/* 0.1.59 法老王的遺物：哪幾回合打完開寶庫；效果在 compileBag（金面具在 bonusGold） */
const RELIC_AT = ['2-5', '4-4', '6-4'];
const RELICS = [
  { k: 'scarab', n: '聖甲蟲護符', ic: 'gear_amulet_0', d: '最下面一排的道具攻速 +25%' },
  { k: 'horus', n: '荷魯斯之眼', ic: 'sk_precise', d: '最上面一排的道具暴擊率 +20%' },
  { k: 'ankh', n: '安卡', ic: 'sk_emergency', d: '每場第一次倒下時，以 30% 生命復活' },
  { k: 'scepter', n: '法老權杖', ic: 'gear_weapon_15', d: '背包裡的武器（含寵物）不超過 3 件時，每件傷害 +40%' },
  { k: 'mask', n: '黃金面具', ic: 'sup_ln_greed', d: '每回合收入 +2 金' },
  { k: 'feather', n: '瑪特之羽', ic: 'sk_grace', d: '佔到背包四個角落的道具傷害 +35%' },
  { k: 'pyramid', n: '金字塔', ic: 'sk_phalanx', d: '完全不碰到背包邊緣的道具攻速 +20%、傷害 +20%' },
  { k: 'sand', n: '沙之沙漏', ic: 'ail_slow', d: '開戰 8 秒後，所有武器攻速 +35%' }
];
const RELICI = Object.fromEntries(RELICS.map(x => [x.k, x]));
/* 0.1.62 道具池的主題（開場內圈轉盤，機率一樣；0.1.69 五個）；MODE_TH_BAN：賽制 × 主題衝突的不會一起抽到 */
const POOLTH = [
  {
    k: 'g',
    n: '巨人國',
    ic: 'sk_bonecrush',
    d: ['這局的道具又大又重、形狀特別', 'U 形、環形、H 形、C 形中間空出來的格子是凹口，放進去的道具有加成']
  },
  { k: 'f', n: '共生森林', ic: 'unit_guardtotem', d: ['這局的道具看旁邊有幾件道具：越擠越強'] },
  { k: 'm', n: '機關城', ic: 'sup_sp_auto', d: ['這局的道具有觸發條件：每第 N 次出手多打、齒輪充能、連鎖帶動'] },
  {
    k: 'c',
    n: '棋盤王國',
    ic: 'it_kingcrown',
    d: [
      '棋子（1 格）照西洋棋的走法加成遠處的道具：每個方向只影響碰到的第一件',
      '這局的武器每被一個棋子影響，再變強一點'
    ]
  },
  {
    k: 'z',
    n: '黃道十二宮',
    ic: 'asc_s_stars',
    d: [
      '星座：旁邊最多 2 件道具也算它那一系，湊羈絆用',
      '背包裡有星座時，羈絆多開 8 件、10 件兩個門檻',
      '這局的武器每開一個羈絆門檻，再變強一點'
    ]
  }
];
const POOLTHI = Object.fromEntries(POOLTH.map(x => [x.k, x]));
const MODE_TH_BAN = { shape: ['g'] };
/* 0.1.62 系別羈絆：背包裡同一系（g 裡任一個標籤）湊 SYN_AT 件分別是 1／2／3 級，效果累加（3 級＝L[0]＋L[1]＋L[2]）；
   m 給那一系的道具（跟飾品加成一樣算進道具身上）、F 給角色。系別飾品（for）算 1 件、重做的羈絆飾品（syn）照寫的件數算 */
/* 0.1.69 黃道十二宮：背包裡有星座時多開 8、10 件兩個門檻（L[3]、L[4]） */
const SYN_AT = [2, 4, 6, 8, 10];
const SYN_W = [
  { m: { spd: 8 } },
  { m: { dmgPct: 15 } },
  { m: { crit: 15, dmgPct: 15 } },
  { m: { spd: 15, dmgPct: 20 } },
  { m: { crit: 20, dmgPct: 40 } }
];
const SYN = [
  {
    k: 'fire',
    g: ['fire'],
    L: [
      { m: { burn: 1 } },
      { F: { combust: 1 } },
      { m: { burn: 2 }, F: { combust: 1 } },
      { m: { burn: 3 }, F: { combust: 2 } },
      { m: { burn: 3 }, F: { combust: 3 } }
    ]
  },
  {
    k: 'cold',
    g: ['cold'],
    L: [
      { m: { freezeCh: 5 } },
      { F: { shatterF: 8 } },
      { m: { freezeCh: 10 }, F: { shatterF: 8 } },
      { m: { freezeCh: 10 }, F: { shatterF: 10 } },
      { F: { shatterS: 15, shatterF: 15 } }
    ]
  },
  {
    k: 'light',
    g: ['light'],
    L: [
      { m: { chainN: 1 } },
      { m: { charge: 1 } },
      { m: { chainN: 1 }, F: { zapPct: 50 } },
      { m: { charge: 1 }, F: { zapPct: 50 } },
      { F: { zapPct: 100 } }
    ]
  },
  {
    k: 'poison',
    g: ['poison'],
    L: [
      { m: { poison: 1 } },
      { F: { p2v: 1 } },
      { m: { poison: 2 }, F: { corrodeRe: 5 } },
      { m: { poison: 3 }, F: { p2v: 1 } },
      { m: { poison: 2, venom: 1 } }
    ]
  },
  {
    k: 'holy',
    g: ['holy'],
    L: [
      { F: { regen: 1 } },
      { F: { startBlock: 30 } },
      { F: { cleanse: 1 } },
      { F: { regen: 4, startBlock: 50 } },
      { F: { ankh: 30, cleanse: 1 } }
    ]
  },
  {
    k: 'dark',
    g: ['dark'],
    L: [
      { m: { ls: 3 } },
      { F: { execute: 20 } },
      { m: { ls: 3 }, F: { execute: 30 } },
      { m: { ls: 5 }, F: { execute: 20 } },
      { m: { crit: 15 }, F: { execute: 40 } }
    ]
  },
  { k: 'sword', g: ['sword'], L: SYN_W },
  { k: 'axe', g: ['axe', 'mace'], L: SYN_W },
  { k: 'bow', g: ['bow', 'xbow'], L: SYN_W },
  { k: 'spear', g: ['spear'], L: SYN_W },
  { k: 'dagger', g: ['dagger'], L: SYN_W },
  { k: 'staff', g: ['staff'], L: SYN_W },
  {
    k: 'shield',
    g: ['shield'],
    L: [
      { F: { startBlock: 20 } },
      { m: { blockPct: 25 } },
      { F: { thornsF: 5 } },
      { m: { blockPct: 50 }, F: { startBlock: 40 } },
      { F: { thornsF: 15, startBlock: 60 } }
    ]
  },
  {
    k: 'pet',
    g: ['pet'],
    L: [
      { m: { dmgPct: 12 } },
      { m: { spd: 15 } },
      { F: { petGuard: 25 } },
      { m: { dmgPct: 25, spd: 15 } },
      { m: { dmgPct: 25 }, F: { petGuard: 25 } }
    ]
  },
  {
    k: 'potion',
    g: ['potion'],
    L: [
      { F: { potMul: 20 } },
      { F: { potUse: 1 } },
      { F: { potMul: 30 } },
      { F: { potMul: 40 } },
      { F: { potUse: 1, potMul: 40 } }
    ]
  }
];
const SYNI = Object.fromEntries(SYN.map((x, i) => [x.k, i]));
/* mx：最多開到幾級（平常 3；背包裡有星座 5，synMax） */
const synLv = (n, mx = 3) => SYN_AT.slice(0, mx).filter(x => n >= x).length;
/* 0.1.59 遺產市集：遺產攤位放幾回合 */
const LEGACY_RC = 2;
/* 快照版本：回合表或道具改到舊快照不能用時才改（跟遊戲版本分開，小改版不用重產種子） */
/* 0.1.50 s20：弓箭手、亞馬遜核心重製（同一個核心編號換了效果）、機器人重新訓練 */
/* 0.1.51 s21：火法師、雷法師核心重製、新雷系道具 */
/* 0.1.52 s22：賽制（印記存在快照裡）、種子 300 局 */
/* 0.1.53 s23：馴獸師核心重製（同一個核心編號換了效果）、四兇、成長存進快照 */
/* 0.1.57 s24：清掉 0.1.52～0.1.56 用 bug（狂風市集洗商店、回扣洗三選一）洗出來的快照 */
/* 0.1.62 s25：道具池（武器分主題）、88 件新道具、飾品重做、系別羈絆 */
/* 0.1.69 s26：新主題棋盤王國、黃道十二宮（98 件新道具）、塔羅牌存在快照裡 */
/* 0.1.70 s27：巨人國、共生森林、機關城的舊武器換成主題專屬武器 */
/* 0.1.72 s28：機器人變聰明（全部菁英、挑職業、擺位、反制、記仇），舊種子太弱 */
const GVER = 's28';
const VER = '0.1.72';
