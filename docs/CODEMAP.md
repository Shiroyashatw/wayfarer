# 程式碼地圖

給開發者（和 Claude）快速定位用：要改某個功能時，先看這份找到檔案和函式，再用行號只讀那一段，不用整個檔案讀一遍。

- 下方「頂層宣告索引」是 `python3 tools/codemap.py` 自動產生的，**改完 JS 後重跑一次**，行號才會對。
- JS 用 prettier 排版（設定在 `.prettierrc`，寬度 120）：`npx prettier@3.3.3 --write js/*.js`。
- 所有 JS 是一般 `<script>`，依 `index.html` 的順序載入、共用全域變數；`main.js` 必須最後。

## 要改什麼，看哪裡

| 想改的功能 | 檔案 | 從這裡開始看 |
| --- | --- | --- |
| 版本號 | `js/data.js` | `VER`（同時更新 CHANGELOG、README、企劃書） |
| 天賦盤起點（之魂）、技能 | `js/data.js` | `CLASSES`（起點名稱、主色、開局技能石）、`SKILLS` |
| 技能石：等級、刻印詞綴、刻印石 | `js/data.js`、`js/items.js` | `GEM_MAX`、`dustNeed`、`GAFF`、`GCUR`；`gemSkill`（技能石→戰鬥技能）、`mySkills`、`gemCraft`、`gemLvBlock` |
| 技能石面板、靈魂祭壇 | `js/ui.js` | `renderSheet` 的 `skills`／`gem` 分支、`A.altar`、`A.gemLv`、`A.gemCraft` |
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
| 掉寶、地城獎勵 | `js/battle.js` | `dropLoot`、`dunReward` |
| 戰鬥畫面（背景、特效、按鈕） | `js/battle.js` | `paintBG`、`renderBHud`、`renderBattle`、`drawFx` |
| 地圖道路資料、圖磚快取 | `js/map.js` | `OpenStreetMap vector tiles` 區段 |
| 地標城鎮清單 | `js/map.js` | `TOWNS`（前 11 個 id 不能改） |
| 地圖上的怪物、寶箱、地城、廟宇生成 | `js/map.js` | `spawns` 區段、`dungeonAt` |
| 迷霧、探索面積 | `js/map.js` | `fog of war` 區段、`explKm2` |
| 地圖繪製、右上角資訊 | `js/map.js` | `renderWorld`、`placeLabel` |
| 點地圖、走路、GPS | `js/map.js` | `input`、`movement`、`GPS` 區段 |
| 主畫面 HUD、底部導覽 | `js/ui.js` | `renderHud`、`NAVG`、`navOpen`；DOM 在 `index.html` 的 `#nav` |
| 各個面板（角色、背包、據點、設定…） | `js/ui.js` | `renderSheet` 的 `sheetName` 分支（見下表） |
| 點地圖物件後的互動（怪物、城鎮、地城） | `js/ui.js` | `entity interaction` 區段 |
| 據點與遠征 | `js/ui.js` | `bases` 區段 |
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
| `TV` | `tree.js` | 天賦樹畫面的縮放與位置 |

## 頂層宣告索引（自動產生）

格式：`名稱:行號`。粗體是檔案裡的區段註解（`/* ===== 區段 ===== */`）。

<!-- index:start -->

### js/core.js（66 行）

  `$:3`
- **utils**（6）
  `h:7`、`rng:13`、`rnd:22`、`now:23`、`REFRESH:25`、`epoch:27`、`uid:29`、`esc:30`、`hex2rgb:31`、`shade:41`、`dist:51`、`fmtD:60`、`dirName:61`、`RANGE:65`

### js/data.js（1746 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（22）
  `CLASSES:24`、`SKILLS:35`、`GEM_MAX:47`、`GEM_DRAW:48`、`dustNeed:49`、`GAFF:51`、`GAFFI:133`、`GCUR:135`、`GCURI:144`、`EL:145`、`MONS:146`、`MIMIC:894`、`EMODS:907`、`DTYPES:920`、`DMODS:962`、`DMODI:975`、`RCOL:976`、`RGLOW:978`、`RAREA:979`、`SLOTS:981`、`SLOTN:982`、`BASES:995`、`DROPS:1044`、`T5:1045`、`ARMOR:1052`、`AFF:1054`、`AFFI:1208`、`STATN:1209`、`sg:1233`、`CUR:1263`、`CURI:1271`、`TH:1274`、`SPOKES:1481`、`TREE:1588`、`VER:1744`、`START:1745`

### js/sprites.js（713 行）

- **pixel sprites (original art)**（3）
  `SPR:4`、`ICONS:357`、`ICOPAL:377`、`PAL:378`、`FIXED:386`、`sprite:388`、`spriteCanvas:425`、`drawSpr:437`、`ICC:448`、`iconURL:449`、`paintIcon:459`、`wepKind:472`、`GEARC:476`、`gearC:487`、`heroPal:488`
- **icons: currency, item slots, passive nodes**（502）
  `PIX:503`、`PIXC:659`、`pixURL:660`、`curIcon:694`、`slotIcon:695`、`ICIMG:705`、`nodeIcon:706`

### js/audio.js（217 行）

- **audio**（3）
  `AU:4`、`audioInit:5`、`tone:30`、`noise:47`、`NS:65`、`nf:66`、`SONGS:71`、`PARSED:109`、`parse:110`、`playSong:122`、`schedule:128`、`SFX:147`、`sfx:209`、`buzz:212`

### js/items.js（670 行）

- **player & items**（3）
  `newGame:4`、`makeItem:56`、`baseOf:73`、`affFits:75`、`fitsSlot:77`、`rollAffix:78`、`cnt:99`、`addRandom:100`、`toMagic:110`、`rareName:117`、`toRare:118`、`itemTitle:124`、`itemName:134`、`itemSum:135`、`itemCard:143`、`sellVal:162`、`giveItem:163`、`giveCur:171`、`rollCur:174`、`curDot:184`、`craftable:186`、`craft:197`
- **skill gems**（214）
  `newGem:215`、`gemSlots:216`、`gemOpen:217`、`gemOf:218`、`GEMK:219`、`gemSkill:221`、`mySkills:237`、`rollGAff:238`、`gAffVal:248`、`gAffTxt:253`、`gemCraftable:254`、`gemCraft:264`、`gemLvBlock:281`、`gemDustBack:288`、`giveGem:289`
- **stats**（297）
  `curSpec:299`、`STAT0:300`、`sumStats:351`、`HP_LV:370`、`stats:373`、`xpNeed:436`、`fullHeal:437`、`clampHP:442`、`autoPot:448`、`naturalRegen:469`、`addLog:477`、`gainXP:481`、`treePts:492`、`dayPhase:493`、`buffOn:499`
- **enemies**（501）
  `pickMon:502`、`makeEnemy:513`、`rollMods:558`、`modNames:567`
- **modal**（569）
  `showModal:570`、`hideModal:576`、`busy:579`、`openShop:580`

### js/battle.js（1226 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:240`、`bmsg:241`、`pop:248`、`anim:251`、`animOff:254`、`later:268`、`startBattle:273`、`renderBHud:305`、`mitigate:359`、`skCost:368`、`canPay:369`、`payCost:370`、`costTxt:375`、`skSt:377`、`skByKey:389`、`extraHit:390`、`heroPacket:391`、`heroDmg:404`、`heroAil:412`、`poisonTick:435`、`takeDmg:437`、`playerHit:443`、`useSkill:478`、`bItem:545`、`flee:568`、`enemyDead:583`、`afterPlayer:588`、`enemyTurn:592`、`endEnemyTurn:684`
- **dungeons (shared by solo and party)**（702）
  `dunSpec:704`、`dunName:729`、`dunEnemy:731`、`dropLoot:790`、`gemLoot:840`、`dunReward:855`、`dunModsHTML:877`、`winBattle:882`、`loseBattle:948`、`endBattle:977`、`enterDungeon:984`、`nextRoom:1001`、`dungeonClear:1024`
- **battle: drawing**（1048）
  `renderBattle:1049`、`drawFx:1162`

### js/map.js（1573 行）

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
  `spawnAt:761`、`MCELL:762`、`evEp:766`、`nearTown:767`、`dungeonAt:771`、`NOT_TEMPLE:792`、`genEntities:793`、`refreshEntities:934`、`VIS:947`、`MOBILE:948`、`visible:949`、`isDone:955`、`townLv:958`
- **world rendering**（960）
  `wv:961`、`VW:963`、`cam:966`、`ZMIN:967`、`sizeWorld:969`、`SX:976`、`BGPAT:978`、`bgPattern:979`、`glow:992`、`label:999`、`sprScale:1018`、`viewChunks:1020`、`camLoadT:1028`、`renderWorld:1029`、`arrows:1292`
- **input**（1322）
  `ptrs:1323`、`drag:1324`、`tapOK:1358`、`endPtr:1359`、`tapWorld:1380`
- **movement**（1414）
  `lastFrame:1415`、`SIM_SPEED:1417`、`setPos:1418`、`checkArrive:1446`
- **GPS**（1474）
  `GPS:1476`、`gpsStart:1477`、`gpsStop:1514`、`tick:1521`、`timeRegen:1546`、`mmss:1555`、`plT:1559`、`placeLabel:1560`

### js/tree.js（437 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:278`、`classPicker:411`

### js/ui.js（1241 行）

- **HUD & sheets**（3）
  `renderHud:4`、`toast:18`、`openSheet:25`、`closeSheet:32`、`TITLES:37`、`NAVG:52`、`navG:69`、`navClose:70`、`navOpen:79`、`KIND:107`、`bar:116`、`entIcon:119`、`fmt1:147`、`curRow:148`、`curRowG:151`、`gemDesc:153`、`gemRow:159`、`prayed:163`、`nearBase:164`、`renderSheet:165`、`nearTownE:339`
- **entity interaction**（343）
  `openEnt:344`、`inRange:427`
- **bases**（429）
  `P30:430`、`prodRate:431`、`stored:432`、`charges:433`、`baseName:447`、`baseTarget:449`、`branchCheck:467`
- **actions**（477）
  `authForm:479`、`A:511`

### js/cloud.js（161 行）

- **cloud save (Supabase)**（4）
  `SB_URL:5`、`CLOUD:8`、`playerTag:19`、`cloudUser:21`、`cloudFetch:32`、`cloudInit:37`、`cloudPush:77`
- **accounts**（104）
  `AUTH_ERR:105`、`authMsg:110`、`authRegister:112`、`authLogin:133`、`authLogout:154`

### js/social.js（178 行）

- **profile & friends**（3）
  `SOC:4`、`isOnline:5`、`profileSync:7`、`friendsLoad:18`、`FR_MSG:30`、`friendAdd:39`、`friendRespond:45`、`friendRemove:49`、`socialOnUser:54`
- **party invites**（64）
  `INVQ:66`、`invitesListen:67`、`invitesStop:84`、`dropInvite:88`、`queueInvite:94`、`nextInvite:105`、`inviteFriend:134`
- **friends sheet**（145）
  `friendsHTML:146`

### js/mp.js（1069 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:60`
- **party / lobby**（62）
  `ptSend:63`、`ptConnect:66`、`ptPill:80`、`partyCreate:89`、`partyJoin:108`、`partyLeave:134`、`ptLobby:151`、`ptGone:157`、`ptMsg:179`、`ptCodeHTML:253`、`partyHTML:255`
- **battle state (leader authoritative)**（283）
  `MBT:284`、`MBFX:286`、`pub:288`、`mpPush:296`、`mpArm:302`、`ptReady:312`、`mpStart:324`、`mpSpawn:367`、`mpRound:378`、`mpNext:389`、`mpEndRound:421`、`mpOnAct:429`、`mpResolve:435`、`mpEnemy:530`、`mpRoomClear:621`
- **battle (every client)**（653）
  `mpEnter:654`、`mpBG:676`、`mpApply:682`、`mpMy:746`、`mpRoomReward:765`、`mpClear:780`、`mpWipe:805`、`mpEnd:829`、`mpStop:846`、`mpLeave:857`
- **battle rendering**（872）
  `mpPos:874`、`renderMBHud:880`、`mpTurnT:930`、`mpTurnBar:931`、`renderMB:954`

### js/main.js（127 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:24`、`migrate:33`、`start:80`
<!-- index:end -->
