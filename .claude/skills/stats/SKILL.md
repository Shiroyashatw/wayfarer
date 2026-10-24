---
name: stats
description: 塞令老師的數據分析：道具的選取率（購買率、持有率、對口職業購買率、有它的名次）、冷門／熱門道具、職業 × 賽制的平均名次、核心選擇率，以及真人對局（Supabase）的統計。使用者問「選取率」「哪些裝備很爛／沒人用」「哪個職業太強」「某賽制誰最強」「數據」「統計」「分析一下」「改完有沒有變好」時用；調整道具或職業數值前後也用這個比較。
---

# 塞令老師 數據分析

## 先講清楚資料從哪來

| 來源 | 工具 | 什麼時候可信 |
| --- | --- | --- |
| **機器人對局**（Node 模擬） | `node tools/stats.js`、`node tools/core_stats.js` | 樣本要多少有多少；但機器人是照 `botPower` 評估在買，**購買率低可能是道具弱，也可能是機器人不會用**（擺法、組合、`botPower` 沒算到的效果） |
| **真人對局**（Supabase `runs`／`snaps`） | `mcp__Supabase__execute_sql`（下面的 SQL） | 真人夠多才有意義；目前每個 `GVER` 只有個位數到幾十局，**少於 30 局的數字只當參考** |
| 種子（`runs.seed = true`） | 同上 | 就是機器人對局，跟 Node 模擬一樣 |

回報時一定要說樣本數、是機器人還是真人。

## 道具與職業：`tools/stats.js`

```bash
node tools/stats.js                        # 120 場、分數 1300、4 個行程平行（約 2 分鐘），印報告
node tools/stats.js 240 --write            # 寫到 docs/道具統計.md（給使用者看的完整表）
node tools/stats.js --mode curse           # 只跑某個賽制（賽制代號見 data.js 的 MODES）
node tools/stats.js --item anvil,符文法珠  # 只印這幾件（代號或名字）
node tools/stats.js --save 前.json         # 存原始數字
node tools/stats.js --diff 前.json         # 跟前一次比，多一欄「變化」（購買率差幾個百分點）
```

- 同一組種子（`--seed`，預設固定）每次結果一樣，**改數值前後要用同樣的場數、分數、賽制比**。
- 欄位：出現（商店出現次數，每次刷新都算）、購買率、對口職業（道具 `for` 對到職業主題或加成標籤的機器人）、持有（最後背包有它）、名次（有它的平均名次，3.5 是平均）、冷門／熱門（同星級同類別中位數的一半以下／1.6 倍以上）。
- 報告最後有**職業 × 賽制**的平均名次表（樣本不到 6 不顯示）。

### 怎麼解讀

1. **冷門而且對口職業也不買** → 道具本身弱（或佔格子不划算）。看它的效果跟同星級的比（skill `balance` 的 `itemPower`）。
2. **冷門但對口職業會買** → 正常的職業專用道具，不用動。
3. **購買率低但名次很好**（例如 5★ 武器） → 貴、不好湊，不是爛。
4. **熱門而且名次好** → 可能太強，跟 skill `balance` 一起看。
5. 機器人從來不買的效果，先確認 `botPower`（`js/bot.js`）有沒有算到那個欄位（skill `bot-ai`），再說道具弱。

### 調數值的流程

1. `node tools/stats.js --save 前.json`（記下改之前）
2. 改 `js/items.js` 的數值（說明文字照 skill `item-text`）
3. `node tools/stats.js --diff 前.json --item 改的那幾件`，購買率回到同組的水準就好，**不要一次拉到熱門**
4. 交差前 `node tools/check.js`、`node tools/stats.js 240 --write` 更新 `docs/道具統計.md`

## 核心：`tools/core_stats.js`

```bash
node tools/core_stats.js 500 1300 --write   # 寫到 docs/核心統計.md：首領三選一的選擇率、名次、常見組合
```

真人的核心選擇：瀏覽器主控台 `await coreStatsCloud()`（`coreStatsCloud(true)` 連種子）。

## 真人對局（Supabase，project `eugkdfhkoaxvqhztvptc`）

用 `mcp__Supabase__execute_sql`，只讀（`select`），**不要改資料**。`ver` 是快照版本 `GVER`（見 `js/data.js`），不是遊戲版本。

```sql
-- 這個版本有多少真人對局、幾個玩家
select seed, count(*) runs, count(distinct user_id) users from public.runs
where ver = 's24' and rounds >= 10 group by seed;

-- 真人最後背包裡每件道具出現幾局、平均名次（每局取最後一個快照）
with last as (
  select distinct on (s.run_id) s.run_id, s.bag, r.place
  from public.snaps s join public.runs r on r.id = s.run_id
  where not r.seed and r.place is not null and r.ver = 's24'
  order by s.run_id, s.round desc)
select it->>0 id, count(distinct run_id) runs, round(avg(place), 2) avg_place
from last, jsonb_array_elements(bag->'it') it group by 1 order by runs desc;

-- 真人的職業名次
select cls, count(*) runs, round(avg(place), 2) avg_place, sum((place = 1)::int) firsts
from public.runs where not seed and place is not null and ver = 's24' group by cls order by avg_place;
```

快照裡道具的格式是 `packIt`（`js/bag.js`）：`[代號, 階, x, y, 旋轉, …]`，`it->>0` 是道具代號、`it->>1` 是階。

## 回報格式

- 一句結論在最前面（例如「最冷門的是 3～4★ 的系別輔助飾品，連對口職業都不買」）。
- 表格只放重點的 5～10 件，完整的在 `docs/道具統計.md`。
- 附上樣本（幾場、真人還是機器人），以及「這是機器人的判斷」的提醒。
- 最後給建議（要改哪幾件、往哪個方向），問使用者要不要改。
