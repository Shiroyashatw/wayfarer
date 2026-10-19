# 漫步勇者 — 給 Claude 的專案說明

## 溝通規則
- **一律用繁體中文回覆**（包含進度說明與 commit 訊息）。
- 版本號：目前是 0.2.x（0.3 保留給昇華系統；使用者指定的版本號為準）。改版本一律用 `python3 tools/setver.py 新版本`，會同時改 `js/data.js` 的 `VER` 和 `index.html` 裡 JS／CSS 網址的 `?v=`（避免手機用到快取的舊檔）；再更新 `CHANGELOG.md` 與 `README.md`。
- 流程：先改、先測，確認 OK 後再一次 commit + push 到 GitHub（push 前先問使用者）。
- 企劃書：`docs/企劃書.md`（線上版在 Claude Docs）。系統規則改了要同步更新。

## 專案結構
純靜態網頁，沒有建置步驟。所有 JS 是一般 `<script>`（非 module），依序載入、共用全域；`main.js` 必須最後。

**改程式前先看 `docs/CODEMAP.md`**：裡面有「要改什麼看哪裡」對照表、面板與全域變數說明，以及每個檔案的函式／常數行號索引。找到行號後用 Read 的 offset/limit 只讀那一段，不要整個檔案讀進來，也不要 `cat` 整個 JS。
- 改完 JS 後：`npx prettier@3.3.3 --write js/*.js`（設定在 `.prettierrc`），再 `python3 tools/codemap.py` 更新索引行號。
- 新增檔案、區段或重要函式時，順手更新 `docs/CODEMAP.md` 的對照表。

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
| `js/map.js` | 世界地圖（以台中車站為原點、公尺座標）、OpenFreeMap 向量圖磚（z14）解碼與 IndexedDB 快取、45 個地標城鎮、分塊迷霧、晝夜視野、生成（`dungeonAt`）、攝影機、GPS |
| `js/tree.js` | 天賦樹全螢幕介面（縮放、拖曳、多節點路徑） |
| `js/ui.js` | HUD、底部面板、互動、據點、`data-act` 動作表 |
| `js/endgame.js` | 0.2 終局：據點半徑與冒險營旗、空白石碑／魔法陣、靈脈、區域特性、冥府侵蝕柱與碎片、絲綢之路（`ui.js` 之後載入） |
| `js/undead.js` | 亡靈軍團：亡靈區、亡靈怪、精華、亡靈祭壇與軍團長、亡靈王、據點的亡靈製作（屍化值）（`endgame.js` 之後載入） |
| `js/demon.js` | 魔霧封印、七宗罪雕像與 7 個王、傳奇裝備、惡魔珠寶與天賦盤珠寶槽、七宗罪之王（0.2.7～0.2.11，`undead.js` 之後載入） |
| `js/gacha.js` | 祈願（抽卡）：卡池、保底、十連、結果動畫 |
| `js/tutor.js` | 新手引導：`TUT` 步驟清單，新增功能時順手補一步 |
| `js/cloud.js` | Supabase 匿名登入、信箱註冊／登入、玩家編號、存檔上傳（每 15 秒／切到背景時） |
| `js/social.js` | 好友（`friend_*` RPC）、名字同步到 `profiles`、組隊邀請（`party_invites` + Realtime） |
| `js/mp.js` | 隊伍（6 碼代碼、Realtime 廣播頻道 `wf-party-代碼`）與多人戰鬥；隊長的裝置計算、廣播 `state` |
| `js/main.js` | `load`/`save`/`migrate`/`start`，最後執行 `start()` |
| `tools/build_artifact.py` | 打包成單一 HTML，給 Claude Artifact 預覽 |
| `tools/codemap.py` | 重新產生 `docs/CODEMAP.md` 的函式行號索引 |
| `supabase/migrations/` | 資料庫結構 |

## 本機執行
```bash
python3 -m http.server 8000   # 開 http://localhost:8000
python3 tools/build_artifact.py   # 產生 dist/wayfarer_artifact.html
```
存檔在 localStorage；改了存檔格式要在 `main.js` 的 `migrate()` 補轉換（存檔版本是 `S.v`）。
測多人：同一個瀏覽器開兩個分頁，第二個網址加 `?p=2`（不同存檔與帳號）。
地圖資料要標示「© OpenStreetMap 貢獻者」（畫面左下角）。

## Supabase
- 專案 ref：`eugkdfhkoaxvqhztvptc`，URL `https://eugkdfhkoaxvqhztvptc.supabase.co`
- 資料表 `public.saves`（user_id、data jsonb、game_version、updated_at），RLS 只允許本人讀寫。
- 前端只放 anon key。**絕對不要使用或要求 service_role key。**
- 合併規則：本機與雲端各有 `savedAt`，啟動時取較新的那份。

## 部署
GitHub Pages：`main` 分支根目錄，網址 https://shiroyashatw.github.io/wayfarer/ 。push 後約 1 分鐘生效。
