# 漫步勇者 — 給 Claude 的專案說明

## 溝通規則
- **一律用繁體中文回覆**（包含進度說明與 commit 訊息）。
- 版本號：demo 目前是 0.1.x，每次更新 +1（0.1.4 → 0.1.5 …）。使用者明確說要進 0.2 才改。版本號在 `js/data.js` 的 `const VER`，同時更新 `CHANGELOG.md` 與 `README.md`。
- 流程：先改、先測，確認 OK 後再一次 commit + push 到 GitHub（push 前先問使用者）。
- 企劃書：`docs/企劃書.md`（線上版在 Claude Docs）。系統規則改了要同步更新。

## 專案結構
純靜態網頁，沒有建置步驟。所有 JS 是一般 `<script>`（非 module），依序載入、共用全域；`main.js` 必須最後。

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 頁面骨架與 DOM、載入順序 |
| `css/style.css` | 全部樣式（手機直式優先） |
| `js/core.js` | `$`、`fl`、`m` 與共用工具（座標、繪圖輔助） |
| `js/data.js` | 地點／城鎮、怪物、詞綴、通貨、天賦樹 `TREE`、`VER` |
| `js/sprites.js` | 16x16 像素圖（自動描邊陰影）、8x8 圖示 |
| `js/audio.js` | Web Audio 合成音樂與音效 |
| `js/items.js` | `newGame`、裝備、詞綴、通貨製作、屬性計算 |
| `js/battle.js` | 戰鬥背景、回合邏輯、繪製 |
| `js/map.js` | 世界地圖（以台中車站為原點、公尺座標）、道路、迷霧、晝夜視野、生成、攝影機 |
| `js/tree.js` | 天賦樹全螢幕介面（縮放、拖曳、多節點路徑） |
| `js/ui.js` | HUD、底部面板、互動、據點、`data-act` 動作表 |
| `js/cloud.js` | Supabase 匿名登入、存檔上傳（每 15 秒／切到背景時） |
| `js/main.js` | `load`/`save`/`migrate`/`start`，最後執行 `start()` |
| `tools/build_artifact.py` | 打包成單一 HTML，給 Claude Artifact 預覽 |
| `supabase/migrations/` | 資料庫結構 |

## 本機執行
```bash
python3 -m http.server 8000   # 開 http://localhost:8000
python3 tools/build_artifact.py   # 產生 dist/wayfarer_artifact.html
```
存檔在 localStorage；改了存檔格式要在 `main.js` 的 `migrate()` 補轉換。

## Supabase
- 專案 ref：`eugkdfhkoaxvqhztvptc`，URL `https://eugkdfhkoaxvqhztvptc.supabase.co`
- 資料表 `public.saves`（user_id、data jsonb、game_version、updated_at），RLS 只允許本人讀寫。
- 前端只放 anon key。**絕對不要使用或要求 service_role key。**
- 合併規則：本機與雲端各有 `savedAt`，啟動時取較新的那份。

## 部署
GitHub Pages：`main` 分支根目錄，網址 https://shiroyashatw.github.io/wayfarer/ 。push 後約 1 分鐘生效。
