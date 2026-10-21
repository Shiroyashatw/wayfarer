/* 漫步勇者 · 各章的怪物池與首領（0.1.0 肉鴿：原本散在地圖玩法裡的首領資料集中到這裡） */
'use strict';
/* 冥府看門人：牛頭、馬面、黑無常、白無常隨機一位，各自的屬性與冥府詞綴不同 */
const WATCHERS = [
  {
    n: '牛頭',
    spr: 'a_oxhead',
    el: 'phys',
    pal: { b: '#6a3a2a', w: '#e8e2d4', r: '#ff3a3a', n: '#c88a7a', a: '#3a2a3a' },
    mods: ['uw_body', 'fury']
  },
  {
    n: '馬面',
    spr: 'a_horseface',
    el: 'fire',
    pal: { g: '#5a7a6a', m: '#2a2a2a', r: '#ff3a3a', n: '#2a3a30', a: '#3a2a3a' },
    mods: ['uw_flame', 'swift']
  },
  {
    n: '黑無常',
    spr: 'a_wuchang_black',
    el: 'cold',
    pal: { h: '#1a1a22', t: '#e8e8e8', f: '#cfd8cf', e: '#111111', r: '#c0202a', c: '#24242c' },
    mods: ['uw_rage', 'cold']
  },
  {
    n: '白無常',
    spr: 'a_wuchang_white',
    el: 'light',
    pal: { h: '#f0f0f0', t: '#c0202a', f: '#f4f4f4', e: '#111111', r: '#e03040', c: '#e4e4ec' },
    mods: ['uw_soul', 'shock']
  }
];
/* 台灣鬼怪：第一章的首領（0.3.26 起地城首領抽籤用的那 9 隻） */
const GHOSTS = [
  { n: '魔神仔', spr: 'a_mosina', el: 'cold' },
  { n: '虎姑婆', spr: 'a_hugupo', el: 'phys' },
  { n: '陳守娘', spr: 'a_chenshouniang', el: 'cold' },
  { n: '椅仔姑', spr: 'a_yiagu', el: 'light' },
  { n: '林投姐', spr: 'a_lintoujie', el: 'cold' },
  { n: '水鬼', spr: 'a_shuigui', el: 'cold' },
  { n: '冥婚新娘', spr: 'a_guixinniang', el: 'fire' },
  { n: '紅衣小女孩', spr: 'a_hongy', el: 'phys' },
  { n: '吊死鬼', spr: 'a_diaosi', el: 'phys' }
];
