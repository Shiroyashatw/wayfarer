#!/usr/bin/env python3
"""圖示改成整張圖表一次產：PixelLab 一張 8×8 格（每格 32×32，共 64 個圖示），同類系的放在同一張，風格一致又省次數。

用法：
    python3 tools/icon_sheets.py build                 # 從 docs/圖示提示詞.md 產生 docs/圖示圖表.md（每張 64 格）
    python3 tools/icon_sheets.py build --per 32        # 免費方案（畫布最大 200×200 面積）：每張 32 格（8×4，256×128）
    python3 tools/icon_sheets.py list                  # 列出有哪些圖表
    python3 tools/icon_sheets.py run --only sheet_skill_1   # 用 PixelLab API 產圖表（需要 PIXELLAB_API_KEY，存到 art/new/）
    python3 tools/icon_sheets.py process               # art/sheets/ 裡的圖表全部切好、打包進遊戲（最常用）
    python3 tools/icon_sheets.py slice art/sheets/sheet_skill_1.png        # 只切一張，存到 art/icons/（檔名照圖表的對照表）
    python3 tools/icon_sheets.py archive               # 已經有圖的提示詞搬到 docs/提示詞封存.md、做完的圖表原圖搬到 art/sheets/done/（process 最後會自動跑）

- 單張圖示的提示詞還是寫在 docs/圖示提示詞.md（要單獨重產某一張時用）；圖表的提示詞由這支程式從那份自動組出來，兩邊不會不同步。
- 新增技能、輔助寶石、節點時：先在 docs/圖示提示詞.md 補一列，再跑 build。
- 圖表編號是固定的：已經在 docs/圖示圖表.md 的圖表，內容與提示詞不會因為 build 改變（產到一半的不會對不上）；
  新的提示詞才會排進新的圖表，編號接在後面。切過的圖表（原圖搬到 art/sheets/done/）會從圖示圖表移除，
  裡面沒畫出來的格子回到待排，跟其他新提示詞一起排進新的圖表。
  要整個重排用 build --fresh（只排還沒有圖的）。
- 分組：裝備、攻擊技能、元素法術、混沌與黑暗法術、增益／治療／召喚／戰場單位、光環、輔助寶石、族裔輔助、天賦樹、昇華；同組依序填滿一張再開下一張。
"""
import argparse, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/圖示提示詞.md'
DOC = ROOT / 'docs/圖示圖表.md'
SHEETS = ROOT / 'art/sheets'  # PixelLab 產的圖表原圖放這裡（檔名 sheet_xxx.png，進 git 保存）
ARCH = ROOT / 'docs/提示詞封存.md'  # 已經接進遊戲的提示詞（要重產時再拿出來）
MON = ROOT / 'docs/怪物提示詞.md'
ICONS = ROOT / 'art/icons'
done = lambda f: (ICONS / f'{f}.png').exists()
COLS, CELL = 8, 32
TAIL = re.compile(r',?\s*(bold simple|readable at small size|centered, readable|no text).*$')
HEAD = re.compile(r'^(game skill icon of|game icon of|single item icon of)\s+(an? )?')
# 所有圖表共用的風格（統一風格的關鍵：同一句、同一組參數）
STYLE = (
    'pixel art game icon sheet: a {cols} by {rows} grid of {n} separate icons, each icon 32x32 pixels centered in its own '
    'equal cell, all icons in one consistent style: bold simple readable silhouette, 1px dark outline, flat colors with one '
    'soft highlight, light from top-left, fully transparent background behind every icon (no background squares, no colored '
    'tiles, no glow boxes, nothing outside the icon shape), no text, no numbers, no grid lines, no frames. '
    'Icons from left to right, top to bottom: '
)
# 各組的配色提示（加在最後，讓整張的色調統一）
GROUPS = [
    ('gear', '裝備', 'items drawn diagonally or front view, natural material colors'),
    ('skill_atk', '攻擊技能', 'weapon attacks, steel grey with blood red accents unless noted'),
    ('skill_ele', '元素法術', 'fire orange red, ice blue, lightning gold and blue-white'),
    ('skill_dark', '混沌與黑暗法術', 'chaos toxic green and dark violet, necromancy bone white with teal ghost fire'),
    ('skill_buff', '增益、治療、召喚與戰場單位', 'golden orange shockwaves, healing green and gold'),
    ('skill_aura', '光環', 'each symbol surrounded by a glowing aura ring'),
    ('sup', '輔助寶石', 'each is a faceted blue-grey support gem with a small symbol inside'),
    ('sup_lin', '族裔輔助', 'each is a dark violet and blood red faceted lineage gem with a small symbol inside'),
    ('tree', '天賦樹節點', 'talent tree emblems, rich colors'),
    ('asc', '昇華節點', 'ascendancy emblems, rich colors with gold trim'),
    ('ui', '介面圖示', 'status effects, currencies, monster skills and materials as clear readable symbols'),
    ('item', '道具', 'backpack items for an auto-battler, chunky readable silhouettes, natural material colors'),
]
GN = {k: n for k, n, _ in GROUPS}
GH = {k: h for k, _, h in GROUPS}
# 同一個大類依序排滿一張再開下一張（技能各類接著排、一般與族裔輔助接著排），少浪費格子
SUPER = [
    ('gear', ['gear']),
    ('skill', ['skill_atk', 'skill_ele', 'skill_dark', 'skill_buff', 'skill_aura']),
    ('sup', ['sup', 'sup_lin']),
    ('tree', ['tree']),
    ('asc', ['asc']),
    ('item', ['item']),
]


def rows_of(src_only=False):
    """讀 docs/圖示提示詞.md（與封存）的表格：回傳 [(檔名, 中文名, 類型, 提示詞)]"""
    out = []
    text = SRC.read_text(encoding='utf-8') + ('\n' + ARCH.read_text(encoding='utf-8') if ARCH.exists() and not src_only else '')
    for line in text.splitlines():
        m = re.match(r'^\| `([\w-]+)` \|(.*)\| `([^`]+)` \|$', line)
        if not m:
            continue
        mid = [c.strip() for c in m.group(2).split('|') if c.strip()]
        out.append((m.group(1), mid[0] if mid else '', mid[1] if len(mid) > 1 else '', m.group(3)))
    return out


def group_of(f, kind, p):
    if f.startswith('it_'):
        return 'item'
    if f.startswith('gear_'):
        return 'gear'
    if f.startswith('sup_'):
        return 'sup_lin' if 'lineage' in p else 'sup'
    if f.startswith('unit_'):
        return 'skill_buff'
    if f.startswith('tree_'):
        return 'tree'
    if f.startswith('asc_'):
        return 'asc'
    if re.match(r'(ail|cur|msk|mat)_', f):
        return 'ui'
    if f.startswith('sk_'):
        if kind == '光環':
            return 'skill_aura'
        if kind == '攻擊':
            return 'skill_atk'
        if kind == '法術':
            return 'skill_dark' if re.search(r'toxic green|violet|bone white|ghost|necro|skull', p) else 'skill_ele'
        return 'skill_buff'
    return None


STOP = {'with', 'of', 'a', 'an', 'the', 'and', 'in', 'to', 'on', 'at', 'by', 'from', 'into', 'its', 'behind', 'over'}


def short(p, words):
    """每格的描述：取第一個逗號前（顏色交給整張的 Palette），超過字數就截短，不停在介系詞上"""
    s = TAIL.sub('', HEAD.sub('', p.strip())).split(',')[0].strip()
    # 輔助寶石：外型交給 Palette，只留符號
    lin = 'lineage gem' in s
    s = re.sub(r'^(a )?(faceted blue-grey support gem|dark violet and blood red faceted lineage gem) with (an? )?', '', s)
    s = re.sub(r'\s*symbol( inside)?$|\s+inside$', '', s)
    if p.startswith('game icon of a faceted') or p.startswith('game icon of a dark violet and blood red faceted'):
        s = ('dark lineage gem: ' if lin else 'gem: ') + s
    w = s.split()[:words]
    while len(w) > 2 and w[-1].lower() in STOP:
        w.pop()
    return ' '.join(w)


def used_names():
    """用過的圖表名稱（圖示圖表、封存、art/sheets/done/），新圖表的編號接在後面"""
    t = (DOC.read_text(encoding='utf-8') if DOC.exists() else '') + (ARCH.read_text(encoding='utf-8') if ARCH.exists() else '')
    names = set(re.findall(r'`(sheet_[a-z]+_\d+)`', t))
    names |= {f.stem for f in (SHEETS / 'done').glob('sheet_*.png')}
    return names


def sheets(per, words, fresh=False):
    """回傳 [(圖表名, 大類, [(檔名, 名稱, 描述, 組)], 固定的提示詞或 None)]"""
    rows = rows_of()
    info = {f: (n, kind, p) for f, n, kind, p in rows}
    kept, inkept = [], set()
    if not fresh and DOC.exists():
        for name, (pr, _, files) in read_doc().items():
            # 全部有圖、或原圖已經切過（在 done/）的不留；沒畫出來的格子回到待排，排進新的圖表
            if all(done(f) for f in files) or (SHEETS / 'done' / f'{name}.png').exists():
                continue
            items = [(f, info.get(f, ('', '', ''))[0], '', group_of(f, *info[f][1:]) if f in info else 'ui') for f in files]
            kept.append((name, name.split('_')[1], items, pr))
            inkept |= set(files)
    used = used_names()
    nxt = {}

    def new_name(sg):
        nxt[sg] = nxt.get(sg, max([int(x.rsplit('_', 1)[1]) for x in used if x.startswith(f'sheet_{sg}_')] or [0])) + 1
        return f'sheet_{sg}_{nxt[sg]}'

    bucket = {k: [] for k, _, _ in GROUPS}
    # 新排的只看 docs/圖示提示詞.md（封存裡沒產的舊提示詞不排）
    for f, n, kind, p in rows_of(src_only=True):
        g = group_of(f, kind, p)
        if g and not done(f) and f not in inkept:
            bucket[g].append((f, n, short(p, words)))
    out = []
    for sg, gs in SUPER:
        items = [(f, n, d, g) for g in gs for f, n, d in bucket[g]]
        for i in range(0, len(items), per):
            out.append([sg, items[i : i + per]])
    # 剩下不到 8 個的零頭，塞進前面還有空格的圖表（少產一張）
    for k in range(len(out) - 1, -1, -1):
        sg, items = out[k]
        if len(items) >= COLS:
            continue
        for j, (sg2, it2) in enumerate(out):
            if j != k and len(it2) + len(items) <= per:
                it2.extend(items)
                del out[k]
                break
    # 介面圖示（狀態、通貨、怪物招式、材料）拿來填滿各張的空格，填不完才另外開一張
    ui = [(f, n, d, 'ui') for f, n, d in bucket['ui']]
    for sg, items in out:
        while ui and len(items) < per:
            items.append(ui.pop(0))
    for i in range(0, len(ui), per):
        out.append(['ui', ui[i : i + per]])
    return kept + [(new_name(sg), sg, items, None) for sg, items in out]


def prompt_of(items):
    rows = (len(items) + COLS - 1) // COLS
    body = '; '.join(f'{k + 1} {d}' for k, (_, _, d, _) in enumerate(items))
    gs = list(dict.fromkeys(g for *_, g in items))
    pal = '; '.join(GH[g] for g in gs)
    return STYLE.format(cols=COLS, rows=rows, n=len(items)) + body + '. Palette: ' + pal + '.'


def kinds(items):
    return '、'.join(GN[g] for g in dict.fromkeys(g for *_, g in items))


def write_iconmap():
    """天賦樹節點是照名字對應圖示（同名共用一張），把 docs/圖示提示詞.md 的「檔名 → 節點名」寫成 js/iconmap.js"""
    m = {}
    for f, n, _, _ in rows_of():
        if not re.match(r'tree_[ns]\d+$', f):
            continue
        f, n = f[5:], n
        m.setdefault(n.strip(), f)
    # 跟 prettier 的輸出一樣（名字是合法識別字就不加引號），重跑 build 才不會每次都有差異
    key = lambda n: n if re.fullmatch(r'[^\W\d]\w*', n) else f"'{n}'"
    body = ',\n'.join(f"  {key(n)}: '{f}'" for n, f in m.items())
    (ROOT / 'js/iconmap.js').write_text(
        '/* 自動產生（tools/icon_sheets.py build）：天賦樹節點名 → art/icons/tree_代號.png；不要手改 */\n'
        f'const TREE_IC = {{\n{body}\n}};\n',
        encoding='utf-8',
    )


def build(per, words, fresh=False):
    sh = sheets(per, words, fresh)
    rows_ = per // COLS
    L = [
        '# 圖示圖表（PixelLab 一次產 64 個）',
        '',
        '這份是 `python3 tools/icon_sheets.py build` 從 `docs/圖示提示詞.md` 自動產生的，**不要手改**（要改提示詞改那份，再重跑 build）。',
        '',
        f'每張圖表 {COLS}×{rows_} 格、每格 {CELL}×{CELL}，整張 {COLS * CELL}×{rows_ * CELL}，一次產 {per} 個圖示；同類系放同一張，風格才統一。',
        '',
        '## 怎麼產',
        '',
        '1. PixelLab → Create image（Pixflux）：Width／Height 照每張的尺寸、勾 **Transparent background**、Outline 選 **Black outline**、Detail **Medium**，'
        '把該張的提示詞整段貼上。畫布面積上限：免費方案 200×200、Tier 1 320×320、Tier 2 以上 400×400；**每張 64 格（256×256）要 Tier 1 以上**，免費方案用 `--per 32` 重產這份（256×128）。',
        '2. **先產 `sheet_skill_1` 當風格基準**，滿意了再產其他張；其他張都把這張當 **Style／Init Image** 參考，整套才會一致。',
        '3. 下載 PNG 放進 **`art/sheets/`**（檔名就是圖表名稱，例如 `sheet_skill_1.png`），跑 `python3 tools/icon_sheets.py process`：'
        '全部切成一格一張（照下面的對照表存到 `art/icons/`，實心背景自動去背）、打包進遊戲，再把做完的提示詞與圖表封存。跟 Claude 說「放了新圖」它會幫你跑。',
        '   圖表編號固定不變：這裡列的都是還有格子沒圖的；做完的移到 `docs/提示詞封存.md`，原圖在 `art/sheets/done/`。',
        '4. 格子歪掉或某幾格不好：那幾個用 `docs/圖示提示詞.md` 的單張提示詞補產。',
        '5. 提示詞太長被截斷（後面幾格畫不出來）：`python3 tools/icon_sheets.py build --words 6` 縮短每格的描述，或 `--per 32` 改成每張 32 格。',
        '',
        '## 共用風格（每張的開頭都是這句）',
        '',
        '```',
        STYLE.format(cols=COLS, rows=rows_, n=per) + '…',
        '```',
        '',
        '## 圖表一覽',
        '',
        '| 圖表 | 類系 | 數量 | 尺寸 |',
        '| --- | --- | --- | --- |',
    ]
    for name, g, items, _ in sh:
        r = (len(items) + COLS - 1) // COLS
        L.append(f'| `{name}` | {kinds(items)} | {len(items)} | {COLS * CELL}×{r * CELL} |')
    for name, g, items, pr in sh:
        r = (len(items) + COLS - 1) // COLS
        L += [
            '',
            f'### `{name}`（{kinds(items)}，{len(items)} 個，{COLS * CELL}×{r * CELL}）',
            '',
            '```',
            pr or prompt_of(items),
            '```',
            '',
            '| 格 | 檔名 | 名稱 |',
            '| --- | --- | --- |',
        ]
        L += [f'| {k // COLS + 1}-{k % COLS + 1} | `{f}` | {n} |' for k, (f, n, _, _) in enumerate(items)]
    DOC.write_text('\n'.join(L) + '\n', encoding='utf-8')
    print(f'已輸出 {DOC.relative_to(ROOT)}：{len(sh)} 張圖表、{sum(len(i) for _, _, i, _ in sh)} 個圖示（每張 {per} 格）')


def read_doc():
    """讀 docs/圖示圖表.md：{圖表名: (提示詞, 尺寸(w,h), [檔名…])}"""
    t = DOC.read_text(encoding='utf-8')
    out = {}
    for m in re.finditer(r'### `(sheet_[\w]+)`（[^，]+，(\d+) 個，(\d+)×(\d+)）\n\n```\n([^\n]*)\n```\n\n\| 格[^\n]*\n\| ---[^\n]*\n((?:\|[^\n]*\n?)*)', t):
        files = re.findall(r'^\| \d+-\d+ \| `([\w-]+)` \|', m.group(6), re.M)
        out[m.group(1)] = (m.group(5), (int(m.group(3)), int(m.group(4))), files)
    return out


def clear_bg(cell, tol=60):
    """有時候某一格會畫成實心背景：四個角都不透明、顏色接近時，從邊緣把接近那個顏色的像素清成透明（回傳有沒有清）"""
    px = cell.load()
    bb = cell.getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()
    if not bb:
        return False
    x0, y0, x1, y1 = bb[0], bb[1], bb[2] - 1, bb[3] - 1
    cs = [px[x0, y0], px[x1, y0], px[x0, y1], px[x1, y1]]
    if any(c[3] < 128 for c in cs):
        return False
    bg = tuple(sum(c[i] for c in cs) // 4 for i in range(3))
    near = lambda c: c[3] >= 128 and sum(abs(c[i] - bg[i]) for i in range(3)) <= tol
    if not all(near(c) for c in cs):
        return False
    todo = [(x, y) for x in range(x0, x1 + 1) for y in (y0, y1)] + [(x, y) for y in range(y0, y1 + 1) for x in (x0, x1)]
    seen = set()
    while todo:
        x, y = todo.pop()
        if (x, y) in seen or not (x0 <= x <= x1 and y0 <= y <= y1) or not near(px[x, y]):
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        todo += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return True


def slice_(png, name=None):
    from PIL import Image
    png = pathlib.Path(png)
    name = name or png.stem.split('.')[0]
    sh = read_doc()
    if name not in sh:
        sys.exit(f'docs/圖示圖表.md 裡沒有 {name}（先跑 build）')
    _, (w, h), files = sh[name]
    im = Image.open(png).convert('RGBA')
    cw, ch = im.width / COLS, im.height / (h // CELL)
    out = ROOT / 'art/icons'
    out.mkdir(parents=True, exist_ok=True)
    fixed, empty = [], []
    for k, f in enumerate(files):
        x, y = (k % COLS) * cw, (k // COLS) * ch
        cell = im.crop((round(x), round(y), round(x + cw), round(y + ch)))
        if cell.size != (CELL, CELL):
            cell = cell.resize((CELL, CELL), Image.NEAREST)
        if clear_bg(cell):
            fixed.append(f)
        # 空白格（PixelLab 沒畫出來）不存，遊戲會繼續用原本的小圖示
        if sum(1 for a in cell.getchannel('A').getdata() if a > 40) < 15:
            empty.append(f)
            continue
        cell.save(out / f'{f}.png')
    print(f'{name}：切成 {len(files)} 張 → art/icons/（原圖 {im.width}×{im.height}）')
    if fixed:
        print('  這幾格有實心背景，已經自動去背（請再看一下）：' + '、'.join(fixed))
    if empty:
        print('  這幾格是空白，沒有存（改提示詞後重產）：' + '、'.join(empty))


def archive():
    """已經有圖的提示詞搬進 docs/提示詞封存.md；做完的圖表原圖搬到 art/sheets/done/；再 build（編號不變）"""
    arch = ARCH.read_text(encoding='utf-8') if ARCH.exists() else (
        '# 提示詞封存\n\n已經產好圖、接進遊戲的提示詞（`tools/icon_sheets.py archive` 自動搬過來）。要重產某一張時，從這裡複製回原本的文件。\n'
    )
    moved = {}
    # 圖示：表格列，圖檔已經在 art/icons/
    out, sec, head = [], '', None
    for line in SRC.read_text(encoding='utf-8').splitlines():
        if line.startswith('#'):
            sec = line.lstrip('#').strip()
        if line.startswith('| 檔名'):
            head = line
        m = re.match(r'^\| `([\w-]+)` \|', line)
        if m and done(m.group(1)):
            moved.setdefault(('圖示・' + sec, head), []).append(line)
            continue
        out.append(line)
    SRC.write_text('\n'.join(out) + '\n', encoding='utf-8')
    # 怪物：「待生成」裡圖檔已經在 art/monsters/ 的（**名稱**　`檔名.png` 加一段 ``` 提示詞）
    t = MON.read_text(encoding='utf-8')
    i = t.find('## 待生成')
    if i >= 0:
        def take(m):
            if (ROOT / 'art/monsters' / m.group(2)).exists():
                moved.setdefault(('怪物', None), []).append(m.group(0).strip('\n'))
                return ''
            return m.group(0)
        rest = re.sub(r'\n\*\*([^*\n]+)\*\*\u3000`([\w-]+\.png)`\n```\n.*?\n```\n', take, t[i:], flags=re.S)
        MON.write_text(t[:i] + rest, encoding='utf-8')
    n = 0
    for (sec, head), lines in moved.items():
        n += len(lines)
        if head:
            arch += f'\n## {sec}\n\n{head}\n| --- | --- | --- | --- |\n' + '\n'.join(lines) + '\n'
        else:
            arch += f'\n## {sec}\n\n' + '\n\n'.join(lines) + '\n'
    # 做完的圖表：原圖搬走、名稱記在封存（編號不再用）
    cur = read_doc()
    # 做完的圖表：全部格子有圖，或原圖已經切過（還在 art/sheets/，process 跑完才會呼叫這裡）
    fin = [k for k, (_, _, files) in cur.items() if all(done(f) for f in files) or (SHEETS / f'{k}.png').exists()]
    fin += [f.stem for f in SHEETS.glob('sheet_*.png') if f.stem not in cur and f.stem not in fin]
    if fin:
        (SHEETS / 'done').mkdir(parents=True, exist_ok=True)
        for k in fin:
            src = SHEETS / f'{k}.png'
            if src.exists():
                src.replace(SHEETS / 'done' / f'{k}.png')
        # 已完成的圖表只留一段：舊的名單加上這次的
        old = re.findall(r'`(sheet_\w+)`', arch.split('## 已完成的圖表', 1)[1]) if '## 已完成的圖表' in arch else []
        arch = arch.split('\n## 已完成的圖表', 1)[0].rstrip('\n') + '\n'
        arch += '\n## 已完成的圖表\n\n' + '、'.join(f'`{k}`' for k in dict.fromkeys(old + fin)) + '\n'
    ARCH.write_text(arch, encoding='utf-8')
    print(f'封存 {n} 條提示詞、{len(fin)} 張做完的圖表 → {ARCH.relative_to(ROOT)}')
    build(64, 9)


def main():
    ap = argparse.ArgumentParser(description='PixelLab 圖示圖表')
    ap.add_argument('cmd', choices=['build', 'list', 'run', 'slice', 'process', 'archive'])
    ap.add_argument('--fresh', action='store_true', help='build：不保留現有圖表，還沒有圖的全部重排')
    ap.add_argument('png', nargs='?', help='slice：圖表 PNG')
    ap.add_argument('--per', type=int, default=64, help='每張幾格（64 或 32）')
    ap.add_argument('--words', type=int, default=9, help='每個圖示描述最多幾個字（太長 PixelLab 可能吃不下）')
    ap.add_argument('--only', default='', help='run：只產名稱以這個開頭的圖表')
    ap.add_argument('--sheet', default='', help='slice：圖表名稱（預設用檔名）')
    a = ap.parse_args()
    if a.cmd == 'build':
        return build(a.per, a.words, a.fresh)
    if a.cmd == 'archive':
        return archive()
    if a.cmd == 'slice':
        return slice_(a.png, a.sheet or None)
    if a.cmd == 'process':
        # art/sheets/ 裡的圖表原圖全部切好，再打包進遊戲（tools/art.py）
        pngs = sorted(SHEETS.glob('sheet_*.png'))
        if not pngs:
            sys.exit('art/sheets/ 裡沒有圖表（檔名要是 sheet_xxx.png）')
        known = read_doc()
        for f in pngs:
            if f.stem in known:
                slice_(f)
            else:
                print(f'{f.name}：圖示圖表裡沒有（已經做完？），略過')
        import subprocess
        subprocess.run([sys.executable, str(ROOT / 'tools/art.py')], check=True)
        return archive()
    sh = read_doc()
    if a.cmd == 'list':
        for k, (p, (w, h), files) in sh.items():
            print(f'{k}: {len(files)} 個 {w}×{h}，提示詞 {len(p)} 字元')
        return
    sys.path.insert(0, str(ROOT / 'tools'))
    import pixellab_batch as pb
    out = ROOT / 'art/new'
    out.mkdir(parents=True, exist_ok=True)
    for k, (p, (w, h), files) in sh.items():
        if not k.startswith(a.only):
            continue
        png, usd = pb.generate(p, w, {'no_background': True}, '/create-image-pixflux', height=h)
        (out / f'{k}.png').write_bytes(png)
        print(f'{k}.png（{w}×{h}）' + (f' ${usd}' if usd is not None else ''))


if __name__ == '__main__':
    main()
