---
name: pixel-art
description: 新增或替換漫步勇者的怪物、首領、裝備圖示等像素圖時使用。先產出給 PixelLab 用的英文提示詞與設定讓使用者去生圖，使用者丟回 PNG 後，照這裡的步驟放進 art/、跑 tools/art.py、接到怪物資料並截圖確認。
---

# 像素圖（PixelLab）提示詞與接入流程

使用者要新增或替換怪物、首領、裝備圖示時，**先給提示詞，不要自己畫**。使用者到 PixelLab 生圖後會把 PNG 丟回來，再照「接入遊戲」的步驟處理。

## 1. 產出提示詞

**先讀 `docs/怪物提示詞.md`**：共用設定、固定句型、世界觀方向，以及已採用的提示詞。新提示詞要沿用同系列的句型與用字（例如七宗罪的王對照路西法那份），畫風才會一致。

先確認要做什麼（怪物名稱、外觀方向、用在哪裡：一般怪、亡靈、魔霧、冥府、首領、裝備）。使用者沒講外觀就依遊戲世界觀補：台灣在地元素（廟宇、民俗、山林動物、都市傳說）＋奇幻 RPG。

輸出給使用者的格式（繁體中文說明＋英文提示詞放在 code block，方便複製）：

1. **PixelLab 設定**（Create image → 模型 Pixen）：

   | 項目 | 一般怪物 | 首領 | 裝備圖示 |
   | --- | --- | --- | --- |
   | Width／尺寸 | 64 | 64 | 32 |
   | Transparent background | 勾選 | 勾選 | 勾選 |
   | Direction | West (facing left) | West (facing left) | None |
   | View | Side (Sidescroller) | Side (Sidescroller) | None |
   | Detail | Medium | Highly detailed | Low／Medium |
   | Outline | Black outline | Black outline | Black outline |

2. **Description**（英文，一隻一段）：

   - 一般怪物／首領，開頭一定要有全身與留白（不然常只生半身）：
     ```
     full body, standing, whole figure from head to feet, legs and feet visible, small character centered with empty space around,
     {外觀描述：種類、顏色、服裝、特徵、姿勢}, {氣氛：menacing / fierce expression / glowing eyes 等}
     ```
   - 四足動物把 `standing ... legs and feet visible` 換成 `full body side view, all four legs visible`。
   - 首領加 `imposing pose, large and powerful, detailed armor/ornaments`。
   - 有翅膀、長武器、尾巴等很寬的造型容易被畫布切邊，開頭再加：
     `the entire character including wings and weapon fits completely inside the canvas with wide empty margins on all sides, nothing cut off at the edges, character occupies about 75 percent of the canvas`；
     翅膀寫 `half-spread close to the body`、長武器寫 `held upright`，結尾補 `facing left`。
   - 裝備圖示（一律畫灰色金屬，材質階級的換色由程式處理）：
     ```
     single {裝備名稱} item icon, made of plain grey iron with brown wood or leather parts, simple readable shape, centered, diagonal from bottom-left to top-right
     ```
     頭盔、胸甲、手套、鞋子把最後一句換成 `front view`。

3. 提醒：不滿意就多按幾次 Generate 挑一張；同一系列先挑一張滿意的當 Init Image（風格參考），整套才會一致。下載 PNG 直接丟回來即可（不用改檔名）。

## 2. 接入遊戲（使用者丟回 PNG 後）

1. 檢查：`python3 -c "from PIL import Image; im=Image.open('檔案').convert('RGBA'); print(im.size, im.getbbox(), len(set(im.getdata())))"`
   - 要是真像素（尺寸就是 Width 設定，例如 64×64），背景透明；如果是放大過的大圖（例如 1024 以上），先量格子大小再用最近鄰縮回原生大小。
   - 必須面向左；面向右的話在資料裡用左右翻轉（`drawSpr` 的 flip），或請使用者重生。
2. 放到 `art/monsters/英文小寫檔名.png`（例如 `jiangshi.png`）。
3. 跑 `python3 tools/art.py`：裁掉透明邊、轉 base64 寫進 `js/art.js`，圖名是 `a_檔名`。
4. 把怪物資料的 `spr` 改成 `'a_檔名'`（`MONS` 在 `js/data.js`、亡靈 `UNDEAD` 在 `js/undead.js`、魔霧 `MISTMON` 在 `js/demon.js`、首領 `BOSSSPR`／`SINSPR` 等）；`pal` 對 PNG 圖沒有作用，可保留。
5. 大小：PNG 圖每個像素畫成 `s × ART_U`（`js/sprites.js`，目前 0.36）。一般怪 64 畫布、人物約 58 高時，跟原本 16×16 的怪差不多大、稍大一點；首領也用 64（試過 128，造型反而沒特色，不用）。首領單獨一隻時戰鬥中站在右半邊、垂直置中（`epos`）。
   - 檢查四邊有沒有不透明像素貼邊（被切掉）：有的話請使用者用「留白」提示詞重生。
6. 用 Playwright 開戰鬥截圖確認（`startBattle(makeEnemy(...))`），也看受擊白閃、倒下動畫、行動順序的小頭像。
7. 把這隻採用的提示詞（含設定、檔名、系列）補進 `docs/怪物提示詞.md` 的「已採用」。
8. 改完照 CLAUDE.md：prettier、`python3 tools/codemap.py`、版本與 CHANGELOG。

## 注意

- 檔案大小：64×64 一張約 2～3KB（base64 後約 3～4KB），幾百張也只有幾百 KB；不要放放大過的原圖。
- 原始 PNG 留在 `art/`，之後改圖重跑 `tools/art.py` 就好；`js/art.js` 是自動產生的，不要手改。
- 主角目前還是 16×16（裝備外觀疊圖在 `js/gear.js`），不要用 PixelLab 的圖替換主角。
