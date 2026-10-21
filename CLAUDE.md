# 漫步勇者 — 給 Claude 的專案說明

## 溝通規則
- **一律用繁體中文回覆**（包含進度說明與 commit 訊息）。
- 版本號：0.1.0 起是肉鴿版，版本號重新從 0.1 開始（走路版到 0.3.52 為止；使用者指定的版本號為準）。改版本一律用 `python3 tools/setver.py 新版本`，會同時改 `js/data.js` 的 `VER` 和 `index.html` 裡 JS／CSS 網址的 `?v=`（避免手機用到快取的舊檔）；再更新 `CHANGELOG.md` 與 `README.md`。
- 流程：先改、先測，確認 OK 後再一次 commit + push 到 GitHub（push 前先問使用者）。
- 企劃書：`docs/企劃書.md`（肉鴿版）；走路版的企劃與更新紀錄在 `docs/archive/`（技能石、詞綴、天賦、昇華、怪物的細節設計可以去那裡查）。系統規則改了要同步更新。
- 遊戲型態：**短局肉鴿**（三章節點地圖、勝利三選一、局外魂晶）。不要再加真實地圖、GPS、走路、刷新週期、組隊相關的東西。
- 介面：照 `docs/設計規範.md`（字級、顏色變數、間距、元件、資訊量規則）；改介面用 skill `ui-design`，改完在手機尺寸截圖並跑 `.claude/skills/ui-design/audit.js`。
- 怪物／首領的 PixelLab 提示詞：`docs/怪物提示詞.md`（新增怪物圖用 skill `pixel-art`，採用後把提示詞記進去）。裝備、技能、輔助寶石圖示的提示詞另外放在 `docs/圖示提示詞.md`（只留還沒產的；做完的在 `docs/提示詞封存.md`，要重產時再複製回去）。

## 專案結構
純靜態網頁，沒有建置步驟。所有 JS 是一般 `<script>`（非 module），依序載入、共用全域；`main.js` 必須最後。

**定位程式碼（省 token，照順序）**：
1. 功能 → 檔案與函式：用 Grep 搜 `docs/CODEMAP.md` 的關鍵字（中文功能名或函式名，例：`Grep "昇華" docs/CODEMAP.md`），一列就是一個功能。**不要 Read 整份 CODEMAP**，需要面板／全域變數表時再用 offset 讀那一段。
2. 函式 → 行號：Grep `docs/SYMBOLS.txt` 的 `^函式名 `（一行一個頂層宣告：`名稱 檔案:行號 [區段]`），或直接 Grep `js/` 的 `function 函式名`。
3. 用 Read 的 offset/limit 只讀那一段（通常 40～120 行）。不要整個 JS 讀進來，也不要 `cat`。
- 大檔只讀需要的部分：`docs/企劃書.md`、`docs/*提示詞.md` 用 Grep 找段落；`CHANGELOG.md` 新增條目只讀開頭 30 行。
- 改完 JS 後：`npx prettier@3.3.3 --write js/*.js`（設定在 `.prettierrc`），再 `python3 tools/codemap.py`（更新大綱、`SYMBOLS.txt`，並列出 CODEMAP 裡已失效的名稱，有的話順手修）。
- 新增功能、檔案或區段時，在 `docs/CODEMAP.md` 對照表補一列（一個功能一列，方便 Grep）。

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 頁面骨架與 DOM（主選單 `#home`、章節地圖 `#runmap`、面板、戰鬥、彈窗）、載入順序 |
| `css/style.css` | 全部樣式（手機直式優先）；開頭 `:root` 是設計規範的變數（`--fs-*`、`--sp-*`、`--r-*`、顏色），中間是共用元件（`.c-*`、`details.more`、`.tiers`、`.g2`），結尾是主選單與章節地圖（`.hm`、`.rm-*`、`.rn`、`.clsg`） |
| `js/core.js` | `$`、`fl`、`h`／`rng`（種子亂數）與共用工具（繪圖輔助 `glow`） |
| `js/data.js` | 怪物 `MONS`、詞綴、通貨、天賦樹 `TREE`、屬性文字 `STATN`、`VER`、存檔鍵 `KEY` |
| `js/sprites.js` | 16x16 像素圖（自動描邊陰影）、8x8 圖示、PNG 大圖載入 `artSheet`（背景預載不重畫面板） |
| `js/gear.js` | 裝備外觀：每種底材的 12×12 圖示 `GEAR`、材質階級 `tierOf`、`gearIcon`、角色外觀疊圖 `heroLook`／`heroSpr`／`heroPal`（`sprites.js` 之後載入） |
| `js/art.js` | 自動產生（`tools/art.py`）：`ART_SHEET` 大圖網址（`img/組名.hash.png`）、`ART` 每張圖在大圖裡的位置，圖名 `a_檔名`；不要手改 |
| `js/iconmap.js` | 自動產生（`tools/icon_sheets.py build`）：天賦樹節點名 → `art/icons/tree_代號.png` 的對照 `TREE_IC`；不要手改 |
| `js/skills.js` | 技能石（約 130 種，武器／元素標籤、召喚、增益、條件 `SK_COND` 與戰吼）、輔助寶石 `SUPG`、圖示（`sprites.js` 之後載入） |
| `js/audio.js` | Web Audio 合成音樂與音效（背景回來時不補排落後的音符） |
| `js/items.js` | `newChar`（一局的角色）／`newGame`（整份存檔）、裝備、詞綴、通貨製作、屬性計算 `sumStats`／`stats`（`runStats` 掛點）、怪物產生 `makeEnemy`、商店 `openShop` |
| `js/battle.js` | 戰鬥背景（柔焦用縮小畫布，不用 filter blur）、多隻敵人的即時行動條戰鬥（`actResolve`／`enemyResolve`）、戰鬥結算 `winBattle`／`loseBattle`（交給 `run.js`）、畫面迴圈 `tick`、戰鬥速度 `bSpd` |
| `js/monskill.js` | 怪物招式：招式表 `MSK`、依階級分配 `monSkills`、放招 `monPick`／`monCast`（`battle.js` 之後載入） |
| `js/ui.js` | HUD、底部面板（角色、技能、背包、裝備、契靈、設定、日誌）、`data-act` 動作表 `A` |
| `js/foes.js` | 各章的首領與怪物池資料：冥府看門人 `WATCHERS`、台灣鬼怪 `GHOSTS`、第三章 `HELLMON`、墮落帝雉 `BEAST_X`、海盜王 `PIRATE_KING` |
| `js/undead.js` | 亡靈怪 `UNDEAD`、亡靈軍團長外觀 `UD_LORDS`、`udBoss`（亡靈王） |
| `js/demon.js` | 七宗罪之王與 7 個王的機制、傳奇裝備、惡魔珠寶、魔霧詞綴與魔霧怪 `MISTMON`、四凶與燭龍、七罪信徒 `SINF`／`makeFollower` |
| `js/zodiac.js` | 墮落十二生肖 `ZODIAC`／`makeZodiac`、墮落配色 `corruptPal`、墮落獸 `HUNT_SPR`／`beastBase` |
| `js/asc.js` | 昇華：8 個職業與 24 條分支（`ASC`、節點 `ASCN`、`ascStats`）、節點圖示、昇華盤（0.1.0 起只能看，昇華由首領三選一給） |
| `js/gacha.js` | 契靈祈願：契靈 `PACTS`（R／SR／SSR）、詞綴池 `PAFF`、卡池、保底、突破、出戰欄（一局裡每打倒一個首領 +1）、結果動畫 |
| `js/events.js` | 事件節點 `EVENTS`（13 個台灣民俗事件）、祝福 `bless`／`runStats`、每級成長 `RUN_LV` |
| `js/run.js` | 一局：章 `CH`、節點 `NODE`、地圖 `genMap`、開始與結算 `startRun`／`endRun`、節點 `enterNode`／`nodeDone`、怪物群 `fightGroup`／`eliteGroup`／`bossGroup`、獎勵三選一 `rewardPicks`／`pickModal`、昇華三選一 `ascModal`、天賦三選一 `passModal`、經驗金幣 `runGain`、章節地圖 `runmapRender`、`viewRender` |
| `js/meta.js` | 局外：角色起始配置 `RUN_CLS`／`applyKit`、局外升級 `META_UP`／`applyMeta`、每日挑戰 `dailySeed`、主選單 `homeRender`、選角 `clsModal` |
| `js/cloud.js` | Supabase 匿名登入、信箱註冊／登入、玩家編號、存檔上傳（每 15 秒／切到背景時） |
| `js/main.js` | `load`/`save`/`migrate`（用新遊戲預設值補欄位）/`start`，最後執行 `start()` |
| `tools/build_artifact.py` | 打包成單一 HTML，給 Claude Artifact 預覽（`img/` 大圖在這裡轉 base64 內嵌） |
| `tools/art.py` | `art/monsters/` 的 PNG 像素圖（裁邊）與 `art/icons/` 的 32×32 圖示（不裁邊）→ 拼成 `img/` 的調色盤大圖（無損、帶 hash）＋`js/art.js` 座標；使用者說「放了新圖」就跑（skill `pixel-art`） |
| `tools/pixellab_batch.py` | PixelLab API 批次產圖：讀 `docs/怪物提示詞.md`／`docs/圖示提示詞.md` 的提示詞，輸出到 `art/new/`（不進 git）；金鑰用環境變數 `PIXELLAB_API_KEY`，不要寫進專案 |
| `tools/icon_sheets.py` | 圖示圖表：從 `docs/圖示提示詞.md` 組出 `docs/圖示圖表.md`（8×8 一張 64 個、同類系同一張、共用風格），圖表原圖放 `art/sheets/`（進 git），`process` 全部切成 `art/icons/` 的單張、跑 `art.py` 打包，最後 `archive`（有圖的提示詞搬到 `docs/提示詞封存.md`；切過的圖表整張移除、原圖搬到 `art/sheets/done/`，沒畫出來的格子重新排進新圖表）；圖表編號固定，重跑 build 不會變 |
| `tools/codemap.py` | 重新產生 `docs/CODEMAP.md` 的區段大綱與 `docs/SYMBOLS.txt`（函式行號，照 `index.html` 的載入順序），並檢查 CODEMAP 裡失效的名稱 |
| `tools/bot.js` | 平衡測試用的代打機器人（加速時間、自動出招、換裝、升級技能石、選路線），不會被遊戲載入；用法寫在檔案開頭 |
| `supabase/migrations/` | 資料庫結構 |

## 本機執行
```bash
python3 -m http.server 8000   # 開 http://localhost:8000
python3 tools/build_artifact.py   # 產生 dist/wayfarer_artifact.html
```
存檔在 localStorage（鍵 `wayfarer_rogue_v1`，格式標記 `fmt: 'rogue1'`）。新增欄位放進 `newGame()`／`newChar()` 就好，`migrate()` 會用預設值補；真的要改既有欄位的意思才需要寫轉換。
測試用存檔：網址加 `?p=2`（不同存檔與帳號）。
平衡測試：本機開遊戲，在 console 載入 `tools/bot.js`（見檔案開頭），看 `__bot.fights`。

## Supabase
- 專案 ref：`eugkdfhkoaxvqhztvptc`，URL `https://eugkdfhkoaxvqhztvptc.supabase.co`
- 資料表 `public.saves`（user_id、data jsonb、game_version、updated_at），RLS 只允許本人讀寫。
- 前端只放 anon key。**絕對不要使用或要求 service_role key。**
- 合併規則：本機與雲端各有 `savedAt`，啟動時取較新的那份。

## 部署
GitHub Pages：`main` 分支根目錄，網址 https://shiroyashatw.github.io/wayfarer/ 。push 後約 1 分鐘生效。
