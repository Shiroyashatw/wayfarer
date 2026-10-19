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
| 技能石面板（圖示格子、一鍵分解） | `js/ui.js` | `renderSheet` 的 `skills`／`gem` 分支、`gemCell`、`dupGems`、`A.gemDup`、`A.gemLv`、`A.gemCraft` |
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

### js/data.js（2021 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（22）
  `CLASSES:24`、`SKILLS:36`、`RSTAR:53`、`GEM_MAX:55`、`GEM_DRAW:56`、`dustNeed:57`、`GAFF:59`、`GAFFI:141`、`GCUR:143`、`GCURI:153`、`EL:154`、`MONS:155`、`MIMIC:903`、`EMODS:916`、`DTYPES:929`、`DMODS:1013`、`DMODI:1026`、`UMODS:1028`、`EMODI:1035`、`FRAG_PARTS:1037`、`ZONE_CELL:1039`、`ZMODS:1041`、`RCOL:1051`、`RGLOW:1053`、`RAREA:1054`、`SLOTS:1056`、`SLOTN:1057`、`BASES:1070`、`DROPS:1119`、`T5:1120`、`ARMOR:1127`、`AFF:1129`、`AFFI:1283`、`STATN:1284`、`sg:1308`、`CUR:1354`、`CURI:1362`、`TH:1365`、`SPOKES:1657`、`TREE:1764`、`VER:2019`、`START:2020`

### js/sprites.js（749 行）

- **pixel sprites (original art)**（3）
  `SPR:4`、`ICONS:357`、`ICOPAL:379`、`PAL:380`、`FIXED:388`、`sprite:390`、`spriteCanvas:427`、`drawSpr:439`、`ICC:450`、`iconURL:451`、`paintIcon:461`、`wepKind:474`、`wepType:479`、`offType:483`、`GEARC:484`、`gearC:495`、`heroPal:496`
- **icons: currency, item slots, passive nodes**（510）
  `PIX:511`、`PIXC:695`、`pixURL:696`、`curIcon:730`、`slotIcon:731`、`ICIMG:741`、`nodeIcon:742`

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

### js/battle.js（1276 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:240`、`bmsg:241`、`pop:248`、`anim:251`、`animOff:254`、`later:268`、`startBattle:273`、`renderBHud:305`、`mitigate:359`、`skCost:368`、`canPay:369`、`payCost:370`、`costTxt:375`、`skSt:377`、`skByKey:390`、`extraHit:391`、`heroPacket:392`、`heroDmg:407`、`heroAil:415`、`poisonTick:438`、`takeDmg:440`、`playerHit:446`、`useSkill:481`、`bItem:548`、`flee:571`、`enemyDead:586`、`afterPlayer:591`、`enemyTurn:595`、`endEnemyTurn:688`
- **dungeons (shared by solo and party)**（706）
  `dunSpec:708`、`dunName:734`、`BIGBOSS:735`、`dunEnemy:737`、`dropLoot:801`、`gemLoot:869`、`dunReward:885`、`dunModsHTML:908`、`winBattle:913`、`loseBattle:982`、`endBattle:1011`、`enterDungeon:1018`、`nextRoom:1035`、`dungeonClear:1058`
- **battle: drawing**（1082）
  `renderBattle:1083`、`drawFx:1196`

### js/map.js（1599 行）

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
  `spawnAt:761`、`MCELL:762`、`evEp:766`、`nearTown:767`、`dungeonAt:771`、`NOT_TEMPLE:792`、`genEntities:793`、`refreshEntities:948`、`VIS:964`、`MOBILE:965`、`visible:966`、`isDone:972`、`townLv:979`
- **world rendering**（981）
  `wv:982`、`VW:984`、`cam:987`、`ZMIN:988`、`sizeWorld:990`、`SX:997`、`BGPAT:999`、`bgPattern:1000`、`glow:1013`、`label:1020`、`sprScale:1039`、`viewChunks:1041`、`camLoadT:1049`、`renderWorld:1050`、`arrows:1316`
- **input**（1346）
  `ptrs:1347`、`drag:1348`、`tapOK:1382`、`endPtr:1383`、`tapWorld:1404`
- **movement**（1438）
  `lastFrame:1439`、`SIM_SPEED:1441`、`setPos:1442`、`checkArrive:1470`
- **GPS**（1498）
  `GPS:1500`、`gpsStart:1501`、`gpsStop:1538`、`tick:1545`、`timeRegen:1570`、`mmss:1579`、`plT:1583`、`placeLabel:1584`

### js/tree.js（437 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:278`、`classPicker:411`

### js/ui.js（1215 行）

- **HUD & sheets**（3）
  `renderHud:4`、`toast:19`、`openSheet:26`、`closeSheet:33`、`TITLES:38`、`NAVG:54`、`navG:72`、`navClose:73`、`navOpen:82`、`KIND:110`、`bar:119`、`entIcon:122`、`fmt1:168`、`curRow:169`、`curRowG:172`、`gemDesc:174`、`gemCell:181`、`dupGems:187`、`gemRow:195`、`prayed:199`、`renderSheet:200`、`nearTownE:361`
- **entity interaction**（365）
  `openEnt:366`、`inRange:450`
- **bases**（452）
  `prodRate:453`、`stored:454`、`baseName:455`、`flagCheck:456`
- **actions**（464）
  `authForm:466`、`A:498`

### js/endgame.js（611 行）

- **map objects**（3）
  `pad16:4`、`ep2:72`
- **zones: base radius, flags, silk-road view**（74）
  `BASE_R:75`、`baseR:76`、`mainBase:77`、`flagR:78`、`flagMs:82`、`FLAG_MAX:83`、`flagsOn:85`、`zones:87`、`zonesKey:99`、`zoneOf:103`、`inZone:104`、`drawZones:105`
- **zone modifiers**（125）
  `zoneXY:126`、`zoneAt:132`
- **spawns**（134）
  `STCELL:135`、`endgameSpawns:140`
- **scrolls, inscriptions, tablets**（219）
  `INSC_MAX:220`、`rollInsc:224`、`makeTablet:233`、`modList:244`、`capMods:246`、`payDun:251`
- **underworld**（265）
  `obeliskCharge:266`、`watcherWin:275`、`makeFrag:281`、`summonWatcher:292`
- **silk road (Supabase)**（311）
  `SILK:312`、`SILK_FREE:313`、`silkLoad:314`、`baseSync:327`、`SILK_MSG:337`、`silkCreate:347`、`silkRemove:354`、`specialty:361`、`caravans:362`、`silkView:382`
- **sheets**（396）
  `SEL:397`、`chip:398`、`baseHTML:400`、`silkHTML:426`、`steleHTML:446`、`ENTURL:468`、`entURL:469`、`portalPick:474`
- **actions**（480）

### js/gacha.js（155 行）

- **banners**（3）
  `GACHA_RATE:5`、`BANNERS:8`、`gpool:29`、`GA:30`、`gachaRoll:31`、`gachaPull:45`、`revealNext:68`
- **ui**（79）
  `gemTile:80`、`openGacha:85`、`closeGacha:93`、`renderGacha:98`

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

### js/mp.js（1117 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:65`
- **party / lobby**（67）
  `ptSend:68`、`ptConnect:71`、`ptPill:85`、`partyCreate:94`、`partyJoin:124`、`partyLeave:150`、`ptLobby:167`、`ptGone:173`、`ptMsg:195`、`ptCodeHTML:269`、`partyHTML:271`
- **battle state (leader authoritative)**（299）
  `MBT:300`、`MBFX:302`、`pub:304`、`mpPush:312`、`mpArm:318`、`ptReady:328`、`mpStart:340`、`mpSpawn:400`、`mpRound:411`、`mpNext:422`、`mpEndRound:454`、`mpOnAct:462`、`mpResolve:468`、`mpEnemy:572`、`mpRoomClear:669`
- **battle (every client)**（701）
  `mpEnter:702`、`mpBG:724`、`mpApply:730`、`mpMy:794`、`mpRoomReward:813`、`mpClear:828`、`mpWipe:853`、`mpEnd:877`、`mpStop:894`、`mpLeave:905`
- **battle rendering**（920）
  `mpPos:922`、`renderMBHud:928`、`mpTurnT:978`、`mpTurnBar:979`、`renderMB:1002`

### js/main.js（153 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:25`、`migrate:34`、`start:106`
<!-- index:end -->
