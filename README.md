# 漫步勇者

以真實台灣地圖為舞台的回合制 RPG 網頁 demo。出門走路是冒險，在家經營據點也能推進。

- 線上遊玩：https://shiroyashatw.github.io/wayfarer/
- 目前版本：v0.1.4（[更新紀錄](CHANGELOG.md)）
- 企劃書：[docs/企劃書.md](docs/企劃書.md)
- 建議用手機直式開啟

## 目前內容

- 遊戲風格地圖（台中車站周邊，道路依真實位置近似）
- 迷霧探索、晝夜與視線範圍、提燈
- 菁英怪、寶箱、限時事件（流浪商人、魔物裂隙、祝福泉、懸賞）
- PoE 式詞綴裝備、7 種通貨製作
- PoE 式起始圓盤天賦樹（171 節點、三職業起點）
- 主據點、分支據點與遠征
- Supabase 匿名登入與雲端存檔

## 開發

純靜態網頁，不需要建置。

```bash
python3 -m http.server 8000
```

檔案結構與開發規則見 [CLAUDE.md](CLAUDE.md)。雲端存檔使用 Supabase `saves` 資料表（RLS，只能讀寫自己的存檔），結構在 `supabase/migrations/`。網頁裡的 Supabase 金鑰是公開用的 anon key。
