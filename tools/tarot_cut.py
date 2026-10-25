#!/usr/bin/env python3
"""0.1.74 塔羅牌圖表 → 單張卡圖：讀 art/sheets/sheet_tarot_N.png，照 docs/塔羅牌圖表.md 的「格序對照」切成
art/icons/tarot_牌.png、astro_月.png（64×64，不裁邊），跑 tools/art.py 打包，切過的原圖搬到 art/sheets/done/。
圖表是放大過的（例如 1024×1024）就照格子數用最近鄰縮回每格 64。
用法：python3 tools/tarot_cut.py"""
import pathlib, re, shutil, subprocess, sys
from PIL import Image

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
        im.crop(((c - 1) * 64, (r - 1) * 64, c * 64, (r - 1) * 64 + 64)).save(icons / (name + '.png'))
        cut += 1
    done.mkdir(parents=True, exist_ok=True)
    shutil.move(str(p), str(done / p.name))
    print(f'{sh}：切了 {len(cs)} 張，原圖搬到 art/sheets/done/')
if not cut:
    sys.exit('art/sheets/ 裡沒有 sheet_tarot_*.png')
subprocess.run([sys.executable, str(root / 'tools/art.py')], check=True)
