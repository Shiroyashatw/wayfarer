# 程式碼地圖

給開發者（和 Claude）快速定位用：要改某個功能時，先看這份找到檔案和函式，再用行號只讀那一段，不用整個檔案讀一遍。

- 下方「頂層宣告索引」是 `python3 tools/codemap.py` 自動產生的，**改完 JS 後重跑一次**，行號才會對。
- JS 用 prettier 排版（設定在 `.prettierrc`，寬度 120）：`npx prettier@3.3.3 --write js/*.js`。
- 所有 JS 是一般 `<script>`，依 `index.html` 的順序載入、共用全域變數；`main.js` 必須最後。

## 要改什麼，看哪裡

| 想改的功能 | 檔案 | 從這裡開始看 |
| --- | --- | --- |
| 版本號 | `js/data.js` | `VER`（同時更新 CHANGELOG、README、企劃書） |
| 職業、技能 | `js/data.js` | `CLASSES`、`SKILLS` |
| 怪物種類與數值 | `js/data.js` | `MONS`、`MIMIC`、`EMODS`（菁英詞綴） |
| 地城種類與地城詞綴 | `js/data.js` | `DTYPES`、`DMODS`；規格換算在 `js/battle.js` 的 `dunSpec` |
| 裝備底材、詞綴、通貨 | `js/data.js` | `BASES`、`AFF`、`CUR`、`STATN`（屬性的顯示文字） |
| 天賦樹節點與基石 | `js/data.js` | `TH`（主題與重要節點）、`SPOKES`（15 條路線與基石）、`TREE`（產生節點座標與連線） |
| 天賦樹介面（縮放、點亮、退點、總覽） | `js/tree.js` | `drawTree`、`renderTreeCard`、`pathTo`、`canRefund` |
| 屬性計算（傷害、護甲、抗性、基石效果） | `js/items.js` | `sumStats`、`stats`（新屬性要加進 `STAT0`） |
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

### js/core.js（64 行）

  `$:3`
- **utils**（6）
  `h:7`、`rng:13`、`rnd:22`、`now:23`、`REFRESH:25`、`epoch:26`、`uid:27`、`esc:28`、`hex2rgb:29`、`shade:39`、`dist:49`、`fmtD:58`、`dirName:59`、`RANGE:63`

### js/data.js（1668 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（21）
  `CLASSES:22`、`SKILLS:56`、`EL:67`、`MONS:68`、`MIMIC:816`、`EMODS:829`、`DTYPES:842`、`DMODS:884`、`DMODI:897`、`RCOL:898`、`RGLOW:900`、`RAREA:901`、`SLOTS:903`、`SLOTN:904`、`BASES:917`、`DROPS:966`、`T5:967`、`ARMOR:974`、`AFF:976`、`AFFI:1130`、`STATN:1131`、`sg:1155`、`CUR:1185`、`CURI:1193`、`TH:1196`、`SPOKES:1403`、`TREE:1510`、`VER:1666`、`START:1667`

### js/sprites.js（665 行）

- **pixel sprites (original art)**（3）
  `SPR:4`、`ICONS:357`、`ICOPAL:377`、`PAL:378`、`FIXED:386`、`sprite:388`、`spriteCanvas:425`、`drawSpr:437`、`ICC:448`、`iconURL:449`、`paintIcon:459`、`heroPal:471`
- **icons: currency, item slots, passive nodes**（482）
  `PIX:483`、`PIXC:611`、`pixURL:612`、`curIcon:646`、`slotIcon:647`、`ICIMG:657`、`nodeIcon:658`

### js/audio.js（217 行）

- **audio**（3）
  `AU:4`、`audioInit:5`、`tone:30`、`noise:47`、`NS:65`、`nf:66`、`SONGS:71`、`PARSED:109`、`parse:110`、`playSong:122`、`schedule:128`、`SFX:147`、`sfx:209`、`buzz:212`

### js/items.js（592 行）

- **player & items**（3）
  `newGame:4`、`makeItem:52`、`baseOf:69`、`affFits:71`、`fitsSlot:73`、`rollAffix:74`、`cnt:95`、`addRandom:96`、`toMagic:106`、`rareName:113`、`toRare:114`、`itemTitle:120`、`itemName:130`、`itemSum:131`、`itemCard:139`、`sellVal:158`、`giveItem:159`、`giveCur:167`、`rollCur:170`、`curDot:180`、`craftable:182`、`craft:193`
- **stats**（210）
  `curSpec:212`、`STAT0:213`、`sumStats:264`、`stats:283`、`xpNeed:347`、`fullHeal:348`、`clampHP:353`、`addLog:358`、`gainXP:362`、`treePts:374`、`dayPhase:375`、`buffOn:381`
- **enemies**（383）
  `pickMon:384`、`makeEnemy:395`、`rollMods:440`、`modNames:449`
- **modal**（451）
  `showModal:452`、`hideModal:458`、`busy:461`、`classModal:462`、`openShop:502`

### js/battle.js（1214 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:240`、`bmsg:241`、`pop:248`、`anim:251`、`animOff:254`、`later:268`、`startBattle:273`、`renderBHud:305`、`mitigate:364`、`skCost:373`、`canPay:374`、`payCost:375`、`costTxt:380`、`extraHit:381`、`heroPacket:382`、`heroDmg:395`、`heroAil:403`、`poisonTick:426`、`takeDmg:428`、`playerHit:434`、`useSkill:469`、`bItem:536`、`flee:558`、`enemyDead:573`、`afterPlayer:578`、`enemyTurn:582`、`endEnemyTurn:674`
- **dungeons (shared by solo and party)**（692）
  `dunSpec:694`、`dunName:719`、`dunEnemy:721`、`dropLoot:780`、`dunReward:829`、`dunModsHTML:851`、`winBattle:856`、`loseBattle:936`、`endBattle:965`、`enterDungeon:972`、`nextRoom:989`、`dungeonClear:1012`
- **battle: drawing**（1036）
  `renderBattle:1037`、`drawFx:1150`

### js/map.js（1559 行）

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
  `spawnAt:761`、`MCELL:762`、`evEp:766`、`nearTown:767`、`dungeonAt:771`、`NOT_TEMPLE:792`、`genEntities:793`、`refreshEntities:933`、`VIS:946`、`MOBILE:947`、`visible:948`、`isDone:954`、`townLv:957`
- **world rendering**（959）
  `wv:960`、`VW:962`、`cam:965`、`ZMIN:966`、`sizeWorld:968`、`SX:975`、`BGPAT:977`、`bgPattern:978`、`glow:991`、`label:998`、`sprScale:1017`、`viewChunks:1019`、`camLoadT:1027`、`renderWorld:1028`、`arrows:1291`
- **input**（1321）
  `ptrs:1322`、`drag:1323`、`tapOK:1357`、`endPtr:1358`、`tapWorld:1379`
- **movement**（1413）
  `lastFrame:1414`、`SIM_SPEED:1416`、`setPos:1417`、`checkArrive:1444`
- **GPS**（1472）
  `GPS:1474`、`gpsStart:1475`、`gpsStop:1512`、`tick:1519`、`mmss:1542`、`plT:1546`、`placeLabel:1547`

### js/tree.js（435 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:278`、`classPicker:411`

### js/ui.js（1057 行）

- **HUD & sheets**（3）
  `renderHud:4`、`toast:18`、`openSheet:25`、`closeSheet:32`、`TITLES:37`、`NAVG:50`、`navG:66`、`navClose:67`、`navOpen:76`、`KIND:103`、`bar:112`、`entIcon:115`、`fmt1:143`、`curRow:144`、`renderSheet:147`、`nearTownE:253`
- **entity interaction**（257）
  `openEnt:258`、`inRange:338`
- **bases**（340）
  `P30:341`、`prodRate:342`、`stored:343`、`charges:344`、`baseName:358`、`baseTarget:360`、`branchCheck:378`
- **actions**（388）
  `authForm:390`、`A:422`

### js/cloud.js（161 行）

- **cloud save (Supabase)**（4）
  `SB_URL:5`、`CLOUD:8`、`playerTag:19`、`cloudUser:21`、`cloudFetch:32`、`cloudInit:37`、`cloudPush:77`
- **accounts**（104）
  `AUTH_ERR:105`、`authMsg:110`、`authRegister:112`、`authLogin:133`、`authLogout:154`

### js/social.js（180 行）

- **profile & friends**（3）
  `SOC:4`、`isOnline:5`、`profileSync:7`、`friendsLoad:18`、`FR_MSG:30`、`friendAdd:39`、`friendRespond:45`、`friendRemove:49`、`socialOnUser:54`
- **party invites**（64）
  `INVQ:66`、`invitesListen:67`、`invitesStop:84`、`dropInvite:88`、`queueInvite:94`、`nextInvite:105`、`inviteFriend:134`
- **friends sheet**（147）
  `friendsHTML:148`

### js/mp.js（1068 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:57`
- **party / lobby**（68）
  `ptSend:69`、`ptConnect:72`、`ptPill:86`、`partyCreate:95`、`partyJoin:114`、`partyLeave:140`、`ptLobby:157`、`ptGone:163`、`ptMsg:185`、`ptCodeHTML:259`、`partyHTML:261`
- **battle state (leader authoritative)**（289）
  `MBT:290`、`MBFX:292`、`pub:294`、`mpPush:302`、`mpArm:308`、`ptReady:318`、`mpStart:330`、`mpSpawn:370`、`mpRound:381`、`mpNext:392`、`mpEndRound:424`、`mpOnAct:432`、`mpResolve:438`、`mpEnemy:532`、`mpRoomClear:623`
- **battle (every client)**（658）
  `mpEnter:659`、`mpBG:681`、`mpApply:687`、`mpMy:751`、`mpRoomReward:767`、`mpClear:782`、`mpWipe:806`、`mpEnd:830`、`mpStop:847`、`mpLeave:858`
- **battle rendering**（873）
  `mpPos:875`、`renderMBHud:881`、`mpTurnT:929`、`mpTurnBar:930`、`renderMB:953`

### js/main.js（114 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:22`、`migrate:31`、`start:67`
<!-- index:end -->
