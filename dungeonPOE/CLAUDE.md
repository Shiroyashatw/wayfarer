# dungeonPOE — 給 Claude 的專案說明

**最高優先：任何改動都先讀 `docs/設計原則.md`**（MDA 從樂趣倒推機制、隨機性規則、從《塞令老師》學到的教訓），規則與數值在 `docs/企劃書.md`，改了要同步。

**每次新對話開始**：先用 Skill 啟動 `ponytail`（最小完整改動）和 `grilling`（先把計畫問清楚再動手）。

**只要動到 UI／UX：一定先啟動 skill `ui-design`**（它會先啟動 `apple-design`，有動畫再加 `animate`）。0.2.0 起是**桌機優先**的即時 ARPG：截圖用 1440×900 與 1280×720（面板不能超出畫面），手機不是目標。

0.2.0 重製成桌機的即時動作 ARPG：藏身處 → 地圖台放地圖碎片、自選階級（1～16，打倒王開放下一階）→ 刷圖打王撿寶。死亡照 PoE（扣經驗、裝備不掉）。10 欄裝備＋格子背包與倉庫，稀有度照 D2。之後：技能寶石、共用天賦樹＋核心昇華樹、市集接回。0.1 的撤離＋背包自動戰鬥規則在 `docs/舊企劃書_0.1.md`（程式在 git 紀錄）。

## 溝通規則
- **一律用繁體中文回覆**（包含 commit 訊息）。
- 版本號：0.2.x。改版本時改 `js/data.js` 的 `VER` 和 `index.html` 所有 `?v=`，再更新 `CHANGELOG.md`。
- 流程：先改、先測，確認 OK 後再 commit + push（push 前先問使用者）。
- 這個資料夾自己就能跑（不引用上一層的檔案），以後可以整個搬到別的 repo。

## 檢查（改了遊戲邏輯一定要跑）
- `node tools/check.js`：圖名、3000 件裝備的稀有度與詞綴範圍、全身裝備數值沒有 NaN、格子背包不重疊。有 ❌ 不交差。
- 戰鬥、面板、拖曳用 Playwright 在本機實際操作（`python3 -m http.server`）：進地圖、打王開放下一階、死亡、拖曳裝上／交換／倉庫／賣掉、存檔還原。
- 改完 JS：`npx prettier@3.3.3 --write js/*.js tools/*.js`。

## 專案結構
純靜態網頁，沒有建置步驟。JS 是一般 `<script>`，照 `index.html` 的順序載入、共用全域；`main.js` 最後。`data`、`items` 是純邏輯（`tools/check.js` 用 Node 載入）。

| 檔案 | 內容 |
| --- | --- |
| `js/core.js` | `$`（getElementById）、`fl`、固定亂數 `h`／`rng`、`esc` |
| `js/data.js` | 表格：`VER`、`KEY`、`SLOT`、主角 `HERO`、等級經驗 `xpNeed`、技能 `SKILLS`（第二階段換成技能寶石）、翻滾與見切 `ROLL`、藥水 `FLASK`、地圖階級 `TMAX`／`mapCost`／`tierMul`／`tierIlvl`、抗性 `RESK`／`ELN`／`ELC`、裝備欄 `EQS`、種類 `KINDS`（大小、可出現的詞綴）、底材 `BASES`、詞綴 `AFF`（`tierRange` T12～T1、`bestTier`）、怪物 `MOBS`／`PACKS`／`ELITE`、王 `BOSSES`／`bossOf` |
| `js/sprites.js`、`js/art.js`、`img/` | 像素圖大圖（`art.js` 是產生的，不要手改）；`artImg`（canvas 用）、`artSprite`（白色閃光版）、`artIconURL`（面板圖示） |
| `js/items.js` | 裝備產生 `mkItem`／`dropItem`／`rollRarity`、名字與說明 `itemName`／`affText`／`baseText`、賣價 `sellPrice`、格子背包 `gridFree`／`gridHits`／`gridAuto`、角色數值 `stats`、`dps` |
| `js/audio.js` | Web Audio 合成音效 `sfx` |
| `js/game.js` | 存檔結構 `newGame`、場景（藏身處 `enterHideout`、開圖 `openMap`、方塊房間地圖 `enterMap`（`TS`、`CHUNK`、牆 `isWall`、找地板 `floorIn`／`floorNear`）、首領進度 `addProg`、回家 `goHome`）、碰撞 `moveBody`／`pushTiles`、玩家與技能 `useSkill`／`actHit`／`updPlayer`、翻滾 `doRoll`、受傷與見切 `hurtPlayer`、死亡 `die`、打怪 `hitMob`／`killMob`（掉落、碎片）、打倒王 `bossDown`（開放下一階）、撿東西 `pickup`、互動 `interact`／`useProp`、怪物 AI `updMobs`／`mobStrike`、王 `bossAI`、主迴圈 `frame` |
| `js/render.js` | canvas 畫面 `draw`：藏身處 `drawHideout`、互動提示 `drawPrompts`、預警、怪物、牆 `drawWalls`、主角（`img/hero.png` 的 `heroCell`、方向 `dirCol`）、特效、跳數字、掉落標籤 `LABELS`、光照、小地圖 |
| `js/hud.js` | HUD（生命／魔力球、技能列固定 5 格 `BAR`、王血條、首領進度條）、面板 `openPanel`／`hudPanels`（裝備 `invHTML`、倉庫、地圖台 `devHTML`）、拖曳 `dragStart`／`dragMove`／`dropTarget`／`dragEnd`、點一下搬移 `quickMove`、賣 `sell`、說明框 `itemTip`、死亡與通關 `hudState`、輸入 `inputInit`、動作 `act` |
| `js/cloud.js` | Supabase 匿名登入＋雲端存檔（表 `dungeon_saves`） |
| `js/market.js` | 0.1 的市集（還沒接回 0.2，`index.html` 沒有載入） |
| `js/main.js` | `load`／`save`／`migrate`／`start` |
| `tools/check.js` | 固定檢查 |
| `supabase/migrations/` | `dungeon_saves` 表、`dungeon_market` 市集表與函式 |

## 本機執行
```bash
python3 -m http.server 8000   # 在 dungeonPOE/ 底下，開 http://localhost:8000
```
存檔在 localStorage（鍵 `dungeonpoe_v1`，網址加 `?p=2` 用另一份）。存檔版本 `S.v`：0.2.0 起是 10（0.1 的 1～3 直接開新角色），改格式要在 `main.js` 的 `migrate()` 補轉換。

## Supabase
同一個專案（ref `eugkdfhkoaxvqhztvptc`），表 `public.dungeon_saves`（跟《塞令老師》的 `saves` 分開，RLS 只允許本人）。前端只放 anon key，**絕對不要使用或要求 service_role key**。表不存在時只存本機。

## 部署
GitHub Pages：`main` 分支，網址 https://shiroyashatw.github.io/wayfarer/dungeonPOE/ 。
