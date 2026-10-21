---
name: ui-design
description: 新增或修改漫步勇者的介面時使用（面板、卡片、按鈕、HUD、商店、背包、裝備、契靈、說明文字、CSS 樣式），也用在使用者說「跑版」「字太小」「字太多」「圖示框太大」「資訊太多」「介面很亂」「看得很痛苦」「整理某個面板」時。先決定版面模式（格子清單→詳情、列表列、詳情頁、控制台），照 docs/設計規範.md 的尺寸表、第一屏預算、字數規則與畫面藍圖改，改完在手機尺寸截圖前後對照並跑 audit。
---

# 漫步勇者 介面設計流程

規範本體在 `docs/設計規範.md`。**動手前先讀第 5～8 節**（版面模式、尺寸表、第一屏預算、字數規則），有藍圖的畫面看第 11 節。變數與共用元件在 `css/style.css` 開頭的 `:root` 與結尾。

## 核心原則（每次都問自己）

1. **這個畫面的主角是什麼？** 主角與主要動作要在第一屏（不捲動）看得到。
2. **這是清單還是詳情？** 清單只放圖示＋一個數字；名字以外的東西（詞綴、說明、按鈕）都進詳情。不要在清單裡把每一項都展開。
3. **能不能用格子？** 同類東西超過 6 個就用 56px 格子（`.slot-g`），一排 5～6 個；圖示佔框 70%，不要大框小圖。
4. **能不能不顯示？** 數量 0、不能用、還沒解鎖的東西收成一行或放進摺疊。
5. **能不能用數字或顏色代替句子？** ▲▼、框色、角標，比一句話快。

## 改一個面板的步驟

1. **找程式**：Grep `docs/CODEMAP.md` 找面板的 HTML 函式（`renderSheet` 的 `sheetName` 分支，或 `pactHTML` 之類），CSS 用 class 名 Grep `css/style.css`。
2. **改之前截圖**：開本機（`.claude/launch.json` 的 `wayfarer`，網址加 `?p=2` 用測試存檔），`resize_window preset: mobile`，`tutorEnd()` 關掉教學，`openSheet('面板', '標題')` 打開，等 1 秒再截圖（面板有滑入動畫），長面板用 `$('sbody').scrollTop` 分段截。順便跑一次 audit 記下數字。
3. **先寫藍圖再寫程式**：照規範第 5 節選模式，列出「第一屏放什麼、詳情放什麼、收進摺疊的是什麼」。規範第 11 節沒有這個畫面的藍圖就補上。
4. **照規範改**：
   - 用共用元件：`.slot-g`（格子）、`.chip`（小格子）、`.card`、`.rowx`、`details.more`（`more(標題, 內容)`）、`.sel`（下拉篩選）。不要每個面板自己做一套。
   - 一個畫面最多一個 `.btn.pri`；按鈕上只寫動作；停用的按鈕寫原因。
   - 顏色、字級、間距只用變數；JS 不寫 `style="color:#…"`，用 `.c-gold`／`.c-good`／`.c-warn`／`.c-bad`／`.c-dim`；稀有度框色用 `.r0`～`.r3`。
   - 新的詳情頁要加返回（`ui.js` 的返回鍵對照，`sheetName === 'item'` 那幾行）。
5. **檢查**：把 `.claude/skills/ui-design/audit.js` 的內容貼進 `javascript_exec`，再跑 `audit('面板名')`：
   - `tinyText`、`offscreen`、`overflowX`、`tallCards`、`emptyFrames` 要是 0；`pri` ≤ 1；`foldChars`（第一屏字數）≤ 150。
6. **改之後截圖**，跟改之前的並排給使用者看（同樣的捲動位置），附上 audit 前後數字。
7. 照 CLAUDE.md：prettier、`python3 tools/codemap.py`、CHANGELOG；新增的元件寫進規範第 4 節。

## 注意

- 新手引導 `js/tutor.js` 的 `TUT` 會框選按鈕（選擇器），改了 class 或結構要確認引導還找得到。
- 面板的 HTML 很多是 JS 字串，改完一定要實際開面板、點進詳情、按返回，不要只看程式碼。
- 戰鬥畫面、地圖 HUD 是 canvas＋DOM 混合，改之前先看 `renderBHud`／`renderHud`。
- 動作（`data-act`）的處理在 `A` 物件；改結構時保留原本的 `data-act` 名稱，邏輯就不用動。
