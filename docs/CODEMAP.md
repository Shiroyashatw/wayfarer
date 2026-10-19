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
| 石碑／魔法陣當場挑戰 | `js/endgame.js` | `A.steleNow`、`A.circleNow`、`onsiteMods`（面板在 `ui.js` 的 `openEnt`） |
| 戰鬥畫面（背景、特效、按鈕） | `js/battle.js` | `paintBG`、`renderBHud`、`renderBattle`、`drawFx`；怪物頭上名字 `placeBName`、左上角層數 `setFloor`、異常狀態圖示 `ailHTML`／`placeAil`（`AIL_E`、`AIL_H`）、頭目血條 `bossBar`、站位 `POS`（`y` 怪物、`hy` 玩家）、底部橫列行動順序 `renderOrder`（小頭像 `portrait`；多人在 `mp.js` 的 `renderMBHud`、倒數條 `mpTurnBar`、站位 `mpPos`） |
| 冥府看門人（牛頭、馬面、黑白無常） | `js/endgame.js` | `WATCHERS`、`summonWatcher` |
| 地圖道路資料、圖磚快取 | `js/map.js` | `OpenStreetMap vector tiles` 區段 |
| 地標城鎮清單 | `js/map.js` | `TOWNS`（前 11 個 id 不能改） |
| 地圖上的怪物、寶箱、地城、廟宇生成 | `js/map.js` | `spawns` 區段、`dungeonAt` |
| 迷霧、探索面積 | `js/map.js` | `fog of war` 區段、`explKm2` |
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

### js/data.js（2289 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（22）
  `CLASSES:24`、`SKILLS:36`、`RSTAR:53`、`GEM_MAX:55`、`GEM_DRAW:56`、`dustNeed:57`、`GAFF:59`、`GAFFI:141`、`GCUR:143`、`GCURI:153`、`EL:154`、`MONS:155`、`MIMIC:1171`、`EMODS:1184`、`DTYPES:1197`、`DMODS:1281`、`DMODI:1294`、`UMODS:1296`、`EMODI:1303`、`FRAG_PARTS:1305`、`ZONE_CELL:1307`、`ZMODS:1309`、`RCOL:1319`、`RGLOW:1321`、`RAREA:1322`、`SLOTS:1324`、`SLOTN:1325`、`BASES:1338`、`DROPS:1387`、`T5:1388`、`ARMOR:1395`、`AFF:1397`、`AFFI:1551`、`STATN:1552`、`sg:1576`、`CUR:1622`、`CURI:1630`、`TH:1633`、`SPOKES:1925`、`TREE:2032`、`VER:2287`、`START:2288`

### js/sprites.js（952 行）

- **pixel sprites (original art)**（3）
  `SPR:4`、`ICONS:560`、`ICOPAL:582`、`PAL:583`、`FIXED:591`、`sprite:593`、`spriteCanvas:630`、`drawSpr:642`、`ICC:653`、`iconURL:654`、`paintIcon:664`、`wepKind:677`、`wepType:682`、`offType:686`、`GEARC:687`、`gearC:698`、`heroPal:699`
- **icons: currency, item slots, passive nodes**（713）
  `PIX:714`、`PIXC:898`、`pixURL:899`、`curIcon:933`、`slotIcon:934`、`ICIMG:944`、`nodeIcon:945`

### js/audio.js（221 行）

- **audio**（3）
  `AU:4`、`audioInit:5`、`tone:30`、`noise:47`、`NS:65`、`nf:66`、`SONGS:71`、`PARSED:109`、`parse:110`、`playSong:122`、`schedule:128`、`SFX:147`、`sfx:213`、`buzz:216`

### js/items.js（768 行）

- **player & items**（3）
  `newGame:4`、`makeItem:63`、`baseOf:80`、`affFits:82`、`fitsSlot:84`、`rollAffix:85`、`cnt:106`、`addRandom:107`、`toMagic:117`、`rareName:124`、`toRare:125`、`itemTitle:131`、`itemName:141`、`itemSum:142`、`itemCard:150`、`sellVal:169`、`giveItem:170`、`giveCur:178`、`rollCur:181`、`curDot:191`、`craftable:193`、`craft:204`
- **skill gems**（221）
  `newGem:222`、`gemSlots:223`、`gemOpen:224`、`gemOf:225`、`GEMK:226`、`gemSkill:228`、`mySkills:250`、`rollGAff:251`、`gAffVal:261`、`gAffTxt:266`、`gemCraftable:267`、`gemCraft:280`、`corrupt:298`、`gemLvBlock:318`、`gemDustBack:325`、`giveGem:326`
- **stats**（334）
  `curSpec:336`、`STAT0:337`、`sumStats:404`、`HP_LV:423`、`stats:426`、`xpNeed:514`、`fullHeal:515`、`clampHP:520`、`autoPot:526`、`naturalRegen:547`、`addLog:555`、`gainXP:559`、`treePts:570`、`dayPhase:571`、`buffOn:577`
- **enemies**（579）
  `pickMon:580`、`makeEnemy:591`、`rollMods:638`、`modNames:647`、`uwApply:649`
- **modal**（667）
  `showModal:668`、`hideModal:674`、`busy:677`、`openShop:678`

### js/battle.js（1377 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:241`、`enemyTop:246`、`placeBName:250`、`AIL_E:256`、`ailHTML:267`、`placeAil:275`、`battleSc:281`、`bossBar:283`、`setFloor:293`、`PORT:298`、`portrait:299`、`renderOrder:305`、`bmsg:314`、`pop:321`、`anim:324`、`animOff:327`、`later:341`、`startBattle:346`、`renderBHud:378`、`mitigate:441`、`skCost:450`、`canPay:451`、`payCost:452`、`costTxt:457`、`skSt:459`、`skByKey:472`、`extraHit:473`、`heroPacket:474`、`heroDmg:489`、`heroAil:497`、`poisonTick:520`、`takeDmg:522`、`playerHit:528`、`useSkill:563`、`bItem:630`、`flee:653`、`enemyDead:668`、`afterPlayer:673`、`enemyTurn:677`、`endEnemyTurn:772`
- **dungeons (shared by solo and party)**（791）
  `dunSpec:793`、`dunName:819`、`BIGBOSS:820`、`dunEnemy:822`、`dropLoot:886`、`gemLoot:956`、`ONSITE_BONUS:979`、`onsiteNow:980`、`dunReward:982`、`dunModsHTML:1005`、`winBattle:1010`、`loseBattle:1080`、`endBattle:1109`、`enterDungeon:1118`、`nextRoom:1136`、`dungeonClear:1159`
- **battle: drawing**（1183）
  `renderBattle:1184`、`drawFx:1297`

### js/map.js（1612 行）

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
  `spawnAt:761`、`MCELL:762`、`evEp:766`、`nearTown:767`、`dungeonAt:771`、`NOT_TEMPLE:792`、`genEntities:793`、`refreshEntities:961`、`VIS:977`、`MOBILE:978`、`visible:979`、`isDone:985`、`townLv:992`
- **world rendering**（994）
  `wv:995`、`VW:997`、`cam:1000`、`ZMIN:1001`、`sizeWorld:1003`、`SX:1010`、`BGPAT:1012`、`bgPattern:1013`、`glow:1026`、`label:1033`、`sprScale:1052`、`viewChunks:1054`、`camLoadT:1062`、`renderWorld:1063`、`arrows:1329`
- **input**（1359）
  `ptrs:1360`、`drag:1361`、`tapOK:1395`、`endPtr:1396`、`tapWorld:1417`
- **movement**（1451）
  `lastFrame:1452`、`SIM_SPEED:1454`、`setPos:1455`、`checkArrive:1483`
- **GPS**（1511）
  `GPS:1513`、`gpsStart:1514`、`gpsStop:1551`、`tick:1558`、`timeRegen:1583`、`mmss:1592`、`plT:1596`、`placeLabel:1597`

### js/tree.js（437 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:278`、`classPicker:411`

### js/ui.js（1223 行）

- **HUD & sheets**（3）
  `renderHud:4`、`toast:23`、`openSheet:30`、`closeSheet:37`、`TITLES:42`、`NAVG:58`、`navG:76`、`navClose:77`、`navOpen:86`、`KIND:114`、`bar:123`、`entIcon:126`、`fmt1:154`、`curRow:155`、`curRowG:158`、`gemDesc:160`、`gemCell:167`、`dupGems:173`、`gemRow:181`、`prayed:185`、`renderSheet:186`、`nearTownE:347`
- **entity interaction**（351）
  `openEnt:352`、`FIGHTK:460`、`onSite:461`、`inRange:462`
- **bases**（464）
  `prodRate:465`、`stored:466`、`baseName:467`、`flagCheck:468`
- **actions**（476）
  `authForm:478`、`A:510`

### js/endgame.js（695 行）

- **map objects**（3）
  `pad16:4`、`ep2:74`
- **zones: base radius, flags, silk-road view**（76）
  `BASE_R:77`、`baseR:78`、`mainBase:79`、`flagR:80`、`flagMs:84`、`FLAG_MAX:85`、`flagsOn:87`、`zones:89`、`zonesKey:101`、`zoneOf:105`、`inZone:106`、`drawZones:107`
- **zone modifiers**（127）
  `zoneXY:128`、`zoneAt:134`
- **spawns**（136）
  `STCELL:137`、`endgameSpawns:142`
- **scrolls, inscriptions, tablets**（221）
  `INSC_MAX:222`、`rollInsc:226`、`makeTablet:235`、`modList:246`、`capMods:248`、`payDun:253`
- **underworld**（269）
  `obeliskCharge:270`、`watcherWin:279`、`makeFrag:285`、`WATCHERS:297`、`summonWatcher:327`
- **silk road (Supabase)**（347）
  `SILK:348`、`SILK_FREE:349`、`silkLoad:350`、`baseSync:363`、`SILK_MSG:373`、`silkCreate:383`、`silkRemove:390`、`specialty:397`、`caravans:398`、`silkView:418`
- **sheets**（432）
  `SEL:433`、`chip:434`、`baseHTML:436`、`silkHTML:462`、`steleHTML:482`、`ENTURL:504`、`entURL:505`、`portalPick:510`
- **actions**（516）
  `onsiteMods:518`、`steleNowMods:528`、`CIRCLE_NOW_FLOORS:529`

### js/gacha.js（155 行）

- **banners**（3）
  `GACHA_RATE:5`、`BANNERS:8`、`gpool:29`、`GA:30`、`gachaRoll:31`、`gachaPull:45`、`revealNext:68`
- **ui**（79）
  `gemTile:80`、`openGacha:85`、`closeGacha:93`、`renderGacha:98`

### js/tutor.js（133 行）

- **tutorial**（3）
  `TUT:5`、`tutI:75`、`tutorStart:76`、`tutorEnd:83`、`tutorShow:89`

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

### js/mp.js（1171 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:65`
- **party / lobby**（67）
  `ptSend:68`、`ptConnect:71`、`ptPill:85`、`partyCreate:94`、`partyJoin:126`、`partyLeave:152`、`ptLobby:169`、`ptGone:175`、`ptMsg:197`、`ptCodeHTML:271`、`partyHTML:273`
- **battle state (leader authoritative)**（301）
  `MBT:302`、`MBFX:304`、`pub:306`、`mpPush:314`、`mpArm:320`、`ptReady:330`、`mpStart:342`、`mpSpawn:404`、`mpRound:415`、`mpNext:426`、`mpEndRound:458`、`mpOnAct:466`、`mpResolve:472`、`mpEnemy:576`、`mpRoomClear:673`
- **battle (every client)**（705）
  `mpEnter:706`、`mpBG:728`、`mpApply:734`、`mpMy:798`、`mpRoomReward:817`、`mpClear:832`、`mpWipe:864`、`mpEnd:888`、`mpStop:905`、`mpLeave:916`
- **battle rendering**（931）
  `mpPos:933`、`renderMBHud:939`、`mpTurnT:1037`、`mpTurnBar:1038`、`renderMB:1056`

### js/main.js（158 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:25`、`migrate:34`、`start:106`
<!-- index:end -->
