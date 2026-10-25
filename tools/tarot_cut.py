#!/usr/bin/env python3
"""0.1.74 塔羅牌圖表 → 單張卡圖：讀 art/sheets/sheet_tarot_N.png，照 docs/塔羅牌圖表.md 的「格序對照」切成
art/icons/tarot_牌.png、astro_月.png（64×64，不裁邊，拿掉 PixelLab 畫的金框），跑 tools/art.py 打包，切過的原圖搬到 art/sheets/done/。
圖表是放大過的（例如 1024×1024）就照格子數用最近鄰縮回每格 64。
用法：python3 tools/tarot_cut.py"""
import pathlib, re, shutil, subprocess, sys
from PIL import Image



# 0.1.84 PixelLab 有的格子畫了金框、有的沒有：一律把框拿掉（外框由畫面統一畫）
B = 10  # 框線＋角花只會在每格外圍 10px 內


def deframe(t):
    t = t.copy(); px = t.load(); n = 64
    off = lambda x, y: min(x, y, n - 1 - x, n - 1 - y)
    ring = [(x, y) for x in range(n) for y in range(n) if off(x, y) in (2, 3)]
    framed = sum(px[q][3] > 0 for q in ring) / len(ring) > 0.1
    # 1. 框線在每格外圍 2～3px：外圍 4px 全清（沒框的圖幾乎不會畫到這裡）
    for x in range(n):
        for y in range(n):
            if off(x, y) <= 3: px[x, y] = (0, 0, 0, 0)
    # 1b. 有框的圖：外圍 7px 內框的金色、黏在金色旁邊的黑邊（框往內縮或黏在圖上的）
    if framed:
        gold = [(223, 183, 118), (201, 159, 87), (228, 195, 124), (237, 206, 126)]
        isg = lambda c: c[3] and min(sum(abs(c[i] - g[i]) for i in range(3)) for g in gold) < 60
        gp = [(x, y) for x in range(n) for y in range(n) if off(x, y) < 7 and isg(px[x, y])]
        for q in gp:
            px[q] = (0, 0, 0, 0)
        for x, y in gp:
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if 0 <= q[0] < n and 0 <= q[1] < n and off(*q) < 7 and px[q][3] and sum(px[q][:3]) < 40:
                        px[q] = (0, 0, 0, 0)
    # 2. 角花：整塊都在外圍 B px 內的小碎塊（有框的圖整圈都找；沒框的只找四個角）
    corner = lambda x, y: min(x, n - 1 - x) < 12 and min(y, n - 1 - y) < 12
    seen = set()
    for y in range(n):
        for x in range(n):
            if (x, y) in seen or not px[x, y][3]: continue
            comp, st = [], [(x, y)]; seen.add((x, y))
            while st:
                a, b = st.pop(); comp.append((a, b))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        q = (a + dx, b + dy)
                        if 0 <= q[0] < n and 0 <= q[1] < n and q not in seen and px[q][3]:
                            seen.add(q); st.append(q)
            if len(comp) < 40 and all(off(*p) < B for p in comp) and (framed or any(corner(*p) for p in comp)):
                for p in comp: px[p] = (0, 0, 0, 0)
    return t


sys.stdout.reconfigure(encoding='utf-8')
root = pathlib.Path(__file__).resolve().parent.parent
doc = (root / 'docs/塔羅牌圖表.md').read_text(encoding='utf-8')
cells = {}  # 圖表 → [(列, 欄, 檔名)]
for sh, r, c, name in re.findall(r'^\| `(sheet_tarot_\d+)` \| (\d+)-(\d+) \| `((?:tarot|astro)_\w+)` \|', doc, re.M):
    cells.setdefault(sh, []).append((int(r), int(c), name))
icons, done = root / 'art/icons', root / 'art/sheets/done'
cut = 0
for sh, cs in cells.items():
    p = root / 'art/sheets' / (sh + '.png')
    if not p.exists():
        continue
    rows, cols = max(r for r, _, _ in cs), max(c for _, c, _ in cs)
    im = Image.open(p).convert('RGBA')
    if im.size != (cols * 64, rows * 64):
        im = im.resize((cols * 64, rows * 64), Image.NEAREST)
    for r, c, name in cs:
        deframe(im.crop(((c - 1) * 64, (r - 1) * 64, c * 64, (r - 1) * 64 + 64))).save(icons / (name + '.png'))
        cut += 1
    done.mkdir(parents=True, exist_ok=True)
    shutil.move(str(p), str(done / p.name))
    print(f'{sh}：切了 {len(cs)} 張，原圖搬到 art/sheets/done/')
if not cut:
    sys.exit('art/sheets/ 裡沒有 sheet_tarot_*.png')
subprocess.run([sys.executable, str(root / 'tools/art.py')], check=True)
