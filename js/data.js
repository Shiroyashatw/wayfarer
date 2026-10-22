/* 塞令老師 · 遊戲表格：版本、回合表、經濟、背包等級（設定值都放這裡，方便調平衡） */
'use strict';
const SLOT = new URLSearchParams(location.search).get('p') || '';
const KEY = 'serling_v1' + (SLOT ? '_p' + SLOT : '');
/* ================= 一局 ================= */
const START_HP = 20, // 生命
  START_GOLD = 10, // 1-1 初始商店的金幣
  BASE_INCOME = 5, // 每回合基礎收入
  INTEREST_MAX = 5, // 利息上限（每 10 金 +1）
  BENCH_N = 6, // 暫存區格數
  SHOP_N = 5, // 商店格數
  REROLL = 1, // 刷新商店
  BASE_HP = 60, // 角色基礎生命（戰鬥）
  FATIGUE_T = 20, // 幾秒後開始疲勞
  MAX_T = 60; // 戰鬥最長秒數
/* 連勝／連敗獎勵：2 連 +1、4 連 +2、6 連以上 +3 */
const streakBonus = n => (n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
/* 背包等級：大小、升級花費、商店機率（1★～5★，%） */
const BAGLV = [
  null,
  { w: 3, h: 3, cost: 0, odds: [100, 0, 0, 0, 0] },
  { w: 3, h: 4, cost: 4, odds: [75, 25, 0, 0, 0] },
  { w: 4, h: 4, cost: 6, odds: [55, 35, 10, 0, 0] },
  { w: 4, h: 5, cost: 10, odds: [40, 35, 20, 5, 0] },
  { w: 5, h: 5, cost: 14, odds: [25, 35, 28, 10, 2] },
  { w: 5, h: 6, cost: 20, odds: [15, 30, 30, 20, 5] },
  { w: 6, h: 6, cost: 26, odds: [10, 25, 30, 25, 10] }
];
const BAG_MAX = BAGLV.length - 1;
/* 回合表（前短後長）：start 初始商店、pve 野怪、elite 菁英、boss 首領、pvp 打對手快照、shop 商店關；loss 是輸了扣的生命 */
const ROUNDS = (() => {
  const out = [],
    add = (st, i, type, loss = 0) => out.push({ id: `${st}-${i}`, st, type, loss });
  add(1, 1, 'start');
  add(1, 2, 'pve', 1);
  add(1, 3, 'pve', 1);
  add(1, 4, 'elite', 2);
  /* 第 2 階段 PvP 與 PvE 穿插：檢驗構築 → 喘口氣補經濟 → 第二輪 PvP → 打王前的商店 → 菁英首領（核心三選一） */
  add(2, 1, 'pvp', 2);
  add(2, 2, 'pve', 1);
  add(2, 3, 'pvp', 2);
  add(2, 4, 'shop');
  add(2, 5, 'boss', 2);
  [1, 2, 3].forEach(i => add(3, i, 'pvp', 3));
  add(3, 4, 'shop');
  [5, 6].forEach(i => add(3, i, 'pvp', 4));
  [1, 2, 3].forEach(i => add(4, i, 'pvp', 4));
  add(4, 4, 'shop');
  [5, 6, 7].forEach(i => add(4, i, 'pvp', 5));
  for (let st = 5; st <= 8; st++) {
    [1, 2, 3].forEach(i => add(st, i, 'pvp', 6));
    add(st, 4, 'shop');
    [5, 6, 7].forEach(i => add(st, i, 'pvp', 6));
  }
  return out;
})();
const RTYPE = { start: '初始商店', pve: '野怪', elite: '菁英', boss: '首領', pvp: '對戰', shop: '商店關' };
/* 名次加減分 */
const PLACE_PTS = [0, 40, 15, -10, -25];
/* 頭像（PNG 像素圖） */
const AVATARS = [
  ['zhongkui', '鍾馗'],
  ['menshen_qin', '秦叔寶'],
  ['menshen_yu', '尉遲恭'],
  ['wuchang_white', '白無常'],
  ['wuchang_black', '黑無常'],
  ['guixinniang', '鬼新娘'],
  ['ghost_priest', '道長'],
  ['bone_knight', '骨騎士'],
  ['death_witch', '死亡女巫'],
  ['lintoujie', '林投姐']
];
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
const VER = '0.4.0';
