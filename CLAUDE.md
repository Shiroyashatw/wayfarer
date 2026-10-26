# 塞令老師 — 給 Claude 的專案說明

**最高優先：任何改動（新功能、道具、職業與核心、賽制、道具池、羈絆、經濟、平衡、介面）都先讀 `docs/設計原則.md`**：用 MDA 從「要給玩家的樂趣」倒推「玩家行為」再決定機制，照它的隨機性規則（偽隨機、保底不破壞共用池、運氣往前放），上線後用 `stats` 驗證玩家行為。

**每次新對話開始**：先用 Skill 啟動 `ponytail`（最小完整改動）和 `grill-me`（先把計畫問清楚再動手）。

**只要動到 UI／UX（不管新對話或小調整）：一定先啟動 skill `ui-design` 並照它的流程做**，它會先啟動 `apple-design`（有動畫再加 `animate`）。設計判斷以 `apple-design` 為主，`docs/設計規範.md` 提供數值、元件與技術限制為輔；改完要在手機 375×667、375×812 與電腦尺寸截圖對照、跑 audit。UI／UX 包括：畫面、版面、互動（點擊、拖曳、手勢）、動畫、提示、說明文字的排版、CSS。

4 人一場的背包自動對戰（0.1.0 從「漫步勇者」走路地圖 RPG 轉型）。設計在 `docs/企劃書.md`，舊版企劃在 `docs/舊企劃書_漫步勇者.md`。

## 溝通規則
- **一律用繁體中文回覆**（包含進度說明與 commit 訊息）。
- 版本號：目前是 0.1.x（0.1.0 是轉型；使用者指定的版本號為準）。改版本一律用 `python3 tools/setver.py 新版本`，會同時改 `js/data.js` 的 `VER` 和 `index.html` 裡 JS／CSS 網址的 `?v=`（避免手機用到快取的舊檔）；再更新 `CHANGELOG.md` 與 `README.md`；有遊戲功能變化的話，也在 `js/news.js` 的 `NEWS` 最上面加一筆給玩家看的更新紀錄（只寫遊戲功能，不寫開發細節）。
- 流程：先改、先測，確認 OK 後再一次 commit + push 到 GitHub（push 前先問使用者）。
- 企劃書：`docs/企劃書.md`（線上版在 Claude Docs）。規則或數值改了要同步更新。
- 介面：任何 UI／UX 改動都走 skill `ui-design`（apple-design 為主、`docs/設計規範.md` 的字級、顏色變數、間距、元件、資訊量規則為輔），改完在手機與電腦尺寸截圖並跑 `.claude/skills/ui-design/audit.js`。
- 圖：道具圖示的 PixelLab 提示詞在 `docs/圖示提示詞.md`（只留還沒產的；做完的在 `docs/提示詞封存.md`），怪物在 `docs/怪物提示詞.md`，玩家選的頭像（4×4 大圖、每格 64×64）在 `docs/頭像圖表.md`，塔羅牌卡圖（64×64）在 `docs/塔羅牌圖表.md`；新增圖用 skill `pixel-art`。
- 說明文字：新增或修改道具、核心、職業、異常、機制後用 skill `item-text`：照規則改產生器（`items.js` 的 `MODN`／`PREN`／`itemDesc`）、百科（`ui.js` 的 `CX_AIL`／`CX_STAT`），跑 `node .claude/skills/item-text/audit.js` 沒有問題才交差。
- 圖示：新增道具或借用圖示（`ic`）後用 skill `icon-check`：`python3 tools/icon_check.py` 產生 `docs/圖示對照.md`（名字 ↔ 圖示原本畫的東西），對不上就換圖示或改名字。
- 機器人：新增道具、體系、機制或改經濟、戰鬥規則後用 skill `bot-ai`：確認 `js/bot.js` 的 `botPower` 有算到新東西，`node tools/bot_train.js --iters 30 --lobbies 40 --write` 重新訓練，再重傳種子。
- 種子與快照：要上版而且改了道具、核心、職業、回合表、經濟或機器人時用 skill `ghost-seed`（判斷要不要換 `GVER`、push 上線後在瀏覽器重傳種子、到資料庫確認）。
- 檢查：改了遊戲邏輯（道具、核心、賽制、經濟、戰鬥、商店、合成、快照格式）都跑 `node tools/check.js`（整局模擬＋不變量：買了馬上賣不會賺、沒有 NaN、格子不重疊、快照還原一樣），沒有 ❌ 才交差；重構前後用 `--golden` 比對結果要一模一樣。
- 賽制：新增或修改賽制用 skill `new-mode`。賽制的差別只透過 `run.js` 的 `MODEH`（規則掛勾）和 `ui.js` 的 `MODEUI`（畫面），不要再寫 `run.mode === '…'`。
- 道具池：新增道具要決定它在哪個池（主題專屬寫 `th: 'g'／'f'／'m'`，舊道具改 `items.js` 的 `POOLS`；基本池 `b` 只放功能、反制道具，武器每件只屬於一個主題），改完跑 `node tools/pools.js --write`。
- 數據：問選取率、冷門道具、職業或賽制強弱、改數值前後有沒有變好，用 skill `stats`（`node tools/stats.js`；真人資料用 Supabase 的 SQL，樣本少要講）。
- 平衡：改道具、職業、核心、怪物、經濟或升階倍率後用 skill `balance`（核心統計：`node tools/core_stats.js 500 1300 --write`）：跑 `.claude/skills/balance/balance.js` 的 `coverage()`（各體系各星級、輔助、異常來源、職業、核心、圖示、說明文字）與 `sims()`（職業名次、PvE 勝率、公平性、局長、背包成長），沒有 ❌ 才交差。

## 專案結構
純靜態網頁，沒有建置步驟。所有 JS 是一般 `<script>`（非 module），依 `index.html` 的順序載入、共用全域；`main.js` 必須最後。

**定位程式碼（省 token，照順序）**：
1. 功能 → 檔案與函式：用 Grep 搜 `docs/CODEMAP.md` 的關鍵字（中文功能名或函式名，例：`Grep "合成" docs/CODEMAP.md`），一列就是一個功能。**不要 Read 整份 CODEMAP**。
2. 函式 → 行號：Grep `docs/SYMBOLS.txt` 的 `^函式名 `（一行一個頂層宣告：`名稱 檔案:行號 [區段]`），或直接 Grep `js/` 的 `function 函式名`。
3. 用 Read 的 offset/limit 只讀那一段（通常 40～120 行）。不要整個 JS 讀進來，也不要 `cat`。
- 大檔只讀需要的部分：`docs/企劃書.md`、`docs/*提示詞.md` 用 Grep 找段落；`CHANGELOG.md` 新增條目只讀開頭 30 行。
- 改完 JS 後：`npx prettier@3.3.3 --write js/*.js`（設定在 `.prettierrc`），再 `python3 tools/codemap.py`（更新大綱、`SYMBOLS.txt`，並列出 CODEMAP 裡已失效的名稱，有的話順手修）。
- 新增功能、檔案或區段時，在 `docs/CODEMAP.md` 對照表補一列（一個功能一列，方便 Grep）。

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 頁面骨架（`#app`、`#modal`、`#toast`）、載入順序 |
| `css/style.css` | 全部樣式（手機直式優先）；開頭 `:root` 是設計規範的變數（`--fs-*`、`--sp-*`、`--r-*`、顏色、星級 `--s1`～`--s5`） |
| `js/core.js` | `$`、`fl`、固定亂數 `h`／`rng`、`esc`、`shade` 等共用工具 |
| `js/data.js` | 遊戲表格：回合表 `ROUNDS`、經濟、背包等級 `BAGLV`、名次加減分、頭像 `AVATARS`、`VER`、存檔鍵 `KEY` |
| `js/sprites.js` | PNG 大圖 `artSprite`／`artIconURL`、8×8 備用星星 `iconURL`、程式像素圖 `pixURL`（只剩藥水） |
| `js/art.js` | 自動產生（`tools/art.py`）：`ART_SHEET` 大圖網址（`img/組名.hash.png`）、`ART` 每張圖的位置，圖名 `a_檔名`；不要手改 |
| `js/items.js` | 道具 `ITEMS`（形狀、星級、標籤、效果、相鄰加成）、職業核心、升階、詞綴、說明文字 |
| `js/bag.js` | 背包格子、擺放、相鄰、合成 `mergeAll`、把背包算成戰鬥數值 `compileBag`、快照格式 |
| `js/sim.js` | 自動戰鬥模擬 `simulate`（純計算、固定亂數、輸出事件時間軸） |
| `js/run.js` | 一局流程：回合、商店、經濟、野怪與首領 `MOBS`、開戰與結算、名次、賽制掛勾 `MODEH`、機器人對局 `simLobby`／`makeBots` |
| `js/bot.js` | 機器人的腦：戰力分數 `botPower`、每回合的決定 `botAct`（買、擺、賣、合成、升背包、刷新、三選一）、訓練出來的參數 `BOT_P`、舊買法 `botActOld`（skill `bot-ai`） |
| `js/ghost.js` | 快照對戰：Supabase `runs`／`snaps` 存取、配對 `ghostRivals`（不夠就機器人補位） |
| `js/audio.js` | Web Audio 合成音樂與音效 |
| `js/cloud.js` | Supabase 匿名登入、信箱註冊／登入、存檔上傳（每 15 秒／切到背景時） |
| `js/news.js` | 給玩家看的更新紀錄 `NEWS`（首頁左下「更新紀錄」） |
| `js/ui.js` | 所有畫面（首頁、準備、戰鬥播放、結算、三選一、圖鑑、說明、設定）、拖曳擺放、`data-act` 動作表 `A` |
| `js/main.js` | `newGame`／`load`／`save`／`migrate`／`start`，最後執行 `start()` |
| `tools/build_artifact.py` | 打包成單一 HTML，給 Claude Artifact 預覽（`img/` 大圖在這裡轉 base64 內嵌） |
| `tools/art.py` | `art/monsters/` 的 PNG 像素圖（裁邊）與 `art/icons/` 的 32×32 圖示（不裁邊）→ 拼成 `img/` 的調色盤大圖＋`js/art.js` 座標；使用者說「放了新圖」就跑（skill `pixel-art`） |
| `tools/pixellab_batch.py` | PixelLab API 批次產圖：讀 `docs/怪物提示詞.md`／`docs/圖示提示詞.md` 的提示詞，輸出到 `art/new/`（不進 git）；金鑰用環境變數 `PIXELLAB_API_KEY`，不要寫進專案 |
| `tools/icon_sheets.py` | 圖示圖表：從 `docs/圖示提示詞.md` 組出 `docs/圖示圖表.md`（8×8 一張 64 個），圖表原圖放 `art/sheets/`，`process` 全部切成 `art/icons/` 的單張、跑 `art.py` 打包，最後 `archive`（有圖的提示詞搬到 `docs/提示詞封存.md`；切過的圖表整張移除、原圖搬到 `art/sheets/done/`）；圖表編號固定 |
| `tools/tarot_cut.py` | 塔羅牌卡圖：`art/sheets/sheet_tarot_N.png` 照 `docs/塔羅牌圖表.md` 的格序切成 `art/icons/tarot_牌.png`（64×64），跑 `art.py`（skill `pixel-art`） |
| `tools/game_node.js` | 在 Node 載入遊戲純邏輯（core～bot），給訓練與大量模擬用 |
| `tools/bot_train.js` | 機器人訓練：自我對打調 `BOT_P`，`--vs-old` 跟舊買法比，`--write` 寫回 `js/bot.js`；`--vs-rcls`／`--vs-plain` 比挑職業、擺位，`--jobs` 平行（skill `bot-ai`） |
| `tools/bot_cls.js` | 機器人挑職業的表 `BOT_CLS`：菁英對局統計職業 × 主題 × 賽制的名次，`--write` 寫回 `js/bot.js`；改了職業、主題、賽制或大改平衡後重跑（skill `bot-ai`） |
| `tools/lobby_pool.js` | 平行跑機器人對局（子行程），`bot_train.js`、`bot_cls.js` 用 |
| `tools/check.js` | 固定檢查：每個賽制整局跑（機器人代打）＋不變量；`--modes`、`--games`、`--golden`（重構前後比對）；有 ❌ 時結束碼 1 |
| `tools/pools.js` | 道具池：檢查每個主題、每類職業武器 1～5★ 都有、武器只屬於一個主題、基本池沒有武器；`--write` 寫 `docs/道具池.md`（分配表在 `items.js` 的 `POOLS`、新道具的 `th`） |
| `tools/stats.js` | 統計（skill `stats`）：機器人對局裡每件商店道具的購買率、對口職業購買率、持有率、名次，冷門／熱門道具，職業 × 賽制的名次；`--jobs` 平行、`--mode`、`--item`、`--save`／`--diff`（改數值前後比較）、`--write` 寫到 `docs/道具統計.md` |
| `tools/pve_check.js` | Node 版 PvE 勝率與對戰秒數：`node tools/pve_check.js 局數 q [MOB_HP] [MOB_DMG]` |
| `tools/icon_check.py` | 圖示對照：每件道具的圖示原本畫的是什麼（讀 `docs/提示詞封存.md` 等提示詞），輸出 `docs/圖示對照.md` 與候選圖示；加關鍵字只列相關的（skill `icon-check`） |
| `tools/codemap.py` | 重新產生 `docs/CODEMAP.md` 的區段大綱與 `docs/SYMBOLS.txt`（檔案照 `index.html` 的順序），並檢查 CODEMAP 裡失效的名稱 |
| `supabase/migrations/` | 資料庫結構（0.1.0 的快照對戰是 `20261022000000_serling_ghosts.sql`） |

## 本機執行
```bash
python3 -m http.server 8000   # 開 http://localhost:8000
python3 tools/build_artifact.py   # 產生 dist/wayfarer_artifact.html
```
存檔在 localStorage（鍵 `serling_v1`）；改了存檔格式要在 `main.js` 的 `migrate()` 補轉換（存檔版本是 `S.v`，0.1.0 起是 100，0.1.92 起是 101（玩家等級 `S.xp`、教學關 `S.tutDone`））。進行中的一局記著版本（`S.run.ver`），版本不同會直接結束那局。
測試用另一份存檔：網址加 `?p=2`。
瀏覽器測一整局：`newRun(liveBots(LOBBY_N - 1, 1000))` 後用 `botAct`（`js/bot.js`）代替玩家、`startFight`／`finishFight` 跑每回合（見 `docs/CODEMAP.md`）。

## Supabase
- 專案 ref：`eugkdfhkoaxvqhztvptc`，URL `https://eugkdfhkoaxvqhztvptc.supabase.co`
- 資料表 `public.saves`（user_id、data jsonb、game_version、updated_at），RLS 只允許本人讀寫。
- 快照對戰：`public.runs`（`ver` 存的是快照版本 `GVER`，不是遊戲版本；回合表或道具改到舊快照不能用時才換 `GVER`，換了要重產種子）、`public.snaps`（大家可讀、只能寫自己的）、RPC `pick_rivals`；SQL 在 `supabase/migrations/20261022000000_serling_ghosts.sql`。資料表不存在時遊戲自動改用機器人對手（`GHOST.off`）。開服種子：在瀏覽器主控台執行 `seedGhosts()`（skill `ghost-seed`），產生 648 局機器人對局（0.1.92 標準賽制加回後；全部是最高牌階 2100 的機器人，54 種賽制 × 主題各 2 場、13 個職業輪流；分數相近的快照不夠時配對會用 2100 再找一次）上傳成 `runs.seed = true`；配對只配同一個賽制＋主題（0.1.69，`runs.mode`／`theme`、RPC `pick_rivals_mt`，SQL 在 `supabase/migrations/20261025000000_serling_mode_theme.sql`，要在 SQL Editor 跑過），真人優先，真人夠多後可用 `delete from public.runs where seed;` 刪掉。
- 排行榜（0.1.29）：`runs.cls`、`runs.rating_end`、RPC `leaderboard`／`class_stats`，SQL 在 `supabase/migrations/20261023000000_serling_leaderboard.sql`（要在 SQL Editor 跑過才有資料；沒跑時首頁職業勝率改用自己的對局）。
- 核心統計（0.1.45）：`runs.core1`／`core2`／`core_log`（首領核心三選一紀錄）、RPC `core_stats`／`core_combo_stats`，SQL 在 `supabase/migrations/20261024000000_serling_core_stats.sql`（要在 SQL Editor 跑過才會存）；瀏覽器主控台 `await coreStatsCloud()` 看真人的選擇率與組合（`coreStatsCloud(true)` 連種子一起算）。
- 詳細統計（0.1.77）：RPC `class_stats_mt`、`core_stats_mt`（照賽制、道具池篩選），SQL 在 `supabase/migrations/20261026000000_serling_mode_stats.sql`（已套用）。
- 前端只放 anon key。**絕對不要使用或要求 service_role key。**
- 合併規則：本機與雲端各有 `savedAt`，啟動時取較新的那份。

## 部署
GitHub Pages：`main` 分支根目錄，網址 https://shiroyashatw.github.io/wayfarer/ 。push 後約 1 分鐘生效。
