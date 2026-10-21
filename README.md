# 漫步勇者

以真實台灣地圖為舞台的回合制 RPG 網頁 demo。出門走路是冒險，在家經營據點也能推進。

- 線上遊玩：https://shiroyashatw.github.io/wayfarer/
- 目前版本：v0.3.44（[更新紀錄](CHANGELOG.md)）
- 企劃書：[docs/企劃書.md](docs/企劃書.md)
- 建議用手機直式開啟

## 目前內容

- 全台灣真實地圖（OpenStreetMap 道路、河流、公園、廟宇），可點地圖走路或用 GPS
- 迷霧探索、晝夜與視線範圍、副手提燈
- 50 種怪物、菁英怪與紅名危險怪、寶箱、限時事件（流浪商人、魔物裂隙、祝福泉、懸賞）
- 普通／團體／地獄地城，PoE 式地城詞綴
- 好友系統與多人組隊地城：大廳全員準備才出發，普通 2 人／團體 3 人／地獄 4 人，每人每回合 15 秒
- PoE 式詞綴裝備（10 個裝備欄，含腰帶與副手）、PoE2 式通貨製作（含富豪石）、圖示格子商店
- PoE 式天賦樹（598 節點、15 條路線、75 個重要節點、15 個基石：血魔法、心靈凌駕、鋼鐵反射、玻璃大砲…）
- 主據點、分支據點與遠征
- Supabase 雲端存檔：遊客匿名登入，或用信箱註冊／登入並取得玩家編號；Realtime 組隊

## 開發

純靜態網頁，不需要建置。

```bash
python3 -m http.server 8000
```

檔案結構與開發規則見 [CLAUDE.md](CLAUDE.md)。雲端存檔使用 Supabase `saves` 資料表（RLS，只能讀寫自己的存檔），玩家編號在 `profiles`，好友在 `friendships`，組隊邀請在 `party_invites`，結構在 `supabase/migrations/`。網頁裡的 Supabase 金鑰是公開用的 anon key。
