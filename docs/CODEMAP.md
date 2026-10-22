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
| 一局流程、商店、升級背包、收入 | `js/run.js` | `newRun`、`nextRound`、`rollShop`／`rollItem`、`buyItem`、`sellItem`、`rerollShop`、`levelUp`、`shopPrice` |
| 野怪、菁英、首領 | `js/run.js` | `MOBS`（照回合編號）、`mobOf`（沒指定的菁英從 `ELITE_POOL` 挑、照階段放大）、`eliteStars`（戰利品星級）、`mkF`／`mkW` |
| 開戰、結算、獎勵三選一、名次 | `js/run.js` | `startFight`、`opponentOf`、`finishFight`、`takePick`、`endRun`、`finalPlace`、對手 `rivalAlive`／`aliveRivals` |
| 機器人對手（4 個一場真的互打） | `js/run.js` | `simLobby`（名次、每回合快照）、`makeBots`、`botAct`（`q` 越高買法越聰明）、`THEMES`；第 1 名對局之後的回合沿用最後快照 `rivalSnap`；隨機名字 `randName`（data.js） |
| 快照對戰（Supabase） | `js/ghost.js`、`supabase/migrations/20261022000000_serling_ghosts.sql` | `ghostRivals`（配對＋機器人補位）、`ghostBegin`、`ghostSnap`、`ghostEnd`、`GHOST.off`、開服種子 `seedGhosts`；資料表 `runs`（`seed` 欄位）／`snaps`、RPC `pick_rivals`（真人優先） |
| 首頁、圖鑑、說明、設定 | `js/ui.js` | `render`、`homeHTML`、`codexHTML`、`helpHTML`、`settingsHTML`、`go` |
| 準備畫面（回合列、背包、暫存區、商店、道具說明） | `js/ui.js` | `prepHTML`、`roundBarHTML`、`bagHTML`、`rivalHTML`、`detailHTML`、`tutHTML`、`cellSize` |
| 道具形狀小圖、背包旋轉鈕 ↻ | `js/ui.js` | `shapeMini`（商店、說明、三選一）、`bagHTML` 的 `.rotb`（`A.rot`） |
| 深淺主題、右上角切換 | `js/ui.js` | `applyTheme`、`themeBtn`、`A.themeTog`、`A.theme`；預設與轉換在 `main.js` 的 `newGame`／`migrate`（`themeSet`） |
| 拖曳擺放、從商店拖、交換位置 | `js/ui.js`、`js/run.js` | `pointerdown`／`pointermove`／`dropEnd`、`dropShop`、`cellAt`、`placeFromBench`、`V.drag`；`buyToBag`、`swapPlan`（run.js） |
| 戰鬥播放 | `js/ui.js` | `beginFight`、`resumeFight`、`renderBattle`、`bTick`、`bPop`、`bFlash`、`bEnd`、`B` |
| 結算、三選一、一局結束 | `js/ui.js` | `resultHTML`、`pickHTML`、`endHTML` |
| 按鈕動作 | `js/ui.js` | `A`（`data-act`）、`showDlg` |
| 道具圖示 | `js/ui.js`、`art/icons/` | `itemIcon`（先找 `it_代號.png`，沒有用 `borrowIcon` 借舊圖示） |
| 像素圖、PNG 大圖載入 | `js/sprites.js`、`js/art.js` | `sprite`、`artSprite`、`artIconURL`、`pixURL`、`iconURL`；大圖載好呼叫 `artRepaint` |
| 存檔、啟動 | `js/main.js` | `newGame`、`load`、`save`、`migrate`（0.1.0 前的存檔不轉移）、`start` |
| 帳號、雲端存檔 | `js/cloud.js` | `cloudInit`、`cloudPush`、`authRegister`、`authLogin`、`authLogout` |
| 音樂音效 | `js/audio.js` | `audioInit`、`playSong`、`sfx` |

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

### js/core.js（71 行）

- **utils**（6），15 個宣告

### js/data.js（117 行）

- **一局**（5），13 個宣告

### js/sprites.js（1415 行）

- **pixel sprites (original art)**（3），33 個宣告
- **icons: currency, item slots, passive nodes**（812），7 個宣告
- **boss sprites**（1070），1 個宣告

### js/art.js（1217 行）


### js/items.js（589 行）


### js/bag.js（200 行）

- **合成**（56），1 個宣告
- **戰鬥數值**（80），4 個宣告

### js/sim.js（152 行）


### js/run.js（502 行）

- **野怪、菁英、首領（也是一組道具，直接寫成戰鬥用的角色）**（3），3 個宣告
- **一局**（87），18 個宣告
- **對手**（260），7 個宣告
- **戰鬥**（311），6 個宣告
- **機器人對手（沒有真人快照時補位；跟玩家用同一套規則跑一整局）**（405），4 個宣告

### js/ghost.js（122 行）

- **開服種子資料（開發用）**（84），1 個宣告

### js/audio.js（221 行）

- **audio**（3），14 個宣告

### js/cloud.js（161 行）

- **cloud save (Supabase)**（4），7 個宣告
- **accounts**（104），5 個宣告

### js/ui.js（965 行）

- **小工具**（6），13 個宣告
- **主題**（60），3 個宣告
- **畫面切換**（76），2 個宣告
- **首頁**（102），2 個宣告
- **準備畫面**（138），10 個宣告
- **結算、三選一、一局結束**（312），3 個宣告
- **戰鬥播放**（333），9 個宣告
- **圖鑑、說明、設定**（484），3 個宣告
- **動作**（539），4 個宣告
- **拖曳擺放**（784），5 個宣告

### js/main.js（72 行）

<!-- index:end -->
