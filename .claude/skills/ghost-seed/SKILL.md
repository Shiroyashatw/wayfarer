---
name: ghost-seed
description: 塞令老師的種子與快照對手：判斷要不要換快照版本 GVER、上線後在瀏覽器重傳機器人種子（seedGhosts）、到資料庫確認數量與職業分布、寫進 CHANGELOG。改了道具、核心、職業、回合表、生命倍率、升階倍率、經濟或機器人，要上版時用；使用者說「重傳種子」「上傳種子」「換 GVER」「快照」「對手太少」「對手都同一個職業」「舊對手怪怪的」時也用。
---

# 塞令老師 種子與快照

對手大多是別人那一局的**快照**（每回合開戰前的背包，存在 Supabase `public.runs`／`public.snaps`）。開服與換版後真人快照不夠，就用**種子**補：瀏覽器跑 `seedGhosts(n)`，讓 6 個機器人用跟玩家一樣的規則打完整局（`simLobby`），每局每回合的背包上傳成 `runs.seed = true`。配對 `pick_rivals` 找「同一個 `ver`、分數差 300 以內」的對局，真人優先、種子補位。

- 程式：`js/ghost.js`（`seedGhosts`、`ghostRivals`、`ghostEnd`、`coreCols`、`coreStatsCloud`）、`js/data.js` 的 `GVER`
- SQL：`supabase/migrations/20261022000000_serling_ghosts.sql`（`runs`、`snaps`、`pick_rivals`）、`…20261023000000_serling_leaderboard.sql`（`cls`、`rating_end`）、`…20261024000000_serling_core_stats.sql`（`core1`／`core2`／`core_log`）
- `runs.ver` 存的是快照版本 `GVER`，不是遊戲版本 `VER`

## 1. 要不要換 GVER

快照存的是背包（道具 id、階、位置、核心 id…），對手的戰鬥是**用現在的程式**重算的。所以問題是「舊快照放到新規則裡還合不合理、會不會出錯」：

| 這次改了什麼 | 換 GVER？ |
| --- | --- |
| 新增道具、核心、職業（舊版玩家的程式不認得） | **要** |
| 同一個 id 換了效果（核心重製：`c_職業_編號` 照順序，換清單就換意思） | **要** |
| 形狀、格數（舊快照的位置會重疊、超出背包） | **要** |
| 回合表、生命倍率、升階倍率、經濟大改 | **要** |
| 機器人變聰明（`BOT_P`、`botPower`）而且差很多 | 要（舊種子太弱） |
| 小數值調整、說明文字、介面 | 不用 |
| 拿掉道具或核心 | 要（舊快照裡有不存在的 id） |

換的時候：`js/data.js` 的 `GVER` 往上加一號（`s21` → `s22`），註解寫這版為什麼換。換了以後舊快照（含真人的）都不會再被配到，**一定要重傳種子**，不然新版開局會全部變成即時機器人。

## 2. 順序：先上線，再傳種子

1. 改完、測完，commit + push（push 前先問使用者，CLAUDE.md）。
2. **等網站上線**：GitHub Pages 約 1 分鐘。用 curl 確認線上的版本號與 GVER 都是新的：
   ```bash
   curl -s "https://shiroyashatw.github.io/wayfarer/js/data.js?nc=$RANDOM" | grep -o "VER = '[0-9.]*'\|GVER = '[a-z0-9]*'"
   ```
   還沒變就每 15 秒再查一次（最多幾分鐘）。**還沒上線就傳的話**，換了 GVER 的種子不會被舊版配到（沒事），但沒換 GVER 時，舊版玩家會配到含新道具的快照、讀不到而出錯。
3. 上線後才傳種子（下一節）。

## 3. 傳種子（瀏覽器）

用本機的程式傳（跟線上同一個 commit）：

1. 開本機伺服器：Browser 工具 `preview_start`，名稱 `wayfarer`（8000）；8000 被別的工作階段占用時用 `wayfarer-8002`（`.claude/launch.json`）。網址加 `?p=2`（測試存檔，不動使用者的存檔）。
2. 等 3 秒讓雲端連線，確認版本：
   ```js
   [VER, GVER, !!CLOUD.uid]   // 要是新的版本號、新的 GVER、true
   ```
3. **背景跑**（直接 `await seedGhosts(160)` 要 80 秒以上，執行指令會逾時）：
   ```js
   window.__seed = { done: false, err: null, t0: Date.now() };
   seedGhosts(160).then(() => (window.__seed.done = true)).catch(e => (window.__seed.err = String(e && (e.message || JSON.stringify(e)))));
   ```
   之後每次最多等 40 秒查一次：
   ```js
   for (let i = 0; i < 8 && !__seed.done && !__seed.err; i++) await new Promise(r => setTimeout(r, 5000));
   JSON.stringify({ ...__seed, sec: ((Date.now() - __seed.t0) / 1000) | 0 })
   ```
   主控台會印「種子對局 N/160」，用 `read_console_messages` 的 `pattern: '種子'` 看進度。
4. **確認**（數量與每個職業幾局）：
   ```js
   const { count } = await CLOUD.sb.from('runs').select('id', { count: 'exact', head: true }).eq('ver', GVER).eq('seed', true);
   const r = await CLOUD.sb.from('runs').select('cls').eq('ver', GVER).eq('seed', true).limit(1000);
   const c = {}; for (const x of r.data || []) c[x.cls] = (c[x.cls] || 0) + 1;
   JSON.stringify({ count, cls: c })
   ```
   `count` 要等於傳的局數；13 個職業都要有。某個職業特別少（例如 0.1.51 亞馬遜只有 2 局）就告訴使用者。

出錯時：`err` 有 `relation … does not exist` 是 SQL 還沒在 Supabase SQL Editor 跑；`雲端還沒連線` 是匿名登入還沒好，重新整理再等一下。**只用 anon key，絕對不要用或要 service_role key。**

## 4. 收尾

- CHANGELOG 那一版寫「快照版本 `GVER` sXX → sYY，重傳 N 局種子」。
- 告訴使用者：上線的 commit、線上確認的版本、資料庫的種子數與職業分布。
- 真人快照夠多以後，可以在 SQL Editor 跑 `delete from public.runs where seed;` 清掉種子（使用者決定，不要自己刪）。

## 之後要改的（記在這裡）

- **局數 160 → 300**：使用者 2026-10-24 決定賽制（0.1.52 起）做完後改成 300 局，讓對手變化更多；到時把這份 skill、CLAUDE.md、`seedGhosts` 預設一起改。
- **職業輪流**：`seedGhosts` 的機器人是隨機選職業，分布會不平均；可以改成 13 個職業輪流。
- **賽制**：賽制做完後快照要記那一局的賽制（地形、印記…），種子也要照賽制分布產生。
