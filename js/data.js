/* 塞令老師 · 遊戲表格：版本、回合表、經濟、背包等級（設定值都放這裡，方便調平衡） */
'use strict';
const SLOT = new URLSearchParams(location.search).get('p') || '';
const KEY = 'serling_v1' + (SLOT ? '_p' + SLOT : '');
/* ================= 一局 ================= */
const START_HP = 40, // 生命（0.1.10 從 20 加到 40，build 有時間成形）
  START_GOLD = 10, // 1-1 開打前的金幣（商店 5 件 1★）
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
  [1, 2, 3].forEach(i => add(3, i, 'pvp', 3));
  add(3, 4, 'elite', 3);
  [5, 6].forEach(i => add(3, i, 'pvp', 4));
  [1, 2, 3].forEach(i => add(4, i, 'pvp', 4));
  /* 0.1.10 4-4 改成首領：打完副核心三選一（2-5 是專屬核心） */
  add(4, 4, 'boss', 4);
  [5, 6, 7].forEach(i => add(4, i, 'pvp', 5));
  for (let st = 5; st <= 8; st++) {
    [1, 2, 3].forEach(i => add(st, i, 'pvp', 6));
    add(st, 4, 'elite', 5);
    [5, 6, 7].forEach(i => add(st, i, 'pvp', 6));
  }
  return out;
})();
const RTYPE = { pve: '野怪', elite: '菁英', boss: '首領', pvp: '對戰' };
/* 回合列的短名與顏色分類 */
const RSHORT = { pve: '野怪', elite: '菁英', boss: '首領', pvp: '對戰' };
/* 0.1.19 戰鬥中的生命倍率（照階段）：合成 ×3／×9 之後傷害長很快，對戰只打 3～4 秒；
   兩邊（玩家、對手快照、怪物）的生命都乘上這個，打久一點，持續傷害、回復、慢速武器、疲勞才有作用 */
const HP_ST = [1, 1.5, 2.6, 3.6, 4.4, 5.1, 5.8, 6.5, 7.2];
const hpMul = st => HP_ST[Math.min(HP_ST.length - 1, st)] || 1;
/* 名次加減分（分數不給玩家看，只顯示牌階） */
const PLACE_PTS = [0, 40, 15, -10, -25];
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
const AVATARS = [
  ['av_swordsman', '銀髮劍士'],
  ['av_prince', '金髮王子'],
  ['av_taoist', '俊美道士'],
  ['av_butler', '冷面執事'],
  ['av_maid', '女僕'],
  ['av_miko', '巫女'],
  ['av_blonde', '金髮美人'],
  ['av_elf', '精靈弓手'],
  ['av_catgirl', '貓耳少女'],
  ['av_pirate', '海盜船長'],
  ['av_knight', '女騎士'],
  ['av_fox', '狐妖'],
  ['av_qipao', '旗袍佳人'],
  ['av_kunoichi', '女忍者'],
  ['av_vampire', '吸血伯爵夫人'],
  ['av_idol', '偶像歌手']
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
/* 快照版本：回合表或道具改到舊快照不能用時才改（跟遊戲版本分開，小改版不用重產種子） */
const GVER = 's13';
const VER = '0.1.19';
