# 程式碼地圖

給開發者（和 Claude）快速定位用：要改某個功能時，先看這份找到檔案和函式，再用行號只讀那一段，不用整個檔案讀一遍。

- 下方「頂層宣告索引」是 `python3 tools/codemap.py` 自動產生的，**改完 JS 後重跑一次**，行號才會對。
- JS 用 prettier 排版（設定在 `.prettierrc`，寬度 120）：`npx prettier@3.3.3 --write js/*.js`。
- 所有 JS 是一般 `<script>`，依 `index.html` 的順序載入、共用全域變數；`main.js` 必須最後。

## 要改什麼，看哪裡

| 想改的功能 | 檔案 | 從這裡開始看 |
| --- | --- | --- |
| 版本號 | `tools/setver.py` | `python3 tools/setver.py 版本` 會改 `js/data.js` 的 `VER` 與 `index.html` 的 `?v=`（同時更新 CHANGELOG、README、企劃書） |
| 天賦盤起點（之魂）、技能 | `js/data.js` | `CLASSES`（起點名稱、主色、開局技能石）、`SKILLS` |
| 技能石：等級、刻印詞綴、刻印石 | `js/data.js`、`js/items.js` | `GEM_MAX`、`dustNeed`、`GAFF`、`GCUR`；`gemSkill`（技能石→戰鬥技能）、`mySkills`、`gemCraft`、`gemLvBlock` |
| 技能石面板（圖示格子、一鍵分解） | `js/ui.js` | `renderSheet` 的 `skills`／`gem` 分支、`gemCell`、`dupGems`、`A.gemDup`、`A.gemLv`、`A.gemCraft` |
| 新手引導（步驟、框選的按鈕） | `js/tutor.js` | `TUT`（每步的標題、說明、要框起來的選擇器）、`tutorStart`、`tutorShow`；存檔旗標 `S.tut` |
| 祈願（抽卡）介面、卡池、保底 | `js/gacha.js` | `BANNERS`、`GACHA_RATE`、`gachaPull`、`renderGacha`；主畫面圖示在 `index.html` 的 `.lbar` |
| 天賦外圈（武器、組隊、刻印專精） | `js/data.js`、`js/items.js` | `TH` 的 `sword`～`gem` 主題、`TREE` 的「0.2.4 外圈」段落；武器條件在 `stats` 開頭（`wepType`、`offType`）；嘲諷、群體治癒、隊友加成在 `mp.js` 的 `mpEnemy`、`mpResolve` |
| 技能石在戰鬥中的效果 | `js/battle.js` | `skSt`（刻印詞綴只對該技能生效）、`skByKey`（`'attack'`／`'s0'`～`'s3'`）、`gemLoot`（碎片與刻印石掉落） |
| 怪物種類與數值 | `js/data.js` | `MONS`、`MIMIC`、`EMODS`（菁英詞綴） |
| 地城種類與地城詞綴 | `js/data.js` | `DTYPES`、`DMODS`；規格換算在 `js/battle.js` 的 `dunSpec` |
| 裝備底材、詞綴、通貨 | `js/data.js` | `BASES`、`AFF`、`CUR`、`STATN`（屬性的顯示文字） |
| 天賦樹節點與基石 | `js/data.js` | `TH`（主題與重要節點）、`SPOKES`（15 條路線與基石）、`TREE`（產生節點座標與連線） |
| 天賦樹介面（縮放、點亮、退點、總覽） | `js/tree.js` | `drawTree`、`renderTreeCard`、`pathTo`、`canRefund` |
| 屬性計算（傷害、護甲、抗性、基石效果） | `js/items.js` | `sumStats`、`stats`（新屬性要加進 `STAT0`；每級成長 `HP_LV`、`MP_LV`） |
| 回復規則（自然回復、自動喝水） | `js/items.js`、`js/map.js` | `naturalRegen`、`autoPot`；走路在 `setPos`、時間在 `timeRegen` |
| 刷新週期 | `js/core.js` | `REFRESH`／`epoch`（怪物、事件 15 分鐘）、`REFRESH_H`／`hepoch`（地城、寶箱、商店、廟宇 1 小時） |
| 角色外觀（跟著裝備） | `js/sprites.js` | `heroPal`、`wepKind`、`GEARC` |
| 裝備生成、詞綴、通貨製作 | `js/items.js` | `makeItem`、`rollAffix`、`craftable`、`craft` |
| 商店 | `js/items.js` | `openShop` |
| 升級曲線 | `js/items.js` | `xpNeed`、`gainXP`、`treePts` |
| 怪物生成（等級、稀有度） | `js/items.js` | `pickMon`、`makeEnemy` |
| 單人戰鬥流程 | `js/battle.js` | `startBattle`、`useSkill`、`playerHit`、`enemyTurn`、`winBattle`、`loseBattle` |
| 戰鬥規則（單人＋多人共用） | `js/battle.js` | `skCost`、`canPay`、`payCost`、`heroPacket`、`heroDmg`、`heroAil`、`takeDmg`、`mitigate` |
| 掉寶、地城獎勵 | `js/battle.js` | `dropLoot`、`dunReward`；靈魂碎片與刻印石 `gemLoot`；現場加成 `ONSITE_BONUS`、`onsiteNow`（判定現場用 `ui.js` 的 `onSite`） |
| 亡靈區、亡靈怪、亡靈祭壇與軍團長、亡靈王 | `js/undead.js` | `undeadSpawns`（由 `endgameSpawns` 呼叫）、`UDZ`、`UNDEAD`、`drawUndead`、`undeadWin`、`commanderWin`、`kingWin`、`A.udBoss`、`A.udKing` |
| 亡靈精華與亡靈製作（屍化值） | `js/undead.js` | `ESS`（精華對應的詞綴）、`UCUR`、`ucReroll`、`ucConv`、`ucAdd`、`ucAff`、`ucBlock`、`undeadCraftHTML`（裝備詳情頁）；屍化值存在裝備的 `sh`、次數 `uc` |
| 魔霧封印、魔霧詞綴與專屬怪、進度與碎片 | `js/demon.js` | `demonSpawns`（由 `endgameSpawns` 呼叫）、`MIST_TIERS`、`MMODS`／`mistApply`、`MISTMON`、`drawMist`、`mistWin`、`A.mistGo`；狀態 `S.mist` |
| 七宗罪雕像、7 個王的機制、殘魂 | `js/demon.js`、`js/battle.js` | `SINS`、`makeSinLord`、`sinTurn`（`enemyTurn` 開頭）、`sinHit`（`playerHit`）、`sinReward`（`dunReward`）、`A.sinGo`；`dunEnemy` 的七宗罪段落 |
| 傳奇裝備 | `js/demon.js`、`js/items.js` | `LEGENDS`、`makeLegend`；屬性在 `sumStats`（`it.leg`），特效旗標 `legPride` 等在 `heroDmg`／`heroAil`／`useSkill`／`bItem` |
| 惡魔珠寶與天賦盤珠寶槽 | `js/demon.js`、`js/data.js`、`js/tree.js` | `JAFF`、`makeJewel`、`jewelCap`、`jewelStats`、`socketCardHTML`、`A.jIn`／`A.jOut`；槽位在 `TREE` 結尾（`type: 'socket'`），鑲嵌狀態 `S.jsock` |
| 狩獵墮落十二生肖（0.2.12） | `js/hunt.js` | `huntWalk`（`setPos` 呼叫）、`huntSpawns`（`genEntities` 最後）、`ZODIAC`、`HSUM`、`makeBeast`、`makeZodiac`、`huntWin`（`winBattle`）、`huntHTML`（`hunt` 面板）、`zodEntHTML`（`openEnt`）；狀態 `S.hunt`、`S.summons`（id 以 `z` 開頭） |
| 魔霧刷新、亡靈區／魔霧／侵蝕柱的地圖繪製 | `js/demon.js`、`js/undead.js`、`js/endgame.js` | `mistEp`／`mistify`（`q` 開頭的魔霧怪）、`drawMist`、`drawUndead`／`drawUndeadMark`、`drawObelisks`；遠距離顯示 `FAR`（`map.js`） |
| 七宗罪之王（4 人，0.2.11） | `js/demon.js`、`js/data.js` | `makeSinKing`、`A.sinKing`、`DTYPES.sinking`；付出殘魂在 `payDun` 的 `souls` |
| 等級上限 | `js/items.js` | `LV_MAX`（`gainXP`） |
| 石碑／魔法陣當場挑戰 | `js/endgame.js` | `A.siteGo` 設定 `SEL.site` 後打開石碑面板（`steleHTML` 的現場模式、`siteEnt`），開打走 `A.steleRun`／`A.circleOpen` |
| 背包材料分頁（碑文碎片、石碑、冥府碎片、卷軸） | `js/endgame.js`、`js/ui.js` | `MAT_TABS`、`matsHTML`、`A.matTab`、`A.matDrop`；分頁列 `bagTabs`（`ui.js`），目前分頁 `SEL.bag` |
| 戰鬥畫面（背景、特效、按鈕） | `js/battle.js` | `paintBG`、`renderBHud`、`renderBattle`、`drawFx`；怪物頭上名字 `placeBName`、左上角層數 `setFloor`、異常狀態圖示 `ailHTML`／`placeAil`（`AIL_E`、`AIL_H`）、頭目血條 `bossBar`、站位 `POS`（`y` 怪物、`hy` 玩家）、底部橫列行動順序 `renderOrder`（小頭像 `portrait`；多人在 `mp.js` 的 `renderMBHud`、倒數條 `mpTurnBar`、站位 `mpPos`） |
| 冥府看門人（牛頭、馬面、黑白無常） | `js/endgame.js` | `WATCHERS`、`summonWatcher` |
| 地圖道路資料、圖磚快取 | `js/map.js` | `OpenStreetMap vector tiles` 區段 |
| 地標城鎮清單 | `js/map.js` | `TOWNS`（前 11 個 id 不能改） |
| 地圖上的怪物、寶箱、地城、廟宇生成 | `js/map.js` | `spawns` 區段、`dungeonAt` |
| 迷霧、探索面積 | `js/map.js` | `fog of war` 區段、`explKm2` |
| 地圖物件什麼時候看得到 | `js/map.js` | `visible`（`MOBILE` 跟視野、`LANDMARK` 至少 `LM_VIS` 公尺） |
| 地圖繪製、右上角資訊 | `js/map.js` | `renderWorld`、`placeLabel` |
| 點地圖、走路、GPS | `js/map.js` | `input`、`movement`、`GPS` 區段 |
| 主畫面 HUD、底部導覽 | `js/ui.js` | `renderHud`、`NAVG`、`navOpen`；DOM 在 `index.html` 的 `#nav` |
| 各個面板（角色、背包、據點、設定…） | `js/ui.js` | `renderSheet` 的 `sheetName` 分支（見下表） |
| 點地圖物件後的互動（怪物、城鎮、地城） | `js/ui.js` | `entity interaction` 區段 |
| 據點（產出、升級） | `js/ui.js` | `bases` 區段；面板內容在 `js/endgame.js` 的 `baseHTML` |
| 據點半徑、冒險營旗、遠端互動範圍 | `js/endgame.js` | `zones`、`inZone`、`zoneOf`、`baseR`、`flagR`、`flagsOn`；地圖虛線圈 `drawZones` |
| 空白石碑、魔法陣、靈脈、侵蝕柱的生成 | `js/endgame.js` | `endgameSpawns`（由 `map.js` 的 `genEntities` 呼叫） |
| 碑文碎片、石碑、冥府碎片、組隊地城付費 | `js/endgame.js` | `rollInsc`、`makeTablet`、`makeFrag`、`capMods`、`payDun`；面板 `steleHTML` |
| 單人石碑／魔法陣／冥府傳送門的規格 | `js/data.js`、`js/battle.js` | `DTYPES.stele／circle／portal`；`dunSpec`（`floors`、`umods`、`norevive`）、`BIGBOSS` |
| 冥府詞綴、侵蝕柱充能、看門人 | `js/data.js`、`js/items.js`、`js/endgame.js` | `UMODS`、`EMODI`；`uwApply`；`obeliskCharge`、`summonWatcher`、`watcherWin` |
| 區域特性 | `js/data.js`、`js/endgame.js` | `ZMODS`、`ZONE_CELL`；`zoneXY`、`zoneAt` |
| 腐化 | `js/items.js` | `corrupt`（`gemCraft` 的 `vaal`） |
| 絲綢之路 | `js/endgame.js`、`supabase/migrations/20261019000000_silk_road.sql` | `SILK`、`silkLoad`、`silkCreate`、`silkView`、`caravans`、`baseSync` |
| 按鈕動作 | `js/ui.js` | `A` 物件（HTML 的 `data-act="名稱"` 對應 `A.名稱`） |
| 像素圖、圖示 | `js/sprites.js` | `SPR`（16×16 角色與怪物）、`ICONS`（8×8 按鈕圖示）、`PIX`（通貨、裝備欄、天賦圖示） |
| 音樂、音效 | `js/audio.js` | `playSong`、`sfx` |
| 帳號、雲端存檔 | `js/cloud.js` | `cloudInit`、`cloudPush`、`authRegister`、`authLogin`、`authLogout` |
| 好友、組隊邀請 | `js/social.js` | `friendsLoad`、`friendsHTML`、`inviteFriend` |
| 組隊大廳、多人戰鬥 | `js/mp.js` | `partyCreate`、`partyJoin`、`partyHTML`、`mpResolve`、`mpEnemy`、`renderMBHud` |
| 存讀檔、存檔轉換、啟動 | `js/main.js` | `load`、`save`、`migrate`、`start` |
| 樣式 | `css/style.css` | 依區塊註解（`/* ---------- shop ---------- */` 等）搜尋 |

## 面板（`renderSheet` 的 `sheetName`）

| sheetName | 標題 | 入口 |
| --- | --- | --- |
| `hero` | 角色 | 底部「角色」→ 角色 |
| `skills` | 技能 | 底部「角色」→ 技能 |
| `gem` | 技能石 | 技能面板裡點技能石（`selGem`） |
| `bag` | 背包 | 底部「背包」 |
| `slot` | 裝備欄 | 背包裡點裝備欄 |
| `item` | 裝備 | 背包裡點物品 |
| `base` | 據點 | 「冒險」→ 據點 |
| `near` | 附近 | 「冒險」→ 附近 |
| `stele` | 石碑與傳送門 | 「冒險」→ 石碑（`steleHTML`，在 `endgame.js`） |
| `log` | 冒險日誌 | 「冒險」→ 冒險日誌 |
| `party` | 組隊 | 「社交」→ 組隊（`partyHTML`，在 `mp.js`） |
| `friends` | 好友 | 「社交」→ 好友（`friendsHTML`，在 `social.js`） |
| `settings` | 設定 | 底部「設定」 |
| `ent` | （依物件） | 點地圖上的物件，由 `openEnt` 畫，不走 `renderSheet` |

## 重要的全域變數

| 變數 | 在哪裡宣告 | 內容 |
| --- | --- | --- |
| `S` | `data.js` | 玩家存檔（等級、裝備 `eq`、背包 `inv`、通貨 `cur`、天賦 `tree`…），格式版本 `S.v` |
| `selGem` | `data.js` | 技能石面板目前選的技能石 id |
| `B` | `data.js` | 單人戰鬥狀態（敵人 `e`、中毒、燃燒、凍結…），沒在戰鬥時是 `null` |
| `D` | `data.js` | 目前攻略中的單人地城（層數、規格 `spec`） |
| `MB` | `data.js` | 多人戰鬥狀態（隊長廣播來的 `state`） |
| `PT` | `mp.js` | 目前的隊伍（代碼、隊長、成員） |
| `ENT` | `data.js` | 地圖上目前生成的物件（怪物、寶箱、地城…），key 是 id |
| `CLOUD` | `cloud.js` | Supabase 連線、目前帳號 `uid`、玩家編號、是否遊客 |
| `SOC` | `social.js` | 好友清單 |
| `GA` | `gacha.js` | 祈願畫面目前的卡池與抽卡結果 |
| `SILK` | `endgame.js` | 絲綢之路清單、目前在看的好友據點 `view` |
| `SEL` | `endgame.js` | 石碑面板選取中的碑文碎片與石碑 |
| `TV` | `tree.js` | 天賦樹畫面的縮放與位置 |

## 頂層宣告索引（自動產生）

格式：`名稱:行號`。粗體是檔案裡的區段註解（`/* ===== 區段 ===== */`）。

<!-- index:start -->

### js/core.js（66 行）

  `$:3`
- **utils**（6）
  `h:7`、`rng:13`、`rnd:22`、`now:23`、`REFRESH:25`、`epoch:27`、`uid:29`、`esc:30`、`hex2rgb:31`、`shade:41`、`dist:51`、`fmtD:60`、`dirName:61`、`RANGE:65`

### js/data.js（2322 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（22）
  `CLASSES:24`、`SKILLS:36`、`RSTAR:53`、`GEM_MAX:55`、`GEM_DRAW:56`、`dustNeed:57`、`GAFF:59`、`GAFFI:141`、`GCUR:143`、`GCURI:153`、`EL:154`、`MONS:155`、`MIMIC:1171`、`EMODS:1184`、`DTYPES:1197`、`DMODS:1308`、`DMODI:1321`、`UMODS:1323`、`EMODI:1330`、`FRAG_PARTS:1332`、`ZONE_CELL:1334`、`ZMODS:1336`、`RCOL:1346`、`RGLOW:1348`、`RAREA:1349`、`SLOTS:1351`、`SLOTN:1352`、`BASES:1365`、`DROPS:1414`、`T5:1415`、`ARMOR:1422`、`AFF:1424`、`AFFI:1578`、`STATN:1579`、`sg:1603`、`CUR:1649`、`CURI:1657`、`TH:1660`、`SPOKES:1952`、`TREE:2059`、`VER:2320`、`START:2321`

### js/sprites.js（952 行）

- **pixel sprites (original art)**（3）
  `SPR:4`、`ICONS:560`、`ICOPAL:582`、`PAL:583`、`FIXED:591`、`sprite:593`、`spriteCanvas:630`、`drawSpr:642`、`ICC:653`、`iconURL:654`、`paintIcon:664`、`wepKind:677`、`wepType:682`、`offType:686`、`GEARC:687`、`gearC:698`、`heroPal:699`
- **icons: currency, item slots, passive nodes**（713）
  `PIX:714`、`PIXC:898`、`pixURL:899`、`curIcon:933`、`slotIcon:934`、`ICIMG:944`、`nodeIcon:945`

### js/audio.js（221 行）

- **audio**（3）
  `AU:4`、`audioInit:5`、`tone:30`、`noise:47`、`NS:65`、`nf:66`、`SONGS:71`、`PARSED:109`、`parse:110`、`playSong:122`、`schedule:128`、`SFX:147`、`sfx:213`、`buzz:216`

### js/items.js（801 行）

- **player & items**（3）
  `newGame:4`、`makeItem:71`、`baseOf:88`、`affFits:90`、`fitsSlot:92`、`rollAffix:94`、`cnt:115`、`addRandom:116`、`toMagic:126`、`rareName:133`、`toRare:134`、`itemTitle:140`、`itemName:151`、`itemSum:152`、`itemCard:160`、`sellVal:183`、`giveItem:184`、`giveCur:192`、`rollCur:195`、`curDot:205`、`craftable:207`、`craft:218`
- **skill gems**（235）
  `newGem:236`、`gemSlots:237`、`gemOpen:238`、`gemOf:239`、`GEMK:240`、`gemSkill:242`、`mySkills:264`、`rollGAff:265`、`gAffVal:275`、`gAffTxt:280`、`gemCraftable:281`、`gemCraft:294`、`corrupt:312`、`gemLvBlock:332`、`gemDustBack:339`、`giveGem:340`
- **stats**（348）
  `curSpec:350`、`STAT0:351`、`sumStats:424`、`HP_LV:445`、`stats:448`、`xpNeed:542`、`fullHeal:543`、`clampHP:548`、`autoPot:554`、`naturalRegen:576`、`addLog:584`、`gainXP:588`、`LV_MAX:601`、`treePts:602`、`dayPhase:603`、`buffOn:609`
- **enemies**（611）
  `pickMon:612`、`makeEnemy:623`、`rollMods:670`、`modNames:679`、`uwApply:681`
- **modal**（700）
  `showModal:701`、`hideModal:707`、`busy:710`、`openShop:711`

### js/battle.js（1413 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:241`、`enemyTop:246`、`placeBName:250`、`AIL_E:256`、`ailHTML:267`、`placeAil:275`、`battleSc:281`、`bossBar:283`、`setFloor:293`、`PORT:298`、`portrait:299`、`renderOrder:305`、`bmsg:314`、`pop:321`、`anim:324`、`animOff:327`、`later:341`、`startBattle:346`、`renderBHud:378`、`mitigate:441`、`skCost:450`、`canPay:451`、`payCost:452`、`costTxt:457`、`skSt:459`、`skByKey:472`、`extraHit:473`、`heroPacket:474`、`heroDmg:489`、`heroAil:499`、`poisonTick:526`、`takeDmg:528`、`playerHit:534`、`useSkill:571`、`bItem:638`、`flee:662`、`enemyDead:677`、`afterPlayer:682`、`enemyTurn:686`、`endEnemyTurn:782`
- **dungeons (shared by solo and party)**（801）
  `dunSpec:803`、`dunName:833`、`BIGBOSS:834`、`dunEnemy:836`、`dropLoot:910`、`gemLoot:985`、`ONSITE_BONUS:1008`、`onsiteNow:1009`、`dunReward:1011`、`dunModsHTML:1035`、`winBattle:1040`、`loseBattle:1116`、`endBattle:1145`、`enterDungeon:1154`、`nextRoom:1172`、`dungeonClear:1195`
- **battle: drawing**（1219）
  `renderBattle:1220`、`drawFx:1333`

### js/map.js（1647 行）

- **world coordinates: meters from 台中車站 (x 東, y 南)**（3）
  `O:4`、`KX:5`、`toM:7`、`toLL:8`、`TOWNS:10`
- **OpenStreetMap vector tiles**（63）
  `TZ:66`、`lng2tx:70`、`tx2lng:75`、`m2t:77`、`tileRect:81`、`CHUNKS:86`、`chunkVer:87`、`chunkQ:90`、`ckey:91`、`IDB:92`、`decodeMVT:130`、`ROADS:267`、`compactTile:269`、`genChunk:302`、`buildChunk:335`、`setChunk:370`、`tileURL:379`、`tileTemplate:380`、`WANT:394`、`fetchChunk:395`、`pumpChunks:425`、`ensureChunks:436`、`chunkAt:456`、`mapLoading:460`、`tilesIn:465`、`snapRoad:476`
- **extra sprites for the game map**（506）
  `HOUSEPALS:566`、`TPAL:571`、`townLayout:577`
- **extra sprites**（608）
- **fog of war (chunked)**（675）
  `CH:677`、`fogCount:682`、`fogReset:683`、`fogChunk:687`、`reveal:701`、`revealed:730`、`explKm2:738`、`MILES:739`、`trailStep:740`
- **spawns**（760）
  `spawnAt:761`、`MCELL:762`、`evEp:766`、`nearTown:767`、`dungeonAt:771`、`NOT_TEMPLE:792`、`genEntities:793`、`refreshEntities:962`、`VIS:979`、`MOBILE:980`、`LANDMARK:982`、`LM_VIS:994`、`FAR:996`、`visible:998`、`isDone:1007`、`townLv:1017`
- **world rendering**（1019）
  `wv:1020`、`VW:1022`、`cam:1025`、`ZMIN:1026`、`sizeWorld:1028`、`SX:1035`、`BGPAT:1037`、`bgPattern:1038`、`glow:1051`、`label:1058`、`sprScale:1077`、`viewChunks:1079`、`camLoadT:1087`、`renderWorld:1088`、`arrows:1359`
- **input**（1389）
  `ptrs:1390`、`drag:1391`、`tapOK:1425`、`endPtr:1426`、`tapWorld:1447`
- **movement**（1481）
  `lastFrame:1482`、`SIM_SPEED:1484`、`setPos:1485`、`checkArrive:1514`
- **GPS**（1542）
  `GPS:1544`、`gpsStart:1545`、`gpsStop:1582`、`tick:1589`、`timeRegen:1614`、`mmss:1623`、`plT:1627`、`placeLabel:1628`

### js/tree.js（449 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:290`、`classPicker:423`

### js/ui.js（1273 行）

- **HUD & sheets**（3）
  `renderHud:4`、`toast:23`、`openSheet:30`、`closeSheet:37`、`TITLES:42`、`NAVG:58`、`navG:76`、`navClose:77`、`navOpen:86`、`KIND:114`、`bar:123`、`entIcon:126`、`fmt1:157`、`curRow:158`、`bagTabs:162`、`curRowG:169`、`gemDesc:171`、`gemCell:178`、`dupGems:184`、`gemRow:192`、`prayed:196`、`renderSheet:197`、`nearTownE:364`
- **entity interaction**（368）
  `openEnt:369`、`FIGHTK:502`、`onSite:503`、`inRange:504`
- **bases**（506）
  `prodRate:507`、`stored:508`、`baseName:509`、`flagCheck:510`
- **actions**（518）
  `authForm:520`、`A:552`

### js/endgame.js（799 行）

- **map objects**（3）
  `pad16:4`、`ep2:74`
- **zones: base radius, flags, silk-road view**（76）
  `BASE_R:77`、`baseR:78`、`mainBase:79`、`flagR:80`、`flagMs:84`、`FLAG_MAX:85`、`flagsOn:87`、`zones:89`、`zonesKey:101`、`zoneOf:105`、`inZone:106`、`drawZones:107`
- **zone modifiers**（127）
  `zoneXY:128`、`zoneAt:134`
- **spawns**（136）
  `STCELL:137`、`drawObelisks:143`、`endgameSpawns:185`
- **scrolls, inscriptions, tablets**（266）
  `INSC_MAX:267`、`rollInsc:271`、`makeTablet:280`、`modList:291`、`capMods:293`、`payDun:298`
- **underworld**（316）
  `obeliskCharge:317`、`watcherWin:326`、`makeFrag:332`、`WATCHERS:344`、`summonWatcher:374`
- **silk road (Supabase)**（394）
  `SILK:395`、`SILK_FREE:396`、`silkLoad:397`、`baseSync:410`、`SILK_MSG:420`、`silkCreate:430`、`silkRemove:437`、`specialty:444`、`caravans:445`、`silkView:465`
- **sheets**（479）
  `SEL:480`、`chip:481`、`baseHTML:483`、`silkHTML:509`、`siteEnt:530`、`steleHTML:535`、`MAT_TABS:572`、`matsHTML:578`、`ENTURL:625`、`entURL:626`、`portalPick:631`
- **actions**（637）

### js/undead.js（619 行）

- **data**（3）
  `pad16u:4`、`UNDEAD:100`、`UNDEADN:177`、`ESS:179`、`ESSI:207`、`ESS_MAX:208`、`affCat:209`、`UCUR:211`、`UCURI:217`、`KING_NEED:218`
- **zones**（233）
  `UD_CELL:234`、`udEp:237`、`UDZ:238`、`undeadSpawns:240`、`udProg:290`、`udZoneAt:291`、`drawUndead:293`、`drawUndeadMark:326`
- **battle**（342）
  `undeadWin:344`、`giveEss:362`、`udBoss:368`、`commanderWin:376`、`kingWin:395`
- **undead crafting (at main base)**（408）
  `atBase:409`、`ucCost:413`、`ucBlock:414`、`maxPS:421`、`rollCat:423`、`hasEss:433`、`payEss:434`、`UC_SH:435`、`ucDone:436`、`ucReroll:440`、`ucConv:452`、`ucAdd:469`、`ucAff:480`、`undeadCraftHTML:502`、`essHTML:539`
- **actions**（547）

### js/demon.js（809 行）

- **sprites & data**（3）
  `pad16d:4`、`MMODS:76`、`mistApply:84`、`MISTMON:100`、`MIST_TIERS:144`、`ROMAN:151`、`SINS:153`、`SINI:218`、`SIN_COST:219`、`LEGENDS:222`、`LEGI:280`、`makeLegend:281`、`JAFF:291`、`JEWEL_MAX:310`、`makeJewel:311`、`giveJewel:320`、`jewelTxt:327`、`jewelCap:329`、`jewelsIn:330`、`jewelStats:335`
- **map: mist seals, active mist, sin statues**（342）
  `MS_CELL:343`、`MISTZ:345`、`demonSpawns:346`、`MQ_CELL:465`、`mistify:469`、`drawMist:480`、`mistWin:539`
- **sin lords**（555）
  `makeSinLord:556`、`makeSinKing:581`、`sinTurn:612`、`sinHit:630`、`sinBattleWin:641`、`sinReward:647`
- **sheets**（670）
  `sinHTML:671`、`sinMods:679`、`demonHTML:689`、`jewelHTML:696`、`socketCardHTML:709`
- **actions**（731）

### js/hunt.js（335 行）

- **data**（3）
  `HUNT_STEP:4`、`ZODIAC:11`、`ZODI:33`、`HSUM:35`、`corruptPal:42`、`sprPal:57`、`zodPal:58`
- **state**（72）
  `H:73`、`huntWalk:75`、`huntHud:87`、`nearSpot:95`、`addSummon:105`、`huntSpawns:113`、`zodActive:123`
- **enemies**（125）
  `makeBeast:126`、`makeZodiac:132`、`huntWin:154`
- **sheet**（187）
  `huntHTML:188`、`huntPaint:211`
- **actions**（218）
  `zodEntHTML:327`

### js/gacha.js（155 行）

- **banners**（3）
  `GACHA_RATE:5`、`BANNERS:8`、`gpool:29`、`GA:30`、`gachaRoll:31`、`gachaPull:45`、`revealNext:68`
- **ui**（79）
  `gemTile:80`、`openGacha:85`、`closeGacha:93`、`renderGacha:98`

### js/tutor.js（146 行）

- **tutorial**（3）
  `TUT:5`、`tutI:88`、`tutorStart:89`、`tutorEnd:96`、`tutorShow:102`

### js/cloud.js（161 行）

- **cloud save (Supabase)**（4）
  `SB_URL:5`、`CLOUD:8`、`playerTag:19`、`cloudUser:21`、`cloudFetch:32`、`cloudInit:37`、`cloudPush:77`
- **accounts**（104）
  `AUTH_ERR:105`、`authMsg:110`、`authRegister:112`、`authLogin:133`、`authLogout:154`

### js/social.js（181 行）

- **profile & friends**（3）
  `SOC:4`、`isOnline:5`、`profileSync:7`、`friendsLoad:18`、`FR_MSG:30`、`friendAdd:39`、`friendRespond:45`、`friendRemove:49`、`socialOnUser:54`
- **party invites**（67）
  `INVQ:69`、`invitesListen:70`、`invitesStop:87`、`dropInvite:91`、`queueInvite:97`、`nextInvite:108`、`inviteFriend:137`
- **friends sheet**（148）
  `friendsHTML:149`

### js/mp.js（1175 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:69`
- **party / lobby**（71）
  `ptSend:72`、`ptConnect:75`、`ptPill:89`、`partyCreate:98`、`partyJoin:130`、`partyLeave:156`、`ptLobby:173`、`ptGone:179`、`ptMsg:201`、`ptCodeHTML:275`、`partyHTML:277`
- **battle state (leader authoritative)**（305）
  `MBT:306`、`MBFX:308`、`pub:310`、`mpPush:318`、`mpArm:324`、`ptReady:334`、`mpStart:346`、`mpSpawn:408`、`mpRound:419`、`mpNext:430`、`mpEndRound:462`、`mpOnAct:470`、`mpResolve:476`、`mpEnemy:580`、`mpRoomClear:677`
- **battle (every client)**（709）
  `mpEnter:710`、`mpBG:732`、`mpApply:738`、`mpMy:802`、`mpRoomReward:821`、`mpClear:836`、`mpWipe:868`、`mpEnd:892`、`mpStop:909`、`mpLeave:920`
- **battle rendering**（935）
  `mpPos:937`、`renderMBHud:943`、`mpTurnT:1041`、`mpTurnBar:1042`、`renderMB:1060`

### js/main.js（180 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:30`、`migrate:39`、`start:128`
<!-- index:end -->
