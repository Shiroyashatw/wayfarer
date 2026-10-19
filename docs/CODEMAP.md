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
| 技能石：等級、刻印詞綴、刻印石 | `js/data.js`、`js/items.js` | `GEM_MAX`、`soulNeed`、`GAFF`、`GCUR`；`gemSkill`（技能石→戰鬥技能）、`mySkills`、`gemCraft`、`gemLvBlock` |
| 技能石面板（圖示格子、分解） | `js/ui.js` | `renderSheet` 的 `skills`／`gem` 分支、`gemCell`（底色 `gemKc`）、`A.gemLv`、`A.gemBreak`、`A.gemCraft` |
| 新手引導（步驟、框選的按鈕） | `js/tutor.js` | `TUT`（每步的標題、說明、要框起來的選擇器）、`tutorStart`、`tutorShow`；存檔旗標 `S.tut` |
| 契靈祈願（0.3.11）：卡池、保底、突破、裝備、契約板、跟隨 | `js/gacha.js` | 資料 `PACTS`／`PACTI`（`t` 是 `fight`／`drop`、`r` 0～5 是 N～UR、`th` 主題；戰鬥的 `b.s`／`b.m`／`b.l` 是契約板節點，掉落的 `st`／`mech`）、`PRAR`／`PCOL`／`PRATE`、保底 `P_SSR`／`P_UR_SOFT`／`P_UR_HARD`（`pityOf`）、突破 `pactGive`／`PBRK_MAX`／`pactMul`；欄位 `PSLOTS`、`pactEqOf`；契約板 `PNODE`、`PRING`／`PRED`、`pactPts`／`pactUsed`、`boardOk`／`nodeBlock`、`pboardHTML`（sheet `pboard`）、`A.pnode`；屬性 `pactStats`（`sumStats`）、機制 `pactMech(k)`／`pactK(k)`（`dropLoot`、`dunReward`、`bossPicks`、`winBattle`、`mpRoomReward`、`gemLoot`、`undeadWin`、`mistWin`、`sinReward`、`addBlood`、`huntWin`、`obeliskCharge`、`rollInsc`）；跟隨 `pactFollow`（`reachOf`、`map.js` 畫在玩家旁邊）；介面 `renderGacha`、`pactHTML`（sheet `pact`）、`A.pactEq`／`A.pactFollow`；狀態 `S.pact`（`have`、`eq.fight`／`eq.drop`、`board`、`follow`）、`S.pity` |
| 技能石商店、靈魂升級（0.3.11） | `js/items.js`、`js/ui.js` | `gemReq`（需求等級，`GEM_START` 是 Lv1 的開局技能）、`gemTier`、`gemPrice`、`gemBuyBlock`、`soulNeed`、`gemSoulBack`；`gemShopHTML`（sheet `gemshop`）、`A.gemShop`／`A.gshopTier`／`A.gemBuy`；祈願石掉落在 `gemLoot` |
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
| 掉寶、地城獎勵 | `js/battle.js` | `dropLoot`、`dunReward`；靈魂、祈願石與刻印石 `gemLoot`；現場加成 `ONSITE_BONUS`、`onsiteNow`（判定現場用 `ui.js` 的 `onSite`；只有石碑、魔法陣有加成：`ONSITE_K`／`siteBonus`） |
| 亡靈區、亡靈怪、亡靈祭壇與軍團長、亡靈王 | `js/undead.js` | `undeadSpawns`（由 `endgameSpawns` 呼叫）、`UDZ`、`UNDEAD`、`drawUndead`、`undeadWin`、`commanderWin`、`kingWin`、`A.udBoss`、`A.udKing` |
| 亡靈精華與亡靈製作（屍化值） | `js/undead.js` | `ESS`（精華對應的詞綴）、`UCUR`、`ucReroll`、`ucConv`、`ucAdd`、`ucAff`、`ucBlock`、`undeadCraftHTML`（裝備詳情頁）；屍化值存在裝備的 `sh`、次數 `uc` |
| 魔霧區、魔霧詞綴與專屬怪、進度與碎片 | `js/demon.js` | `demonSpawns`（由 `endgameSpawns` 呼叫，產生 `MZ` 魔霧區）、`mistAt`、`mistProg`、`MIST_TIERS`、`MMODS`／`mistApply`、`MISTMON`、`mistify(e, q, k, Z)`、`drawSeals`（紫色圓圈與光柱）／`drawSealMark`（遠距離符號）、`mistWin`；各區進度 `S.mistp`（每輪 `_ep` 換新） |
| 七宗罪雕像、7 個王的機制、殘魂 | `js/demon.js`、`js/battle.js` | `SINS`、`makeSinLord`、`sinTurn`（`enemyTurn` 開頭）、`sinHit`（`playerHit`）、`sinReward`（`dunReward`）、`A.sinGo`；`dunEnemy` 的七宗罪段落 |
| 傳奇裝備 | `js/demon.js`、`js/items.js` | `LEGENDS`、`makeLegend`；屬性在 `sumStats`（`it.leg`），特效旗標 `legPride` 等在 `heroDmg`／`heroAil`／`useSkill`／`bItem` |
| 惡魔珠寶與天賦盤珠寶槽 | `js/demon.js`、`js/data.js`、`js/tree.js` | `JAFF`、`makeJewel`、`jewelCap`、`jewelStats`、`socketCardHTML`、`A.jIn`／`A.jOut`；槽位在 `TREE` 結尾（`type: 'socket'`），鑲嵌狀態 `S.jsock` |
| 今日委託、附近面板分組、足跡（0.2.13） | `js/daily.js` | `QUESTS`、`daily`、`quest(k, n)`（各處呼叫：`winBattle`、`dungeonClear`、`pray`、`openChest`、`gather`、`obeliskCharge`、`mistWin`、`huntWalk`、`setPos`）、`dailyHTML`、`nearHTML`／`ngroup`／`nearProg`（`near` 面板）、`footStep`（`trailStep`）、`footLv`／`footDens`／`footRare`（`genEntities` 怪物生成）、`drawFoot`；狀態 `S.daily`、`S.foot` |
| 多隻敵人戰鬥（0.3） | `js/battle.js`、`js/mp.js` | 野外群體隻數 `packN`（機率表 `PACK_P`）、同伴種類 `packBases`＋`packSeed`（位置與週期固定）、`packOf(lead, extra, n, seed)`；開打前陣容 `lineupHTML`（`ui.js`，`openEnt` 呼叫）；互動範圍 `RANGE`／`TOWN_R`／`reachOf`（core.js）；結算核心 `actResolve`（玩家行動→事件）、`enemyResolve`（敵人行動）、`petsAct`（召喚物）、`roundEnd`／`battleOpen`；單人 `startBattle`（`pack` 帶小怪 `packOf`）、`useSkill`、`playEv`（播事件）、`enemyPhase`；站位 `epos`／`ESLOT`、`drawEnemies`（選取特效 `drawSel`、換目標名字淡出 `selTrack`）、`enemyBars`、點敵人換目標 `pickTarget`；地城一層一群 `dunEnemy(D, room, extra)`；組隊 `mpResolve`／`mpEnemy`／`mpFx`、經驗平均 `mpRoomReward` |
| 行動值（戰鬥行動順序，0.3.10） | `js/battle.js`、`js/mp.js` | `AV_MAX`、`avSpd`、`avNext`（下一個行動的單位）、`avPreview`（橫列預測）；單人 `soloUnits`、`nextTurn`、`enemyAct`（`B.av`、`B.turns`）；組隊 `mpUnits`、`mpRound`（每層重置）、`mpNext`、`mpEnemy`（`MB.av`、`MB.ea`、`MB.order`） |
| T 級 T1～T16（0.3.10） | `js/items.js`、`js/ui.js`、`js/map.js` | `TIERS`、`T_MAX`、`tierNow`／`tierMax`、`tierRange`、`aLv`（地圖基準等級，生成怪物與地城都用這個，不要直接用 `S.lv`）、`dunLv`、`tierBonus`／`tierBoss`、`tierNeed`；強度在 `makeEnemy`、掉寶在 `dropLoot`／`dunReward`；突破試煉 `tierTownHTML`／`A.tierTrial`／`tierUpDone`（`dungeonClear`）；說明與切換 `tierInfoHTML`／`A.tierInfo`／`A.tierSet`；狀態 `S.tier`、`S.tmax` |
| 武器種類、雙手武器 | `js/data.js`、`js/sprites.js`、`js/battle.js` | `BASES.weapon`（`k` 外觀、`t` 類別、`th` 雙手；只能加在最後）、`wepKind`／`wepType`／`twoHand`、`WTAGN`；裝備衝突在 `A.equip`；手上武器圖 `drawWeapon` |
| 裝備品質、尾王三選一、單人地城（0.3.1.9） | `js/items.js`、`js/battle.js`、`js/map.js` | 品質 `Q_CAP`／`hasQ`／`qPhys`／`qArm`（`sumStats`、`stats`、`itemCard`）、通貨 `whet`／`scrap`（`CUR`、`craftable`、`craft`）；三選一 `bossPicks`（`dungeonClear`）；額外單人地城 `soloDunAt`（`SDCELL`，`genEntities`）；戰鬥面板四技能在 `renderBHud`／`mp.js` 的 `renderMBHud`（普攻 `.atk` 在右上、物品／逃跑 `.brow2`） |
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
| `gemshop` | 技能石商店 | 城鎮面板 →「技能石商店」（`gemShopHTML`，0.3.11） |
| `pact` | 契靈 | 角色頁 →「契靈」或祈願畫面的「我的契靈」（`pactHTML`，在 `gacha.js`） |
| `pboard` | 契約板 | 契靈面板裡點已裝的戰鬥契靈（`pboardHTML`，`SEL.pboard`） |
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
| `GA` | `gacha.js` | 祈願畫面目前的卡池（`fight`／`drop`）與抽卡結果 |
| `SILK` | `endgame.js` | 絲綢之路清單、目前在看的好友據點 `view` |
| `SEL` | `endgame.js` | 石碑面板選取中的碑文碎片與石碑 |
| `TV` | `tree.js` | 天賦樹畫面的縮放與位置 |

## 頂層宣告索引（自動產生）

格式：`名稱:行號`。粗體是檔案裡的區段註解（`/* ===== 區段 ===== */`）。

<!-- index:start -->

### js/core.js（71 行）

  `$:3`
- **utils**（6）
  `h:7`、`rng:13`、`rnd:22`、`now:23`、`REFRESH:25`、`epoch:27`、`uid:29`、`esc:30`、`hex2rgb:31`、`shade:41`、`dist:51`、`fmtD:60`、`dirName:61`、`RANGE:66`、`reachOf:69`

### js/data.js（2395 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（22）
  `CLASSES:24`、`SKILLS:36`、`GEM_MAX:65`、`GEM_DRAW:67`、`soulNeed:68`、`GAFF:70`、`GAFFI:152`、`GCUR:154`、`GCURI:164`、`EL:165`、`MONS:166`、`MIMIC:1182`、`EMODS:1195`、`DTYPES:1208`、`DMODS:1319`、`DMODI:1332`、`UMODS:1334`、`EMODI:1341`、`FRAG_PARTS:1343`、`ZONE_CELL:1345`、`ZMODS:1347`、`RCOL:1357`、`RGLOW:1359`、`RAREA:1360`、`SLOTS:1362`、`SLOTN:1363`、`BASES:1376`、`DROPS:1454`、`T5:1455`、`ARMOR:1462`、`AFF:1464`、`AFFI:1618`、`STATN:1619`、`sg:1673`、`CUR:1719`、`CURI:1730`、`TH:1733`、`SPOKES:2025`、`TREE:2132`、`VER:2393`、`START:2394`

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

### js/items.js（993 行）

- **player & items**（3）
  `newGame:4`、`makeItem:77`、`baseOf:96`、`Q_CAP:98`、`hasQ:99`、`qMul:100`、`qPhys:101`、`qArm:102`、`affFits:104`、`fitsSlot:106`、`rollAffix:108`、`cnt:129`、`addRandom:130`、`toMagic:140`、`rareName:147`、`toRare:148`、`itemTitle:154`、`itemName:165`、`itemSum:166`、`itemCard:175`、`sellVal:204`、`giveItem:205`、`giveCur:213`、`rollCur:216`、`curDot:226`、`craftable:228`、`craft:241`
- **skill gems**（259）
  `newGem:260`、`gemSlots:261`、`gemOpen:262`、`gemOf:263`、`GEMK:264`、`gemSkill:266`、`mySkills:296`、`rollGAff:297`、`gAffVal:307`、`gAffTxt:312`、`gemCraftable:313`、`gemCraft:326`、`corrupt:344`、`gemLvBlock:364`、`gemSoulBack:372`、`GEM_START:375`、`GEMREQ:376`、`gemReq:377`、`gemTier:389`、`gemPrice:390`、`hasGem:391`、`gemBuyBlock:392`、`giveGem:399`
- **stats**（407）
  `curSpec:409`、`STAT0:410`、`sumStats:512`、`HP_LV:536`、`stats:539`、`MECH:640`、`xpNeed:671`、`fullHeal:675`、`clampHP:680`、`autoPot:686`、`naturalRegen:708`、`addLog:716`、`gainXP:720`、`LV_MAX:735`、`treePts:736`、`dayPhase:737`、`buffOn:743`
- **enemies**（745）
  `TIERS:748`、`T_MAX:766`、`tierOfLv:768`、`tierMax:769`、`tierNow:770`、`tierRange:771`、`aLv:773`、`dunLv:778`、`tierBonus:783`、`tierBoss:787`、`tierNeed:789`、`pickMon:790`、`makeEnemy:801`、`rollMods:853`、`modNames:862`、`uwApply:864`
- **modal**（883）
  `showModal:884`、`hideModal:890`、`busy:893`、`openShop:894`、`SHOP:992`

### js/battle.js（2343 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:241`、`ESLOT:246`、`battleSc:271`、`epos:273`、`etop:287`、`placeBName:288`、`AIL_E:294`、`ailHTML:310`、`placeAil:318`、`bossBar:325`、`enemyBars:335`、`setFloor:345`、`PORT:350`、`portrait:351`、`renderOrder:361`、`bmsg:370`、`pop:377`、`anim:381`、`animOff:384`、`later:398`
- **battle: rules（單人與組隊共用）**（404）
  `eInit:406`、`PACK_P:413`、`packN:414`、`packSeed:424`、`packBases:425`、`packOf:439`、`skTag:457`、`supOf:459`、`bsum:468`、`mitigate:470`、`skCost:478`、`lifeCost:479`、`canPay:480`、`payCost:482`、`costTxt:488`、`skSt:493`、`skByKey:506`、`extraHit:507`、`heroPacket:508`、`heroDmg:523`、`heroAil:537`、`poisonTick:579`、`takeDmg:581`、`hitCol:592`、`aliveIdx:600`、`actResolve:603`、`addBuff:773`、`petsAct:781`、`enemyResolve:804`、`AV_MAX:937`、`avSpd:938`、`avNext:939`、`avPreview:956`、`roundEnd:961`、`battleOpen:971`
- **battle: solo**（984）
  `heroMe:986`、`startBattle:1016`、`pickTarget:1055`、`renderBHud:1085`、`playEv:1171`、`soloExt:1225`、`useSkill:1238`、`bItem:1264`、`flee:1309`、`allDead:1324`、`afterPlayer:1325`、`soloUnits:1337`、`nextTurn:1342`、`enemyAct:1361`
- **dungeons (shared by solo and party)**（1376）
  `dunSpec:1378`、`dunName:1408`、`BIGBOSS:1418`、`dunEnemy:1421`、`dropLoot:1527`、`SOUL_MUL:1609`、`gemLoot:1610`、`ONSITE_BONUS:1637`、`onsiteNow:1638`、`dunReward:1640`、`dunModsHTML:1665`、`lootList:1671`、`winBattle:1680`、`loseBattle:1782`、`endBattle:1806`、`enterDungeon:1815`、`nextRoom:1833`、`dungeonClear:1853`、`BP_ARMOR:1909`、`bossPicks:1911`
- **battle: drawing**（1994）
  `drawEnemies:1996`、`selTrack:2037`、`drawSel:2048`、`drawPets:2083`、`renderBattle:2092`、`drawWeapon:2168`、`drawFx:2246`

### js/map.js（1719 行）

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
  `spawnAt:762`、`MCELL:763`、`evEp:767`、`nearTown:768`、`SDCELL:772`、`soloDunAt:773`、`dungeonAt:802`、`NOT_TEMPLE:823`、`genEntities:824`、`refreshEntities:1002`、`VIS:1021`、`MOBILE:1022`、`LANDMARK:1024`、`LM_VIS:1036`、`FAR:1038`、`visible:1040`、`isDone:1049`、`townLv:1059`
- **world rendering**（1061）
  `wv:1062`、`VW:1064`、`cam:1067`、`ZMIN:1068`、`sizeWorld:1070`、`SX:1077`、`BGPAT:1079`、`bgPattern:1080`、`glow:1093`、`label:1100`、`sprScale:1119`、`viewChunks:1121`、`camLoadT:1129`、`renderWorld:1130`、`arrows:1420`
- **input**（1450）
  `ptrs:1451`、`drag:1452`、`tapOK:1486`、`endPtr:1487`、`tapWorld:1508`
- **movement**（1542）
  `lastFrame:1543`、`SIM_SPEED:1546`、`simSpeed:1547`、`setPos:1548`、`checkArrive:1578`
- **GPS**（1606）
  `GPS:1608`、`gpsStart:1609`、`gpsStop:1647`、`tick:1654`、`timeRegen:1681`、`mmss:1690`、`plT:1694`、`placeLabel:1695`

### js/tree.js（449 行）

- **passive tree (full screen)**（3）
  `startOf:4`、`blockedStart:5`、`treeAdj:9`、`canAlloc:19`、`pathTo:23`、`canRefund:50`、`treeTotals:67`、`TV:78`、`openTree:79`、`closeTree:87`、`sizeTree:94`、`treeFit:102`、`TX:109`、`CLSN:111`、`NR:112`、`drawTree:113`、`renderTreeCard:290`、`classPicker:423`

### js/ui.js（1684 行）

- **HUD & sheets**（3）
  `renderHud:4`、`ZICON:22`、`ibarRender:32`、`toast:55`、`openSheet:62`、`closeSheet:70`、`TITLES:76`、`NAVG:97`、`navG:116`、`navClose:117`、`navOpen:126`、`KIND:155`、`bar:164`、`entIcon:167`、`fmt1:201`、`curRow:202`、`bagTabs:206`、`curRowG:213`、`BUFFN:216`、`gemDesc:217`、`SKF:252`、`skfOk:260`、`gemKc:272`、`gemCell:273`、`gemRow:277`、`gemShopHTML:282`、`prayed:299`、`sheetParent:301`、`renderSheet:310`、`nearTownE:495`、`shopSellHTML:499`、`canSell:518`、`worseThanEq:524`、`sellSel:529`、`bagListHTML:531`
- **entity interaction**（549）
  `openEnt:550`、`lineupHTML:699`、`tierTownHTML:711`、`tierUpDone:719`、`tierInfoHTML:729`、`onSite:741`、`ONSITE_K:743`、`siteBonus:744`、`inRange:745`
- **bases**（747）
  `prodRate:748`、`stored:749`、`baseName:750`、`flagCheck:751`
- **actions**（759）
  `authForm:761`、`A:793`

### js/endgame.js（837 行）

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
  `obeliskCharge:351`、`watcherWin:362`、`makeFrag:368`、`WATCHERS:380`、`summonWatcher:410`
- **silk road (Supabase)**（430）
  `SILK:431`、`SILK_FREE:432`、`silkLoad:433`、`baseSync:446`、`SILK_MSG:456`、`silkCreate:466`、`silkRemove:473`、`specialty:480`、`caravans:481`、`silkView:502`
- **sheets**（516）
  `SEL:517`、`chip:518`、`baseHTML:520`、`silkHTML:546`、`siteEnt:567`、`steleHTML:572`、`MAT_TABS:609`、`matsHTML:615`、`ENTURL:662`、`entURL:663`、`portalPick:668`
- **actions**（674）

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

### js/demon.js（865 行）

- **sprites & data**（3）
  `pad16d:4`、`MMODS:76`、`mistApply:84`、`MISTMON:100`、`MIST_TIERS:145`、`ROMAN:152`、`SINS:154`、`SINI:219`、`SIN_COST:220`、`LEGENDS:223`、`LEGI:281`、`makeLegend:282`、`JAFF:292`、`JEWEL_MAX:311`、`makeJewel:312`、`giveJewel:321`、`jewelTxt:328`、`jewelCap:330`、`jewelsIn:331`、`jewelStats:336`
- **map: mist seals, active mist, sin statues**（343）
  `MS_CELL:344`、`MZ:347`、`mistAt:348`、`mistProg:349`、`demonSpawns:350`、`MQ_CELL:478`、`mistify:482`、`drawSeals:496`、`drawSealMark:559`、`mistWin:597`
- **sin lords**（618）
  `SINSPR:620`、`makeSinLord:629`、`makeSinKing:654`、`sinTurn:676`、`sinHit:694`、`sinBattleWin:705`、`sinReward:711`
- **sheets**（740）
  `sinHTML:741`、`sinMods:749`、`demonHTML:759`、`jewelHTML:766`、`socketCardHTML:779`
- **actions**（801）

### js/hunt.js（869 行）

- **data**（3）
  `HUNT_STEP:4`、`pad16z:11`、`ZBASE:214`、`ZODIAC:226`、`ZODI:310`、`HSUM:312`、`drawZodiacs:319`、`corruptPal:355`、`zodPal:370`
- **state**（387）
  `H:388`、`HUNT_LV:391`、`HEAT_MIN:396`、`huntLv:400`、`huntCfg:407`、`addBlood:408`、`huntWalk:418`、`huntTick:428`、`huntKills:442`、`huntUp:453`、`huntBuff:462`、`huntHud:472`、`nearSpot:485`、`addSummon:495`、`huntSpawns:503`、`zodActive:513`
- **enemies**（515）
  `makeBeast:516`、`ZOD_MODS:523`、`rollZodMods:525`、`makeZodiac:531`、`huntWin:554`
- **sheet**（590）
  `huntHTML:591`、`huntPaint:624`
- **印記兌換**（631）
  `ZLEG:633`、`ZLEG_COST:647`、`zodStats:667`、`markTotal:671`、`sealHTML:672`、`spendMarks:695`
- **actions**（703）
  `zodEntHTML:861`

### js/daily.js（237 行）

- **今日委託**（3）
  `QUESTS:5`、`QUESTI:19`、`DAILY_N:20`、`today:22`、`daily:23`、`quest:38`、`questReward:55`、`dailyHTML:72`
- **附近面板分組**（85）
  `NGROUP:86`、`ngroup:97`、`nearProg:114`、`nearCard:132`、`nearHTML:135`
- **足跡**（171）
  `FOOT_CELL:173`、`FOOTA:177`、`footKey:178`、`footN2Lv:179`、`footLv:180`、`footStep:185`、`footDens:210`、`drawFoot:213`

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

### js/gacha.js（627 行）

- **pacts**（5）
  `PRAR:7`、`PACTS:38`、`PACTI:210`、`PTYPE:211`、`PMECHN:212`、`PD:227`、`pactMul:235`、`pactOwned:236`、`pactEqOf:237`、`pactsOn:238`、`pactIsOn:239`、`pv:241`、`stTxt:242`、`mechTxt:243`、`pactPts:245`、`pactBoard:246`、`pactUsed:247`、`ringOf:248`、`ringLv:249`、`boardOk:251`、`nodeBlock:258`、`pactStats:274`、`pactMech:290`、`pactK:298`、`pactFollow:300`、`pactTxt:305`、`pactImg:312`、`pactPal:317`、`pactTile:322`
- **banners**（327）
  `BANNERS:328`、`ppool:346`、`GA:347`、`pityOf:348`、`gachaRoll:353`、`pactGive:381`、`gachaPull:397`、`revealNext:420`
- **ui**（431）
  `openGacha:432`、`closeGacha:440`、`renderGacha:445`、`pactHTML:482`、`pboardHTML:516`、`pactRefresh:547`

### js/tutor.js（160 行）

- **tutorial**（3）
  `TUT:5`、`tutI:102`、`tutorStart:103`、`tutorEnd:110`、`tutorShow:116`

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

### js/mp.js（1019 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:32`
- **party / lobby**（34）
  `ptSend:35`、`ptConnect:38`、`ptPill:52`、`partyCreate:61`、`partyJoin:93`、`partyLeave:119`、`ptLobby:136`、`ptGone:142`、`ptMsg:164`、`ptCodeHTML:238`、`partyHTML:240`
- **battle state (leader authoritative)**（268）
  `MBT:269`、`MBFX:271`、`pub:273`、`mpPush:281`、`mpArm:287`、`ptReady:297`、`mpStart:309`、`mpSpawn:376`、`mpUnits:391`、`mpRound:396`、`mpNext:402`、`mpOnAct:436`、`mpResolve:442`、`mpEnemy:487`、`mpRoomClear:509`
- **battle (every client)**（549）
  `mpEnter:550`、`mpBG:573`、`mpApply:579`、`mpFx:594`、`mpMy:653`、`mpRoomReward:674`、`mpClear:696`、`mpWipe:729`、`mpEnd:753`、`mpStop:770`、`mpLeave:781`
- **battle rendering**（796）
  `mpPos:798`、`renderMBHud:804`、`mpTurnT:904`、`mpTurnBar:905`、`renderMB:923`

### js/main.js（217 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:30`、`migrate:40`、`start:165`
<!-- index:end -->
