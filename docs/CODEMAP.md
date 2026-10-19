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
| 今日委託、附近面板分組、足跡（0.2.13） | `js/daily.js` | `QUESTS`、`daily`、`quest(k, n)`（各處呼叫：`winBattle`、`dungeonClear`、`pray`、`openChest`、`gather`、`obeliskCharge`、`mistWin`、`huntWalk`、`setPos`）、`dailyHTML`、`nearHTML`／`ngroup`／`nearProg`（`near` 面板）、`footStep`（`trailStep`）、`footLv`／`footDens`／`footRare`（`genEntities` 怪物生成）、`drawFoot`；狀態 `S.daily`、`S.foot` |
| 地圖事件連動（0.2.13） | `js/demon.js`、`js/undead.js`、`js/hunt.js` | 霧中亡靈：`mistify`（`e.ud`）、`mistWin`／`undeadWin`（×1.5）；冥府生肖：`A.huntZod`（`ZOD_UW_R`、`uwz`）、`huntWin`；夜晚：`undeadSpawns` 半徑、魔霧刷新機率 |
| 狩獵墮落十二生肖（0.2.12） | `js/hunt.js` | `huntWalk`（`setPos` 呼叫）、`huntSpawns`（`genEntities` 最後）、`ZODIAC`（圖 `SPR.z_*`、配色 `ZBASE`）、`drawZodiacs`、`HSUM`、`makeBeast`、`makeZodiac`、`huntWin`（`winBattle`）、`huntHTML`（`hunt` 面板）、`zodEntHTML`（`openEnt`）；狀態 `S.hunt`、`S.summons`（id 以 `z` 開頭） |
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

### js/items.js（803 行）

- **player & items**（3）
  `newGame:4`、`makeItem:73`、`baseOf:90`、`affFits:92`、`fitsSlot:94`、`rollAffix:96`、`cnt:117`、`addRandom:118`、`toMagic:128`、`rareName:135`、`toRare:136`、`itemTitle:142`、`itemName:153`、`itemSum:154`、`itemCard:162`、`sellVal:185`、`giveItem:186`、`giveCur:194`、`rollCur:197`、`curDot:207`、`craftable:209`、`craft:220`
- **skill gems**（237）
  `newGem:238`、`gemSlots:239`、`gemOpen:240`、`gemOf:241`、`GEMK:242`、`gemSkill:244`、`mySkills:266`、`rollGAff:267`、`gAffVal:277`、`gAffTxt:282`、`gemCraftable:283`、`gemCraft:296`、`corrupt:314`、`gemLvBlock:334`、`gemDustBack:341`、`giveGem:342`
- **stats**（350）
  `curSpec:352`、`STAT0:353`、`sumStats:426`、`HP_LV:447`、`stats:450`、`xpNeed:544`、`fullHeal:545`、`clampHP:550`、`autoPot:556`、`naturalRegen:578`、`addLog:586`、`gainXP:590`、`LV_MAX:603`、`treePts:604`、`dayPhase:605`、`buffOn:611`
- **enemies**（613）
  `pickMon:614`、`makeEnemy:625`、`rollMods:672`、`modNames:681`、`uwApply:683`
- **modal**（702）
  `showModal:703`、`hideModal:709`、`busy:712`、`openShop:713`

### js/battle.js（1418 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:241`、`enemyTop:246`、`placeBName:250`、`AIL_E:256`、`ailHTML:267`、`placeAil:275`、`battleSc:281`、`bossBar:283`、`setFloor:293`、`PORT:298`、`portrait:299`、`renderOrder:305`、`bmsg:314`、`pop:321`、`anim:324`、`animOff:327`、`later:341`、`startBattle:346`、`renderBHud:378`、`mitigate:441`、`skCost:450`、`canPay:451`、`payCost:452`、`costTxt:457`、`skSt:459`、`skByKey:472`、`extraHit:473`、`heroPacket:474`、`heroDmg:489`、`heroAil:499`、`poisonTick:526`、`takeDmg:528`、`playerHit:534`、`useSkill:571`、`bItem:638`、`flee:662`、`enemyDead:677`、`afterPlayer:682`、`enemyTurn:686`、`endEnemyTurn:782`
- **dungeons (shared by solo and party)**（801）
  `dunSpec:803`、`dunName:833`、`BIGBOSS:834`、`dunEnemy:836`、`dropLoot:910`、`gemLoot:985`、`ONSITE_BONUS:1008`、`onsiteNow:1009`、`dunReward:1011`、`dunModsHTML:1035`、`winBattle:1040`、`loseBattle:1120`、`endBattle:1149`、`enterDungeon:1158`、`nextRoom:1176`、`dungeonClear:1199`
- **battle: drawing**（1224）
  `renderBattle:1225`、`drawFx:1338`

### js/map.js（1657 行）

- **world coordinates: meters from 台中車站 (x 東, y 南)**（3）
  `O:4`、`KX:5`、`toM:7`、`toLL:8`、`TOWNS:10`
- **OpenStreetMap vector tiles**（63）
  `TZ:66`、`lng2tx:70`、`tx2lng:75`、`m2t:77`、`tileRect:81`、`CHUNKS:86`、`chunkVer:87`、`chunkQ:90`、`ckey:91`、`IDB:92`、`decodeMVT:130`、`ROADS:267`、`compactTile:269`、`genChunk:302`、`buildChunk:335`、`setChunk:370`、`tileURL:379`、`tileTemplate:380`、`WANT:394`、`fetchChunk:395`、`pumpChunks:425`、`ensureChunks:436`、`chunkAt:456`、`mapLoading:460`、`tilesIn:465`、`snapRoad:476`
- **extra sprites for the game map**（506）
  `HOUSEPALS:566`、`TPAL:571`、`townLayout:577`
- **extra sprites**（608）
- **fog of war (chunked)**（675）
  `CH:677`、`fogCount:682`、`fogReset:683`、`fogChunk:687`、`reveal:701`、`revealed:730`、`explKm2:738`、`MILES:739`、`trailStep:740`
- **spawns**（761）
  `spawnAt:762`、`MCELL:763`、`evEp:767`、`nearTown:768`、`dungeonAt:772`、`NOT_TEMPLE:793`、`genEntities:794`、`refreshEntities:966`、`VIS:983`、`MOBILE:984`、`LANDMARK:986`、`LM_VIS:998`、`FAR:1000`、`visible:1002`、`isDone:1011`、`townLv:1021`
- **world rendering**（1023）
  `wv:1024`、`VW:1026`、`cam:1029`、`ZMIN:1030`、`sizeWorld:1032`、`SX:1039`、`BGPAT:1041`、`bgPattern:1042`、`glow:1055`、`label:1062`、`sprScale:1081`、`viewChunks:1083`、`camLoadT:1091`、`renderWorld:1092`、`arrows:1365`
- **input**（1395）
  `ptrs:1396`、`drag:1397`、`tapOK:1431`、`endPtr:1432`、`tapWorld:1453`
- **movement**（1487）
  `lastFrame:1488`、`SIM_SPEED:1490`、`setPos:1491`、`checkArrive:1521`
- **GPS**（1549）
  `GPS:1551`、`gpsStart:1552`、`gpsStop:1589`、`tick:1596`、`timeRegen:1621`、`mmss:1630`、`plT:1634`、`placeLabel:1635`

### js/tree.js（449 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:290`、`classPicker:423`

### js/ui.js（1270 行）

- **HUD & sheets**（3）
  `renderHud:4`、`toast:23`、`openSheet:30`、`closeSheet:37`、`TITLES:42`、`NAVG:58`、`navG:76`、`navClose:77`、`navOpen:86`、`KIND:114`、`bar:123`、`entIcon:126`、`fmt1:157`、`curRow:158`、`bagTabs:162`、`curRowG:169`、`gemDesc:171`、`gemCell:178`、`dupGems:184`、`gemRow:192`、`prayed:196`、`renderSheet:197`、`nearTownE:359`
- **entity interaction**（363）
  `openEnt:364`、`FIGHTK:497`、`onSite:498`、`inRange:499`
- **bases**（501）
  `prodRate:502`、`stored:503`、`baseName:504`、`flagCheck:505`
- **actions**（513）
  `authForm:515`、`A:547`

### js/endgame.js（801 行）

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
  `obeliskCharge:317`、`watcherWin:327`、`makeFrag:333`、`WATCHERS:345`、`summonWatcher:375`
- **silk road (Supabase)**（395）
  `SILK:396`、`SILK_FREE:397`、`silkLoad:398`、`baseSync:411`、`SILK_MSG:421`、`silkCreate:431`、`silkRemove:438`、`specialty:445`、`caravans:446`、`silkView:466`
- **sheets**（480）
  `SEL:481`、`chip:482`、`baseHTML:484`、`silkHTML:510`、`siteEnt:531`、`steleHTML:536`、`MAT_TABS:573`、`matsHTML:579`、`ENTURL:626`、`entURL:627`、`portalPick:632`
- **actions**（638）

### js/undead.js（620 行）

- **data**（3）
  `pad16u:4`、`UNDEAD:100`、`UNDEADN:177`、`ESS:179`、`ESSI:207`、`ESS_MAX:208`、`affCat:209`、`UCUR:211`、`UCURI:217`、`KING_NEED:218`
- **zones**（233）
  `UD_CELL:234`、`udEp:237`、`UDZ:238`、`undeadSpawns:240`、`udProg:290`、`udZoneAt:291`、`drawUndead:293`、`drawUndeadMark:326`
- **battle**（342）
  `undeadWin:344`、`giveEss:363`、`udBoss:369`、`commanderWin:377`、`kingWin:396`
- **undead crafting (at main base)**（409）
  `atBase:410`、`ucCost:414`、`ucBlock:415`、`maxPS:422`、`rollCat:424`、`hasEss:434`、`payEss:435`、`UC_SH:436`、`ucDone:437`、`ucReroll:441`、`ucConv:453`、`ucAdd:470`、`ucAff:481`、`undeadCraftHTML:503`、`essHTML:540`
- **actions**（548）

### js/demon.js（819 行）

- **sprites & data**（3）
  `pad16d:4`、`MMODS:76`、`mistApply:84`、`MISTMON:100`、`MIST_TIERS:144`、`ROMAN:151`、`SINS:153`、`SINI:218`、`SIN_COST:219`、`LEGENDS:222`、`LEGI:280`、`makeLegend:281`、`JAFF:291`、`JEWEL_MAX:310`、`makeJewel:311`、`giveJewel:320`、`jewelTxt:327`、`jewelCap:329`、`jewelsIn:330`、`jewelStats:335`
- **map: mist seals, active mist, sin statues**（342）
  `MS_CELL:343`、`MISTZ:345`、`demonSpawns:346`、`MQ_CELL:470`、`mistify:474`、`drawMist:488`、`mistWin:547`
- **sin lords**（565）
  `makeSinLord:566`、`makeSinKing:591`、`sinTurn:622`、`sinHit:640`、`sinBattleWin:651`、`sinReward:657`
- **sheets**（680）
  `sinHTML:681`、`sinMods:689`、`demonHTML:699`、`jewelHTML:706`、`socketCardHTML:719`
- **actions**（741）

### js/hunt.js（668 行）

- **data**（3）
  `HUNT_STEP:4`、`pad16z:11`、`ZBASE:214`、`ZODIAC:226`、`ZODI:310`、`HSUM:312`、`drawZodiacs:319`、`corruptPal:355`、`zodPal:370`
- **state**（384）
  `H:385`、`huntWalk:387`、`huntHud:400`、`nearSpot:408`、`addSummon:418`、`huntSpawns:426`、`zodActive:436`
- **enemies**（438）
  `makeBeast:439`、`ZOD_MODS:446`、`rollZodMods:448`、`makeZodiac:454`、`huntWin:477`
- **sheet**（511）
  `huntHTML:512`、`huntPaint:535`
- **actions**（542）
  `zodEntHTML:660`

### js/daily.js（233 行）

- **今日委託**（3）
  `QUESTS:5`、`QUESTI:19`、`DAILY_N:20`、`today:22`、`daily:23`、`quest:38`、`questReward:55`、`dailyHTML:69`
- **附近面板分組**（82）
  `NGROUP:83`、`ngroup:94`、`nearProg:111`、`nearCard:128`、`nearHTML:131`
- **足跡**（167）
  `FOOT_CELL:169`、`FOOTA:173`、`footKey:174`、`footN2Lv:175`、`footLv:176`、`footStep:181`、`footDens:206`、`drawFoot:209`

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

### js/main.js（187 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:30`、`migrate:40`、`start:135`
<!-- index:end -->
