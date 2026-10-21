---
name: ui-design
description: 新增或修改漫步勇者的介面時使用（面板、卡片、按鈕、HUD、商店、說明文字、CSS 樣式），也用在使用者說「跑版」「字太小」「資訊太多」「介面很亂」「整理某個面板」時。照 docs/設計規範.md 的字級、顏色、間距、元件與資訊量規則做，改完在手機尺寸截圖並跑 audit 檢查。
---

# 漫步勇者 介面設計流程

規範本體在 `docs/設計規範.md`（字級 7 階、顏色變數、間距、元件、資訊量規則、檢查清單）。**動手前先讀那份**，變數定義在 `css/style.css` 開頭的 `:root`。

## 改一個面板的步驟

1. **找程式**：Grep `docs/CODEMAP.md` 找面板的 HTML 函式（例如狩獵是 `huntHTML`），CSS 用 class 名 Grep `css/style.css`。
2. **改之前截圖**：開本機（`.claude/launch.json` 的 `wayfarer`，網址加 `?p=2` 用測試存檔），手機尺寸 `resize_window preset: mobile`，`tutorEnd()` 關掉教學，`openSheet('面板', '標題')` 打開，等 1 秒再截圖（面板有 0.25 秒滑入動畫），長面板用 `$('sbody').scrollTop` 分段截。
3. **照規範改**：
   - 畫面只留「現在的狀態」與「能做的事」；規則、機制、公式收進 `<details class="more"><summary>說明</summary>…</details>`。
   - 每張卡片最多 3 行字；一個畫面最多一個 `.btn.pri`；字不小於 `--fs-cap`（11px）。
   - 顏色、字級、間距只用變數；JS 不寫 `style="color:#…"`，用 `.c-gold`／`.c-good`／`.c-warn`／`.c-bad`／`.c-dim`。
   - 停用的按鈕旁邊寫原因（還差多少、幾級解鎖）。
4. **檢查**：把 `.claude/skills/ui-design/audit.js` 的內容貼進 `javascript_exec`，再跑 `audit('面板名')`。`tinyText`、`offscreen`、`overflowX` 要是 0；`pri` 最多 1。
5. **改之後截圖**，跟改之前並排給使用者看。
6. 照 CLAUDE.md：prettier、`python3 tools/codemap.py`、CHANGELOG。

## 注意

- 新手引導 `js/tutor.js` 的 `TUT` 會框選按鈕（選擇器），改了 class 或結構要確認引導還找得到。
- 面板的 HTML 很多是 JS 字串，改完一定要實際開面板看，不要只看程式碼。
- 戰鬥畫面、地圖 HUD 是 canvas＋DOM 混合，改之前先看 `renderBHud`／`renderHud`。
