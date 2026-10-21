# 漫步勇者 — 給 Claude 的專案說明

## 溝通規則
- **一律用繁體中文回覆**（包含進度說明與 commit 訊息）。
- 版本號：目前是 0.3.x（0.3.0 是昇華系統；使用者指定的版本號為準）。改版本一律用 `python3 tools/setver.py 新版本`，會同時改 `js/data.js` 的 `VER` 和 `index.html` 裡 JS／CSS 網址的 `?v=`（避免手機用到快取的舊檔）；再更新 `CHANGELOG.md` 與 `README.md`。
- 流程：先改、先測，確認 OK 後再一次 commit + push 到 GitHub（push 前先問使用者）。
- 企劃書：`docs/企劃書.md`（線上版在 Claude Docs）。系統規則改了要同步更新。
- 怪物／首領的 PixelLab 提示詞：`docs/怪物提示詞.md`（新增怪物圖用 skill `pixel-art`，採用後把提示詞記進去）。裝備、技能、輔助寶石圖示的提示詞另外放在 `docs/圖示提示詞.md`。

## 專案結構
純靜態網頁，沒有建置步驟。所有 JS 是一般 `<script>`（非 module），依序載入、共用全域；`main.js` 必須最後。

**定位程式碼（省 token，照順序）**：
1. 功能 → 檔案與函式：用 Grep 搜 `docs/CODEMAP.md` 的關鍵字（中文功能名或函式名，例：`Grep "昇華" docs/CODEMAP.md`），一列就是一個功能。**不要 Read 整份 CODEMAP**，需要面板／全域變數表時再用 offset 讀那一段。
2. 函式 → 行號：Grep `docs/SYMBOLS.txt` 的 `^函式名 `（一行一個頂層宣告：`名稱 檔案:行號 [區段]`），或直接 Grep `js/` 的 `function 函式名`。
3. 用 Read 的 offset/limit 只讀那一段（通常 40～120 行）。不要整個 JS 讀進來，也不要 `cat`。
- 大檔只讀需要的部分：`docs/企劃書.md`、`docs/*提示詞.md` 用 Grep 找段落；`CHANGELOG.md` 新增條目只讀開頭 30 行；`js/art.js` 是 base64 圖檔，永遠不要讀（`.rgignore` 已讓 Grep 略過）。
- 改完 JS 後：`npx prettier@3.3.3 --write js/*.js`（設定在 `.prettierrc`），再 `python3 tools/codemap.py`（更新大綱、`SYMBOLS.txt`，並列出 CODEMAP 裡已失效的名稱，有的話順手修）。
- 新增功能、檔案或區段時，在 `docs/CODEMAP.md` 對照表補一列（一個功能一列，方便 Grep）。

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 頁面骨架與 DOM、載入順序 |
| `css/style.css` | 全部樣式（手機直式優先） |
| `js/core.js` | `$`、`fl`、`m` 與共用工具（座標、繪圖輔助） |
| `js/data.js` | 地點／城鎮、怪物、詞綴、通貨、天賦樹 `TREE`、`VER` |
| `js/sprites.js` | 16x16 像素圖（自動描邊陰影）、8x8 圖示 |
| `js/gear.js` | 0.3.1 裝備外觀：每種底材的 12×12 圖示 `GEAR`、材質階級 `tierOf`、`gearIcon`、角色外觀疊圖 `heroLook`／`heroSpr`／`heroPal`（`sprites.js` 之後載入） |
| `js/art.js` | 自動產生（`tools/art.py`）：`art/monsters/*.png` 的 PNG 怪物圖（base64），圖名 `a_檔名`；不要手改 |
| `js/skills.js` | 0.3 技能石擴充（約 130 種，武器／元素標籤、召喚、增益、0.3.19 條件 `SK_COND` 與戰吼）、0.3.20 輔助寶石 `SUPG`、新圖示（`sprites.js` 之後載入） |
| `js/audio.js` | Web Audio 合成音樂與音效 |
| `js/items.js` | `newGame`、裝備、詞綴、通貨製作、屬性計算 |
| `js/battle.js` | 戰鬥背景、多隻敵人的回合邏輯（`actResolve`／`enemyResolve` 單人與組隊共用）、繪製 |
| `js/map.js` | 世界地圖（以台中車站為原點、公尺座標）、OpenFreeMap 向量圖磚（z14）解碼與 IndexedDB 快取、45 個地標城鎮、分塊迷霧、晝夜視野、生成（`dungeonAt`）、攝影機、GPS |
| `js/tree.js` | 天賦樹全螢幕介面（縮放、拖曳、多節點路徑）、0.3.13 中間的契靈圓盤（沒有出發點，從圓盤往外點） |
| `js/ui.js` | HUD、底部面板、互動、據點、`data-act` 動作表 |
| `js/endgame.js` | 0.2 終局：0.3.23 藏身處（取代據點，`hideoutHTML`）、空白石碑／魔法陣、靈脈、區域特性、冥府侵蝕柱與碎片（`ui.js` 之後載入；據點半徑、冒險營旗、絲綢之路 0.3.23 拿掉） |
| `js/undead.js` | 亡靈軍團：亡靈區、亡靈怪、精華、亡靈祭壇與軍團長、亡靈王、據點的亡靈製作（屍化值）（`endgame.js` 之後載入） |
| `js/demon.js` | 魔霧封印、七宗罪雕像與 7 個王、傳奇裝備、惡魔珠寶與天賦盤珠寶槽、七宗罪之王（0.2.7～0.2.11，`undead.js` 之後載入） |
| `js/hunt.js` | 狩獵墮落十二生肖：追蹤之血、墮落獸、惡魔結晶召喚事件、十二生肖首領（0.2.12，`demon.js` 之後載入） |
| `js/daily.js` | 今日委託、「委託」面板（0.3.15 取代附近：委託、所在區域進度、刷新倒數）、足跡（0.2.13，`hunt.js` 之後載入） |
| `js/asc.js` | 0.3 昇華：昇華職業與 24 條分支資料（0.3.16 起每條分支是 `ASC_ART` 裡自己的一張圖案，路線短、會分岔，「抉擇」大點旁三個小點只能點一個）、節點圖示、昇華面板、城鎮的昇華試煉、重選（`daily.js` 之後載入） |
| `js/gacha.js` | 0.3.12 契靈祈願：契靈 `PACTS`（R／SR／SSR）、詞綴池 `PAFF`（T6～T1、標籤、技能等級 +N）、卡池、保底、突破解鎖詞綴、欄位（隨昇華試煉）、跟隨、結果動畫 |
| `js/tutor.js` | 新手引導：`TUT` 步驟清單，新增功能時順手補一步 |
| `js/cloud.js` | Supabase 匿名登入、信箱註冊／登入、玩家編號、存檔上傳（每 15 秒／切到背景時） |
| `js/social.js` | 好友（`friend_*` RPC）、名字同步到 `profiles`、組隊邀請（`party_invites` + Realtime） |
| `js/mp.js` | 隊伍（6 碼代碼、Realtime 廣播頻道 `wf-party-代碼`）與多人戰鬥；隊長的裝置計算、廣播 `state` |
| `js/main.js` | `load`/`save`/`migrate`/`start`，最後執行 `start()` |
| `tools/build_artifact.py` | 打包成單一 HTML，給 Claude Artifact 預覽 |
| `tools/art.py` | `art/` 的 PNG 像素圖 → `js/art.js`（裁邊、內嵌）；新增怪物圖先用 skill `pixel-art` 產生 PixelLab 提示詞 |
| `tools/pixellab_batch.py` | PixelLab API 批次產圖：讀 `docs/怪物提示詞.md`／`docs/圖示提示詞.md` 的提示詞，輸出到 `art/new/`（不進 git）；金鑰用環境變數 `PIXELLAB_API_KEY`，不要寫進專案 |
| `tools/codemap.py` | 重新產生 `docs/CODEMAP.md` 的區段大綱與 `docs/SYMBOLS.txt`（函式行號），並檢查 CODEMAP 裡失效的名稱 |
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
