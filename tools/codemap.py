"""產生 docs/CODEMAP.md 裡的「頂層宣告索引」（函式、常數與行號）。
改完 JS 後執行：python3 tools/codemap.py
只會改寫 <!-- index:start --> 和 <!-- index:end --> 之間的內容，其他手寫說明保留。"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
order = ['core', 'data', 'sprites', 'audio', 'items', 'battle', 'map', 'tree', 'ui', 'cloud', 'social', 'mp', 'main']
pat = re.compile(r'^(?:async\s+)?function\s+([\w$]+)|^(?:const|let|var)\s+([\w$]+)\s*=')
out = []
for name in order:
    f = root / 'js' / f'{name}.js'
    lines = f.read_text(encoding='utf8').split('\n')
    out.append(f'\n### js/{name}.js（{len(lines)} 行）\n')
    items = []
    def flush():
        if items:
            out.append('  ' + '、'.join(f'`{x}`' for x in items))
            items.clear()
    for i, ln in enumerate(lines, 1):
        sec = re.match(r'^/\* =+ (.+?) =+ \*/', ln)
        if sec:
            flush()
            out.append(f'- **{sec.group(1)}**（{i}）')
            continue
        m = pat.match(ln)
        if m:
            items.append(f'{m.group(1) or m.group(2)}:{i}')
    flush()
doc = root / 'docs' / 'CODEMAP.md'
s = doc.read_text(encoding='utf8')
a, b = '<!-- index:start -->', '<!-- index:end -->'
s = s[: s.index(a) + len(a)] + '\n' + '\n'.join(out) + '\n' + s[s.index(b):]
doc.write_text(s, encoding='utf8')
print('updated', doc)
