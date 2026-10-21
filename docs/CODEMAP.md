# 程式碼地圖

給開發者（和 Claude）快速定位用：要改某個功能時，用關鍵字搜這份找到檔案和函式（一個功能一列），再用行號只讀那一段，不用整個檔案讀一遍。

- 函式／常數的行號在 `docs/SYMBOLS.txt`（一行一個，Grep `^名稱 `）；下方「檔案區段大綱」只列區段。兩者都是 `python3 tools/codemap.py` 自動產生的，**改完 JS 後重跑一次**，行號才會對；它也會列出這份表格裡已經找不到的名稱。
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
| 圖騰、砲台、陷阱、地雷、技能欄 6 格（0.3.22） | `js/battle.js`、`js/skills.js`、`js/mp.js`、`js/ui.js` | 規則在 `battle.js` 的「戰場單位」註解：`UNIT_MAX`／`UNIT_N`、`unitSk`、`placeUnit`（`actResolve` 開頭）、`unitCaster`、`unitsAct`（`petsAct` 呼叫）、`mineBlast`（單人 `useSkill('mines')`、組隊 `mpResolve`）；陷阱在 `enemyResolve` 開頭觸發、圖騰被選為目標也在 `enemyResolve`；狀態 `me.units`／`me.traps`／`me.mines`，顯示在 `heroAilHTML`；技能資料在 `skills.js` 結尾（`totem`／`turret`／`trap`／`mine` 欄位）、轉換輔助 `sp_totem`／`sp_trap`／`sp_mine`（`SUPREQ.unit`）；技能欄 6 格：`renderBHud`／`renderMBHud` 的 `six`（CSS `.bcmd.six`）、技能頁 `.gslots.g6` |
| 技能石在戰鬥中的效果 | `js/battle.js` | `skSt`（技能石數值只對該技能生效、刻印共鳴 `engPct` 改成每顆輔助）、`supOf`（昇華＋技能石的 `gsup`）、`skByKey`（`'attack'`／`'s0'`～`'s3'`）、`gemLoot`（靈魂與刻印石系列）、0.3.20 `supLoot`／`mechOf`（寶石稜鏡與族裔輔助從野外機制掉、一般輔助從菁英與首領掉）；`dunReward` 的冥府傳送門與七宗罪首領 |
| 怪物種類與數值 | `js/data.js` | `MONS`、`MIMIC`、`EMODS`（菁英詞綴） |
| 怪物招式（0.3.38） | `js/monskill.js`、`js/battle.js`、`js/mp.js`、`js/ui.js` | 招式表 `MSK`（`m` 倍率、`t` 單體／全體、`dot`、`stun`／`frz`、`debuff`、`self` 狂暴／護盾／再生／召喚）、元素與階級招式池 `MSK_EL`／`MSK_T2`～`MSK_T5`；階級 `monTier`（一般 1、稀有 2、菁英紅名 3、首領 4、大王 5、七宗罪之王 6）、清單 `monSkills`（依本名固定）、`monSkillNames`；放招 `monPick`（冷卻 `e.mcd`）、`monCast`、打人 `mHit`；`enemyResolve` 一開始呼叫（`ext.boss`、`ext.av`）；戰鬥開始時 `e.msk`；怪物的 `rage`（`enemyDot` 倒數）、`eshield`（`actResolve` 先扣）；說明在 `openEnt` 與狀態面板 |
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
| PNG 怪物圖（0.3.1.3） | `art/monsters/`、`tools/art.py`、`js/art.js`、`js/sprites.js` | 原圖放 `art/monsters/檔名.png`（或子資料夾 `art/monsters/組名/`）→ `python3 tools/art.py` → 拼成 `img/組名.hash.png` 調色盤大圖（0.3.30，每張最多 255 色、12 張圖，沿用上次的分配）＋`ART_SHEET`／`ART`（圖名 `a_檔名`，怪物 `spr` 填這個）；用到才載大圖 `artSheet`（開場 5 秒後背景載其他張）、`artImg`、畫布 `artSprite`（`sprite` 遇到 `a_` 開頭時呼叫）、大小 `ART_U`（`drawSpr` 的 `sp.art`）、列表小圖 `paintIcon18`；提示詞與流程見 skill `.claude/skills/pixel-art` |
| 技能 PNG 圖示（0.3.39） | `art/icons/`、`tools/icon_sheets.py`、`tools/art.py`、`js/sprites.js` | 圖表 `docs/圖示圖表.md` → `icon_sheets.py slice` 切到 `art/icons/sk_代號.png`（實心背景自動去背，icon_sheets.py 的 clear_bg）→ `art.py` 打包（大圖 `ic_*`）；顯示 `skIcon(代號, 原本圖示)`（沒有就用 8×8 `iconURL`）、按鈕 `icoSrc`；技能石要有 `k`（`gemSkill`）；用在 `gemCell`、`gemRow`、技能石商店、戰鬥按鈕（`renderBHud`／`renderMBHud`）；CSS `.cico.sk`、`.bcmd.six .cb img` |
| 裝備圖示、材質階級（0.3.1） | `js/gear.js` | `GEAR`（每個底材一張 12×12，索引對應 `BASES`，新底材要補圖）、`MATC`／`BLADEC`／`TRIMC`／`GEMC`、`tierOf`／`TIERN`、`gearPal`、`gearIcon`（`slotIcon` 呼叫） |
| 點地圖移動速度（0.3.1.1，0.3.33 滑條） | `js/map.js`、`js/ui.js` | `SIM_SPEED`、`SIM_MAX`（10 倍）、`simSpeed()`（乘上 `S.simSpd`）；設定面板的滑條 `#simSpd`（`ui.js` 的 `input`／`change` 監聽，`.slider`） |
| 背包批量賣出、上鎖（0.3.1） | `js/ui.js` | `canSell`（城鎮或據點）、`bagListHTML`、`worseThanEq`、`sellSel`、`A.sellMode`／`A.sellPick`／`A.sellQuick`／`A.sellMany`／`A.lock`、單件 `A.sell`；勾選狀態 `SEL.sell`、上鎖 `it.lock` |
| 裝備生成、詞綴、通貨製作 | `js/items.js` | `makeItem`、`rollAffix`、`craftable`、`craft` |
| 商店 | `js/items.js` | `openShop` |
| 升級曲線 | `js/items.js` | `xpNeed`、`gainXP`、`treePts` |
| 獲取倍率（0.3.34，設定滑條） | `js/items.js`、`js/battle.js`、`js/mp.js`、`js/ui.js` | `RATES`／`RATE_MAX`／`rate(k)`（`S.rates`：`xp`、`gold`、`drop`）；套用在 `winBattle`、`mpRoomReward`（經驗、金幣）、`dropLoot`／`gemLoot`／`supLoot`（掉寶）、`dunReward`（金幣、通貨）；滑條 `input[data-rate]`（`ui.js` 的 `input`／`change` 監聽） |
| 怪物生成（等級、稀有度） | `js/items.js` | `pickMon`、`makeEnemy` |
| 單人戰鬥流程 | `js/battle.js` | `startBattle`、`useSkill`（呼叫 `actResolve`）、`playEv`、每幀 `soloStep`（`renderBattle` 呼叫）、`meReady`、`enemyAct`、勝負 `soloEnd`、`winBattle`、`loseBattle`；七宗罪等掛鉤 `soloExt` |
| 戰鬥規則（單人＋多人共用） | `js/battle.js` | `skCost`、`canPay`、`payCost`、`heroPacket`、`heroDmg`、`heroAil`、`takeDmg`、`mitigate` |
| 掉寶、地城獎勵 | `js/battle.js` | `dropLoot`、`dunReward`；靈魂、祈願石與刻印石 `gemLoot`；現場加成 `ONSITE_BONUS`、`onsiteNow`（判定現場用 `ui.js` 的 `onSite`；只有石碑、魔法陣有加成：`ONSITE_K`／`siteBonus`） |
| 亡靈區、亡靈怪、亡靈祭壇與軍團長、亡靈王 | `js/undead.js` | `undeadSpawns`（由 `endgameSpawns` 呼叫）、`UDZ`、`UNDEAD`、`drawUndead`、`undeadWin`、`commanderWin`、`kingWin`、`A.udBoss`、`A.udKing` |
| 亡靈精華與亡靈製作（屍化值） | `js/undead.js` | `ESS`（精華對應的詞綴）、`UCUR`、`ucReroll`、`ucConv`、`ucAdd`、`ucAff`、`ucBlock`、`undeadCraftHTML`（裝備詳情頁）；屍化值存在裝備的 `sh`、次數 `uc` |
| 魔霧區、魔霧詞綴與專屬怪、進度與碎片 | `js/demon.js` | `demonSpawns`（由 `endgameSpawns` 呼叫，產生 `MZ` 魔霧區）、`mistAt`、`mistProg`、`MIST_TIERS`、`MMODS`／`mistApply`、`MISTMON`、`mistify(e, q, k, Z)`、`drawSeals`（紫色圓圈與光柱）／`drawSealMark`（遠距離符號）、`mistWin`；各區進度 `S.mistp`（每輪 `_ep` 換新） |
| 魔霧四凶與燭龍（0.3.24） | `js/demon.js`、`js/battle.js`、`js/ui.js` | `XIONG`／`XIONGI`、`xiongOf`、`xseal`／`xsealAll`（`S.xseal`）、`makeXiong`、`makeZhulong`、`beastTurn`（`enemyResolve` 開頭）、`xiongWin`／`zhulongWin`（`winBattle` 的 `B.xiong`／`B.zhulong`）、`A.xiongGo`／`A.zhulongGo`（`openEnt` 的 `mseal`）；看不到行動順序 `hideAv`（`renderBHud`、`renderMBHud`）、黑夜打空 `blind`（`actResolve`）；魔霧進度滿 `mistWin` |
| 七罪據點（0.3.25 攻佔城鎮，0.3.37 改成地圖上的據點） | `js/demon.js`、`js/battle.js`、`js/ui.js`、`js/map.js` | `SIEGE_LV`（5）／`SG_CELL`／`SIEGE_R`、`SIEGE_FX`、信徒 `SINF`（`followerBase`／`followerize`／`makeFollower`）、這一輪的據點 `SZ`（`siegeZones`，跟魔霧一樣 `ep2` 每 2 小時換）、`siegeAt`、進度 `sgRec`／`sgProg`／`sgDone`（`S.sgp`）、`siegeSpawns`（`demonSpawns`，中心 `kind: 'szone'` 與信徒）、`drawSiege`（`map.js` 繪製）、`siegeApply`（`startBattle`，`B.siegeK`、`B.me.slow`／`charmed`）、`siegeWin`（`winBattle`）、`siegeDone`（`sinReward`，`S.sgDun`）、`siegeZoneHTML`（`openEnt` 的 `szone`）、`A.siegeGo`（`dt: 'sin'`、`siege: 1`，`dunSpec`／`dunEnemy`）；信徒特色 `followerTurn`（`enemyResolve`）、`followerAfter`、`followerHit`（`actResolve`）、玩家中毒 `pdot`（`roundEnd`）、模仿者 `me.lastEl` |
| 七宗罪雕像、7 個王的機制、殘魂（0.3.24 雕像拿掉） | `js/demon.js`、`js/battle.js` | `SINS`、`makeSinLord`、`sinTurn`（`enemyResolve`，經 `soloExt`）、`sinHit`（`actResolve`，經 `soloExt`）、`sinReward`（`dunReward`）；`dunEnemy` 的七宗罪段落 |
| 傳奇裝備 | `js/demon.js`、`js/items.js` | `LEGENDS`、`makeLegend`；屬性在 `sumStats`（`it.leg`），特效旗標 `legPride` 等在 `heroDmg`／`heroAil`／`useSkill`／`bItem` |
| 惡魔珠寶與天賦盤珠寶槽 | `js/demon.js`、`js/data.js`、`js/tree.js` | `JAFF`、`makeJewel`、`jewelCap`、`jewelStats`、`socketCardHTML`、`A.jIn`／`A.jOut`；槽位在 `TREE` 結尾（`type: 'socket'`），鑲嵌狀態 `S.jsock` |
| 今日委託、委託面板、足跡（0.2.13；0.3.15 委託面板取代附近） | `js/daily.js` | `QUESTS`、`daily`、`quest(k, n)`（各處呼叫：`winBattle`、`dungeonClear`、`pray`、`openChest`、`gather`、`obeliskCharge`、`mistWin`、`huntWalk`、`setPos`）、`dailyHTML`、`questHTML`／`questProg`（`quest` 面板：今日委託、所在區域進度、刷新倒數）、`footStep`（`trailStep`）、`footLv`／`footDens`／`footRare`（`genEntities` 怪物生成）、`drawFoot`；狀態 `S.daily`、`S.foot` |
| 多隻敵人戰鬥（0.3） | `js/battle.js`、`js/mp.js` | 野外群體隻數 `packN`（機率表 `PACK_P`）、同伴種類 `packBases`＋`packSeed`（位置與週期固定）、`packOf(lead, extra, n, seed)`；開打前陣容 `lineupHTML`（`ui.js`，`openEnt` 呼叫）；互動範圍 `RANGE`／`TOWN_R`／`reachOf`（core.js）；結算核心 `actResolve`（玩家行動→事件）、`enemyResolve`（敵人行動）、`petsAct`（召喚物）、`roundEnd`／`battleOpen`；單人 `startBattle`（`pack` 帶小怪 `packOf`）、`useSkill`、`playEv`（播事件）、`enemyAct`；站位 `epos`／`ESLOT`、`drawEnemies`（選取特效 `drawSel`、換目標名字淡出 `selTrack`）、`enemyBars`、點敵人換目標 `pickTarget`；地城一層一群 `dunEnemy(D, room, extra)`；組隊 `mpResolve`／`mpEnemy`／`mpFx`、經驗平均 `mpRoomReward` |
| 行動值（戰鬥行動順序，0.3.10） | `js/battle.js`、`js/mp.js` | `AV_MAX`、`avSpd`、`avNext`／`avPreview`（橫列預測）；單人 `soloUnits`（`B.av`）；組隊 `mpUnits`、`mpRound`（每層重置）、`mpEnemy`（`MB.av`、`MB.ea`、`MB.order`） |
| 即時行動條、冷卻（秒）、自動施放（0.3.35） | `js/battle.js`、`js/mp.js`、`js/skills.js`、`js/ui.js` | 規則在 `battle.js` 的「即時行動條」註解：`TURN_S`（一跳 3 秒，資料的「回合」= 一跳）、`ATB_K`、`CDR_MAX`（40%）、`AUTO_WAIT`、`STAGGER`；冷卻 `skCdS`／`cdrOf`／`cdTick`（`me.cd`、`me.cdMax` 秒）、自動施放 `autoPick`（輔助 `sp_auto`：`sup.auto`／`cdAdd`）；每跳 `tickResolve`（`enemyDot`、`roundEnd`、`petsAct`）；單人 `soloStep`／`meReady`／`soloEnd`（`B.hold`／`B.anim`／`B.over`／`B.ready`／`B.tick`）、開場 `atbStart`；組隊隊長 `mpClock`（每 100 毫秒）、`mpRun`、`mpOnAct`（`MB.ready`／`MB.rt`／`MB.q`／`MB.lock`）、隊員補間 `mpLocal`（`MBloc`）、`mpMine`；畫面 `avBar`／`cdMask`／`atbPaint`、說明文字秒數 `secs`／`tLeft`；技能冷卻表 `SK_CD`（`skills.js` 結尾）；冷卻縮減詞綴 `cdr`（`AFF`、`PAFF`、`STATN`）；地圖「走過去戰鬥」`A.engage`／`engageCheck`（`setPos` 呼叫） |
| T 級 T1～T16（0.3.10） | `js/items.js`、`js/ui.js`、`js/map.js` | `TIERS`、`T_MAX`、`tierNow`／`tierMax`、`tierRange`、`aLv`（地圖基準等級，生成怪物與地城都用這個，不要直接用 `S.lv`）、`dunLv`、`tierBonus`／`tierBoss`、`tierNeed`；強度在 `makeEnemy`、掉寶在 `dropLoot`／`dunReward`；突破試煉 `tierTownHTML`／`A.tierTrial`／`tierUpDone`（`dungeonClear`）；說明與切換 `tierInfoHTML`／`A.tierInfo`／`A.tierSet`；狀態 `S.tier`、`S.tmax` |
| 武器種類、雙手武器 | `js/data.js`、`js/sprites.js`、`js/battle.js` | `BASES.weapon`（`k` 外觀、`t` 類別、`th` 雙手；只能加在最後）、`wepKind`／`wepType`／`twoHand`、`WTAGN`；裝備衝突在 `A.equip`；手上武器圖 `drawWeapon` |
| 裝備品質、尾王三選一、單人地城（0.3.1.9） | `js/items.js`、`js/battle.js`、`js/map.js` | 品質 `Q_CAP`／`hasQ`／`qPhys`／`qArm`（`sumStats`、`stats`、`itemCard`）、通貨 `whet`／`scrap`（`CUR`、`craftable`、`craft`）；三選一 `bossPicks`（`dungeonClear`）；額外單人地城 `soloDunAt`（`SDCELL`，`genEntities`）；戰鬥面板四技能在 `renderBHud`／`mp.js` 的 `renderMBHud`（普攻 `.atk` 在右上、物品／逃跑 `.brow2`） |
| 技能標籤（0.3.1.8，0.3.18 直覺化） | `js/skills.js`、`js/ui.js`、`js/battle.js` | `skTags`（類型 `SKTYPE`、目標、元素、武器、效果，不放數字；CSS `.skt.ty/.tg/.el/.w/.eff`）、`skTagHTML(q, n, from)`（`from` 1 略過類型）、`skShort`（戰鬥按鈕）；說明 `gemDesc(q, st)` 關鍵字上色 `kw`（CSS `.kw`）；武器限制 `wOk`（`canPay` 一起檢查）、戰鬥按鈕小字 `skSub`、換武器提示 `wepWarn`；商店重複購買 `gemCount`；技能頁篩選 `SKF`／`skfOk`／`A.skFilter`（`SEL.skf`） |
| 頂部資訊條、區域特性說明（0.3.1.8） | `js/ui.js`、`js/map.js` | `ibarRender`（`renderHud`、`placeLabel` 呼叫）、`ZICON`、`A.zoneInfo`、`A.ibInfo`；DOM `#ibar` |
| 子頁面返回鍵（0.3.1.8） | `js/ui.js`、`index.html` | `sheetParent`、`A.sheetBack`；DOM `#sback`（`renderSheet` 開頭決定顯示） |
| 商店購買／出售（0.3.1.8） | `js/items.js`、`js/ui.js` | `openShop`（`SHOP.mode`／`SHOP.render`）、`shopSellHTML`、`A.shopTab`／`A.shopPick`／`A.shopQuick`／`A.shopSellGo` |
| 技能條件、狀態連動、冷卻、蓄力、戰吼（0.3.19） | `js/battle.js`、`js/skills.js`、`js/ui.js`、`js/mp.js` | 規則說明在 `battle.js` 的「技能的通用條件與狀態連動」註解；`skKey`、`cdLeft`／`charging`、條件倍率 `condMul`（`COND_ST`、`stackOf`）、按鈕預覽 `condTxt`、`skReady`／`skSub`（單人 `renderBHud`、組隊 `renderMBHud`、`mpResolve`）；`actResolve` 裡的連續 `comboN`、蓄力 `chg`、冷卻 `cd`（`roundEnd` 遞減）、強化 `empN`、引爆 `det`、消耗 `consume`、易傷 `vul`、衰老 `slow`（`avSpd`）、死亡印記 `dmark`、擴散 `spreadSt`、擊殺爆炸 `killBoom`、屍爆 `sac`、號令 `cmd`；戰吼 `cryResolve`；中毒／流血疊層 `addPoison`／`bleedTick`；狀態圖示 `AIL_E`／`AIL_H`／`AIL_NUM`、自己的增益 `heroAilHTML`；資料 `SK_COND`（現有技能的條件）與 0.3.19 新技能（`skills.js` 結尾）；說明 `gemDesc` |
| 混沌傷害、武器限制、技能篩選（0.3.36） | `js/battle.js`、`js/items.js`、`js/data.js`、`js/skills.js`、`js/ui.js` | 傷害封包多了 `chaos`、抗性陣列第 4 格是混沌（`mitigate`、`res[3]`）；屬性 `addChaos`／`chaosPct`／`resChaos`（`stats` 的 `chaos`、`elm.chaos`、`res.chaos`）；輔助效果 `pkSup`（`cvFire`… 轉換、`gFire`… 附加、`eleMore`／`physMore`／`noEle`）、`noAil`／`noCrit`／`avBack`／`mpLeech`／`foesCap`；武器 `wOk`（`w: 'melee'`、`oh: 'shield'`、`st.otag`）；技能池擴充在 `skills.js` 結尾的「0.3.36」區段；篩選 `SKW`／`skwOk`／`skfRows`、輔助商店 `SUPF`／`supfOk`（`A.skWep`、`A.supF`） |
| 技能石資料與效果 | `js/skills.js`、`js/items.js`、`js/battle.js` | `SKILLS` 擴充欄位（`w`、`tg`、`hits`、`chain`、`proj`、`addEl`、`bleed`、`stun`、`mark`、`curse`、`exec`、`pet`、`buff`、`lifeCost`）；等級成長 `gemSkill`；說明 `gemDesc`（`ui.js`） |
| 昇華（0.3） | `js/asc.js`、`js/items.js` | 資料 `ASC`（職業→分支→`t1`／`t2`／`u`）、節點表 `ASCN`／`ASCB`、輔助效果文字 `SUPN`；屬性 `ascStats`（`sumStats`）、`ascSup`（`stats` 的 `sup`，戰鬥用 `supOf`）；昇華盤 `openAsc`／`drawAsc`／`renderAscCard`（座標 `ascXY`、視角 `AV`、`ascFit`）、小點圖示 `SMG`、圖示 `ascIcon`、換分支 `A.ascSwitch`；試煉 `ascTownHTML`（城鎮面板）、`A.ascTrial`、`ascTrialDone`（`dungeonClear`）；狀態 `S.asc` |
| 首領專屬圖（0.2.13.1） | `js/sprites.js`、`js/demon.js`、`js/battle.js`、`js/undead.js` | `SPR.b_*` 與 `BOSSPAL`（sprites.js 結尾）；七宗罪 `SINSPR`（`makeSinLord`）、`makeSinKing`、地城首領 `BOSSSPR`（`dunEnemy`）、亡靈王 `A.udKing` |
| 地城首領抽籤、PNG 怪物圖（0.3.26） | `js/battle.js`、`tools/art.py`、`js/art.js` | `GHOSTS`／`ghostOf`（9 種台灣鬼怪，依地城種子抽）、`dunEnemy` 的固定首領（石獅、鍾馗、門神兩隻、閻羅王）；PNG 圖放 `art/monsters/`，`python3 tools/art.py` 產生 `img/` 大圖與 `js/art.js`，`spr` 填 `a_檔名` |
| 戰鬥的狀態與紀錄面板（0.3.27） | `js/battle.js`、`js/ui.js`、`index.html` | `BLOG`／`blog`／`logEv`（紀錄，`playEv` 與 `mpFx` 寫入）、`binfoRender`（狀態頁：`BUFFK` 增益說明、`AILD` 異常說明、`binfoTrait` 特色）、動作 `A.binfo`／`A.binfoTab`；按鈕排版在 `renderBHud`／`renderMBHud` |
| 印記兌換、生肖傳奇（0.2.13） | `js/hunt.js`、`js/items.js` | `ZLEG`（加進 `LEGENDS`／`LEGI`，`k` 是 `z_生肖`）、`zodStats`（`sumStats` 呼叫，生肖共鳴）、`sealHTML`（`seal` 面板）、`A.sealLeg`／`A.sealJewel`、`spendMarks`；`S.hunt.marks`（可消耗）、`S.hunt.slain`（稱號） |
| 地圖事件連動（0.2.13） | `js/demon.js`、`js/undead.js`、`js/hunt.js` | 霧中亡靈：`mistify`（`e.ud`）、`mistWin`／`undeadWin`（×1.5）；冥府生肖：`A.huntZod`（`ZOD_UW_R`、`uwz`）、`huntWin`；夜晚：`undeadSpawns` 半徑、魔霧刷新機率 |
| 獵殺等級（0.3.1.6） | `js/hunt.js`、`js/map.js`、`js/battle.js`、`js/ui.js` | `HUNT_LV`（三級的強化與倍率）、`huntLv`／`huntCfg`、`huntTick`（每分鐘熱度與關閉後消退，`map.js` 每幀呼叫）、`huntKills`（`winBattle`）、`huntBuff`（`A.fight`、`packOf`）、`packN` 的成群加成；紅圈在 `map.js` 畫玩家範圍圈的地方；狀態 `S.hunt.heat`／`tAt` |
| 狩獵墮落十二生肖（0.2.12） | `js/hunt.js` | `huntWalk`（`setPos` 呼叫）、`huntSpawns`（`genEntities` 最後）、`ZODIAC`（圖 `SPR.z_*`、配色 `ZBASE`）、`drawZodiacs`、`HSUM`、`makeBeast`、`makeZodiac`、`huntWin`（`winBattle`）、`huntHTML`（`hunt` 面板，0.3.31 照設計規範重排：獵殺等級 `.tiers`、規則收進 `details.more`）、`zodEntHTML`（`openEnt`）；狀態 `S.hunt`、`S.summons`（id 以 `z` 開頭） |
| 魔霧刷新、亡靈區／魔霧／侵蝕柱的地圖繪製 | `js/demon.js`、`js/undead.js`、`js/endgame.js` | `mistEp`／`mistify`（`q` 開頭的魔霧怪）、`drawSeals`／`drawSealMark`、`drawUndead`／`drawUndeadMark`、`drawObelisks`；遠距離顯示 `FAR`（`map.js`） |
| 七宗罪之王（4 人，0.2.11） | `js/demon.js`、`js/data.js` | `makeSinKing`、`A.sinKing`、`DTYPES.sinking`；付出殘魂在 `payDun` 的 `souls` |
| 等級上限 | `js/items.js` | `LV_MAX`（`gainXP`） |
| 石碑／魔法陣當場挑戰 | `js/endgame.js` | `A.siteGo` 設定 `SEL.site` 後打開石碑面板（`steleHTML` 的現場模式、`siteEnt`），開打走 `A.steleRun`／`A.circleOpen` |
| 背包材料分頁（碑文碎片、石碑、冥府碎片、卷軸） | `js/endgame.js`、`js/ui.js` | `MAT_TABS`、`matsHTML`、`A.matTab`、`A.matDrop`；分頁列 `bagTabs`（`ui.js`），目前分頁 `SEL.bag` |
| 戰鬥畫面（背景、特效、按鈕） | `js/battle.js` | `paintBG`、`renderBHud`、`renderBattle`、`drawFx`；怪物頭上名字 `placeBName`、左上角層數 `setFloor`、異常狀態圖示 `ailHTML`／`placeAil`（`AIL_E`、`AIL_H`）、頭目血條 `bossBar`、站位 `POS`（`y` 怪物、`hy` 玩家）、底部橫列行動順序 `renderOrder`（名字用 `shortName`，小頭像 `portrait`；多人在 `mp.js` 的 `renderMBHud`、倒數條 `mpTurnBar`、站位 `mpPos`） |
| 冥府看門人（牛頭、馬面、黑白無常） | `js/endgame.js` | `WATCHERS`、`summonWatcher` |
| 地圖道路資料、圖磚快取 | `js/map.js` | `OpenStreetMap vector tiles` 區段 |
| 地標城鎮清單 | `js/map.js` | `TOWNS`（前 11 個 id 不能改） |
| 地圖上的怪物、寶箱、地城、廟宇生成 | `js/map.js` | `spawns` 區段、`dungeonAt` |
| 迷霧、探索面積 | `js/map.js`、`js/main.js` | `fog of war` 區段、`explKm2`；存檔只存揭開的點 `S.trail`（`trailStep`，0.3.30 每 `TRAIL_G` 公尺一格一點、不截斷，`trailKey`／`trailC`），讀檔時 `rebuildWorld` 重播 `reveal` |
| 地圖物件什麼時候看得到 | `js/map.js` | `visible`（`MOBILE` 跟視野、`LANDMARK` 至少 `LM_VIS` 公尺） |
| 地圖繪製、右上角資訊 | `js/map.js` | `renderWorld`、`placeLabel`（0.3.31 點一下展開 `explMore`）；物件標籤 `qlabel`／`flushLabels`（0.3.31 依重要度畫、重疊略過）；每幀 `tick`，0.3.30 被面板蓋住時不畫 `mapCovered`、屬性快取 `worldStats` |
| 點地圖、走路、GPS | `js/map.js` | `input`、`movement`、`GPS` 區段 |
| 主畫面 HUD、底部導覽 | `js/ui.js` | `renderHud`、`NAVG`、`navOpen`；DOM 在 `index.html` 的 `#nav` |
| 各個面板（角色、背包、藏身處、設定…） | `js/ui.js` | `renderSheet` 的 `sheetName` 分支（見下表） |
| 點地圖物件後的互動（怪物、城鎮、地城） | `js/ui.js` | `entity interaction` 區段 |
| 藏身處（0.3.23 取代據點） | `js/endgame.js`、`js/ui.js` | 面板 `hideoutHTML`（sheet `base`，選單「冒險 → 藏身處」）、休息 `A.hideRest`／`hideRestLeft`（`HIDE_REST`、`S.hideRest`）、魔晶兌換 `A.cryTrade`（`CRY_COST`）；隨時能賣 `canSell`、亡靈製作 `atBase`（`undead.js`，一律 true） |
| 遠端互動範圍（0.3.23 拿掉） | `js/endgame.js` | `zones()` 回傳空的，`zoneOf`／`inZone`／`drawZones` 保留但不會有範圍；`flagsOn` 回傳空的 |
| 空白石碑、魔法陣、靈脈、侵蝕柱的生成 | `js/endgame.js` | `endgameSpawns`（由 `map.js` 的 `genEntities` 呼叫） |
| 碑文碎片、石碑、冥府碎片、組隊地城付費 | `js/endgame.js` | `rollInsc`、`makeTablet`、`makeFrag`、`capMods`、`payDun`；面板 `steleHTML` |
| 單人石碑／魔法陣／冥府傳送門的規格 | `js/data.js`、`js/battle.js` | `DTYPES.stele／circle／portal`；`dunSpec`（`floors`、`umods`、`norevive`）、`BIGBOSS` |
| 冥府詞綴、侵蝕柱充能、看門人 | `js/data.js`、`js/items.js`、`js/endgame.js` | `UMODS`、`EMODI`；`uwApply`；`obeliskCharge`、`summonWatcher`、`watcherWin` |
| 區域特性 | `js/data.js`、`js/endgame.js` | `ZMODS`、`ZONE_CELL`；`zoneXY`、`zoneAt` |
| 腐化 | `js/items.js` | `corrupt`（`gemCraft` 的 `vaal`：超限、品質超限、擴槽、沒變化、毀滅；毀滅時輔助退回背包） |
| 絲綢之路（0.3.23 拿掉） | `supabase/migrations/20261019000000_silk_road.sql` | 前端程式拿掉，資料表與 RPC 留著；之後改成城鎮之間的商路 |
| 按鈕動作 | `js/ui.js` | `A` 物件（HTML 的 `data-act="名稱"` 對應 `A.名稱`） |
| 像素圖、圖示 | `js/sprites.js` | `SPR`（16×16 角色與怪物）、`ICONS`（8×8 按鈕圖示）、`PIX`（通貨、裝備欄、天賦圖示） |
| 音樂、音效 | `js/audio.js` | `playSong`、`sfx` |
| 帳號、雲端存檔 | `js/cloud.js` | `cloudInit`、`cloudPush`、`authRegister`、`authLogin`、`authLogout` |
| 好友、組隊邀請 | `js/social.js` | `friendsLoad`、`friendsHTML`、`inviteFriend` |
| 組隊大廳、多人戰鬥 | `js/mp.js` | `partyCreate`、`partyJoin`、`partyHTML`、`mpResolve`、`mpEnemy`、`renderMBHud` |
| 存讀檔、存檔轉換、啟動 | `js/main.js` | `load`、`save`、`migrate`、`start`；存檔失敗提示 `saveFail`（0.3.30） |
| 樣式 | `css/style.css` | 依區塊註解（`/* ---------- shop ---------- */` 等）搜尋 |
| 設計規範、共用元件（0.3.31） | `docs/設計規範.md`、`css/style.css`、`.claude/skills/ui-design/` | `:root` 變數（字級 `--fs-cap`～`--fs-hero`、間距 `--sp-1`～`--sp-5`、圓角 `--r-*`、`--bad`／`--warn`／`--danger`／`--heat` 等）；元件 `.c-gold`／`.c-good`／`.c-warn`／`.c-bad`／`.c-dim`、列表按鈕 `.btn.buy`、摺疊說明 `details.more`（JS 用 `ui.js` 的 `more(標題, html)`）、等級格 `.tiers`、兩欄 `.g2`、卡片標題 `.ct`、按鈕第二行 `.bnote`；檢查工具 `audit.js` |

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
| `base` | 藏身處 | 「冒險」→ 藏身處（`hideoutHTML`，在 `endgame.js`） |
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
| `SEL` | `endgame.js` | 石碑面板選取中的碑文碎片與石碑 |
| `TV` | `tree.js` | 天賦樹畫面的縮放與位置 |

## 檔案區段大綱（自動產生）

格式：`名稱:行號`。粗體是檔案裡的區段註解（`/* ===== 區段 ===== */`）。

<!-- index:start -->

### js/core.js（71 行）

- **utils**（6），15 個宣告

### js/data.js（2718 行）

- **state**（3），2 個宣告
- **game data**（22），41 個宣告

### js/sprites.js（1374 行）

- **pixel sprites (original art)**（3），24 個宣告
- **icons: currency, item slots, passive nodes**（777），7 個宣告
- **boss sprites**（1029），1 個宣告

### js/gear.js（685 行）

- **0.3.1 裝備外觀：每種底材的 12×12 圖示、材質階級配色、角色外觀疊圖**（1），17 個宣告

### js/art.js（194 行）


### js/skills.js（1973 行）


### js/audio.js（221 行）

- **audio**（3），14 個宣告

### js/items.js（1145 行）

- **player & items**（3），27 個宣告
- **skill gems**（261），29 個宣告
- **stats**（508），23 個宣告
- **enemies**（897），16 個宣告
- **modal**（1035），5 個宣告

### js/battle.js（3414 行）

- **battle: painted backgrounds**（3），5 個宣告
- **battle: logic**（239），36 個宣告
- **battle: rules（單人與組隊共用）**（610），66 個宣告
- **battle: solo**（1812），20 個宣告
- **dungeons (shared by solo and party)**（2312），24 個宣告
- **battle: drawing**（3057），7 個宣告

### js/monskill.js（203 行）


### js/map.js（1761 行）

- **world coordinates: meters from 台中車站 (x 東, y 南)**（3），5 個宣告
- **OpenStreetMap vector tiles**（63），26 個宣告
- **extra sprites for the game map**（506），3 個宣告
- **extra sprites**（608），0 個宣告
- **fog of war (chunked)**（675），11 個宣告
- **spawns**（773），18 個宣告
- **world rendering**（1070），18 個宣告
- **input**（1485），5 個宣告
- **movement**（1578），5 個宣告
- **GPS**（1633），11 個宣告

### js/tree.js（496 行）

- **passive tree (full screen)**（3），18 個宣告

### js/ui.js（2019 行）

- **HUD & sheets**（3），53 個宣告
- **entity interaction**（810），11 個宣告
- **actions**（1018），2 個宣告

### js/endgame.js（691 行）

- **map objects**（3），2 個宣告
- **zones（0.3.23 起沒有遠端範圍）**（76），6 個宣告
- **zone modifiers**（107），2 個宣告
- **spawns**（116），3 個宣告
- **scrolls, inscriptions, tablets**（280），6 個宣告
- **underworld**（330），5 個宣告
- **sheets**（410），12 個宣告
- **actions**（538），0 個宣告

### js/undead.js（619 行）

- **data**（3），10 個宣告
- **zones**（233），8 個宣告
- **battle**（342），5 個宣告
- **undead crafting（0.3.23 起在藏身處）**（409），15 個宣告
- **actions**（545），0 個宣告

### js/demon.js（1452 行）

- **sprites & data**（3），19 個宣告
- **map: mist seals, active mist, sin statues**（341），10 個宣告
- **sin lords**（582），7 個宣告
- **sheets**（706），4 個宣告
- **actions**（763），0 個宣告
- **0.3.24 魔霧：山海經四凶與燭龍**（796），10 個宣告
- **0.3.25 七罪（0.3.37 改成地圖上的七罪據點）**（986），21 個宣告

### js/hunt.js（870 行）

- **data**（3），9 個宣告
- **state**（387），16 個宣告
- **enemies**（514），5 個宣告
- **sheet**（589），2 個宣告
- **印記兌換**（632），6 個宣告
- **actions**（704），1 個宣告

### js/daily.js（199 行）

- **今日委託**（3），8 個宣告
- **委託面板（0.3.15，原本的「附近」）**（85），2 個宣告
- **足跡**（141），8 個宣告

### js/asc.js（2234 行）

- **data**（69），10 個宣告
- **state & stats**（1625），18 個宣告
- **icons**（1699），2 個宣告
- **board（0.3.0.3：比照天賦樹的全螢幕昇華盤）**（1727），16 個宣告
- **trials**（2080），2 個宣告
- **actions**（2096），0 個宣告

### js/gacha.js（811 行）

- **pacts**（6），28 個宣告
- **banners**（549），8 個宣告
- **ui**（620），8 個宣告

### js/tutor.js（164 行）

- **tutorial**（3），5 個宣告

### js/cloud.js（161 行）

- **cloud save (Supabase)**（4），7 個宣告
- **accounts**（104），5 個宣告

### js/social.js（178 行）

- **profile & friends**（3），9 個宣告
- **party invites**（64），7 個宣告
- **friends sheet**（145），1 個宣告

### js/mp.js（1154 行）

- **party / lobby**（35），11 個宣告
- **battle state (leader authoritative)**（269），17 個宣告
- **battle (every client)**（643），11 個宣告
- **battle rendering**（905），6 個宣告

### js/main.js（401 行）

- **boot**（3），7 個宣告
<!-- index:end -->
