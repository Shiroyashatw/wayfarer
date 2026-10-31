/* ARPG 原型 · 資料表：玩家、技能、怪物、裝備部位與詞綴 */
'use strict';
const VER = '0.0.1';
const KEY = 'arpg_demo_v1';

/* 玩家基礎數值（等級每升一級：生命 +12、傷害 +6%） */
const HERO = { hp: 120, mp: 60, mpReg: 5, spd: 230, dmg: [9, 14], as: 1, crit: 5, critX: 1.5, armor: 0 };

/* 技能：k 按鍵、t 出手時間（吃攻速）、mp 魔力、cd 冷卻、m 傷害倍率 */
const SKILLS = {
  slash: { n: '斬擊', key: '左鍵', ic: 'sk_slash2', t: 0.36, mp: 0, cd: 0, m: 1, r: 100, arc: 2.1, gain: 2, d: '向前揮出扇形斬擊，打中每隻回 2 魔力' },
  blade: { n: '飛刃', key: '右鍵', ic: 'sk_fanblade', t: 0.42, mp: 6, cd: 0, m: 0.8, spd: 760, pierce: 2, d: '射出飛刃，穿透 2 隻' },
  whirl: { n: '旋風斬', key: 'Q', ic: 'sk_whirl', t: 0.4, mp: 18, cd: 3, m: 1.8, r: 150, d: '原地迴旋，打周圍所有敵人並擊退' },
  iai: { n: '居合突進', key: 'E', ic: 'sk_iai', t: 0.22, mp: 12, cd: 4, m: 1.5, dist: 300, d: '衝向滑鼠位置，斬過路上的敵人；衝刺中無敵' }
};
const ROLL = { t: 0.32, dist: 175, iframe: 0.26, cd: 0.55, perfect: 0.16, slow: 0.55, slowScale: 0.3 };
const FLASK = { n: 3, heal: 0.5, t: 1.4, perKill: 0.12 };

/* 怪物：hp／dmg 是第 1 級的值，r 碰撞半徑、sz 畫的高度、ai 行為 */
const MOBS = {
  slime: { n: '綠史萊姆', sp: 'm_slime_green', hp: 34, dmg: 9, spd: 95, r: 18, sz: 40, ai: 'melee', wind: 0.5, reach: 46, cd: 1.3, xp: 6 },
  dog: { n: '流浪狗', sp: 'm_straydog', hp: 26, dmg: 8, spd: 200, r: 16, sz: 42, ai: 'lunge', wind: 0.38, reach: 230, cd: 1.6, xp: 6 },
  bat: { n: '蝙蝠', sp: 'm_bat', hp: 14, dmg: 5, spd: 230, r: 13, sz: 34, ai: 'melee', wind: 0.28, reach: 36, cd: 0.9, xp: 3, fly: 1 },
  fire: { n: '鬼火', sp: 'm_ghostfire', hp: 22, dmg: 10, spd: 120, r: 15, sz: 40, ai: 'ranged', wind: 0.55, reach: 330, cd: 2.0, xp: 7, fly: 1 },
  bear: { n: '黑熊', sp: 'm_blackbear', hp: 95, dmg: 24, spd: 80, r: 26, sz: 64, ai: 'slam', wind: 0.85, reach: 100, cd: 2.4, xp: 18 }
};
const BOSS = { n: '虎姑婆', sp: 'hugupo', hp: 700, dmg: 26, spd: 135, r: 40, sz: 120, ai: 'boss', xp: 200 };
/* 一群的組成 */
const PACKS = [
  ['slime', 'slime', 'slime', 'slime'],
  ['dog', 'dog', 'dog'],
  ['bat', 'bat', 'bat', 'bat', 'bat', 'bat'],
  ['fire', 'fire', 'slime', 'slime'],
  ['bear', 'slime', 'slime'],
  ['dog', 'dog', 'fire'],
  ['bear', 'bat', 'bat', 'bat']
];
const ELITE = { hp: 3.2, dmg: 1.5, sz: 1.3 };
const lvMul = L => ({ hp: 1 + 0.45 * (L - 1), dmg: 1 + 0.3 * (L - 1) });

/* 裝備部位：ic 圖示前綴與張數、base 底材數值 */
const SLOTS = {
  weapon: { n: '武器', ic: 'gear_weapon', ics: 8, aff: ['dmg', 'flat', 'as', 'crit', 'loh'] },
  helm: { n: '頭盔', ic: 'gear_helm', ics: 6, aff: ['life', 'armor', 'crit', 'mp', 'aoe'] },
  chest: { n: '胸甲', ic: 'gear_chest', ics: 6, aff: ['life', 'armor', 'regen'] },
  gloves: { n: '手套', ic: 'gear_gloves', ics: 6, aff: ['life', 'armor', 'as', 'flat', 'loh'] },
  boots: { n: '鞋子', ic: 'gear_boots', ics: 6, aff: ['life', 'armor', 'ms'] },
  ring: { n: '戒指', ic: 'gear_ring', ics: 6, aff: ['life', 'mp', 'dmg', 'flat', 'as', 'regen'] },
  amulet: { n: '項鍊', ic: 'gear_amulet', ics: 6, aff: ['life', 'mp', 'dmg', 'crit', 'aoe', 'regen'] }
};
const SLOTK = Object.keys(SLOTS);
/* 底材：武器加傷害、防具加護甲／生命（隨物品等級成長） */
const baseOf = (slot, L) =>
  slot === 'weapon'
    ? { flat: Math.round(3 + 2.2 * L) }
    : slot === 'ring' || slot === 'amulet'
      ? {}
      : { armor: Math.round((slot === 'chest' ? 14 : 7) * (1 + 0.5 * (L - 1))) };
/* 詞綴：p 前綴／s 後綴、v(L) 回傳 [最小, 最大] */
const AFF = {
  dmg: { p: 1, n: '物理傷害 +{}%', v: L => [8 + 4 * L, 18 + 6 * L] },
  flat: { p: 1, n: '附加 {} 物理傷害', v: L => [1 + L, 3 + 2 * L] },
  life: { p: 1, n: '最大生命 +{}', v: L => [8 + 6 * L, 18 + 10 * L] },
  armor: { p: 1, n: '護甲 +{}', v: L => [6 + 5 * L, 14 + 9 * L] },
  mp: { p: 1, n: '最大魔力 +{}', v: L => [6 + 3 * L, 14 + 5 * L] },
  as: { p: 0, n: '攻擊速度 +{}%', v: L => [5 + L, 9 + 2 * L] },
  crit: { p: 0, n: '暴擊率 +{}%', v: L => [2 + L, 5 + 1.5 * L] },
  regen: { p: 0, n: '每秒回復 {} 生命', v: L => [1 + 0.5 * L, 2 + L] },
  ms: { p: 0, n: '移動速度 +{}%', v: L => [6 + L, 12 + 2 * L] },
  loh: { p: 0, n: '擊中回復 {} 生命', v: L => [1 + 0.5 * L, 2 + L] },
  aoe: { p: 0, n: '範圍 +{}%', v: L => [6 + 2 * L, 12 + 3 * L] }
};
const RARN = ['普通', '魔法', '稀有'];
const NAME_A = ['血腥', '幽冥', '赤焰', '寒霜', '雷鳴', '破曉', '暗夜', '狂怒', '亡者', '鐵壁', '疾風', '妖異'];
const NAME_B = ['之牙', '之咒', '低語', '守望', '咆哮', '之誓', '之握', '之心', '餘燼', '之痕', '之眼', '行者'];
