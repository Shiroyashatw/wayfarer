"""從 ../dungeonPOE 的大圖挑出原型要用的圖，拼成 img/atlas.png 與 js/art.js（只在換圖時跑）"""
import json, re, os
from PIL import Image
SRC = os.path.join(os.path.dirname(__file__), '..', '..', 'dungeonPOE')
OUT = os.path.join(os.path.dirname(__file__), '..')
art = open(os.path.join(SRC, 'js', 'art.js'), encoding='utf-8').read()
sheets = dict(re.findall(r"'?([\w-]+)'?: '(img/[^']+)'", art))
rects = {k: (s, int(x), int(y), int(w), int(h)) for k, s, x, y, w, h in
         re.findall(r"^\s*'?(\w+)'?: \['([\w-]+)', (\d+), (\d+), (\d+), (\d+)\]", art, re.M)}
names = ['av_musashi', 'av_musashi_atk', 'm_slime_green', 'm_straydog', 'm_ghostfire', 'm_blackbear', 'm_bat',
         'hugupo', 'sk_slash2', 'sk_fanblade', 'sk_whirl', 'sk_iai', 'it_potion', 'mat_gold']
for g, n in [('weapon', 8), ('helm', 6), ('chest', 6), ('gloves', 6), ('boots', 6), ('ring', 6), ('amulet', 6)]:
    names += [f'gear_{g}_{i}' for i in range(n)]
imgs = {}
for n in names:
    s, x, y, w, h = rects[n]
    im = imgs.setdefault(s, Image.open(os.path.join(SRC, sheets[s])).convert('RGBA'))
    imgs[n] = im.crop((x, y, x + w, y + h))
# 簡單的排列：一排排放，寬 1024
W, X, Y, rowh, pos = 1024, 0, 0, 0, {}
for n in names:
    c = imgs[n]
    if X + c.width > W: X, Y, rowh = 0, Y + rowh + 1, 0
    pos[n] = [X, Y, c.width, c.height]
    X += c.width + 1; rowh = max(rowh, c.height)
at = Image.new('RGBA', (W, Y + rowh))
for n in names: at.paste(imgs[n], tuple(pos[n][:2]))
at.save(os.path.join(OUT, 'img', 'atlas.png'), optimize=True)
open(os.path.join(OUT, 'js', 'art.js'), 'w', encoding='utf-8').write(
    '/* 自動產生（tools/atlas.py），不要手改：圖名 → [x, y, 寬, 高] */\nconst ART = ' + json.dumps(pos) + ';\n')
print(len(names), 'sprites', at.size)
