"""更新程式碼地圖。改完 JS 後執行：python3 tools/codemap.py

1. docs/CODEMAP.md：只改寫 <!-- index:start --> 和 <!-- index:end --> 之間的「檔案區段大綱」（區段名稱與行號），其他手寫說明保留。
2. docs/SYMBOLS.txt：每個頂層函式／常數一行「名稱 檔案:行號 區段」，給 Grep 用（例：Grep `^sumStats ` 就拿到位置），不要整份讀。
3. 檢查 CODEMAP 手寫表格裡用反引號寫的名稱，JS／HTML／CSS 都找不到的會列出來（改名或刪掉後記得修表格）。"""
import re, sys, pathlib
sys.stdout.reconfigure(encoding='utf-8')
root = pathlib.Path(__file__).resolve().parent.parent
order = ['core', 'data', 'sprites', 'gear', 'art', 'skills', 'audio', 'items', 'battle', 'map', 'tree', 'ui', 'endgame', 'undead', 'demon', 'hunt', 'daily', 'asc', 'gacha', 'tutor', 'cloud', 'social', 'mp', 'main']
pat = re.compile(r'^(?:async\s+)?function\s+([\w$]+)|^(?:const|let|var)\s+([\w$]+)\s*=')
out, syms, srcs = [], [], []
for name in order:
    rel = f'js/{name}.js'
    lines = (root / rel).read_text(encoding='utf8').split('\n')
    if name != 'art':
        srcs.append('\n'.join(lines))
    out.append(f'\n### {rel}（{len(lines)} 行）\n')
    sec, n = '', 0
    def flush():
        if sec:
            out[-1] += f'，{n} 個宣告'
    for i, ln in enumerate(lines, 1):
        m = re.match(r'^/\* =+ (.+?) =+ \*/', ln)
        if m:
            flush()
            sec, n = m.group(1), 0
            out.append(f'- **{sec}**（{i}）')
            continue
        m = pat.match(ln)
        if m:
            n += 1
            syms.append(f'{m.group(1) or m.group(2)} {rel}:{i}' + (f' [{sec}]' if sec else ''))
    flush()
doc = root / 'docs' / 'CODEMAP.md'
s = doc.read_text(encoding='utf8')
a, b = '<!-- index:start -->', '<!-- index:end -->'
s = s[: s.index(a) + len(a)] + '\n' + '\n'.join(out) + '\n' + s[s.index(b):]
doc.write_text(s, encoding='utf8')
(root / 'docs' / 'SYMBOLS.txt').write_text(
    '# 自動產生（tools/codemap.py），不要手改、不要整份讀：用 Grep「^名稱 」找位置\n' + '\n'.join(syms) + '\n', encoding='utf8')
print('updated', doc, 'and docs/SYMBOLS.txt', f'({len(syms)} 個宣告)')

src = '\n'.join(srcs) + (root / 'index.html').read_text(encoding='utf8') + (root / 'css' / 'style.css').read_text(encoding='utf8')
names = set(re.findall(r'`([A-Za-z_$][\w$.]*)(?:\([^`]*\))?`', s[: s.index(a)], re.A))
miss = sorted(x for x in names if not re.search(r'(?<![\w$])' + re.escape(x.split('.')[-1]) + r'(?![\w$])', src))
if miss:
    print('CODEMAP 表格裡找不到的名稱（可能已改名或刪除）：', '、'.join(miss))
