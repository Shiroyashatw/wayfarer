#!/usr/bin/env python3
"""把 art/ 裡的 PNG 像素圖拼成幾張大圖（img/組名.hash.png），座標寫進 js/art.js。
用法：python3 tools/art.py（新增或換圖後跑一次；需要 Pillow：python3 -m pip install --user pillow）
- art/monsters/檔名.png → 遊戲裡的圖名 'a_檔名'（怪物資料的 spr 填這個）；子資料夾 art/monsters/組名/檔名.png 也可以，圖名一樣是 'a_檔名'
- 會自動裁掉四周透明的空白；半透明一律變成全透明／不透明（像素圖不要半透明邊）
- 圖要面向左（戰鬥中怪物在右邊）；背景要透明
- 分組：子資料夾名，否則檔名第一個 _ 前的前綴（至少 4 張同前綴才自成一組，其他歸 misc）
- 每張大圖最多 255 色，存成調色盤 PNG（無損，跟原圖每個像素都一樣）；顏色超過就再開一張（組名-2、組名-3…）
- 檔名帶內容 hash：只有內容變了的大圖會換檔名，手機只重新下載那一張；舊的大圖會自動刪掉
- js/art.js 只放座標（ART_SHEET 大圖網址、ART 每張圖在哪張大圖的哪裡），遊戲用到才載入大圖；打包 Artifact 時由 build_artifact.py 內嵌"""
import hashlib, io, pathlib, re, sys
from collections import Counter
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
root = pathlib.Path(__file__).resolve().parent.parent
src, out_dir = root / 'art/monsters', root / 'img'
icons = root / 'art/icons'  # 0.3.39 圖示（tools/icon_sheets.py 切好的 32×32，不裁邊）
MAX_W, PAD = 512, 1


def load(p):
    im = Image.open(p).convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda v: 255 if v >= 128 else 0))
    return im if p.parent == icons else im.crop(im.getbbox())


files = sorted([*src.rglob('*.png'), *icons.glob('*.png')], key=lambda p: p.stem)
names = [p.stem for p in files]
dup = [n for n, c in Counter(names).items() if c > 1]
if dup:
    sys.exit('圖名重複（不同資料夾同檔名）：' + '、'.join(dup))
pre = Counter(n.split('_')[0] for n in names if '_' in n)


def group(p):
    if p.parent == icons:
        return 'ic_' + p.stem.split('_')[0]
    if p.parent != src:
        return p.parent.relative_to(src).parts[0]
    k = p.stem.split('_')[0] if '_' in p.stem else ''
    return k if pre[k] >= 4 else 'misc'


groups = {}
for p in files:
    groups.setdefault(group(p), []).append((p.stem, load(p)))

# 沿用上次的分配（讀舊的 js/art.js）：圖留在原本那張大圖，新圖才找有空位的大圖，其他大圖的檔名就不會跟著變
old = pathlib.Path(root / 'js/art.js')
prev = dict(re.findall(r"^  (\w+): \['([\w-]+)'", old.read_text(encoding='utf-8'), re.M)) if old.exists() else {}
PER = 12  # 一張大圖最多幾張圖（用到才載入，太大張反而多載用不到的）
sheet_of = lambda g, n: g if n == 1 else f'{g}-{n}'
bins = {}  # 大圖名 → {'g': 組, 'items': [(圖名, im)], 'cols': 顏色集合}
todo = []
for g in sorted(groups):
    for name, im in groups[g]:
        c = {px[:3] for px in im.get_flattened_data() if px[3]}
        s = prev.get(name)
        b = bins.setdefault(s, {'g': g, 'items': [], 'cols': set()}) if s and re.fullmatch(re.escape(g) + r'(-\d+)?', s) else None
        if b and (not b['items'] or (len(b['items']) < PER and len(b['cols'] | c) <= 255)):
            b['items'].append((name, im))
            b['cols'] |= c
        else:
            todo.append((g, name, im, c))
for g, name, im, c in todo:
    b = next((b for b in bins.values() if b['g'] == g and len(b['items']) < PER and len(b['cols'] | c) <= 255), None)
    if not b:
        n = 1
        while sheet_of(g, n) in bins:
            n += 1
        b = bins[sheet_of(g, n)] = {'g': g, 'items': [], 'cols': set()}
    b['items'].append((name, im))
    b['cols'] |= c
sheets = [(s, b['items'], b['cols']) for s, b in sorted(bins.items()) if b['items']]  # (名稱, [(圖名, im)], 顏色集合)


def pack(items):
    """一列一列由左往右排（依高度排序，列高接近），寬度上限 MAX_W"""
    pos, x, y, row = {}, 0, 0, 0
    for name, im in sorted(items, key=lambda t: (-t[1].height, t[0])):
        if x and x + im.width > MAX_W:
            x, y, row = 0, y + row + PAD, 0
        pos[name] = (x, y)
        x += im.width + PAD
        row = max(row, im.height)
    w = max(pos[n][0] + im.width for n, im in items)
    return pos, w, y + row


out_dir.mkdir(exist_ok=True)
keep, sheet_url, coords, total = set(), {}, {}, 0
for sname, items, cols in sheets:
    pos, w, h = pack(items)
    rgba = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for name, im in items:
        rgba.paste(im, pos[name])
    if len(cols) <= 255:
        pal = sorted(cols)
        idx = {c: i + 1 for i, c in enumerate(pal)}
        img = Image.new('P', (w, h))
        img.putdata([idx[px[:3]] if px[3] else 0 for px in rgba.get_flattened_data()])
        img.putpalette([0, 0, 0] + [v for c in pal for v in c])
        opt = {'transparency': 0}
    else:
        img, opt = rgba, {}  # 單張圖本身就超過 255 色：維持 RGBA
    buf = io.BytesIO()
    img.save(buf, 'PNG', optimize=True, **opt)
    data = buf.getvalue()
    back = Image.open(io.BytesIO(data)).convert('RGBA')
    assert back.tobytes() == rgba.tobytes() or all(
        (a[3] == 0 and b[3] == 0) or a == b for a, b in zip(back.get_flattened_data(), rgba.get_flattened_data())
    ), f'{sname} 轉檔後像素不同'
    fn = f'{sname}.{hashlib.sha1(data).hexdigest()[:8]}.png'
    (out_dir / fn).write_bytes(data)
    keep.add(fn)
    sheet_url[sname] = f'img/{fn}'
    for name, im in items:
        coords[name] = (sname, *pos[name], im.width, im.height)
    total += len(data)
    print(f'{fn}：{len(items)} 張，{w}×{h}，{len(cols)} 色，{len(data) // 1024} KB')
for f in out_dir.glob('*.png'):
    if f.name not in keep:
        f.unlink()
        print('刪掉舊的', f.name)

js = ('/* 自動產生，不要手改：python3 tools/art.py（來源 art/monsters/*.png）。圖名是 a_檔名，見 sprites.js 的 artSprite */\n'
      '/* ART_SHEET：大圖網址；ART：圖名 → [大圖, x, y, 寬, 高] */\n'
      'const ART_SHEET = {\n' + ',\n'.join(f"  '{k}': '{v}'" for k, v in sheet_url.items()) + '\n};\n'
      'const ART = {\n' + ',\n'.join(f"  {n}: ['{s}', {x}, {y}, {w}, {h}]" for n, (s, x, y, w, h) in sorted(coords.items())) + '\n};\n')
(root / 'js/art.js').write_text(js, encoding='utf-8')
print(f'已輸出 js/art.js（{len(coords)} 張圖、{len(sheets)} 張大圖，共 {total // 1024} KB）')
