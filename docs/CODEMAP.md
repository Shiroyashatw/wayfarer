# 程式碼地圖

給開發者（和 Claude）快速定位用：要改某個功能時，用關鍵字搜這份找到檔案和函式（一個功能一列），再用行號只讀那一段，不用整個檔案讀一遍。

- 函式／常數的行號在 `docs/SYMBOLS.txt`（一行一個，Grep `^名稱 `）；下方「檔案區段大綱」只列區段。兩者都是 `python3 tools/codemap.py` 自動產生的，**改完 JS 後重跑一次**，行號才會對；它也會列出這份表格裡已經找不到的名稱。
- JS 用 prettier 排版（設定在 `.prettierrc`，寬度 120）：`npx prettier@3.3.3 --write js/*.js`。
- 所有 JS 是一般 `<script>`，依 `index.html` 的順序載入、共用全域變數；`main.js` 必須最後。

## 要改什麼，看哪裡

| 想改的功能 | 檔案 | 從這裡開始看 |
| --- | --- | --- |
| 版本號 | `tools/setver.py` | `python3 tools/setver.py 版本` 會改 `js/data.js` 的 `VER` 與 `index.html` 的 `?v=`；再更新 CHANGELOG、README |
| 一局的流程（0.1.0 肉鴿） | `js/run.js` | 規則說明在檔案開頭；章 `CH`、節點 `NODE`、`RUN_FLOORS`、`RUN_REST`；開始 `startRun`（`applyKit`、`applyMeta`）、結算 `endRun`（魂晶、祈願石、每日 ×1.5）、放棄 `A.runQuit`（`ui.js`）；狀態 `S.run`（`seed`、`ch`、`map`、`at`、`cleared`、`kills`、`elites`、`bosses`、`lvSeen`、`extraPicks`、`bless`、`seenEv`、`rerolls`、`bought`、`daily`、`cls`） |
| 章節地圖（節點地圖產生、畫面） | `js/run.js`、`css/style.css` | `genMap`（起點、路線不交叉 `cross`、種類權重）、`nextNodes`、`enterNode`／`NODE_GO`、`nodeDone`（旅途經驗）、`chapterClear`；畫面 `runmapRender`（`.rm-hd`、`.rm-map`、`.rn`、圖例 `.rm-lg`，打開時捲到能走的節點）、`viewRender`（主選單／地圖切換、底部導覽只在局裡顯示） |
| 怪物群、菁英、首領（各章） | `js/run.js`、`js/foes.js`、`js/zodiac.js`、`js/demon.js`、`js/undead.js` | `runLv`（怪物等級）、`chMob`（各章怪物池：`MONS` 的 `bg`、第三章 `UNDEAD`＋`MISTMON`＋`HELLMON`）、`fightGroup`、`eliteGroup`（墮落獸 `beastBase`＋`BEAST_X`、七罪信徒 `makeFollower`、冥府看門人 `WATCHERS`）、`bossGroup`（`GHOSTS`、`makeZodiac`、`makeXiong`、`PIRATE_KING`、`makeSinKing`、`udBoss`、`makeZhulong`、閻羅王；生命攻擊換算成每章目標值）、`nodeSeed` |
| 經驗、金幣、掉寶（一局裡） | `js/run.js`、`js/battle.js`、`js/items.js` | `runGain`（照節點給，`winBattle` 呼叫）、`runLootQ`（掉寶加成）、`xpNeed`（20＋18×等級）、`gainXP`；勝利後回血 `runWin` |
| 獎勵三選一、首領寶箱、重抽 | `js/run.js`、`js/battle.js` | `rewardPicks`（技能石、輔助寶石、裝備、金幣）、`bossPicks`（battle.js）、`pickModal`（`auto` 選完直接繼續、`regen` 重抽）、`runWin` |
| 天賦三選一（升級） | `js/run.js` | `pendPicks`、`passPool`（重要節點／基石，排除 `PASS_NO`）、`passTxt`、`treeIcURL`、`passModal`、地圖上的 `A.runPick` |
| 昇華三選一（首領之後） | `js/run.js`、`js/asc.js` | `ascModal`（第一章選分支、第二章選大點、`trials` 加契靈欄位）；昇華盤只能看（`renderAscCard` 的 `act`） |
| 非戰鬥節點 | `js/run.js`、`js/items.js` | `restNode`（回血或修練技能石）、`chestNode`（寶箱怪 `MIMIC`）、`shopNode`→`openShop`（庫存種子、`SHOP_CUR`、`S.run.bought`）、`eventNode` |
| 事件、祝福、每級成長 | `js/events.js` | `EVENTS`（`k`、`n`、`ch`、`t`、`opts(c)`）、`bless`、`runStats`（`sumStats` 呼叫：`RUN_LV` 每級成長＋`S.run.bless`）、`evFoe`（事件的怪） |
| 主選單、選角、局外升級、每日挑戰 | `js/meta.js` | `homeRender`、`clsModal`（`RUN_CLS`、`clsOpen`、解鎖 `S.meta.unlock`）、`applyKit`、`metaModal`（`META_UP`、`metaLv`、`S.meta.up`）、`applyMeta`（`START_BLESS`）、`today`／`dailySeed`／`dailyCls`／`dailyDone`（`S.meta.daily`）、`A.clsPick`／`A.metaShop`／`A.dailyGo` |
| 戰鬥速度、背景柔焦 | `js/battle.js`、`js/ui.js` | `bSpd`（`S.bspd`，`soloStep` 乘上去）、設定的 `A.bspd`；`paintBG` 的 `soft`（縮小畫布再放大，不用 filter blur） |
| 玩法說明（第一局） | `js/run.js` | `howTo`（`startRun` 在第一局呼叫） |
| 平衡測試（代打機器人） | `tools/bot.js` | 時間倍率、連跑幾局、每場紀錄；用法寫在檔案開頭 |
| 亡靈、魔霧、四凶與燭龍（第三章、第二章首領） | `js/undead.js`、`js/demon.js`、`js/battle.js` | 亡靈怪 `UNDEAD`、軍團長外觀 `UD_LORDS`、`udBoss`；魔霧怪 `MISTMON`、魔霧詞綴 `MMODS`／`mistApply`；四凶 `XIONG`／`makeXiong`、`makeZhulong`、機制 `beastTurn`（`enemyResolve`） |
| 天賦盤起點（之魂）、技能 | `js/data.js` | `CLASSES`（起點名稱、主色、開局技能石）、`SKILLS` |
| 技能石：等級、插槽、輔助寶石、品質（0.3.20） | `js/data.js`、`js/items.js`、`js/skills.js` | `GEM_MAX`、`soulNeed`、`GCUR`（刻印石系列開插槽、混沌刻印石重骰插槽數、寶石稜鏡加品質、冥府之血腐化）；技能石 `newGem`（`sock` 插槽數、`sp` 插著的輔助、`q` 品質）、`gemSkill`（技能石→戰鬥技能，加上品質與輔助：`gsup` 給 `supOf`）、品質效果 `gemQFx`（依技能特色自動決定）、`Q_GEM`／`prismAdd`、`mySkills`、`gemCraftable`／`gemCraft`（`SOCK_CUR`）、`corrupt`；輔助寶石資料 `SUPG`／`SUPGI`（`skills.js`，`sup` 戰鬥效果、`sk` 技能條件欄位、`req` 能插的技能 `SUPREQ`／`SUPREQN`、`conv` 轉換類、`lin` 族裔＋`m` 機制 `SUPM`）、`supFits`、`supBlock`／`supIn`／`supOut`／`giveSup`／`supUsed`（族裔同名限一顆）；背包 `S.sups` |
| 技能石面板（圖示格子、插槽、商店、分解；0.3.44 格子化 `.sgrid6`、下拉 `skfSel`） | `js/ui.js` | `renderSheet` 的 `skills`／`gem` 分支、`gemCell`（底色 `gemKc`、插槽點、品質 `.gq`）、輔助寶石列 `supLine`、紅點 `supHint`；商店 ；`A.gemLv`、`A.gemBreak`（輔助退回背包）、`A.gemCraft`、`A.supPick`／`A.supIn`／`A.supOut` |
| 技能石商店、靈魂升級（0.3.11） | `js/items.js`、`js/ui.js` | `gemReq`（需求等級，`GEM_START` 是 Lv1 的開局技能）、`gemTier`、`gemPrice`、`gemBuyBlock`、`soulNeed`、`gemSoulBack`；祈願石掉落在 `gemLoot` |
| 技能石在戰鬥中的效果 | `js/battle.js` | `skSt`（技能石數值只對該技能生效、刻印共鳴 `engPct` 改成每顆輔助）、`supOf`（昇華＋技能石的 `gsup`）、`skByKey`（`'attack'`／`'s0'`～`'s3'`）、`gemLoot`（靈魂與刻印石系列）、0.3.20 `supLoot`／`mechOf`（寶石稜鏡與族裔輔助從野外機制掉、一般輔助從菁英與首領掉）； 的冥府傳送門與七宗罪首領 |
| 怪物種類與數值 | `js/data.js` | `MONS`、`MIMIC`、`EMODS`（菁英詞綴） |
| 裝備底材、詞綴、通貨 | `js/data.js` | `BASES`、`AFF`、`CUR`、`STATN`（屬性的顯示文字） |
| 天賦樹節點與基石 | `js/data.js` | `TH`（主題與重要節點）、`SPOKES`（15 條路線與基石）、`TREE`（產生節點座標與連線） |
| 昇華分支圖案、三選一（0.3.16） | `js/asc.js` | 每條分支一張圖 `ASC_ART[分支 id]`（`s` 小點、`b` 大點、`ch` 抉擇＋三個選項、`L` 連線、`P` 路徑），建在 `ASCN`（`nb` 鄰居）與 `ASCE`（邊 `[甲, 乙, 圓心?]`）；大點是 `t1` 4 個＋`t2` 前 2 個，抉擇 `kind: 'c'`、三個選項 `kind: 'o'`（`hub`）是 `t2[2]`＋`u`；座標 `ascXY`（`AV_E`、`AV_K`）、弧 `ascCtl`；點亮 `ascCan`：`ascOpen`（旁邊有已點的節點、選項要抉擇已點且其他選項沒點、0.3.17 小點 `ascSmall`／大點各最多 4 個）＋`ascFree`（點了之後還補得滿 4 小 4 大，`ASCF` 快取）；剩餘數 `ascLeft` |
| 屬性計算（傷害、護甲、抗性、基石效果） | `js/items.js` | `sumStats`、`stats`（新屬性要加進 `STAT0`；每級成長 `HP_LV`、`MP_LV`） |
| 角色外觀（跟著裝備） | `js/gear.js` | `heroLook`（外觀代碼，多人傳 `look`）、`heroSpr(view, look)`（組出 `heroF:…`／`heroS:…` 像素圖）、`heroPal`（材質階級配色）、`GLOOK`、正面武器 `WFRONT`、副手 `OFRONT`；側面武器 `battle.js` 的 `drawWeapon`（`mc` 刃色） |
| PNG 怪物圖（0.3.1.3） | `art/monsters/`、`tools/art.py`、`js/art.js`、`js/sprites.js` | 原圖放 `art/monsters/檔名.png`（或子資料夾 `art/monsters/組名/`）→ `python3 tools/art.py` → 拼成 `img/組名.hash.png` 調色盤大圖（0.3.30，每張最多 255 色、12 張圖，沿用上次的分配）＋`ART_SHEET`／`ART`（圖名 `a_檔名`，怪物 `spr` 填這個）；用到才載大圖 `artSheet`（開場 5 秒後背景載其他張）、`artImg`、畫布 `artSprite`（`sprite` 遇到 `a_` 開頭時呼叫）、大小 `ART_U`（`drawSpr` 的 `sp.art`）、列表小圖 `paintIcon18`；提示詞與流程見 skill `.claude/skills/pixel-art` |
| 技能／裝備 PNG 圖示（0.3.39～0.3.40） | `art/sheets/`（圖表原圖）、`art/icons/`、`tools/icon_sheets.py`、`tools/art.py`、`js/sprites.js` | 圖表 `docs/圖示圖表.md` → 原圖放 `art/sheets/`、`icon_sheets.py process` 切到 `art/icons/sk_代號.png`／`gear_欄位_序號.png`（實心背景自動去背，icon_sheets.py 的 clear_bg）→ `art.py` 打包（大圖 `ic_*`）；顯示 `skIcon(代號, 原本圖示)`、裝備 `slotIcon`（都走 `artIconURL`）（沒有就用 8×8 `iconURL`）、按鈕 `icoSrc`；技能石要有 `k`（`gemSkill`）；用在 `gemCell`、`gemRow`、技能石商店、戰鬥按鈕（`renderBHud`）；CSS `.cico.sk`、`.bcmd.six .cb img` |
| 裝備圖示、材質階級（0.3.1） | `js/gear.js` | `GEAR`（每個底材一張 12×12，索引對應 `BASES`，新底材要補圖）、`MATC`／`BLADEC`／`TRIMC`／`GEMC`、`tierOf`／`TIERN`、`gearPal`、`gearIcon`（`slotIcon` 呼叫） |
| 藥水百分比與預覽、商店多買、特殊倉庫、快速比較（0.3.44） | `js/ui.js`、`js/items.js`、`index.html` | HUD `hpt`／`mpt`；`potVal`（items.js，共用回復量）、`potRow`（`.potr`／`.pbar`）；商店 `openShop` 的 `.buyn`；倉庫 ／`MAT_IC`；比較 `eqPower`／`eqCmp`／`cmpBadge`／`cmpTxt`；人形裝備欄 `.doll2` |
| 武器細分類、弩、箭袋（0.3.46） | `js/sprites.js`、`js/items.js`、`js/ui.js`、`js/skills.js`、`js/battle.js` | `wepCat`（13 類）、弩是 `t: 'xbow'`（`WTAGN`、`wOk` 的 melee、`SUPREQ.melee`、`SKW`）、弩技能 `xbolt`～`xsiege`（skills.js 結尾）；箭袋 `isQuiver`／`offOn`（`sumStats`、`offType`）、`A.equip` 的 clash 規則 |
| 背包、裝備詳情、契靈的格子版面（0.3.43） | `js/ui.js`、`js/items.js`、`js/gacha.js`、`css/style.css` | 共用元件 `.slot-g`（格子，`.r0`～`.r3`、`.fill` 給自帶外框的 `slotFramed` 圖示、`i.badge`）、`.chip`、`.sel`（`<select data-chg="動作">`，`change` 監聽呼叫 `A[動作]({k})`）、`moreK`（記住開關的摺疊）；背包 `renderSheet` 的 `bag` 分支、`curRow`／`curHelp`；裝備詳情 `item` 分支、`itemType`、`itemCard(it, title, {head, cmp})`、`dlt`；契靈 `pactHTML`／`pactCell`／`pactDetHTML`（sheet `pdet`，`SEL.pdet`，`A.pactDet`） |
| 裝備生成、詞綴、通貨製作 | `js/items.js` | `makeItem`、`rollAffix`、`craftable`、`craft` |
| 商店 | `js/items.js` | `openShop` |
| 升級曲線 | `js/items.js` | `xpNeed`、`gainXP`、`treePts` |
| 怪物生成（等級、稀有度） | `js/items.js` | `pickMon`、`makeEnemy` |
| 單人戰鬥流程 | `js/battle.js` | `startBattle`、`useSkill`（呼叫 `actResolve`）、`playEv`、每幀 `soloStep`（`renderBattle` 呼叫）、`meReady`、`enemyAct`、勝負 `soloEnd`、`winBattle`、`loseBattle`；七宗罪等掛鉤 `soloExt` |
| 戰鬥規則（單人＋多人共用） | `js/battle.js` | `skCost`、`canPay`、`payCost`、`heroPacket`、`heroDmg`、`heroAil`、`takeDmg`、`mitigate` |
| 四凶與燭龍的機制 | `js/demon.js`、`js/battle.js` | `XIONG`／`XIONGI`、`makeXiong`、`makeZhulong`、`beastTurn`（`enemyResolve` 開頭）；看不到行動順序 `hideAv`（`renderBHud`）、黑夜打空 `blind`（`actResolve`） |
| 七宗罪的王與七宗罪之王的機制 | `js/demon.js`、`js/battle.js` | `SINS`、`SINSPR`、`makeSinLord`、`makeSinKing`、`sinTurn`（`enemyResolve`，經 `soloExt`）、`sinHit`（`actResolve`，經 `soloExt`）、`sinBattleWin`（貪婪之王吐回金幣） |
| 傳奇裝備 | `js/demon.js`、`js/items.js` | `LEGENDS`、`makeLegend`；屬性在 `sumStats`（`it.leg`），特效旗標 `legPride` 等在 `heroDmg`／`heroAil`／`useSkill`／`bItem` |
| 武器種類、雙手武器 | `js/data.js`、`js/sprites.js`、`js/battle.js` | `BASES.weapon`（`k` 外觀、`t` 類別、`th` 雙手；只能加在最後）、`wepKind`／`wepType`／`twoHand`、`WTAGN`；裝備衝突在 `A.equip`；手上武器圖 `drawWeapon` |
| 技能標籤（0.3.1.8，0.3.18 直覺化） | `js/skills.js`、`js/ui.js`、`js/battle.js` | `skTags`（類型 `SKTYPE`、目標、元素、武器、效果，不放數字；CSS `.skt.ty/.tg/.el/.w/.eff`）、`skTagHTML(q, n, from)`（`from` 1 略過類型）、`skShort`（戰鬥按鈕）；說明 `gemDesc(q, st)` 關鍵字上色 `kw`（CSS `.kw`）；武器限制 `wOk`（`canPay` 一起檢查）、戰鬥按鈕小字 `skSub`、換武器提示 `wepWarn`；商店重複購買 `gemCount`；技能頁篩選 `SKF`／`skfOk`／`A.skFilter`（`SEL.skf`） |
| 子頁面返回鍵（0.3.1.8） | `js/ui.js`、`index.html` | `sheetParent`、`A.sheetBack`；DOM `#sback`（`renderSheet` 開頭決定顯示） |
| 商店購買／出售（0.3.1.8） | `js/items.js`、`js/ui.js` | `openShop`（`SHOP.mode`／`SHOP.render`）、`shopSellHTML`、`A.shopTab`／`A.shopPick`／`A.shopQuick`／`A.shopSellGo` |
| 混沌傷害、武器限制、技能篩選（0.3.36） | `js/battle.js`、`js/items.js`、`js/data.js`、`js/skills.js`、`js/ui.js` | 傷害封包多了 `chaos`、抗性陣列第 4 格是混沌（`mitigate`、`res[3]`）；屬性 `addChaos`／`chaosPct`／`resChaos`（`stats` 的 `chaos`、`elm.chaos`、`res.chaos`）；輔助效果 `pkSup`（`cvFire`… 轉換、`gFire`… 附加、`eleMore`／`physMore`／`noEle`）、`noAil`／`noCrit`／`avBack`／`mpLeech`／`foesCap`；武器 `wOk`（`w: 'melee'`、`oh: 'shield'`、`st.otag`）；技能池擴充在 `skills.js` 結尾的「0.3.36」區段；篩選 `SKW`／`skwOk`／`skfRows`、輔助商店 `SUPF`／`supfOk`（`A.skWep`、`A.supF`） |
| 技能石資料與效果 | `js/skills.js`、`js/items.js`、`js/battle.js` | `SKILLS` 擴充欄位（`w`、`tg`、`hits`、`chain`、`proj`、`addEl`、`bleed`、`stun`、`mark`、`curse`、`exec`、`pet`、`buff`、`lifeCost`）；等級成長 `gemSkill`；說明 `gemDesc`（`ui.js`） |
| 戰鬥的狀態與紀錄面板（0.3.27） | `js/battle.js`、`js/ui.js`、`index.html` | `BLOG`／`blog`／`logEv`（紀錄，`playEv` 與  寫入）、`binfoRender`（狀態頁：`BUFFK` 增益說明、`AILD` 異常說明、`binfoTrait` 特色）、動作 `A.binfo`／`A.binfoTab`；按鈕排版在 `renderBHud` |
| 等級上限 | `js/items.js` | `LV_MAX`（`gainXP`） |
| 主畫面 HUD、底部導覽 | `js/ui.js` | `renderHud`、`NAVG`、`navOpen`；DOM 在 `index.html` 的 `#nav` |
| 腐化 | `js/items.js` | `corrupt`（`gemCraft` 的 `vaal`：超限、品質超限、擴槽、沒變化、毀滅；毀滅時輔助退回背包） |
| 按鈕動作 | `js/ui.js` | `A` 物件（HTML 的 `data-act="名稱"` 對應 `A.名稱`） |
| 像素圖、圖示 | `js/sprites.js` | `SPR`（16×16 角色與怪物）、`ICONS`（8×8 按鈕圖示）、`PIX`（通貨、裝備欄、天賦圖示） |
| 音樂、音效 | `js/audio.js` | `playSong`、`sfx` |
| 帳號、雲端存檔 | `js/cloud.js` | `cloudInit`、`cloudPush`、`authRegister`、`authLogin`、`authLogout` |
| 存讀檔、存檔轉換、啟動 | `js/main.js` | `load`、`save`、`migrate`、`start`；存檔失敗提示 `saveFail`（0.3.30） |
| 樣式 | `css/style.css` | 依區塊註解（`/* ---------- shop ---------- */` 等）搜尋 |
| 設計規範、共用元件（0.3.31） | `docs/設計規範.md`、`css/style.css`、`.claude/skills/ui-design/` | `:root` 變數（字級 `--fs-cap`～`--fs-hero`、間距 `--sp-1`～`--sp-5`、圓角 `--r-*`、`--bad`／`--warn`／`--danger`／`--heat` 等）；元件 `.c-gold`／`.c-good`／`.c-warn`／`.c-bad`／`.c-dim`、列表按鈕 `.btn.buy`、摺疊說明 `details.more`（JS 用 `ui.js` 的 `more(標題, html)`）、等級格 `.tiers`、兩欄 `.g2`、卡片標題 `.ct`、按鈕第二行 `.bnote`；檢查工具 `audit.js` |

## 面板（`renderSheet` 的 `sheetName`）

| sheetName | 標題 | 入口 |
| --- | --- | --- |
| `hero` | 角色 | 一局裡底部「角色」→ 角色 |
| `skills` | 技能 | 底部「角色」→ 技能 |
| `gem` | 技能石 | 技能面板裡點技能石（`selGem`） |
| `pact` | 契靈 | 角色頁 →「契靈」或祈願畫面的「我的契靈」（`pactHTML`，在 `gacha.js`） |
| `pdet` | 契靈詳情 | 契靈格子（`pactDetHTML`） |
| `pbrk` | 契靈突破 | 契靈詳情的「突破」（`pactBrkHTML`，`SEL.pbrk`） |
| `bag` | 背包 | 底部「背包」 |
| `slot` | 裝備欄 | 背包裡點裝備欄 |
| `item` | 裝備 | 背包裡點物品 |
| `log` | 冒險日誌 | 底部「角色」→ 冒險日誌 |
| `settings` | 設定 | 主選單「設定」或底部「設定」 |

主選單（`#home`，`homeRender`）、章節地圖（`#runmap`，`runmapRender`）、選角／局外升級／商店／事件／三選一都是彈窗（`showModal`），不走 `renderSheet`。

## 重要的全域變數

| 變數 | 在哪裡宣告 | 內容 |
| --- | --- | --- |
| `S` | `data.js` | 存檔：一局的角色欄位在最上層（等級、裝備 `eq`、背包 `inv`、通貨 `cur`、天賦 `tree`、昇華 `asc`…），局外在 `S.meta`、`S.pact`、`S.cur.wish`，一局的進度在 `S.run`；格式 `S.fmt`（`SAVE_FMT`） |
| `selGem` | `data.js` | 技能石面板目前選的技能石 id |
| `B` | `data.js` | 戰鬥狀態（敵人 `es`、行動值 `av`、預選 `queued`…），沒在戰鬥時是 `null` |
| `D`、`MB` | `data.js` | 走路版的地城、多人戰鬥狀態，0.1.0 起一直是 `null`（還有幾處讀到，之後可以清掉） |
| `CLOUD` | `cloud.js` | Supabase 連線、目前帳號 `uid`、玩家編號、是否遊客 |
| `GA` | `gacha.js` | 祈願畫面目前的卡池（`pact`）與抽卡結果 |
| `SEL` | `ui.js` | 面板的選取狀態（背包分頁、批量賣出、篩選、契靈） |
| `SHOP` | `items.js` | 商店彈窗的分頁與重畫函式（`canSell` 看它） |

## 檔案區段大綱（自動產生）

格式：`名稱:行號`。粗體是檔案裡的區段註解（`/* ===== 區段 ===== */`）。

<!-- index:start -->

### js/core.js（79 行）

- **utils**（6），16 個宣告

### js/data.js（3031 行）

- **state**（3），2 個宣告
- **game data**（22），41 個宣告

### js/sprites.js（1422 行）

- **pixel sprites (original art)**（3），35 個宣告
- **icons: currency, item slots, passive nodes**（818），7 個宣告
- **boss sprites**（1077），1 個宣告

### js/gear.js（685 行）

- **0.3.1 裝備外觀：每種底材的 12×12 圖示、材質階級配色、角色外觀疊圖**（1），17 個宣告

### js/art.js（1217 行）


### js/iconmap.js（132 行）


### js/skills.js（2080 行）


### js/audio.js（223 行）

- **audio**（3），14 個宣告

### js/items.js（1210 行）

- **player & items**（3），31 個宣告
- **skill gems**（265），29 個宣告
- **stats**（516），23 個宣告
- **enemies**（901），16 個宣告
- **modal**（1039），6 個宣告

### js/battle.js（3000 行）

- **battle: painted backgrounds**（3），5 個宣告
- **battle: logic**（251），42 個宣告
- **battle: rules（單人與組隊共用）**（643），63 個宣告
- **battle: solo**（1830），21 個宣告
- **戰鬥結算（0.1.0 肉鴿：原本的地城、裂隙、試煉、石碑拿掉，改成一局裡的節點，流程在 run.js）**（2339），11 個宣告
- **畫面迴圈**（2637），1 個宣告
- **battle: drawing**（2643），7 個宣告

### js/monskill.js（226 行）


### js/ui.js（1382 行）

- **HUD & sheets**（3），56 個宣告
- **entity interaction**（781），0 個宣告
- **actions**（783），2 個宣告

### js/undead.js（196 行）

- **data**（3），4 個宣告
- **bosses**（187），1 個宣告

### js/demon.js（799 行）

- **sprites & data**（3），19 個宣告
- **sin lords**（340），6 個宣告
- **山海經四凶與燭龍（首領）**（433），5 個宣告
- **七罪信徒（第二章的菁英）**（567），7 個宣告

### js/zodiac.js（388 行）

- **data**（3），6 個宣告
- **enemies**（336），5 個宣告

### js/foes.js（179 行）


### js/asc.js（2223 行）

- **data**（69），10 個宣告
- **state & stats**（1625），18 個宣告
- **icons**（1699），3 個宣告
- **board（0.3.0.3：比照天賦樹的全螢幕昇華盤）**（1743），17 個宣告
- **trials**（2097），1 個宣告
- **actions**（2106），0 個宣告

### js/gacha.js（825 行）

- **pacts**（6），28 個宣告
- **banners**（549），8 個宣告
- **ui**（620），10 個宣告

### js/events.js（348 行）

- **祝福：這一局的永久加成（S.run.bless，runStats 加進屬性）**（5），6 個宣告
- **事件表**（34），2 個宣告

### js/run.js（843 行）

- **地圖產生**（44），2 個宣告
- **開始與結束**（116），3 個宣告
- **節點**（196），9 個宣告
- **戰鬥勝利：獎勵三選一**（383），12 個宣告
- **非戰鬥節點**（647），4 個宣告
- **畫面：主選單、章節地圖**（783），2 個宣告
- **actions**（833），0 個宣告

### js/meta.js（185 行）

- **局外升級（魂晶，永久）**（29），4 個宣告
- **每日挑戰**（58），4 個宣告
- **主選單**（68），3 個宣告
- **actions**（160），0 個宣告

### js/cloud.js（158 行）

- **cloud save (Supabase)**（4），7 個宣告
- **accounts**（102），5 個宣告

### js/main.js（69 行）

- **boot**（3），9 個宣告
<!-- index:end -->
