# dungeonPOE — 給 Claude 的專案說明

**最高優先：任何改動都先讀 `docs/設計原則.md`**（MDA 從樂趣倒推機制、隨機性規則、從《塞令老師》學到的教訓），規則與數值在 `docs/企劃書.md`，改了要同步。

**每次新對話開始**：先用 Skill 啟動 `ponytail`（最小完整改動）和 `grilling`（先把計畫問清楚再動手）。

**只要動到 UI／UX：一定先啟動 skill `ui-design`**（它會先啟動 `apple-design`，有動畫再加 `animate`）。skill 裡寫的檔名是《塞令老師》的，在這裡對應：畫面 `js/ui.js`、樣式 `css/style.css`、規範 `docs/設計規範.md`、audit `.claude/skills/ui-design/audit.js`。改完在 375×667、375×812、1440×900 截圖並跑 audit。

撤離＋背包構築的單人 PvE：背著背包下地城，點格子走隨機地圖、自動戰鬥（怪物也有背包，打贏就是戰利品），熱度滿了墮落十二生肖會追殺，帶著寶物撤離；死了只留黑盒。前作《塞令老師》（同一個 repo 的根目錄）。

## 溝通規則
- **一律用繁體中文回覆**（包含 commit 訊息）。
- 版本號：0.1.x。改版本時改 `js/data.js` 的 `VER` 和 `index.html` 所有 `?v=`，再更新 `CHANGELOG.md`。
- 流程：先改、先測，確認 OK 後再 commit + push（push 前先問使用者）。
- 這個資料夾自己就能跑（不引用上一層的檔案），以後可以整個搬到別的 repo。

## 檢查（改了遊戲邏輯一定要跑）
- `node tools/check.js`：圖名、買了馬上賣不賺、地圖走得到、沒有 NaN、背包不重疊、存檔還原、每個核心都有作用。有 ❌ 不交差。
- `node tools/autoplay.js 30 [職業] [--greedy]`：規則式自動玩家，看撤離率、深度、王與生肖勝率、逃跑率、撤離時熱度（企劃書第 9.2 節有基準）。改了數值前後都跑。
- 改完 JS：`npx prettier@3.3.3 --write js/*.js tools/*.js`。

## 專案結構
純靜態網頁，沒有建置步驟。JS 是一般 `<script>`，照 `index.html` 的順序載入、共用全域；`main.js` 最後。`core`～`meta` 是純邏輯（Node 也能載入，見 `tools/game_node.js`），`sprites`／`art`／`audio`／`cloud`／`ui`／`main` 只在瀏覽器。

| 檔案 | 內容 |
| --- | --- |
| `js/core.js` | `$`、`fl`、固定亂數 `h`／`rng`、`esc` |
| `js/data.js` | 表格：道具 `ITEMS`（含寵物 `PETS`、寵物蛋、寶物 `TREAS`）、會動的頭像 `AVANIM`、詞綴 `AFF`（T12～T1，`T12` 切段）、稀有度 `RARN`、抗性 `RESK`／`RES_CAP`／`resPen`、背包 `BAGS`（`d`＝幾號地城解鎖）／黑盒 `BOX`／地上與怪物背包 `MBAGS`、頭像 `AVATARS`、熱度 `HEAT`、怪物 `MOBS`／菁英詞綴 `MAFF`／王 `BOSSES`／生肖 `ZODIAC`、職業與核心 `CLASSES`、天賦 `TREE`、`VER`、存檔鍵 `KEY` |
| `js/gear.js` | 道具實例、擲詞綴 `rollItem`、檢查別人的道具 `cleanItem`、寵物 `rollPet`／孵蛋 `hatch`、形狀與擺放 `cellsOf`／`fits`／`autoPlace`、位置詞綴、把背包算成戰鬥數值 `compile`（含抗性 `res`、武器屬性 `el`／`add`）、扣懲罰後的抗性 `finalRes`、說明文字 `baseLines`／`affLine` |
| `js/sim.js` | 自動戰鬥 `simulate`（純計算、偽隨機 `prd`、輸出事件時間軸，含哪件道具發動；怪物用背包裡的武器 `wps`）、預估 `predict`、危險等級 `danger`／`DANGER` |
| `js/dungeon.js` | 一趟地城：怪物 `mkFoe`／`foesFor`、怪物與寶箱的背包 `lootBag`／`equipFoe`、地圖 `genMap`、`newRun`、移動 `moveTo`／`step`／`arrive`、熱度與生肖 `addHeat`／`spawnZod`、熱度滿只留一個撤離點 `closeExits`、打或跑 `fightNow`／`flee`、戰利品 `lootFor`（隨機掉落 `DROP`、寶物 `rollTreasure`）、地城商人、事件 `EVENTS`、下樓 `goDown`、結算 `runResult` |
| `js/meta.js` | 存檔結構 `newGame`、職業等級與天賦 `clLv`／`takeNode`／`coresOf`／`heroOf`、城鎮（商店 `buyShop`、賣 `sellItem`、買背包 `buyBag`）、跑刀 `ensureStarter`、出發 `depart`、結算 `finishRun`（帶出來的蛋 `hatchAll`） |
| `js/sprites.js`、`js/art.js`、`img/` | 從《塞令老師》複製的像素圖大圖（`art.js` 是產生的，不要手改） |
| `js/audio.js` | Web Audio 合成音效 |
| `js/cloud.js` | Supabase 匿名登入＋雲端存檔（表 `dungeon_saves`） |
| `js/market.js` | 市集（真人交易，表 `dungeon_market`）：`mkLoad`、上架 `mkSell`、`mkBuy`、下架 `mkCancel`、領錢 `mkClaim` |
| `js/ui.js` | 所有畫面：城鎮五個分頁（整備、倉庫 `whHTML`、市集 `mkHTML`、商店 `shopHTML`、職業 `treeHTML`）、格子卡片 `scHTML`、道具說明卡 `detOpen`／`detRender`、背包拖曳（`pointerdown`／`pointermove`／`pointerup`、落點判斷 `plan`（自動轉向、交換 `swapDest`）、`dragMove`、旋轉 `dragRot`／`rotIt`）、說明卡 `openDlg`／`closeDlg`、設定 `settingsDlg`、地城 `runHTML`／`mapHTML`、待辦 `pendDlg`（遭遇的怪物背包 `ebagHTML`）、新手教學 `TIPS`／`coach`、戰鬥播放（`startFightView`、`bTick`、背包運作 `fightBagHTML`／`itemFire`、訊息 `logEv`）、結算、動作表 `A` |
| `js/main.js` | `load`／`save`／`migrate`／`start` |
| `tools/game_node.js` | 在 Node 載入純邏輯 |
| `tools/check.js` | 固定檢查 |
| `tools/autoplay.js` | 規則式自動玩家與統計 |
| `supabase/migrations/` | `dungeon_saves` 表、`dungeon_market` 市集表與函式（要在 Supabase SQL Editor 跑一次） |

## 本機執行
```bash
python3 -m http.server 8000   # 在 dungeonPOE/ 底下，開 http://localhost:8000
```
存檔在 localStorage（鍵 `dungeonpoe_v1`，網址加 `?p=2` 用另一份）。存檔版本 `S.v`（0.1.0 是 1、0.1.3 是 2、0.1.4 是 3），改格式要在 `main.js` 的 `migrate()` 補轉換；進行中的一局記著 `S.run.ver`，版本不同會直接當作撤離（東西不會不見）。

## Supabase
同一個專案（ref `eugkdfhkoaxvqhztvptc`），表 `public.dungeon_saves`（跟《塞令老師》的 `saves` 分開，RLS 只允許本人）。前端只放 anon key，**絕對不要使用或要求 service_role key**。表不存在時只存本機。

## 部署
GitHub Pages：`main` 分支，網址 https://shiroyashatw.github.io/wayfarer/dungeonPOE/ 。
