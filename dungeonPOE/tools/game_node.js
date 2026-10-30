/* dungeonPOE · 在 Node 載入遊戲純邏輯（data～meta），給自動玩家、檢查、平衡用 */
'use strict';
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const FILES = ['core', 'data', 'gear', 'sim', 'dungeon', 'meta'];
function load() {
  const ctx = {
    console,
    URLSearchParams,
    Math,
    Date,
    JSON,
    location: { search: '' },
    setTimeout: () => 0,
    setInterval: () => 0
  };
  vm.createContext(ctx);
  const src = FILES.map(f => fs.readFileSync(path.join(__dirname, '../js', f + '.js'), 'utf8')).join('\n;\n');
  /* const／let 在 vm 裡不會變成全域，最後把要用的名字掛到 G 上 */
  vm.runInContext(src + '\n;this.G = { ' + EXPORTS.join(',') + ' };', ctx);
  return ctx.G;
}
const EXPORTS = (
  'h rng fl ITEMS ITEMI GEAR AFF AFFI BAGS BAGI BOX MBAGS AVATARS HEAT MOBS BOSSES ZODIAC CLASSES CLSI COREI TNODES lvOf mobBase ' +
  'mkItem baseOf rollItem cellsOf fits autoPlace occ compile coreV simulate predict danger mkFoe foesFor lootBag equipFoe genMap moves dists newRun ' +
  'canMove moveTo fightNow flee lootFor goDown eventPick shopBuy shopPrice EVENTS runResult heatLv runL P_of ' +
  'newGame heroOf depart finishRun takeNode canTake coresOf toggleCore buyBag buyShop sellItem ensureStarter clLv tPoints ' +
  'itemPrice sellPrice cellCount newBag allItems eqOf hatch rollPet PETS TREAS rollTreasure closeExits'
).split(' ');
module.exports = { load };
