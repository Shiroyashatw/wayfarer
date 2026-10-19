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
| 角色外觀（跟著裝備） | `js/gear.js` | `heroLook`（外觀代碼，多人傳 `look`）、`heroSpr(view, look)`（組出 `heroF:…`／`heroS:…` 像素圖）、`heroPal`（材質階級配色）、`GLOOK`、正面武器 `WFRONT`、副手 `OFRONT`；側面武器 `battle.js` 的 `drawWeapon`（`mc` 刃色） |
| PNG 怪物圖（0.3.1.3） | `art/monsters/`、`tools/art.py`、`js/art.js`、`js/sprites.js` | 原圖放 `art/monsters/檔名.png` → `python3 tools/art.py` → `ART`（圖名 `a_檔名`，怪物 `spr` 填這個）；載入 `artImg`、畫布 `artSprite`（`sprite` 遇到 `a_` 開頭時呼叫）、大小 `ART_U`（`drawSpr` 的 `sp.art`）、列表小圖 `paintIcon18`；提示詞與流程見 skill `.claude/skills/pixel-art` |
| 裝備圖示、材質階級（0.3.1） | `js/gear.js` | `GEAR`（每個底材一張 12×12，索引對應 `BASES`，新底材要補圖）、`MATC`／`BLADEC`／`TRIMC`／`GEMC`、`tierOf`／`TIERN`、`gearPal`、`gearIcon`（`slotIcon` 呼叫） |
| 點地圖移動速度（0.3.1.1） | `js/map.js`、`js/ui.js` | `SIM_SPEED`、`simSpeed()`（乘上 `S.simSpd`）；設定面板 `A.simSpd` |
| 背包批量賣出、上鎖（0.3.1） | `js/ui.js` | `canSell`（城鎮或據點）、`bagListHTML`、`worseThanEq`、`sellSel`、`A.sellMode`／`A.sellPick`／`A.sellQuick`／`A.sellMany`／`A.lock`、單件 `A.sell`；勾選狀態 `SEL.sell`、上鎖 `it.lock` |
| 裝備生成、詞綴、通貨製作 | `js/items.js` | `makeItem`、`rollAffix`、`craftable`、`craft` |
| 商店 | `js/items.js` | `openShop` |
| 升級曲線 | `js/items.js` | `xpNeed`、`gainXP`、`treePts` |
| 怪物生成（等級、稀有度） | `js/items.js` | `pickMon`、`makeEnemy` |
| 單人戰鬥流程 | `js/battle.js` | `startBattle`、`useSkill`、`playerHit`、`enemyTurn`、`winBattle`、`loseBattle` |
| 戰鬥規則（單人＋多人共用） | `js/battle.js` | `skCost`、`canPay`、`payCost`、`heroPacket`、`heroDmg`、`heroAil`、`takeDmg`、`mitigate` |
| 掉寶、地城獎勵 | `js/battle.js` | `dropLoot`、`dunReward`；靈魂碎片與刻印石 `gemLoot`；現場加成 `ONSITE_BONUS`、`onsiteNow`（判定現場用 `ui.js` 的 `onSite`；只有石碑、魔法陣有加成：`ONSITE_K`／`siteBonus`） |
| 亡靈區、亡靈怪、亡靈祭壇與軍團長、亡靈王 | `js/undead.js` | `undeadSpawns`（由 `endgameSpawns` 呼叫）、`UDZ`、`UNDEAD`、`drawUndead`、`undeadWin`、`commanderWin`、`kingWin`、`A.udBoss`、`A.udKing` |
| 亡靈精華與亡靈製作（屍化值） | `js/undead.js` | `ESS`（精華對應的詞綴）、`UCUR`、`ucReroll`、`ucConv`、`ucAdd`、`ucAff`、`ucBlock`、`undeadCraftHTML`（裝備詳情頁）；屍化值存在裝備的 `sh`、次數 `uc` |
| 魔霧區、魔霧詞綴與專屬怪、進度與碎片 | `js/demon.js` | `demonSpawns`（由 `endgameSpawns` 呼叫，產生 `MZ` 魔霧區）、`mistAt`、`mistProg`、`MIST_TIERS`、`MMODS`／`mistApply`、`MISTMON`、`mistify(e, q, k, Z)`、`drawSeals`（紫色圓圈與光柱）／`drawSealMark`（遠距離符號）、`mistWin`；各區進度 `S.mistp`（每輪 `_ep` 換新） |
| 七宗罪雕像、7 個王的機制、殘魂 | `js/demon.js`、`js/battle.js` | `SINS`、`makeSinLord`、`sinTurn`（`enemyTurn` 開頭）、`sinHit`（`playerHit`）、`sinReward`（`dunReward`）、`A.sinGo`；`dunEnemy` 的七宗罪段落 |
| 傳奇裝備 | `js/demon.js`、`js/items.js` | `LEGENDS`、`makeLegend`；屬性在 `sumStats`（`it.leg`），特效旗標 `legPride` 等在 `heroDmg`／`heroAil`／`useSkill`／`bItem` |
| 惡魔珠寶與天賦盤珠寶槽 | `js/demon.js`、`js/data.js`、`js/tree.js` | `JAFF`、`makeJewel`、`jewelCap`、`jewelStats`、`socketCardHTML`、`A.jIn`／`A.jOut`；槽位在 `TREE` 結尾（`type: 'socket'`），鑲嵌狀態 `S.jsock` |
| 今日委託、附近面板分組、足跡（0.2.13） | `js/daily.js` | `QUESTS`、`daily`、`quest(k, n)`（各處呼叫：`winBattle`、`dungeonClear`、`pray`、`openChest`、`gather`、`obeliskCharge`、`mistWin`、`huntWalk`、`setPos`）、`dailyHTML`、`nearHTML`／`ngroup`／`nearProg`（`near` 面板）、`footStep`（`trailStep`）、`footLv`／`footDens`／`footRare`（`genEntities` 怪物生成）、`drawFoot`；狀態 `S.daily`、`S.foot` |
| 多隻敵人戰鬥（0.3） | `js/battle.js`、`js/mp.js` | 野外群體隻數 `packN`（機率表 `PACK_P`）、同伴種類 `packBases`＋`packSeed`（位置與週期固定）、`packOf(lead, extra, n, seed)`；開打前陣容 `lineupHTML`（`ui.js`，`openEnt` 呼叫）；互動範圍 `RANGE`／`TOWN_R`／`reachOf`（core.js）；結算核心 `actResolve`（玩家行動→事件）、`enemyResolve`（敵人行動）、`petsAct`（召喚物）、`roundEnd`／`battleOpen`；單人 `startBattle`（`pack` 帶小怪 `packOf`）、`useSkill`、`playEv`（播事件）、`enemyPhase`；站位 `epos`／`ESLOT`、`drawEnemies`（選取特效 `drawSel`、換目標名字淡出 `selTrack`）、`enemyBars`、點敵人換目標 `pickTarget`；地城一層一群 `dunEnemy(D, room, extra)`；組隊 `mpResolve`／`mpEnemy`／`mpFx`、經驗平均 `mpRoomReward` |
| 武器種類、雙手武器 | `js/data.js`、`js/sprites.js`、`js/battle.js` | `BASES.weapon`（`k` 外觀、`t` 類別、`th` 雙手；只能加在最後）、`wepKind`／`wepType`／`twoHand`、`WTAGN`；裝備衝突在 `A.equip`；手上武器圖 `drawWeapon` |
| 裝備品質、尾王三選一、單人地城（0.3.1.9） | `js/items.js`、`js/battle.js`、`js/map.js` | 品質 `Q_CAP`／`hasQ`／`qPhys`／`qArm`（`sumStats`、`stats`、`itemCard`）、通貨 `whet`／`scrap`（`CUR`、`craftable`、`craft`）；三選一 `bossPicks`（`dungeonClear`）；額外單人地城 `soloDunAt`（`SDCELL`，`genEntities`）；戰鬥面板四技能在 `renderBHud`／`mp.js` 的 `renderMBHud`（`.brow3`） |
| 技能標籤（0.3.1.8） | `js/skills.js`、`js/ui.js`、`js/battle.js` | `skTags`（目標、傷害類型、武器、效果）、`skTagHTML`、`skShort`（戰鬥按鈕）；技能頁篩選 `SKF`／`skfOk`／`A.skFilter`（`SEL.skf`） |
| 頂部資訊條、區域特性說明（0.3.1.8） | `js/ui.js`、`js/map.js` | `ibarRender`（`renderHud`、`placeLabel` 呼叫）、`ZICON`、`A.zoneInfo`、`A.ibInfo`；DOM `#ibar` |
| 子頁面返回鍵（0.3.1.8） | `js/ui.js`、`index.html` | `sheetParent`、`A.sheetBack`；DOM `#sback`（`renderSheet` 開頭決定顯示） |
| 商店購買／出售（0.3.1.8） | `js/items.js`、`js/ui.js` | `openShop`（`SHOP.mode`／`SHOP.render`）、`shopSellHTML`、`A.shopTab`／`A.shopPick`／`A.shopQuick`／`A.shopSellGo` |
| 技能石資料與效果 | `js/skills.js`、`js/items.js`、`js/battle.js` | `SKILLS` 擴充欄位（`w`、`tg`、`hits`、`chain`、`proj`、`addEl`、`bleed`、`stun`、`mark`、`curse`、`exec`、`pet`、`buff`、`lifeCost`）；等級成長 `gemSkill`；說明 `gemDesc`（`ui.js`） |
| 昇華（0.3） | `js/asc.js`、`js/items.js` | 資料 `ASC`（職業→分支→`t1`／`t2`／`u`）、節點表 `ASCN`／`ASCB`、輔助效果文字 `SUPN`；屬性 `ascStats`（`sumStats`）、`ascSup`（`stats` 的 `sup`，戰鬥用 `supOf`）；昇華盤 `openAsc`／`drawAsc`／`renderAscCard`（座標 `ascXY`、視角 `AV`、`ascFit`）、小點圖示 `SMG`、圖示 `ascIcon`、換分支 `A.ascSwitch`；試煉 `ascTownHTML`（城鎮面板）、`A.ascTrial`、`ascTrialDone`（`dungeonClear`）；狀態 `S.asc` |
| 首領專屬圖（0.2.13.1） | `js/sprites.js`、`js/demon.js`、`js/battle.js`、`js/undead.js` | `SPR.b_*` 與 `BOSSPAL`（sprites.js 結尾）；七宗罪 `SINSPR`（`makeSinLord`）、`makeSinKing`、地城首領 `BOSSSPR`（`dunEnemy`）、亡靈王 `A.udKing` |
| 印記兌換、生肖傳奇（0.2.13） | `js/hunt.js`、`js/items.js` | `ZLEG`（加進 `LEGENDS`／`LEGI`，`k` 是 `z_生肖`）、`zodStats`（`sumStats` 呼叫，生肖共鳴）、`sealHTML`（`seal` 面板）、`A.sealLeg`／`A.sealJewel`、`spendMarks`；`S.hunt.marks`（可消耗）、`S.hunt.slain`（稱號） |
| 地圖事件連動（0.2.13） | `js/demon.js`、`js/undead.js`、`js/hunt.js` | 霧中亡靈：`mistify`（`e.ud`）、`mistWin`／`undeadWin`（×1.5）；冥府生肖：`A.huntZod`（`ZOD_UW_R`、`uwz`）、`huntWin`；夜晚：`undeadSpawns` 半徑、魔霧刷新機率 |
| 獵殺等級（0.3.1.6） | `js/hunt.js`、`js/map.js`、`js/battle.js`、`js/ui.js` | `HUNT_LV`（三級的強化與倍率）、`huntLv`／`huntCfg`、`huntTick`（每分鐘熱度與關閉後消退，`map.js` 每幀呼叫）、`huntKills`（`winBattle`）、`huntBuff`（`A.fight`、`packOf`）、`packN` 的成群加成；紅圈在 `map.js` 畫玩家範圍圈的地方；狀態 `S.hunt.heat`／`tAt` |
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

### js/core.js（69 行）

  `$:3`
- **utils**（6）
  `h:7`、`rng:13`、`rnd:22`、`now:23`、`REFRESH:25`、`epoch:27`、`uid:29`、`esc:30`、`hex2rgb:31`、`shade:41`、`dist:51`、`fmtD:60`、`dirName:61`、`RANGE:66`、`reachOf:68`

### js/data.js（2395 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（22）
  `CLASSES:24`、`SKILLS:36`、`RSTAR:64`、`GEM_MAX:66`、`GEM_DRAW:67`、`dustNeed:68`、`GAFF:70`、`GAFFI:152`、`GCUR:154`、`GCURI:164`、`EL:165`、`MONS:166`、`MIMIC:1182`、`EMODS:1195`、`DTYPES:1208`、`DMODS:1319`、`DMODI:1332`、`UMODS:1334`、`EMODI:1341`、`FRAG_PARTS:1343`、`ZONE_CELL:1345`、`ZMODS:1347`、`RCOL:1357`、`RGLOW:1359`、`RAREA:1360`、`SLOTS:1362`、`SLOTN:1363`、`BASES:1376`、`DROPS:1454`、`T5:1455`、`ARMOR:1462`、`AFF:1464`、`AFFI:1618`、`STATN:1619`、`sg:1673`、`CUR:1719`、`CURI:1730`、`TH:1733`、`SPOKES:2025`、`TREE:2132`、`VER:2393`、`START:2394`

### js/sprites.js（1333 行）

- **pixel sprites (original art)**（3）
  `SPR:4`、`ICONS:560`、`ICOPAL:582`、`PAL:583`、`FIXED:591`、`ART_U:594`、`artImg:596`、`artSprite:605`、`sprite:629`、`paintIcon18:668`、`spriteCanvas:674`、`drawSpr:686`、`ICC:706`、`iconURL:707`、`paintIcon:717`、`wepKind:730`、`wepType:732`、`twoHand:733`、`WTAGN:734`、`offType:735`
- **icons: currency, item slots, passive nodes**（736）
  `PIX:737`、`PIXC:929`、`pixURL:930`、`curIcon:964`、`slotIcon:965`、`ICIMG:979`、`nodeIcon:980`
- **boss sprites**（988）
  `BOSSPAL:1264`

### js/gear.js（685 行）

- **0.3.1 裝備外觀：每種底材的 12×12 圖示、材質階級配色、角色外觀疊圖**（1）
  `GEAR:3`、`TIER_LV:244`、`tierOf:246`、`MATC:247`、`BLADEC:258`、`gearArt:261`、`gearPal:263`、`GIC:286`、`gearIcon:288`、`GLOOK:340`、`heroLook:347`、`WFRONT:355`、`OFRONT:502`、`put:508`、`stamp:513`、`heroSpr:518`、`heroPal:637`

### js/art.js（33 行）

  `ART:2`

### js/skills.js（736 行）

  `SKKIND:675`、`skTags:691`、`skTagHTML:725`、`skShort:731`

### js/audio.js（221 行）

- **audio**（3）
  `AU:4`、`audioInit:5`、`tone:30`、`noise:47`、`NS:65`、`nf:66`、`SONGS:71`、`PARSED:109`、`parse:110`、`playSong:122`、`schedule:128`、`SFX:147`、`sfx:213`、`buzz:216`

### js/items.js（912 行）

- **player & items**（3）
  `newGame:4`、`makeItem:74`、`baseOf:93`、`Q_CAP:95`、`hasQ:96`、`qMul:97`、`qPhys:98`、`qArm:99`、`affFits:101`、`fitsSlot:103`、`rollAffix:105`、`cnt:126`、`addRandom:127`、`toMagic:137`、`rareName:144`、`toRare:145`、`itemTitle:151`、`itemName:162`、`itemSum:163`、`itemCard:172`、`sellVal:201`、`giveItem:202`、`giveCur:210`、`rollCur:213`、`curDot:223`、`craftable:225`、`craft:238`
- **skill gems**（256）
  `newGem:257`、`gemSlots:258`、`gemOpen:259`、`gemOf:260`、`GEMK:261`、`gemSkill:263`、`mySkills:293`、`rollGAff:294`、`gAffVal:304`、`gAffTxt:309`、`gemCraftable:310`、`gemCraft:323`、`corrupt:341`、`gemLvBlock:361`、`gemDustBack:368`、`giveGem:369`
- **stats**（377）
  `curSpec:379`、`STAT0:380`、`sumStats:482`、`HP_LV:505`、`stats:508`、`MECH:609`、`xpNeed:640`、`fullHeal:644`、`clampHP:649`、`autoPot:655`、`naturalRegen:677`、`addLog:685`、`gainXP:689`、`LV_MAX:702`、`treePts:703`、`dayPhase:704`、`buffOn:710`
- **enemies**（712）
  `pickMon:713`、`makeEnemy:724`、`rollMods:772`、`modNames:781`、`uwApply:783`
- **modal**（802）
  `showModal:803`、`hideModal:809`、`busy:812`、`openShop:813`、`SHOP:911`

### js/battle.js（2289 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:241`、`ESLOT:246`、`battleSc:271`、`epos:273`、`etop:287`、`placeBName:288`、`AIL_E:294`、`ailHTML:310`、`placeAil:318`、`bossBar:325`、`enemyBars:335`、`setFloor:345`、`PORT:350`、`portrait:351`、`renderOrder:361`、`bmsg:370`、`pop:377`、`anim:381`、`animOff:384`、`later:398`
- **battle: rules（單人與組隊共用）**（404）
  `eInit:406`、`PACK_P:413`、`packN:414`、`packSeed:424`、`packBases:425`、`packOf:439`、`skTag:457`、`supOf:459`、`bsum:468`、`mitigate:470`、`skCost:478`、`lifeCost:479`、`canPay:480`、`payCost:482`、`costTxt:488`、`skSt:493`、`skByKey:506`、`extraHit:507`、`heroPacket:508`、`heroDmg:523`、`heroAil:537`、`poisonTick:579`、`takeDmg:581`、`hitCol:592`、`aliveIdx:600`、`actResolve:603`、`addBuff:773`、`petsAct:781`、`enemyResolve:804`、`roundEnd:935`、`battleOpen:945`
- **battle: solo**（958）
  `heroMe:960`、`startBattle:990`、`pickTarget:1034`、`renderBHud:1064`、`playEv:1148`、`soloExt:1202`、`useSkill:1215`、`bItem:1241`、`flee:1286`、`allDead:1301`、`afterPlayer:1302`、`enemyPhase:1314`、`endRound:1330`
- **dungeons (shared by solo and party)**（1345）
  `dunSpec:1347`、`dunName:1377`、`BIGBOSS:1385`、`dunEnemy:1388`、`dropLoot:1489`、`SOUL_MUL:1568`、`gemLoot:1569`、`ONSITE_BONUS:1592`、`onsiteNow:1593`、`dunReward:1595`、`dunModsHTML:1619`、`lootList:1625`、`winBattle:1634`、`loseBattle:1735`、`endBattle:1759`、`enterDungeon:1768`、`nextRoom:1786`、`dungeonClear:1808`、`BP_ARMOR:1857`、`bossPicks:1859`
- **battle: drawing**（1940）
  `drawEnemies:1942`、`selTrack:1983`、`drawSel:1994`、`drawPets:2029`、`renderBattle:2038`、`drawWeapon:2114`、`drawFx:2192`

### js/map.js（1699 行）

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
  `spawnAt:762`、`MCELL:763`、`evEp:767`、`nearTown:768`、`SDCELL:772`、`soloDunAt:773`、`dungeonAt:791`、`NOT_TEMPLE:812`、`genEntities:813`、`refreshEntities:991`、`VIS:1008`、`MOBILE:1009`、`LANDMARK:1011`、`LM_VIS:1023`、`FAR:1025`、`visible:1027`、`isDone:1036`、`townLv:1046`
- **world rendering**（1048）
  `wv:1049`、`VW:1051`、`cam:1054`、`ZMIN:1055`、`sizeWorld:1057`、`SX:1064`、`BGPAT:1066`、`bgPattern:1067`、`glow:1080`、`label:1087`、`sprScale:1106`、`viewChunks:1108`、`camLoadT:1116`、`renderWorld:1117`、`arrows:1400`
- **input**（1430）
  `ptrs:1431`、`drag:1432`、`tapOK:1466`、`endPtr:1467`、`tapWorld:1488`
- **movement**（1522）
  `lastFrame:1523`、`SIM_SPEED:1526`、`simSpeed:1527`、`setPos:1528`、`checkArrive:1558`
- **GPS**（1586）
  `GPS:1588`、`gpsStart:1589`、`gpsStop:1627`、`tick:1634`、`timeRegen:1661`、`mmss:1670`、`plT:1674`、`placeLabel:1675`

### js/tree.js（449 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:290`、`classPicker:423`

### js/ui.js（1594 行）

- **HUD & sheets**（3）
  `renderHud:4`、`ZICON:22`、`ibarRender:32`、`toast:54`、`openSheet:61`、`closeSheet:69`、`TITLES:75`、`NAVG:93`、`navG:112`、`navClose:113`、`navOpen:122`、`KIND:151`、`bar:160`、`entIcon:163`、`fmt1:197`、`curRow:198`、`bagTabs:202`、`curRowG:209`、`BUFFN:212`、`gemDesc:213`、`SKF:248`、`skfOk:256`、`gemCell:268`、`dupGems:274`、`gemRow:282`、`prayed:286`、`sheetParent:288`、`renderSheet:296`、`nearTownE:476`、`shopSellHTML:480`、`canSell:499`、`worseThanEq:505`、`sellSel:510`、`bagListHTML:512`
- **entity interaction**（530）
  `openEnt:531`、`lineupHTML:678`、`onSite:690`、`ONSITE_K:692`、`siteBonus:693`、`inRange:694`
- **bases**（696）
  `prodRate:697`、`stored:698`、`baseName:699`、`flagCheck:700`
- **actions**（708）
  `authForm:710`、`A:742`

### js/endgame.js（835 行）

- **map objects**（3）
  `pad16:4`、`ep2:74`
- **zones: base radius, flags, silk-road view**（76）
  `BASE_R:77`、`baseR:78`、`mainBase:79`、`flagR:80`、`flagMs:84`、`FLAG_MAX:85`、`flagsOn:87`、`zones:89`、`zonesKey:101`、`zoneOf:105`、`inZone:106`、`drawZones:107`
- **zone modifiers**（127）
  `zoneXY:128`、`zoneAt:134`
- **spawns**（136）
  `STCELL:137`、`drawObelisks:144`、`endgameSpawns:186`
- **scrolls, inscriptions, tablets**（300）
  `INSC_MAX:301`、`rollInsc:305`、`makeTablet:314`、`modList:325`、`capMods:327`、`payDun:332`
- **underworld**（350）
  `obeliskCharge:351`、`watcherWin:361`、`makeFrag:367`、`WATCHERS:379`、`summonWatcher:409`
- **silk road (Supabase)**（429）
  `SILK:430`、`SILK_FREE:431`、`silkLoad:432`、`baseSync:445`、`SILK_MSG:455`、`silkCreate:465`、`silkRemove:472`、`specialty:479`、`caravans:480`、`silkView:500`
- **sheets**（514）
  `SEL:515`、`chip:516`、`baseHTML:518`、`silkHTML:544`、`siteEnt:565`、`steleHTML:570`、`MAT_TABS:607`、`matsHTML:613`、`ENTURL:660`、`entURL:661`、`portalPick:666`
- **actions**（672）

### js/undead.js（613 行）

- **data**（3）
  `pad16u:4`、`UNDEAD:100`、`UNDEADN:177`、`ESS:179`、`ESSI:207`、`ESS_MAX:208`、`affCat:209`、`UCUR:211`、`UCURI:217`、`KING_NEED:218`
- **zones**（233）
  `UD_CELL:234`、`udEp:237`、`UDZ:238`、`undeadSpawns:240`、`udProg:290`、`udZoneAt:291`、`drawUndead:293`、`drawUndeadMark:326`
- **battle**（342）
  `undeadWin:344`、`giveEss:363`、`udBoss:369`、`commanderWin:377`、`kingWin:396`
- **undead crafting (at main base)**（409）
  `atBase:410`、`ucCost:414`、`ucBlock:415`、`maxPS:422`、`rollCat:424`、`hasEss:434`、`payEss:435`、`UC_SH:436`、`ucDone:437`、`ucReroll:441`、`ucConv:453`、`ucAdd:470`、`ucAff:481`、`undeadCraftHTML:503`、`essHTML:540`
- **actions**（548）

### js/demon.js（858 行）

- **sprites & data**（3）
  `pad16d:4`、`MMODS:76`、`mistApply:84`、`MISTMON:100`、`MIST_TIERS:145`、`ROMAN:152`、`SINS:154`、`SINI:219`、`SIN_COST:220`、`LEGENDS:223`、`LEGI:281`、`makeLegend:282`、`JAFF:292`、`JEWEL_MAX:311`、`makeJewel:312`、`giveJewel:321`、`jewelTxt:328`、`jewelCap:330`、`jewelsIn:331`、`jewelStats:336`
- **map: mist seals, active mist, sin statues**（343）
  `MS_CELL:344`、`MZ:347`、`mistAt:348`、`mistProg:349`、`demonSpawns:350`、`MQ_CELL:478`、`mistify:482`、`drawSeals:496`、`drawSealMark:559`、`mistWin:597`
- **sin lords**（617）
  `SINSPR:619`、`makeSinLord:628`、`makeSinKing:653`、`sinTurn:675`、`sinHit:693`、`sinBattleWin:704`、`sinReward:710`
- **sheets**（733）
  `sinHTML:734`、`sinMods:742`、`demonHTML:752`、`jewelHTML:759`、`socketCardHTML:772`
- **actions**（794）

### js/hunt.js（868 行）

- **data**（3）
  `HUNT_STEP:4`、`pad16z:11`、`ZBASE:214`、`ZODIAC:226`、`ZODI:310`、`HSUM:312`、`drawZodiacs:319`、`corruptPal:355`、`zodPal:370`
- **state**（387）
  `H:388`、`HUNT_LV:391`、`HEAT_MIN:396`、`huntLv:400`、`huntCfg:407`、`addBlood:408`、`huntWalk:417`、`huntTick:427`、`huntKills:441`、`huntUp:452`、`huntBuff:461`、`huntHud:471`、`nearSpot:484`、`addSummon:494`、`huntSpawns:502`、`zodActive:512`
- **enemies**（514）
  `makeBeast:515`、`ZOD_MODS:522`、`rollZodMods:524`、`makeZodiac:530`、`huntWin:553`
- **sheet**（589）
  `huntHTML:590`、`huntPaint:623`
- **印記兌換**（630）
  `ZLEG:632`、`ZLEG_COST:646`、`zodStats:666`、`markTotal:670`、`sealHTML:671`、`spendMarks:694`
- **actions**（702）
  `zodEntHTML:860`

### js/daily.js（234 行）

- **今日委託**（3）
  `QUESTS:5`、`QUESTI:19`、`DAILY_N:20`、`today:22`、`daily:23`、`quest:38`、`questReward:55`、`dailyHTML:69`
- **附近面板分組**（82）
  `NGROUP:83`、`ngroup:94`、`nearProg:111`、`nearCard:129`、`nearHTML:132`
- **足跡**（168）
  `FOOT_CELL:170`、`FOOTA:174`、`footKey:175`、`footN2Lv:176`、`footLv:177`、`footStep:182`、`footDens:207`、`drawFoot:210`

### js/asc.js（1497 行）

- **data**（67）
  `ASC_LV:68`、`N:71`、`ASC:72`、`TAGN:857`、`SUPN:875`、`SMG:899`、`ASCN:928`、`ASCB:929`
- **state & stats**（959）
  `ASCD:960`、`ascPts:961`、`ascUsed:962`、`ascNext:963`、`ascOn:964`、`ascStats:969`、`ascSup:976`、`ascTxt:978`、`ascCostTxt:990`、`ascCan:992`、`ascResetCost:1003`、`ascAlert:1005`
- **icons**（1007）
  `ASCI:1009`、`ascIcon:1010`
- **board（0.3.0.3：比照天賦樹的全螢幕昇華盤）**（1035）
  `AV:1037`、`ascMine:1038`、`AV_ANG:1039`、`ascXY:1042`、`AIMG:1050`、`ascImg:1051`、`AX:1061`、`openAsc:1063`、`closeAsc:1075`、`sizeAsc:1080`、`ascFit:1089`、`ascState:1105`、`drawAsc:1110`、`renderAscCard:1208`
- **trials**（1343）
  `ascTownHTML:1345`、`ascTrialDone:1352`
- **actions**（1359）

### js/gacha.js（155 行）

- **banners**（3）
  `GACHA_RATE:5`、`BANNERS:8`、`gpool:29`、`GA:30`、`gachaRoll:31`、`gachaPull:45`、`revealNext:68`
- **ui**（79）
  `gemTile:80`、`openGacha:85`、`closeGacha:93`、`renderGacha:98`

### js/tutor.js（155 行）

- **tutorial**（3）
  `TUT:5`、`tutI:97`、`tutorStart:98`、`tutorEnd:105`、`tutorShow:111`

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

### js/mp.js（1030 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:32`
- **party / lobby**（34）
  `ptSend:35`、`ptConnect:38`、`ptPill:52`、`partyCreate:61`、`partyJoin:93`、`partyLeave:119`、`ptLobby:136`、`ptGone:142`、`ptMsg:164`、`ptCodeHTML:238`、`partyHTML:240`
- **battle state (leader authoritative)**（268）
  `MBT:269`、`MBFX:271`、`pub:273`、`mpPush:281`、`mpArm:287`、`ptReady:297`、`mpStart:309`、`mpSpawn:376`、`mpRound:390`、`mpNext:401`、`mpEndRound:433`、`mpOnAct:436`、`mpResolve:442`、`mpEnemy:487`、`mpRoomClear:512`
- **battle (every client)**（552）
  `mpEnter:553`、`mpBG:576`、`mpApply:582`、`mpFx:597`、`mpMy:656`、`mpRoomReward:677`、`mpClear:699`、`mpWipe:732`、`mpEnd:756`、`mpStop:773`、`mpLeave:784`
- **battle rendering**（799）
  `mpPos:801`、`renderMBHud:807`、`mpTurnT:915`、`mpTurnBar:916`、`renderMB:934`

### js/main.js（202 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:30`、`migrate:40`、`start:150`
<!-- index:end -->
