# 程式碼地圖

給開發者（和 Claude）快速定位用：要改某個功能時，用關鍵字搜這份找到檔案和函式（一個功能一列），再用行號只讀那一段，不用整個檔案讀一遍。

- 函式／常數的行號在 `docs/SYMBOLS.txt`（一行一個，Grep `^名稱 `）；下方「檔案區段大綱」只列區段。兩者都是 `python3 tools/codemap.py` 自動產生的，**改完 JS 後重跑一次**，行號才會對；它也會列出這份表格裡已經找不到的名稱。
- JS 用 prettier 排版（設定在 `.prettierrc`，寬度 120）：`npx prettier@3.3.3 --write js/*.js`。
- 所有 JS 是一般 `<script>`，依 `index.html` 的順序載入、共用全域變數；`main.js` 必須最後。

## 要改什麼，看哪裡

| 功能 | 檔案 | 看這些 |
| --- | --- | --- |
| 回合表、經濟、背包等級、扣血、名次加減分、頭像、快照版本 | `js/data.js` | `ROUNDS`、`RTYPE`、`RSHORT`、`GVER`、`BAGLV`、`START_HP`、`START_GOLD`、`BASE_INCOME`、`INTEREST_MAX`、`streakBonus`、`PLACE_PTS`、`AVATARS`、`VER` |
| 道具資料（形狀、星級、標籤、效果、相鄰加成）、職業核心 | `js/items.js` | `ITEMS`／`ITEMI`、形狀 `SH`、`shapeOf`、標籤 `TAGN`、升階 `TIERM`／`TIERB`、詞綴 `AFFX`／`affOf`、價格 `priceOf`／`sellOf`、說明 `itemDesc`／`modTxt`／`scaleMod` |
| 背包格子、擺放、相鄰、合成 | `js/bag.js` | `cellsOf`、`bagGrid`、`canPlace`、`adjacent`、`sameRow`、`findSpot`（自動擺放）、`mergeAll`（3 件合成） |
| 背包算成戰鬥數值（加成怎麼套） | `js/bag.js` | `compileBag`（hp、護甲、武器、盾、藥水、`fx`）、給畫面用的 `bagMods`；快照格式 `packBag`／`unpackBag` |
| 自動戰鬥模擬（傷害、暴擊、格擋、燃燒、中毒、凍結、暈眩、吸血、疲勞） | `js/sim.js` | `simulate`（固定亂數、輸出事件 `ev`）、`simSide`；常數 `FATIGUE_T`、`MAX_T`（data.js） |
| 一局流程、商店、升級背包、收入 | `js/run.js` | `newRun`、`nextRound`、收入 `incomeOf`／打贏獎勵 `winGold`、`rollShop`／`rollItem`、`buyItem`、`sellItem`、`rerollShop`、`levelUp`、`shopPrice` |
| 野怪、菁英、首領 | `js/run.js` | `MOBS`（照回合編號）、`mobOf`（沒指定的菁英從 `ELITE_POOL` 挑、照階段放大）、`eliteStars`（戰利品星級）、`mkF`／`mkW` |
| 開戰、結算、獎勵三選一、名次 | `js/run.js` | `startFight`、`opponentOf`、`finishFight`、`takePick`、`endRun`、`finalPlace`、對手 `rivalAlive`／`aliveRivals` |
| 機器人對手（4 個一場真的互打） | `js/run.js` | `simLobby`（名次、每回合快照）、`makeBots`、`botAct`（`q` 越高買法越聰明）、`THEMES`；第 1 名對局之後的回合沿用最後快照 `rivalSnap`；隨機名字 `randName`（data.js） |
| 快照對戰（Supabase） | `js/ghost.js`、`supabase/migrations/20261022000000_serling_ghosts.sql` | `ghostRivals`（配對＋機器人補位）、`ghostBegin`、`ghostSnap`、`ghostEnd`、`GHOST.off`、開服種子 `seedGhosts`；資料表 `runs`（`seed` 欄位）／`snaps`、RPC `pick_rivals`（真人優先） |
| 首頁、圖鑑、說明、設定 | `js/ui.js` | `render`、`homeHTML`、`codexHTML`、`helpHTML`、`settingsHTML`、`go` |
| 準備畫面（回合列、背包、暫存區、商店、道具說明） | `js/ui.js` | `prepHTML`、`roundBarHTML`、`bagHTML`、`rivalHTML`、`detailHTML`、`tutHTML`、`cellSize` |
| 金幣旁的下回合預估收入（0.1.25） | `js/run.js`、`js/ui.js` | `incomeEst`（[輸, 贏]）、`incomeOf`、`winGold`（run）；`incTxt`、`.gold .inc`（ui） |
| 電腦版放大與兩欄準備畫面（0.1.25） | `js/ui.js`、`css/style.css` | `fitZoom`、`V.z`（`cellAt`、拖曳影子換算縮放）；CSS 變數 `--z`、`.pcol`（`.pa`／`.pb`／`.pc`）、`@media (min-width:1040px)` |
| 機器人 AI（0.1.20） | `js/bot.js`、`tools/game_node.js`、`tools/bot_train.js` | `botPower`（戰力分數）、`botValue`、`botPlace`、`botWeakest`、`botAct`、`BOT_P`、`botActOld`；`simLobby` 的 `opt.P`／`opt.old`（run） |
| 戰鬥生命照階段放大（0.1.19） | `js/data.js`、`js/run.js` | `HP_ST`、`hpMul`（data）；`stageHp`、`MOB_HP`、`MOB_DMG`（run，`startFight`、`simLobby`、`resumeFight` 都套用） |
| 更新紀錄（首頁左下，0.1.16） | `js/news.js`、`js/ui.js` | `NEWS`（給玩家看的每版功能變化，上新版時在最上面加一筆）；`showNews`、`A.news`、`S.newsSeen`（亮點） |
| 即時戰鬥紀錄（0.1.13） | `js/ui.js` | `bLog`、`bNames`（`bTick` 每個事件呼叫）、`#blog` |
| 角色加成照升階（0.1.13） | `js/items.js`、`js/bag.js` | `fxT`、`FX_FLAT`；`compileBag` |
| 怪物模板與怪物池（0.1.12） | `js/run.js` | `ARCH`、`archMix`、`mob`、`pool`、`MOBS`（`1-1`～`2-5`、`sins`、`zodiac`、`kings`、`fiends`）、`ELITE_POOL`、`mobOf` |
| 過去的對局（0.1.21） | `js/run.js`、`js/ui.js` | `fightSum` 的 `run.dmg`（整局累計）、`endRun` 存進 `S.hist`（`HIST_FULL` 局留詳細）；`showMatch`、`showLog(id, hi)`、`A.match` |
| 戰鬥紀錄（0.1.12） | `js/run.js`、`js/ui.js` | `fightSum`（run）；`showLog`、`A.log`、回合列與結算的入口（ui） |
| 戰鬥特效（0.1.12） | `js/ui.js`、`css/style.css` | `bHit`、`bAnim`、`bBurst`、`bSlash`；`.sp` 的動畫 |
| 升階倍率（0.1.10） | `js/items.js`、`js/bag.js` | `TIERM`、`TIERB`、`TIERCD`、`TIERCH`、`cdT`、`onT`（items）；`compileBag`（bag） |
| 核心新機制（先手、處決、背水、越戰越快、護盾、連擊、反彈、暴擊回血） | `js/sim.js`、`js/bag.js` | `simSide`、`simulate` 裡的 `F.opener` 等；`compileBag` 的預設值 |
| 加時：對手那局打完後快照變強、打到分出勝負（0.1.22）；機器人種子第 1 名繼續買到 8-7（0.1.23）；本局算血：對手生命 `rv.hp` 照這局勝負、沒打你的對手用快照互打（0.1.26）；剩 3 人時輪空的對手打你這回合的背包（0.1.27）；缺開頭快照用最早一筆 `rivalSnap`（0.1.27） | `js/run.js` | `rivalFights`、`rivalBag`、`petLoss`、`rivalHp`、`rivalOT`、`otGrow`、`OT_DMG`、`opponentOf`、`finishFight`、`simLobby`（solo、`short`） |
| 異常狀態（流血、破甲、虛弱、致盲）與戰鬥中顯示（0.1.9） | `js/sim.js`、`js/bag.js`、`js/ui.js` | `simSide`、`simulate`（`WEAK_PCT` 等常數）；`compileBag` 的武器欄位；`bSts`、`STI`、`STN`（ui） |
| 開戰藥劑、開戰效果通用化（0.1.9） | `js/items.js`、`js/bag.js`、`js/sim.js` | `PRE_T`、`PREN`、`preKey`、`preVal`、`preTxt`；`F.throwPct` |
| 職業核心池（0.1.9） | `js/items.js`、`js/run.js`、`js/ui.js` | `CORE_P`、`CORE_MAIN`（專屬）、`CORE_SUB`（副核心）、`genCores`（items）；首領三選一在 `finishFight`（2-5 專屬、4-4 副核心）（run）；圖鑑的核心列表在 `codexHTML`（ui） |
| 背包升級費用（0.1.12） | `js/data.js`、`js/run.js` | `BAGLV` 的 `cost`、`lvOpen`、`levelUp` |
| 對手扣血、最後回合結算（0.1.8） | `js/run.js`、`js/ui.js` | `rivalHp`、`rivalAlive`、`finishFight`（`out.hit`／`out.ko`、同回合倒下的名次 0.1.27）、`finalPlace`（run）；`rivalHTML`、`nextRival`、`resultHTML`（ui） |
| 起手道具、Ⅲ 階詞綴、商店 Ⅱ 階（0.1.8） | `js/run.js`、`js/bag.js`、`js/data.js` | `giveStarter`、`rollShop` 的 `t`、`shopPrice`（run）；`mergeAll` 的 `m2`（bag）；`BAGLV` 的 `t2`（data） |
| 開局職業（三選一、刷新一次） | `js/items.js`、`js/run.js`、`js/bag.js`、`js/ui.js` | `CLASSES`、`CLSI`、`clsDesc`（items）；`rollClasses`、`newRun` 的 `phase: 'cls'`、`bonusGold`（run）；`compileBag`／`bagMods` 的 `bag.cls`（bag）；`clsHTML`、`A.cls`、`A.clsRe`（ui） |
| 融合（0.1.28：融合輔助＋道具合成一件「前綴・道具」，多標籤、多效果）、反制寵物 | `js/items.js`、`js/bag.js`、`js/sim.js`、`js/bot.js`、`js/ui.js` | 道具的 `tf`、`tfTxt`、`PIERCE_MAX`、`PETDOWN_MAX`、`PREN` 的 `petSeal`／`petLock`（items）；道具的 `f`／`ft`、`tfOf`、`canFuse`、`fuseInto`、`fuseAll`（`mergeAll` 呼叫）、`tagsWith`、`fuName`、`sellO`、`compileBag` 的 `TG`／`has`、`bagMods` 的 `w: 'tf'`、`packBag` 多兩欄（bag）；`simulate` 的 `pierce`／`chain`／`guard`／`bash`／`bomb`、`petDown`／`petHunt`、`petRank`（sim）；`BOT_EPET`、`run.epet`（bot、`simLobby`）；`fuseAt`、`fuseToast`、`dropEnd`／`dropShop` 的 `d.fuse`、`A.autoPlace`、`detailHTML` 的 ✦、`bagHTML` 的 `.fui`／`.tfm`、`bNames`（ui） |
| 輔助道具（0.1.7，配合職業） | `js/items.js` | `ITEMS` 的「0.1.7 輔助道具」段；`for` 給機器人選購、`gold` 是錢袋 |
| 牌階（鐵牌～菁英、一二三、定級賽） | `js/data.js`、`js/ui.js` | `RANKS`、`rankOf`、`rankName`、`rankProg`、`placed`（data）；`rankIcon`（程式畫像素圖示）、`rankHTML`、`rankMove`（ui）；定級加倍在 `endRun` |
| 戰鬥冷卻條、封鎖顯示 | `js/ui.js` | `cdTimeline`、`bCd`（`bTick` 每格呼叫） |
| 開戰前特殊效果（封鎖、降階） | `js/items.js`、`js/bag.js`、`js/sim.js` | 道具的 `pre`、`preVal`、`preTxt`（items）；`compileBag` 的 `F.pre`（bag）；`simulate` 開頭（sim） |
| 戰利品寄放（暫存區滿了） | `js/run.js`、`js/ui.js` | `takePick`（hold）、`claimHold`（run）；`botHold`（bot，0.1.27 機器人賣最沒用的一件騰位置）；`holdHTML`、`A.claim`、`A.sellHold`（ui） |
| 機器人強度跟著牌階 | `js/run.js`、`js/ghost.js` | `simLobby` 的 `q`、`gb`；`seedGhosts`（700～2100） |
| 角色數值面板（點左上角頭像） | `js/ui.js` | `statsHTML`、`A.stats`（用 `compileBag` 算） |
| 5★ 隨機詞綴、開獎畫面 | `js/items.js`、`js/run.js`、`js/ui.js` | `MOD5`、`roll5`、`mod5Q`、`mod5Txt`（items）；`newItem` 擲詞綴（run）；`compileBag`、`mergeAll` 留最好的（bag）；`mod5HTML`、`revealHTML`、`A.seen5`（ui） |
| 拖曳自動轉向、滿了也能買來合成 | `js/ui.js`、`js/run.js` | `autoFit`、`drawGhost`（ui）；`wouldMerge`、`buyItem`（run） |
| 道具形狀小圖、背包旋轉鈕 ↻ | `js/ui.js` | `shapeMini`（商店、說明、三選一）、`bagHTML` 的 `.rotb`（`A.rot`） |
| 深淺主題、右上角切換 | `js/ui.js` | `applyTheme`、`themeBtn`、`A.themeTog`、`A.theme`；預設與轉換在 `main.js` 的 `newGame`／`migrate`（`themeSet`） |
| 拖曳擺放、從商店拖、交換位置 | `js/ui.js`、`js/run.js` | `pointerdown`／`pointermove`／`dropEnd`、`dropShop`、`cellAt`、`placeFromBench`、`V.drag`；`buyToBag`、`swapPlan`（run.js） |
| 戰鬥播放 | `js/ui.js` | `beginFight`、`resumeFight`、`renderBattle`、`bTick`、`bPop`、`bFlash`、`bEnd`、`B` |
| 結算、三選一、一局結束 | `js/ui.js` | `resultHTML`、`pickHTML`、`endHTML` |
| 按鈕動作 | `js/ui.js` | `A`（`data-act`）、`showDlg` |
| 背包相鄰加成的連接點、來源高亮、拖曳預覽（0.1.28） | `js/ui.js`、`css/style.css` | `linkHTML`、`bagHTML` 的 `lit`／`src`／`.hassel`、`dragLit`（pointermove 呼叫）、`detailHTML` 的加成來源分行；CSS `.lk`、`.it.src`、`.it.pv` |
| 即時機器人（0.1.31：每回合跟玩家一起推進、看你上一回合的背包反制） | `js/run.js`、`js/ghost.js` | `liveBots`、`liveStep`（`startFight` 呼叫）、`liveAfter`（`finishFight` 呼叫）、`LIVE_ME`、`rv.live`、`rv.lw`、`run.myPrev`；共用 `mkBot`、`botAfter`（`simLobby` 也用）；`ghostRivals` 用 `liveBots` 補位 |
| 6 人一場、真人快照上限（0.1.29） | `js/data.js`、`js/ghost.js`、`js/run.js`、`js/ui.js` | `LOBBY_N`、`GHOST_MAX`、`PLACE_PTS`（data）；`ghostRivals`（ghost）；`simLobby`、`rivalFights`（兩兩互打）（run）；`rivalHTML` 的 `.rivals.n5`（ui） |
| 後期魔王菁英、高星機率（0.1.29） | `js/run.js` | `ELITE_POOL`（7 階段起 `kings`）、`ELITE_KING`、`eliteStars`、`shopOdds`（`rollItem` 用） |
| 菁英三選一保底職業武器、副核心融入專屬核心（0.1.29） | `js/run.js`、`js/bag.js`、`js/bot.js`、`js/ui.js` | `eliteOpts`、`clsWeaponTags`、`mainCore`、`takePick`（run）；道具的 `sc`、`compileBag`／`bagMods`、`packBag`（bag）；`botValue0` 的 `how: 'core'`（bot）；`detailHTML`、`bagHTML` 的 `.fui`（ui） |
| 第二個專屬核心融入第一個（0.1.34，取代副核心） | `js/bag.js`、`js/run.js`、`js/bot.js` | `defsOf`、`coreProp`、`compileBag` 的 `X`（bag）；`bossCores`、`takePick`、`giveGift`、`botAfter` 的首領三選一（run）；`botValue0`（bot） |
| 核心新機制（0.1.33：開場必連擊、先手、連鎖 N、全封鎖、賄賂、防具倍率、護甲轉傷害、每件某標籤加成、雙手少 1 格、送寵物、免費刷新、菁英全劍、商人菁英金） | `js/items.js`、`js/bag.js`、`js/sim.js`、`js/run.js`、`js/ui.js` | 核心的 `openDbl`、`firstStrike`、`chainN`（`CHAIN_MAX`／`CHAIN_DMG`）、`pre.sealAll`、`bribe`、`defX`、`armDmg`、`fxPer`、`shrink`、`gift`、`freeRoll`、`eliteAll`、職業的 `eliteGold`（items）；`compileBag`、`syncShrink`、`shapeOf` 的 `sm`（bag／items）；`simulate` 的 `attack(…, mul)`（sim）；`payBribe`、`freeRolls`、`eliteOpts(win)`、`takePick` 的 `gift`（run） |
| 商人／浪人／亞馬遜改版（0.1.35：金錢標花錢翻倍、魔劍正宗吸收劍、二天一流 2 件合成、招架、連鎖追擊、開戰免異常、背水攻速、每格連擊、第一桶金、財源滾滾、鈔能力、六合彩、精品提早詞綴、折價卷、回扣三選一、豪賭刷新上限） | `js/items.js`、`js/bag.js`、`js/sim.js`、`js/run.js`、`js/bot.js`、`js/ui.js` | 道具 `coindart`／`masamune`、`shopOK`、`RICH`／`richOf`、`goldStOf`、核心的 `gain`／`goldSt`／`rich`／`lotto`／`early`／`lvOff`／`kick`／`rollCap`／`merge2`／`give`／`eliteT`（items）；`absorbAll`、`mergeNeed`／`merge2Of`、`compileBag` 的 `gold`／`parry`／`triple`／`immT`／`rageSpd`／武器 `dbl`／`coin`、`packBag` 的 `gp`／`ab`（bag）；`coinW`、`simulate` 的 `spent`、`parA`（sim）；`bonusGold`、`lottoOdds`、`slotPrice`、`kickback`、`rollsLeft`、`lvCost`、`eliteTier`、`giveGift`、`takePick` 的 `pend.tier`／`pend.z`（run）；`botEcon`、`botPend`（bot）；`abHTML`、`pickHTML`、`pick` 的 `mid`（ui） |
| 商店池子、職業偏好、對手職業圖示（0.1.36） | `js/run.js`、`js/ui.js` | `POOL`／`poolOf`、`poolAdd`、`poolHeld`、`poolOthers`、`poolUsed`、`poolLeft`、`CLS_W`／`clsShopTags`／`clsBoost`、`wpick`、`rollItem`、`rollShop`、`run.lob`（`liveStep`、`simLobby` 設的其他人）、`rivalCls`（run）；`rvClsIc`、`rivalHTML`（ui）；池子剩多少不顯示 |
| 異常重製與陷阱（0.1.37：劇毒、點燃、腐蝕、衰老、冰緩、混亂、單件凍結、陷阱、時段加成、萬能藥、自殘、以毒為生、免疫、煉成、別西卜、寒冰之心） | `js/sim.js`、`js/bag.js`、`js/items.js`、`js/run.js`、`js/bot.js`、`js/ui.js` | `simulate` 的 `freezeIt`／`chillIt`／`trapFire`／`addPoison`／`addVenom`／`gainBlock`／`brewFx`、`phaseOf`、常數 `VENOM_MAX`／`FREEZE_T`／`CHILL_T`／`BOMB_DMG`（sim）；`compileBag` 的 `grid`／`traps`／`phase`／`potBuff`、`coreFx`、`packBag` 的 `ex`／`hh`／`rc`（bag）；核心的 `pres`／`traps`／`phase`／`potBuff`／`brew`／`earlyPot`、道具 `philstone`／`ultelixir`／`fsnake`／`bzseal`／`beelzebub`／`icheart`、`BREW`／`brewTxt`、`SEAL_RC`（items）；`afterSim`、`putItem`、`brewPend`、`sealTick`、`takePick` 的 `pend.brew`（run）；`botPend` 的煉成、`BOT_BREW`（bot）；`cdTimeline` 的 `ice`／`trap`、`STN`／`STI`／`TRAPN`、`pickHTML` 的煉成（ui） |
| 對手背包詳細、右鍵旋轉、百科（0.1.38） | `js/ui.js`、`css/style.css`、`tools/icon_sheets.py` | `rvDetHTML`、`showRivalBag(i, sel)`、`rotIt`、`pointermove` 的右鍵偵測、`contextmenu`；`codexHTML`、`CX_TABS`／`CX_AIL`／`CX_STAT`、動作 `cxTab`；`.rvit button`、`.rvdet`、`.cxtab`；圖示圖表新增「職業核心」組（tools/icon_sheets.py） |
| 戰鬥紀錄對手背包詳細、道具觸發次數（0.1.40） | `js/sim.js`、`js/bag.js`、`js/run.js`、`js/ui.js` | `simulate` 的 `tr`／`trig`、`compileBag` 的 `F.src`（sim／bag）；`finishFight` 的 `run.trig`（run）；`lgBagHTML`、`showLog(id, hi, sel)`、`trigHTML`（ui） |
| 說明文字的異常圖示（0.1.41） | `js/ui.js`、`css/style.css` | `dsc`、`KW_IC`／`KW_RE`（包在 `itemDesc`／`clsDesc`／`modTxt`／`brewTxt`／`mod5Txt` 外面）；`img.kw` |
| 核心欄、商店機率（0.1.42） | `js/bag.js`、`js/run.js`、`js/bot.js`、`js/ui.js` | `bagAll`、`packIt`／`unpackIt`、`packBag` 的 `co`（bag）；`mainCore`、`coreSync`、`takePick` 的核心、`shopChance`（run）；`botValue0` 的核心（bot）；`coreFabHTML`、`coreDetHTML`、`oddsHTML`、動作 `coreSel`（ui） |
| 說明文字產生器與檢查、機器人存錢（0.1.43） | `js/items.js`、`js/ui.js`、`js/bot.js`、`js/bag.js` | `joinTxt`／`JOIN_P`、`itemDesc` 的分組與「命中時：」（items）；`dsc` 的 `ST_IC`／`ST_RE`、`CX_STAT`（ui）；`botFloor`、`botKeep`、`botEcon`（bot）；`synergy` 的 `absorb`（bag）；檢查腳本在 skill `item-text` |
| 核心統計（0.1.44：三選一紀錄、選擇率、組合名次） | `js/run.js`、`tools/core_stats.js` | `takePick` 的 `run.coreLog`、`botAfter` 的首領 `pend`、`simLobby` 的 `info.stat`、`endRun` 的 `cl`（run）；工具輸出 `docs/核心統計.md` |
| 核心統計進資料庫（0.1.45） | `js/ghost.js`、`supabase/migrations/20261024000000_serling_core_stats.sql` | `ghostEnd` 的核心欄位、`coreCols`、`seedGhosts` 的核心、`coreStatsCloud`；RPC `core_stats`／`core_combo_stats` |
| 弓箭手、亞馬遜重製（0.1.50：插箭、爆裂箭、箭雨、多重射擊、狙擊、元素箭袋、連珠箭、游擊、風之箭、捕獸夾／獵網／尖樁陷阱、撕裂、插矛、協同作戰召喚、女武神復活、矛弓連攜、戰舞、反擊、血獵、日月輪轉、姊妹盟約、浴血戰姬） | `js/items.js`、`js/bag.js`、`js/sim.js`、`js/bot.js`、`js/ui.js`、`css/style.css` | `CORE_MAIN.archer`／`spearman`、`skyhawk`、常數 `ARROW_MAX` 等、`MODN` 的新鍵、`TRN`（items）；`compileBag` 的新角色鍵、武器的 `kind`／`stick`／`shots`／`snipe`／`elem`／`sure`／`pin`／`rend`、姊妹盟約 `sisters`（bag）；`simulate` 的 `stickArrows`、`addRend`、`fire`、`counter`、`revive`、`isDay`、召喚 `sm0`／`sm1`、陷阱 `snare`／`net`／`stake`、事件 `boom`／`rain`／`revive`／`summon`／`sun`／`pinOut`（sim）；`botPower` 的插箭、撕裂、召喚（bot）；`smnHTML`、`bSun`、`STI` 的插箭／撕裂／插矛、`CX_AIL`（ui）；`.smn`／`.smf`／`.smit`、`.sunb`、`--day`／`--night`（css） |
| 火法師、雷法師重製（0.1.51：自動點燃、星星之火、爆燃、流星火雨、焚盡斬殺線、自焚、火之化身、炎爆、灼命、熱浪、鳳凰涅槃；連鎖、電荷、放電、麻痺、癱瘓、超載、雷神降臨、雷暴雲、疾雷、雷鳴、電磁脈衝、雷火、靜電場、避雷針、電網陷阱；新雷系道具；核心自訂圖示 icx） | `js/items.js`、`js/bag.js`、`js/sim.js`、`js/bot.js`、`js/ui.js`、`css/style.css` | `CORE_MAIN.pyro`／`storm`、`thunderjav`／`thunderbow`／`teslacoil`／`thunderheart`／`thunderbat`、常數 `CHARGE_MAX`／`ZAP_*`／`PARA_*`／`METEOR_*`／`SPARK_*` 等、`genCores` 的 `icx`（items）；`compileBag` 的新角色鍵、武器 `charge`（bag）；`simulate` 的 `igniteIt`、`stunIt`、`addPara`、`addCharge`、`zap`、定時效果（流星、雷暴雲、炎爆、焚盡、鳳凰、星星之火蔓延）、事件 `zap`／`meteor`／`bolt`／`flash`／`combust`／`burnout`／`phoenix`／`avatar`／`god`／`palsy`／`static`／`spark`（sim）；`botPower` 的電荷、點燃（bot）；`itemIcon` 的 `icx`、`bSpark`、`bFall`、斬殺線 `kl0`／`kl1`、`STI` 的電荷／麻痺（ui）；`.kline`、`.firec`、`.fall`、`.sp.avt`／`.sp.god`（css） |
| 賽制（0.1.58：詛咒寶藏、七十二變、星象輪轉、法老王的遺物、遺產市集） | `js/data.js`、`js/run.js`、`js/bag.js`、`js/sim.js`、`js/bot.js`、`js/ui.js`、`js/items.js`、`css/style.css` | `CURSES`／`CURSE_P`、`ASTROS`、`RELICS`／`RELIC_AT`、`LEGACY_RC`（data）；`curseRoll`、`rollShm`／`shmOf`／`modeFix`、`rollAstro`／`astroAt`／`astroF`／`fightF`、`relicOpts`／`relicTake`／`relicOpen`／`relicPick`、`legacyDrop`／`legPrice`／`legacyBuy`（run）；`shapeO`（items）；`compileBag` 的詛咒與遺物、`mergeAll` 的詛咒疊加、`packIt` 的 `sh`／`cu`、`packBag` 的 `rel`（bag）；安卡 `F.ankh`（sim）；`botEx`、`botRelic`、`botLegacy`（bot）；`cuBadge`、`cuLineHTML`、`astroListHTML`、`relicLine`、`relicHTML`、`legHTML`、動作 `relicPick`／`legSel`／`legBuy`（ui）；`.cub`、`.astl`、`.relo`、`.leg`（css） |
| 賽制（0.1.52：開場隨機、狂風市集、印記、流浪商隊、種子 300 局職業輪流） | `js/data.js`、`js/run.js`、`js/bag.js`、`js/sim.js`、`js/bot.js`、`js/ui.js`、`js/ghost.js`、`css/style.css` | `MODES`／`MODEI`、`SIGILS`／`SG_AT`／`sgLv`、`VANS`／`VANI`（data）；`rollMode`、`newRun` 的 `phase: 'mode'`、`sgFix`、`sgCount`、`slotPrice`（狂風 -1）、`afterBuy`（雙胞胎、狂風換新）、`rerollShop`／`rollsLeft`、`bossCores` 的 `ban`、`luckWin`、流浪商隊 `vanDo`／`vanOK`／`itemCat`／`takeOut`／`findU`／`shopTop`／`vanRoll`、`mkBot` 的 `opt.mode`／`opt.cls`、`simLobby` 的賽制（run）；`mergeAll` 的印記三選一 `run.sgq`、`packIt`／`unpackIt` 的印記、`compileBag` 的 `sgMight`… 與武器的 `sgM`／`sgS`／`sgL`／`sgK`（bag）；`heal` 溢出變護盾、`gainBlock` 的盾擊、`fire` 的重擊、`relay`、幸運一擊、開戰擲骰（sim）；`botPower` 的印記、`sgBias`、`botCaravan`（bot）；`modeHTML`、`modeBarHTML`、`sgInfoHTML`、`sgLineHTML`、`sgPickHTML`、`vanHTML`、`vanGo`、`vanPick`、`sgBadge`、動作 `modeOk`／`modeInfo`／`sgInfo`／`sgPick`／`van`（ui）；`seedGhosts` 300 局、職業輪流（ghost）；`.mbar`、`.mchip`、`.sgrow`／`.sgc`、`.sgb.sg0`～`.sg4`、`.van`、`.btn.sm`／`.btn.buy`（css） |
| 馴獸師重製（0.1.53：成長、寵物不吃反彈、捕獲、進化、獸群召喚、獸群首領、巨獸化、群狼戰術、護主、撲殺、狂暴、馴獸鞭、共生、四兇召來／遠古之器、反制寵物調整） | `js/items.js`、`js/bag.js`、`js/run.js`、`js/sim.js`、`js/bot.js`、`js/ui.js` | `CORE_MAIN.tamer`、`vessel`／`taotie`／`qiongqi`／`taowu`／`hundun`、`WOLF_T`／`FRENZY_MAX`／`VESSEL_N`／`GORGE_MAX`／`PERILS`（items）；`compileBag` 的看不見的戰狼 `vw`、成長 `gw`、巨獸化、首領、`dr`，`packIt` 的 `gw`、`mergeAll` 留最高成長（bag）；`petWin`（成長、捕獲）、`petEvolve`、`sacrifice`／`sacOK`（run）；`attack` 的護主 `inGd`、`noTh`、共生、狂暴、四兇的吞噬／命中封鎖／混沌，計時的撲殺、馴獸鞭、戰狼加入（sim）；`botPower` 的四兇與馴獸師、`botEcon` 的捕獲／進化、獻祭（bot）；`sacPick`、動作 `sacr`、結算的捕獲、戰鬥事件 `wolf`／`pounce`／`whip`／`petGuard`（ui） |
| 音效開關、百科搜尋與收合清單（0.1.55） | `js/ui.js`、`css/style.css` | `sfxBtn`、動作 `sfxTog`；`codexHTML`、`cxRow`、`cxFilter`、`plain`、動作 `cxClear`／`cxTab`、`V.cxQ`、`input` 事件的 `#cxq`；`.sfxb`、`.cxsearch`、`.cxr`、`.cxg`、`.cxsec` |
| 點對手看上一回合的背包、重畫保留折疊（0.1.32） | `js/ui.js` | `showRivalBag`、`A.rvBag`、`rivalHTML` 的 `button.rv`；`render` 保留 `details[data-k]`（圖鑑 `codexHTML` 的 `cx_職業`） |
| 戰報按鈕、拖曳中旋轉（0.1.29） | `js/ui.js` | `lastLogBtn`、`A.lastLog`；`dragMove`、`dragRot`（keydown／mousedown 右鍵／wheel）、`V.drag` 的 `rot`／`gi` |
| 首頁排行榜、各職業勝率（0.1.29） | `js/ghost.js`、`js/ui.js`、`supabase/migrations/20261023000000_serling_leaderboard.sql` | `BOARD`、`ghostBoard`、`ghostEnd`（寫 `cls`／`rating_end`）（ghost）；`boardHTML`、`A.lb`、`V.lb`（ui）；RPC `leaderboard`、`class_stats` |
| 抗異常、淨化、減回復、減暴擊（0.1.29） | `js/items.js`、`js/bag.js`、`js/sim.js`、`js/bot.js` | `fx` 的 `rBurn`～`rBlind`、`poisonImm`、`cleanse`、`healCut`、`critRes`、`RES_MAX`、`CLEANSE_T`（items）；`compileBag` 預設值（bag）；`simulate` 的 `res`、`healOf`、`cleanse` 事件（sim）；`botThreat`、`BOT_ERES`、`run.eres`（bot、`simLobby`） |
| 照格數變強的融合（0.1.29） | `js/items.js`、`js/bag.js` | `forgehammer`、`giantblood` 的 `cellPct`／`cellHp`；`compileBag` 的武器 `mul` |
| 道具圖示 | `js/ui.js`、`art/icons/` | `itemIcon`（先找 `it_代號.png`，沒有用 `borrowIcon` 借舊圖示） |
| 像素圖、PNG 大圖載入 | `js/sprites.js`、`js/art.js` | `artSprite`、`artIconURL`、`pixURL`（只剩藥水 `ic_potion`）、`iconURL`（備用星星）；大圖載好呼叫 `artRepaint`（0.1.27 刪掉舊版 16×16 像素圖與裝備、技能圖示） |
| 存檔、啟動 | `js/main.js` | `newGame`、`load`、`save`、`migrate`（0.1.0 前的存檔不轉移）、`start` |
| 帳號、雲端存檔 | `js/cloud.js` | `cloudInit`、`cloudPush`、`authRegister`、`authLogin`、`authLogout` |
| 音效（0.1.5 拿掉背景音樂） | `js/audio.js` | `audioInit`、`sfx`、`SFX` |

## 重要的全域變數

| 變數 | 內容 |
| --- | --- |
| `S` | 存檔：名字、頭像 `av`、分數 `rating`、戰績 `hist`、圖鑑 `seen`、設定、新手提示 `tut`、進行中的一局 `run` |
| `S.run` | 一局：回合 `ri`、生命 `hp`、金幣、背包等級 `lv`、背包 `bag`（`items`）、暫存區 `bench`、商店 `shop`、對手 `rivals`（每回合的快照 `snaps`）、階段 `phase`（prep／battle／result／pick／end） |
| `B` | 播放中的戰鬥（時間軸、目前生命與格擋） |
| `V` | 畫面狀態（不存檔）：`scr` 哪個畫面、`sel` 選中的道具、`drag` 拖曳中 |
| `GHOST` | 快照對戰是否停用（`off`）與原因 |

## 檔案區段大綱（自動產生）

格式：`名稱:行號`。粗體是檔案裡的區段註解（`/* ===== 區段 ===== */`）。

<!-- index:start -->

### js/core.js（42 行）

- **utils**（5），5 個宣告

### js/data.js（336 行）

- **一局**（5），37 個宣告

### js/sprites.js（134 行）

- **程式像素圖（道具 ic: 'p:鍵'）**（92），3 個宣告

### js/art.js（1528 行）


### js/items.js（3190 行）


### js/bag.js（840 行）

- **合成**（181），3 個宣告
- **戰鬥數值**（262），9 個宣告

### js/sim.js（1260 行）


### js/run.js（1832 行）

- **野怪、菁英、首領（也是一組道具，直接寫成戰鬥用的角色）**（3），7 個宣告
- **一局**（234），9 個宣告
- **0.1.58 七十二變、星象輪轉**（306），10 個宣告
- **0.1.36 池子**（409），38 個宣告
- **對手**（785），16 個宣告
- **戰鬥**（887），23 個宣告
- **0.1.52 流浪商隊**（1260），7 個宣告
- **0.1.58 法老王的遺物**（1388），4 個宣告
- **0.1.58 遺產市集**（1433），8 個宣告
- **機器人對手（沒有真人快照時補位；跟玩家用同一套規則跑一整局）**（1587），4 個宣告
- **即時機器人（0.1.30）**（1759），5 個宣告

### js/bot.js（722 行）

- **戰力分數**（22），19 個宣告
- **每回合**（477），8 個宣告

### js/ghost.js（214 行）

- **排行榜（0.1.29）**（138），2 個宣告
- **開服種子資料（開發用）**（165），1 個宣告

### js/audio.js（102 行）

- **audio**（3），6 個宣告

### js/cloud.js（187 行）

- **cloud save (Supabase)**（4），6 個宣告
- **accounts**（110），7 個宣告

### js/news.js（376 行）


### js/ui.js（2918 行）

- **小工具**（6），15 個宣告
- **牌階**（71），5 個宣告
- **主題**（174），4 個宣告
- **畫面切換**（193），2 個宣告
- **首頁**（231），3 個宣告
- **準備畫面**（323），17 個宣告
- **0.1.52 賽制**（658），27 個宣告
- **結算、三選一、一局結束**（986），6 個宣告
- **戰鬥播放**（1042），26 個宣告
- **圖鑑、說明、設定**（1776），9 個宣告
- **動作**（2012），12 個宣告
- **拖曳擺放**（2599），14 個宣告

### js/main.js（74 行）

<!-- index:end -->
