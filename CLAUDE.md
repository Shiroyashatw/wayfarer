# 塞令老師 — 給 Claude 的專案說明

4 人一場的背包自動對戰（0.1.0 從「漫步勇者」走路地圖 RPG 轉型）。設計在 `docs/企劃書.md`，舊版企劃在 `docs/舊企劃書_漫步勇者.md`。

## 溝通規則
- **一律用繁體中文回覆**（包含進度說明與 commit 訊息）。
- 版本號：目前是 0.1.x（0.1.0 是轉型；使用者指定的版本號為準）。改版本一律用 `python3 tools/setver.py 新版本`，會同時改 `js/data.js` 的 `VER` 和 `index.html` 裡 JS／CSS 網址的 `?v=`（避免手機用到快取的舊檔）；再更新 `CHANGELOG.md` 與 `README.md`；有遊戲功能變化的話，也在 `js/news.js` 的 `NEWS` 最上面加一筆給玩家看的更新紀錄（只寫遊戲功能，不寫開發細節）。
- 流程：先改、先測，確認 OK 後再一次 commit + push 到 GitHub（push 前先問使用者）。
- 企劃書：`docs/企劃書.md`（線上版在 Claude Docs）。規則或數值改了要同步更新。
- 介面：照 `docs/設計規範.md`（字級、顏色變數、間距、元件、資訊量規則）；改介面用 skill `ui-design`，改完在手機尺寸截圖並跑 `.claude/skills/ui-design/audit.js`。
- 圖：道具圖示的 PixelLab 提示詞在 `docs/圖示提示詞.md`（只留還沒產的；做完的在 `docs/提示詞封存.md`），怪物在 `docs/怪物提示詞.md`，玩家選的頭像（4×4 大圖、每格 64×64）在 `docs/頭像圖表.md`；新增圖用 skill `pixel-art`。
- 圖示：新增道具或借用圖示（`ic`）後用 skill `icon-check`：`python3 tools/icon_check.py` 產生 `docs/圖示對照.md`（名字 ↔ 圖示原本畫的東西），對不上就換圖示或改名字。
- 平衡：改道具、職業、核心、怪物、經濟或升階倍率後用 skill `balance`：跑 `.claude/skills/balance/balance.js` 的 `coverage()`（各體系各星級、輔助、異常來源、職業、核心、圖示、說明文字）與 `sims()`（職業名次、PvE 勝率、公平性、局長、背包成長），沒有 ❌ 才交差。

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
| `js/sprites.js` | 像素圖（`SPR`、自動描邊）、8×8 圖示 `iconURL`、`pixURL`、PNG 大圖 `artSprite`／`artIconURL`（舊版留下的部分函式沒用到） |
| `js/art.js` | 自動產生（`tools/art.py`）：`ART_SHEET` 大圖網址（`img/組名.hash.png`）、`ART` 每張圖的位置，圖名 `a_檔名`；不要手改 |
| `js/items.js` | 道具 `ITEMS`（形狀、星級、標籤、效果、相鄰加成）、職業核心、升階、詞綴、說明文字 |
| `js/bag.js` | 背包格子、擺放、相鄰、合成 `mergeAll`、把背包算成戰鬥數值 `compileBag`、快照格式 |
| `js/sim.js` | 自動戰鬥模擬 `simulate`（純計算、固定亂數、輸出事件時間軸） |
| `js/run.js` | 一局流程：回合、商店、經濟、野怪與首領 `MOBS`、開戰與結算、名次、機器人對手 `makeBot` |
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
| `tools/icon_check.py` | 圖示對照：每件道具的圖示原本畫的是什麼（讀 `docs/提示詞封存.md` 等提示詞），輸出 `docs/圖示對照.md` 與候選圖示；加關鍵字只列相關的（skill `icon-check`） |
| `tools/codemap.py` | 重新產生 `docs/CODEMAP.md` 的區段大綱與 `docs/SYMBOLS.txt`（檔案照 `index.html` 的順序），並檢查 CODEMAP 裡失效的名稱 |
| `supabase/migrations/` | 資料庫結構（0.1.0 的快照對戰是 `20261022000000_serling_ghosts.sql`） |

## 本機執行
```bash
python3 -m http.server 8000   # 開 http://localhost:8000
python3 tools/build_artifact.py   # 產生 dist/wayfarer_artifact.html
```
存檔在 localStorage（鍵 `serling_v1`）；改了存檔格式要在 `main.js` 的 `migrate()` 補轉換（存檔版本是 `S.v`，0.1.0 起是 100）。進行中的一局記著版本（`S.run.ver`），版本不同會直接結束那局。
測試用另一份存檔：網址加 `?p=2`。
瀏覽器測一整局：`newRun(makeBots(3, 1000))` 後用 `botAct` 代替玩家、`startFight`／`finishFight` 跑每回合（見 `docs/CODEMAP.md`）。

## Supabase
- 專案 ref：`eugkdfhkoaxvqhztvptc`，URL `https://eugkdfhkoaxvqhztvptc.supabase.co`
- 資料表 `public.saves`（user_id、data jsonb、game_version、updated_at），RLS 只允許本人讀寫。
- 快照對戰：`public.runs`（`ver` 存的是快照版本 `GVER`，不是遊戲版本；回合表或道具改到舊快照不能用時才換 `GVER`，換了要重產種子）、`public.snaps`（大家可讀、只能寫自己的）、RPC `pick_rivals`；SQL 在 `supabase/migrations/20261022000000_serling_ghosts.sql`。資料表不存在時遊戲自動改用機器人對手（`GHOST.off`）。開服種子：在瀏覽器主控台執行 `seedGhosts(160)`，產生 160 局機器人對局（分數 700～2100 平均分布，每個牌階都有對手）（4 個一場真的互打）上傳成 `runs.seed = true`；配對時真人優先，真人夠多後可用 `delete from public.runs where seed;` 刪掉。
- 前端只放 anon key。**絕對不要使用或要求 service_role key。**
- 合併規則：本機與雲端各有 `savedAt`，啟動時取較新的那份。

## 部署
GitHub Pages：`main` 分支根目錄，網址 https://shiroyashatw.github.io/wayfarer/ 。push 後約 1 分鐘生效。
