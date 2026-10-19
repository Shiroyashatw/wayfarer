#!/usr/bin/env python3
"""把 art/ 裡的 PNG 像素圖轉成 js/art.js（base64 內嵌，單一 HTML 打包也能用）。
用法：python3 tools/art.py
- art/monsters/檔名.png → 遊戲裡的圖名 'a_檔名'（怪物資料的 spr 填這個）
- 會自動裁掉四周透明的空白；半透明一律變成全透明／不透明（像素圖不要半透明邊）
- 圖要面向左（戰鬥中怪物在右邊）；背景要透明"""
import base64, io, pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
out, total = [], 0
for p in sorted((root / 'art/monsters').glob('*.png')):
    im = Image.open(p).convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
    im.putalpha(a)
    im = im.crop(im.getbbox())
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    b = buf.getvalue()
    total += len(b)
    out.append(f"  {p.stem}: 'data:image/png;base64,{base64.b64encode(b).decode()}'")
    print(f'{p.stem}: {im.width}×{im.height}，{len(b)} bytes')
js = ('/* 自動產生，不要手改：python3 tools/art.py（來源 art/monsters/*.png）。圖名是 a_檔名，見 sprites.js 的 artSprite */\n'
      'const ART = {\n' + ',\n'.join(out) + '\n};\nObject.keys(ART).forEach(artImg);\n')
(root / 'js/art.js').write_text(js, encoding='utf-8')
print(f'已輸出 js/art.js（{len(out)} 張，PNG 共 {total // 1024} KB）')
