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
| 技能石：等級、插槽、輔助寶石、品質（0.3.20） | `js/data.js`、`js/items.js`、`js/skills.js` | `GEM_MAX`、`soulNeed`、`GCUR`（刻印石系列開插槽、混沌刻印石重骰插槽數、寶石稜鏡加品質、冥府之血腐化）；技能石 `newGem`（`sock` 插槽數、`sp` 插著的輔助、`q` 品質）、`gemSkill`（技能石→戰鬥技能，加上品質與輔助：`gsup` 給 `supOf`）、品質效果 `gemQFx`（依技能特色自動決定）、`Q_GEM`／`prismAdd`、`mySkills`、`gemCraftable`／`gemCraft`（`SOCK_CUR`）、`corrupt`；輔助寶石資料 `SUPG`／`SUPGI`（`skills.js`，`sup` 戰鬥效果、`sk` 技能條件欄位、`req` 能插的技能 `SUPREQ`／`SUPREQN`、`conv` 轉換類、`lin` 族裔＋`m` 機制 `SUPM`）、`supFits`、`supBlock`／`supIn`／`supOut`／`giveSup`／`supUsed`（族裔同名限一顆）；背包 `S.sups` |
| 技能石面板（圖示格子、插槽、商店、分解） | `js/ui.js` | `renderSheet` 的 `skills`／`gem` 分支、`gemCell`（底色 `gemKc`、插槽點、品質 `.gq`）、輔助寶石列 `supLine`、紅點 `supHint`；商店 `gemShopHTML`／`supShopHTML`（切換 `gshopKind`、`SEL.gshopK`，價格 `supPrice`、`supBuyBlock`、數量 `supN`）；`A.gemLv`、`A.gemBreak`（輔助退回背包）、`A.gemCraft`、`A.supPick`／`A.supIn`／`A.supOut`、`A.supBuy`、`A.gshopK` |
| 新手引導（步驟、框選的按鈕） | `js/tutor.js` | `TUT`（每步的標題、說明、要框起來的選擇器）、`tutorStart`、`tutorShow`；存檔旗標 `S.tut` |
| 契靈祈願（0.3.12）：卡池、詞綴、突破、欄位、跟隨 | `js/gacha.js`、`js/items.js` | 契靈 `PACTS`／`PACTI`（`r` 0～2 是 R／SR／SSR）、`PRAR`／`PCOL`／`PRATE`、保底 `P_SOFT`／`P_HARD`（`pityOf`）；詞綴 `PAFF`／`PAFFI`（`v` 是 T6～T1 的範圍、`tg` 標籤、`ssr` 專屬、`sk` 特定技能等級、`allSk`）、階級權重 `PTW`、`rollTier`／`rollPAff`／`rollPact`、文字 `paffTxt`、標籤 `PTAG`／`paffTags`／`pactTags`；個體 `pactOf(u)`／`pactKind(u)`、新抽到 `pactGive`、突破 `pactFodder`／`A.pactBrk`／`A.pactEat`（sheet `pbrk`，`pactBrkHTML`、`PBRK_MAX`、`pactOpen` 已解鎖的詞綴）、卡片 `pactCard`；欄位 `pactSlots`（`PSLOT0` + 昇華試煉）、`pactsOn`；屬性 `pactStats`（`sumStats`）、技能等級 `pactSkLv`（`gemSkill` 的 `plus`）；跟隨 `pactFollow`（`reachOf`、`map.js` 畫在玩家旁邊）；介面 `renderGacha`、`pactHTML`（sheet `pact`）、`A.pactEq`／`A.pactFollow`／`A.ptag`；狀態 `S.pact`（`list = [{u, k, brk, aff}]`、`eq`／`follow` 存個體編號 `u`）、`S.pity` |
| 技能石商店、靈魂升級（0.3.11） | `js/items.js`、`js/ui.js` | `gemReq`（需求等級，`GEM_START` 是 Lv1 的開局技能）、`gemTier`、`gemPrice`、`gemBuyBlock`、`soulNeed`、`gemSoulBack`；`gemShopHTML`（sheet `gemshop`）、`A.gemShop`／`A.gshopTier`／`A.gemBuy`；祈願石掉落在 `gemLoot` |
| 天賦外圈（武器、組隊、刻印專精） | `js/data.js`、`js/items.js` | `TH` 的 `sword`～`gem` 主題、`TREE` 的「0.2.4 外圈」段落；武器條件在 `stats` 開頭（`wepType`、`offType`）；嘲諷、群體治癒、隊友加成在 `mp.js` 的 `mpEnemy`、`mpResolve` |
| 精魄與光環（0.3.21） | `js/items.js`、`js/skills.js`、`js/ui.js`、`js/battle.js`、`js/mp.js`、`js/data.js`、`js/gacha.js` | 精魄 `SPIRIT0`、`st.spirit`／`st.spiritUsed`；光環欄 `S.aura`（`AURA_MAX`）、`auraOn`（`sumStats` 加屬性）、`auraCost`、`auraExtra`（`auraVs` 給 `condMul`、`paura` 給隊友）；光環資料 `skills.js`（`kind: 'aura'`）、等級與品質在 `gemSkill`／`gemQFx`；介面 `auraBlock`、`A.auraOn`／`A.auraOff`、技能頁的光環欄；天賦精魄在 `TREE` 結尾、契靈詞綴 `PAFF` 的 `spirit`；組隊光環 `mp.js` 開場、回血 `hot`（`roundEnd`） |
| 技能石在戰鬥中的效果 | `js/battle.js` | `skSt`（技能石數值只對該技能生效、刻印共鳴 `engPct` 改成每顆輔助）、`supOf`（昇華＋技能石的 `gsup`）、`skByKey`（`'attack'`／`'s0'`～`'s3'`）、`gemLoot`（靈魂與刻印石系列）、0.3.20 `supLoot`／`mechOf`（寶石稜鏡與族裔輔助從野外機制掉、一般輔助從菁英與首領掉）；`dunReward` 的冥府傳送門與七宗罪首領 |
| 怪物種類與數值 | `js/data.js` | `MONS`、`MIMIC`、`EMODS`（菁英詞綴） |
| 地城種類與地城詞綴 | `js/data.js` | `DTYPES`、`DMODS`；規格換算在 `js/battle.js` 的 `dunSpec` |
| 裝備底材、詞綴、通貨 | `js/data.js` | `BASES`、`AFF`、`CUR`、`STATN`（屬性的顯示文字） |
| 天賦樹節點與基石 | `js/data.js` | `TH`（主題與重要節點）、`SPOKES`（15 條路線與基石）、`TREE`（產生節點座標與連線） |
| 契靈圓盤、沒有出發點（0.3.13） | `js/data.js`、`js/tree.js` | `TREE` 開頭的根節點 `start`（圓心，接到每條輻射路線的第一格；`startOf()` 永遠是 `start`）；`CLASSES` 只剩名稱與主色（`clsOf`／`OLDCLS`）；圓盤 `DISC_R`／`dslotXY`／`drawDisc`（接到根節點的線從圓盤邊緣畫起）、`TV.slot`（`renderTreeCard` 顯示欄位）、`A.treePact` |
| 昇華分支圖案、三選一（0.3.16） | `js/asc.js` | 每條分支一張圖 `ASC_ART[分支 id]`（`s` 小點、`b` 大點、`ch` 抉擇＋三個選項、`L` 連線、`P` 路徑），建在 `ASCN`（`nb` 鄰居）與 `ASCE`（邊 `[甲, 乙, 圓心?]`）；大點是 `t1` 4 個＋`t2` 前 2 個，抉擇 `kind: 'c'`、三個選項 `kind: 'o'`（`hub`）是 `t2[2]`＋`u`；座標 `ascXY`（`AV_E`、`AV_K`）、弧 `ascCtl`；點亮 `ascCan`：`ascOpen`（旁邊有已點的節點、選項要抉擇已點且其他選項沒點、0.3.17 小點 `ascSmall`／大點各最多 4 個）＋`ascFree`（點了之後還補得滿 4 小 4 大，`ASCF` 快取）；剩餘數 `ascLeft` |
| 天賦樹的路線結構（0.3.14） | `js/data.js` | `TREE` 的 `sec`：每條路線用 `W(r, l)` 自己的座標，工具 `sm`／`nb`／`path`／`loop`；工具還有 `arc`（弧線串起來）；內段 `IN`（8 種，回傳入口與中圈連接點）、外段 `OUT`（8 種，回傳外圈連接點），組合見 `sec` 結尾；連線 `ln(a, b, 圓心)` 帶圓心時 `tree.js` 用 `arcCtl` 畫成弧；中圈／外圈連接用 `sec[j].mid`／`.out`；外圈專精群三種形狀 `form`、`CR`／`CRAD`／`RING`；舊存檔的節點保留在 `migrate` 的 `v < 20` |
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
| 今日委託、委託面板、足跡（0.2.13；0.3.15 委託面板取代附近） | `js/daily.js` | `QUESTS`、`daily`、`quest(k, n)`（各處呼叫：`winBattle`、`dungeonClear`、`pray`、`openChest`、`gather`、`obeliskCharge`、`mistWin`、`huntWalk`、`setPos`）、`dailyHTML`、`questHTML`／`questProg`（`quest` 面板：今日委託、所在區域進度、刷新倒數）、`footStep`（`trailStep`）、`footLv`／`footDens`／`footRare`（`genEntities` 怪物生成）、`drawFoot`；狀態 `S.daily`、`S.foot` |
| 多隻敵人戰鬥（0.3） | `js/battle.js`、`js/mp.js` | 野外群體隻數 `packN`（機率表 `PACK_P`）、同伴種類 `packBases`＋`packSeed`（位置與週期固定）、`packOf(lead, extra, n, seed)`；開打前陣容 `lineupHTML`（`ui.js`，`openEnt` 呼叫）；互動範圍 `RANGE`／`TOWN_R`／`reachOf`（core.js）；結算核心 `actResolve`（玩家行動→事件）、`enemyResolve`（敵人行動）、`petsAct`（召喚物）、`roundEnd`／`battleOpen`；單人 `startBattle`（`pack` 帶小怪 `packOf`）、`useSkill`、`playEv`（播事件）、`enemyPhase`；站位 `epos`／`ESLOT`、`drawEnemies`（選取特效 `drawSel`、換目標名字淡出 `selTrack`）、`enemyBars`、點敵人換目標 `pickTarget`；地城一層一群 `dunEnemy(D, room, extra)`；組隊 `mpResolve`／`mpEnemy`／`mpFx`、經驗平均 `mpRoomReward` |
| 行動值（戰鬥行動順序，0.3.10） | `js/battle.js`、`js/mp.js` | `AV_MAX`、`avSpd`、`avNext`（下一個行動的單位）、`avPreview`（橫列預測）；單人 `soloUnits`、`nextTurn`、`enemyAct`（`B.av`、`B.turns`）；組隊 `mpUnits`、`mpRound`（每層重置）、`mpNext`、`mpEnemy`（`MB.av`、`MB.ea`、`MB.order`） |
| T 級 T1～T16（0.3.10） | `js/items.js`、`js/ui.js`、`js/map.js` | `TIERS`、`T_MAX`、`tierNow`／`tierMax`、`tierRange`、`aLv`（地圖基準等級，生成怪物與地城都用這個，不要直接用 `S.lv`）、`dunLv`、`tierBonus`／`tierBoss`、`tierNeed`；強度在 `makeEnemy`、掉寶在 `dropLoot`／`dunReward`；突破試煉 `tierTownHTML`／`A.tierTrial`／`tierUpDone`（`dungeonClear`）；說明與切換 `tierInfoHTML`／`A.tierInfo`／`A.tierSet`；狀態 `S.tier`、`S.tmax` |
| 武器種類、雙手武器 | `js/data.js`、`js/sprites.js`、`js/battle.js` | `BASES.weapon`（`k` 外觀、`t` 類別、`th` 雙手；只能加在最後）、`wepKind`／`wepType`／`twoHand`、`WTAGN`；裝備衝突在 `A.equip`；手上武器圖 `drawWeapon` |
| 裝備品質、尾王三選一、單人地城（0.3.1.9） | `js/items.js`、`js/battle.js`、`js/map.js` | 品質 `Q_CAP`／`hasQ`／`qPhys`／`qArm`（`sumStats`、`stats`、`itemCard`）、通貨 `whet`／`scrap`（`CUR`、`craftable`、`craft`）；三選一 `bossPicks`（`dungeonClear`）；額外單人地城 `soloDunAt`（`SDCELL`，`genEntities`）；戰鬥面板四技能在 `renderBHud`／`mp.js` 的 `renderMBHud`（普攻 `.atk` 在右上、物品／逃跑 `.brow2`） |
| 技能標籤（0.3.1.8，0.3.18 直覺化） | `js/skills.js`、`js/ui.js`、`js/battle.js` | `skTags`（類型 `SKTYPE`、目標、元素、武器、效果，不放數字；CSS `.skt.ty/.tg/.el/.w/.eff`）、`skTagHTML(q, n, from)`（`from` 1 略過類型）、`skShort`（戰鬥按鈕）；說明 `gemDesc(q, st)` 關鍵字上色 `kw`（CSS `.kw`）；武器限制 `wOk`（`canPay` 一起檢查）、戰鬥按鈕小字 `skSub`、換武器提示 `wepWarn`；商店重複購買 `gemCount`；技能頁篩選 `SKF`／`skfOk`／`A.skFilter`（`SEL.skf`） |
| 頂部資訊條、區域特性說明（0.3.1.8） | `js/ui.js`、`js/map.js` | `ibarRender`（`renderHud`、`placeLabel` 呼叫）、`ZICON`、`A.zoneInfo`、`A.ibInfo`；DOM `#ibar` |
| 子頁面返回鍵（0.3.1.8） | `js/ui.js`、`index.html` | `sheetParent`、`A.sheetBack`；DOM `#sback`（`renderSheet` 開頭決定顯示） |
| 商店購買／出售（0.3.1.8） | `js/items.js`、`js/ui.js` | `openShop`（`SHOP.mode`／`SHOP.render`）、`shopSellHTML`、`A.shopTab`／`A.shopPick`／`A.shopQuick`／`A.shopSellGo` |
| 技能條件、狀態連動、冷卻、蓄力、戰吼（0.3.19） | `js/battle.js`、`js/skills.js`、`js/ui.js`、`js/mp.js` | 規則說明在 `battle.js` 的「技能的通用條件與狀態連動」註解；`skKey`、`cdLeft`／`charging`、條件倍率 `condMul`（`COND_ST`、`stackOf`）、按鈕預覽 `condTxt`、`skReady`／`skSub`（單人 `renderBHud`、組隊 `renderMBHud`、`mpResolve`）；`actResolve` 裡的連續 `comboN`、蓄力 `chg`、冷卻 `cd`（`roundEnd` 遞減）、強化 `empN`、引爆 `det`、消耗 `consume`、易傷 `vul`、衰老 `slow`（`avSpd`）、死亡印記 `dmark`、擴散 `spreadSt`、擊殺爆炸 `killBoom`、屍爆 `sac`、號令 `cmd`；戰吼 `cryResolve`；中毒／流血疊層 `addPoison`／`bleedTick`；狀態圖示 `AIL_E`／`AIL_H`／`AIL_NUM`、自己的增益 `heroAilHTML`；資料 `SK_COND`（現有技能的條件）與 0.3.19 新技能（`skills.js` 結尾）；說明 `gemDesc` |
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
| 腐化 | `js/items.js` | `corrupt`（`gemCraft` 的 `vaal`：超限、品質超限、擴槽、沒變化、毀滅；毀滅時輔助退回背包） |
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
| `pbrk` | 契靈突破 | 契靈卡片的「突破」（`pactBrkHTML`，`SEL.pbrk`） |
| `bag` | 背包 | 底部「背包」 |
| `slot` | 裝備欄 | 背包裡點裝備欄 |
| `item` | 裝備 | 背包裡點物品 |
| `base` | 據點 | 「冒險」→ 據點 |
| `quest` | 委託 | 「冒險」→ 委託（`questHTML`，在 `daily.js`） |
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
| `GA` | `gacha.js` | 祈願畫面目前的卡池（`pact`）與抽卡結果 |
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

### js/data.js（2661 行）

- **state**（3）
  `SLOT:5`、`KEY:6`
- **game data**（22）
  `CLASSES:26`、`OLDCLS:36`、`clsOf:37`、`SKILLS:39`、`GEM_MAX:68`、`GEM_DRAW:70`、`soulNeed:71`、`GCUR:74`、`GCURI:84`、`EL:85`、`MONS:86`、`MIMIC:1102`、`EMODS:1115`、`DTYPES:1128`、`DMODS:1239`、`DMODI:1252`、`UMODS:1254`、`EMODI:1261`、`FRAG_PARTS:1263`、`ZONE_CELL:1265`、`ZMODS:1267`、`RCOL:1277`、`RGLOW:1279`、`RAREA:1280`、`SLOTS:1282`、`SLOTN:1283`、`BASES:1296`、`DROPS:1374`、`T5:1375`、`ARMOR:1382`、`AFF:1384`、`AFFI:1538`、`STATN:1539`、`sg:1594`、`CUR:1640`、`CURI:1651`、`TH:1654`、`SPOKES:1946`、`TREE:2053`、`VER:2659`、`START:2660`

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

### js/skills.js（1243 行）

  `SKKIND:675`、`SKTYPE:691`、`skTags:705`、`skTagHTML:749`、`skShort:755`、`SK_COND:761`、`SUPG:986`、`SUPGI:1159`、`SUPM:1160`、`SUPREQ:1162`、`SUPREQN:1174`、`supFits:1186`

### js/audio.js（221 行）

- **audio**（3）
  `AU:4`、`audioInit:5`、`tone:30`、`noise:47`、`NS:65`、`nf:66`、`SONGS:71`、`PARSED:109`、`parse:110`、`playSong:122`、`schedule:128`、`SFX:147`、`sfx:213`、`buzz:216`

### js/items.js（1126 行）

- **player & items**（3）
  `newGame:4`、`makeItem:79`、`baseOf:98`、`Q_CAP:100`、`hasQ:101`、`qMul:102`、`qPhys:103`、`qArm:104`、`affFits:106`、`fitsSlot:108`、`rollAffix:110`、`cnt:131`、`addRandom:132`、`toMagic:142`、`rareName:149`、`toRare:150`、`itemTitle:156`、`itemName:167`、`itemSum:168`、`itemCard:177`、`sellVal:206`、`giveItem:207`、`giveCur:215`、`rollCur:218`、`curDot:228`、`craftable:230`、`craft:243`
- **skill gems**（261）
  `newGem:264`、`SOCK_MAX:265`、`gemOf:266`、`GEMK:267`、`gemQFx:269`、`gemSkill:312`、`mySkills:375`、`supUsed:377`、`supBlock:378`、`supIn:389`、`supOut:395`、`giveSup:401`、`Q_GEM:406`、`prismAdd:407`、`SOCK_CUR:409`、`gemCraftable:410`、`gemCraft:416`、`corrupt:439`、`gemLvBlock:462`、`gemSoulBack:470`、`GEM_START:474`、`GEMREQ:475`、`gemReq:476`、`gemTier:488`、`gemPrice:489`、`hasGem:490`、`gemCount:491`、`gemBuyBlock:492`、`giveGem:498`
- **stats**（507）
  `curSpec:509`、`STAT0:510`、`sumStats:613`、`auraExtra:638`、`SPIRIT0:649`、`auraCost:651`、`auraOn:652`、`HP_LV:666`、`stats:669`、`MECH:773`、`xpNeed:804`、`fullHeal:808`、`clampHP:813`、`autoPot:819`、`naturalRegen:841`、`addLog:849`、`gainXP:853`、`LV_MAX:868`、`treePts:869`、`dayPhase:870`、`buffOn:876`
- **enemies**（878）
  `TIERS:881`、`T_MAX:899`、`tierOfLv:901`、`tierMax:902`、`tierNow:903`、`tierRange:904`、`aLv:906`、`dunLv:911`、`tierBonus:916`、`tierBoss:920`、`tierNeed:922`、`pickMon:923`、`makeEnemy:934`、`rollMods:986`、`modNames:995`、`uwApply:997`
- **modal**（1016）
  `showModal:1017`、`hideModal:1023`、`busy:1026`、`openShop:1027`、`SHOP:1125`

### js/battle.js（2675 行）

- **battle: painted backgrounds**（3）
  `bbg:4`、`BW:7`、`sizeBattle:10`、`blob:20`、`paintBG:27`
- **battle: logic**（238）
  `BFX:239`、`POS:241`、`ESLOT:246`、`battleSc:271`、`epos:273`、`etop:287`、`placeBName:288`、`AIL_E:294`、`AIL_NUM:317`、`ailHTML:318`、`heroAilHTML:330`、`placeAil:338`、`bossBar:345`、`enemyBars:355`、`setFloor:365`、`PORT:370`、`portrait:371`、`renderOrder:381`、`bmsg:390`、`pop:397`、`anim:401`、`animOff:404`、`later:418`
- **battle: rules（單人與組隊共用）**（424）
  `eInit:426`、`PACK_P:435`、`packN:436`、`packSeed:446`、`packBases:447`、`packOf:461`、`skTag:479`、`supOf:481`、`bsum:492`、`mitigate:494`、`skCost:502`、`lifeCost:503`、`wOk:505`、`canPay:506`、`skSub:511`、`skReady:520`、`payCost:521`、`costTxt:527`、`skSt:532`、`skByKey:545`、`extraHit:546`、`heroPacket:547`、`heroDmg:562`、`heroAil:576`、`poisonTick:623`、`bleedTick:625`、`addPoison:626`、`takeDmg:632`、`hitCol:643`、`aliveIdx:651`、`skKey:659`、`cdLeft:660`、`charging:661`、`COND_ST:662`、`stackOf:673`、`condMul:675`、`condTxt:690`、`actResolve:703`、`cryResolve:995`、`addBuff:1039`、`petsAct:1052`、`enemyResolve:1075`、`AV_MAX:1216`、`avSpd:1218`、`avNext:1220`、`avPreview:1237`、`roundEnd:1242`、`battleOpen:1256`
- **battle: solo**（1269）
  `heroMe:1271`、`startBattle:1301`、`pickTarget:1340`、`renderBHud:1370`、`playEv:1456`、`soloExt:1510`、`useSkill:1523`、`bItem:1550`、`flee:1595`、`allDead:1610`、`afterPlayer:1611`、`soloUnits:1623`、`nextTurn:1628`、`enemyAct:1647`
- **dungeons (shared by solo and party)**（1662）
  `dunSpec:1664`、`dunName:1694`、`BIGBOSS:1704`、`dunEnemy:1707`、`dropLoot:1813`、`SOUL_MUL:1895`、`gemLoot:1896`、`mechOf:1923`、`supLoot:1933`、`ONSITE_BONUS:1956`、`onsiteNow:1957`、`dunReward:1959`、`dunModsHTML:1999`、`lootList:2005`、`winBattle:2014`、`loseBattle:2115`、`endBattle:2139`、`enterDungeon:2148`、`nextRoom:2166`、`dungeonClear:2186`、`BP_ARMOR:2242`、`bossPicks:2244`
- **battle: drawing**（2326）
  `drawEnemies:2328`、`selTrack:2369`、`drawSel:2380`、`drawPets:2415`、`renderBattle:2424`、`drawWeapon:2500`、`drawFx:2578`

### js/map.js（1727 行）

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
  `wv:1062`、`VW:1064`、`cam:1067`、`ZMIN:1068`、`sizeWorld:1070`、`SX:1077`、`BGPAT:1079`、`bgPattern:1080`、`glow:1093`、`label:1100`、`sprScale:1119`、`viewChunks:1121`、`camLoadT:1129`、`renderWorld:1130`、`arrows:1428`
- **input**（1458）
  `ptrs:1459`、`drag:1460`、`tapOK:1494`、`endPtr:1495`、`tapWorld:1516`
- **movement**（1550）
  `lastFrame:1551`、`SIM_SPEED:1554`、`simSpeed:1555`、`setPos:1556`、`checkArrive:1586`
- **GPS**（1614）
  `GPS:1616`、`gpsStart:1617`、`gpsStop:1655`、`tick:1662`、`timeRegen:1689`、`mmss:1698`、`plT:1702`、`placeLabel:1703`

### js/tree.js（496 行）

- **passive tree (full screen)**（3）
  `startOf:5`、`treeAdj:6`、`canAlloc:16`、`pathTo:20`、`canRefund:47`、`treeTotals:64`、`TV:75`、`DISC_R:77`、`openTree:94`、`closeTree:102`、`sizeTree:110`、`treeFit:118`、`TX:124`、`NR:126`、`drawTree:127`、`arcCtl:283`、`drawDisc:293`、`renderTreeCard:334`

### js/ui.js（1933 行）

- **HUD & sheets**（3）
  `renderHud:4`、`ZICON:22`、`ibarRender:32`、`toast:55`、`openSheet:62`、`closeSheet:70`、`TITLES:76`、`NAVG:97`、`navG:116`、`navClose:117`、`navOpen:126`、`KIND:155`、`bar:164`、`entIcon:167`、`fmt1:201`、`curRow:202`、`bagTabs:206`、`curRowG:213`、`BUFFN:216`、`kw:225`、`wepWarn:227`、`gemDesc:236`、`SKF:348`、`skfOk:356`、`gemKc:368`、`gemCell:369`、`gemRow:374`、`auraBlock:380`、`supPrice:386`、`supBuyBlock:387`、`supN:393`、`supHint:395`、`supLine:396`、`gemShopHTML:399`、`gshopKind:418`、`supShopHTML:427`、`prayed:437`、`sheetParent:439`、`renderSheet:448`、`nearTownE:663`、`shopSellHTML:667`、`canSell:686`、`worseThanEq:692`、`sellSel:697`、`bagListHTML:699`
- **entity interaction**（717）
  `openEnt:718`、`lineupHTML:867`、`tierTownHTML:879`、`tierUpDone:887`、`tierInfoHTML:897`、`onSite:909`、`ONSITE_K:911`、`siteBonus:912`、`inRange:913`
- **bases**（915）
  `prodRate:916`、`stored:917`、`baseName:918`、`flagCheck:919`
- **actions**（927）
  `authForm:929`、`A:961`

### js/endgame.js（836 行）

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
  `SILK:430`、`SILK_FREE:431`、`silkLoad:432`、`baseSync:445`、`SILK_MSG:455`、`silkCreate:465`、`silkRemove:472`、`specialty:479`、`caravans:480`、`silkView:501`
- **sheets**（515）
  `SEL:516`、`chip:517`、`baseHTML:519`、`silkHTML:545`、`siteEnt:566`、`steleHTML:571`、`MAT_TABS:608`、`matsHTML:614`、`ENTURL:661`、`entURL:662`、`portalPick:667`
- **actions**（673）

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

### js/demon.js（864 行）

- **sprites & data**（3）
  `pad16d:4`、`MMODS:76`、`mistApply:84`、`MISTMON:100`、`MIST_TIERS:145`、`ROMAN:152`、`SINS:154`、`SINI:219`、`SIN_COST:220`、`LEGENDS:223`、`LEGI:281`、`makeLegend:282`、`JAFF:292`、`JEWEL_MAX:311`、`makeJewel:312`、`giveJewel:321`、`jewelTxt:328`、`jewelCap:330`、`jewelsIn:331`、`jewelStats:336`
- **map: mist seals, active mist, sin statues**（343）
  `MS_CELL:344`、`MZ:347`、`mistAt:348`、`mistProg:349`、`demonSpawns:350`、`MQ_CELL:478`、`mistify:482`、`drawSeals:496`、`drawSealMark:559`、`mistWin:597`
- **sin lords**（617）
  `SINSPR:619`、`makeSinLord:628`、`makeSinKing:653`、`sinTurn:675`、`sinHit:693`、`sinBattleWin:704`、`sinReward:710`
- **sheets**（739）
  `sinHTML:740`、`sinMods:748`、`demonHTML:758`、`jewelHTML:765`、`socketCardHTML:778`
- **actions**（800）

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

### js/daily.js（199 行）

- **今日委託**（3）
  `QUESTS:5`、`QUESTI:19`、`DAILY_N:20`、`today:22`、`daily:23`、`quest:38`、`questReward:55`、`dailyHTML:72`
- **委託面板（0.3.15，原本的「附近」）**（85）
  `questProg:88`、`questHTML:127`
- **足跡**（141）
  `FOOT_CELL:143`、`FOOTA:147`、`footKey:148`、`footN2Lv:149`、`footLv:150`、`footStep:155`、`footDens:180`、`drawFoot:183`

### js/asc.js（2234 行）

- **data**（69）
  `ASC_LV:70`、`N:73`、`ASC:74`、`TAGN:859`、`SUPN:877`、`SMG:901`、`ASCN:930`、`ASCB:931`、`ASC_ART:937`、`ASCE:1560`
- **state & stats**（1625）
  `ASCD:1626`、`ascPts:1627`、`ascUsed:1628`、`ascNext:1629`、`ascOn:1630`、`ascStats:1635`、`ascSup:1642`、`ascTxt:1644`、`ascCostTxt:1656`、`ascCan:1658`、`ascSmall:1665`、`ascOpen:1667`、`ASCF:1676`、`ascFree:1677`、`ascNear:1689`、`ascLeft:1691`、`ascResetCost:1695`、`ascAlert:1697`
- **icons**（1699）
  `ASCI:1701`、`ascIcon:1702`
- **board（0.3.0.3：比照天賦樹的全螢幕昇華盤）**（1727）
  `AV:1729`、`ascMine:1731`、`AV_ANG:1732`、`AV_E:1736`、`ascXY:1738`、`ascCtl:1749`、`AIMG:1761`、`ascImg:1762`、`AX:1772`、`openAsc:1774`、`closeAsc:1786`、`sizeAsc:1791`、`ascFit:1800`、`ascState:1827`、`drawAsc:1832`、`renderAscCard:1940`
- **trials**（2080）
  `ascTownHTML:2082`、`ascTrialDone:2089`
- **actions**（2096）

### js/gacha.js（767 行）

- **pacts**（6）
  `PRAR:8`、`PTW:23`、`PTAG:30`、`PAFF:49`、`PAFFI:345`、`PACTS:347`、`PACTI:380`、`PD:382`、`pactOf:388`、`pactKind:389`、`pactSlots:394`、`pactsOn:395`、`pactIsOn:399`、`pactOpen:401`、`pactFodder:406`、`rollTier:411`、`rollPAff:417`、`rollPact:438`、`paffTags:445`、`pactTags:456`、`pactTagHTML:461`、`paffTxt:463`、`pactStats:471`、`pactSkLv:479`、`pactFollow:489`、`pactPal:494`、`pactImg:499`、`pactTile:500`
- **banners**（505）
  `BANNERS:506`、`ppool:516`、`GA:517`、`pityOf:518`、`gachaRoll:523`、`pactGive:535`、`gachaPull:542`、`revealNext:565`
- **ui**（576）
  `openGacha:577`、`closeGacha:585`、`renderGacha:590`、`pactAffHTML:626`、`pactCard:637`、`pactHTML:651`、`pactBrkHTML:683`、`pactRefresh:692`

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

### js/mp.js（1025 行）

  `PT:6`、`TURN_MS:7`、`ptMax:10`、`allReady:11`、`genCode:12`、`amLeader:14`、`mySnap:15`、`palFor:32`
- **party / lobby**（34）
  `ptSend:35`、`ptConnect:38`、`ptPill:52`、`partyCreate:61`、`partyJoin:93`、`partyLeave:119`、`ptLobby:136`、`ptGone:142`、`ptMsg:164`、`ptCodeHTML:238`、`partyHTML:240`
- **battle state (leader authoritative)**（268）
  `MBT:269`、`MBFX:271`、`pub:273`、`mpPush:281`、`mpArm:287`、`ptReady:297`、`mpStart:309`、`mpSpawn:381`、`mpUnits:396`、`mpRound:401`、`mpNext:407`、`mpOnAct:441`、`mpResolve:447`、`mpEnemy:493`、`mpRoomClear:515`
- **battle (every client)**（555）
  `mpEnter:556`、`mpBG:579`、`mpApply:585`、`mpFx:600`、`mpMy:659`、`mpRoomReward:680`、`mpClear:702`、`mpWipe:735`、`mpEnd:759`、`mpStop:776`、`mpLeave:787`
- **battle rendering**（802）
  `mpPos:804`、`renderMBHud:810`、`mpTurnT:910`、`mpTurnBar:911`、`renderMB:929`

### js/main.js（324 行）

- **boot**（3）
  `load:4`、`save:12`、`rebuildWorld:30`、`migrate:40`、`start:268`
<!-- index:end -->
