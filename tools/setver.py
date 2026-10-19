"""設定版本號：同時改 js/data.js 的 VER，以及 index.html 裡 JS／CSS 網址後面的 ?v=（讓瀏覽器在改版時一定抓新檔）。
用法：python3 tools/setver.py 0.2.5.6"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
v = sys.argv[1]
d = root / 'js' / 'data.js'
d.write_text(re.sub(r"const VER = '[^']*';", f"const VER = '{v}';", d.read_text(encoding='utf-8')), encoding='utf-8')
h = root / 'index.html'
s = h.read_text(encoding='utf-8')
s = re.sub(r'((?:src|href)="(?:js|css)/[^"?]+\.(?:js|css))(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={v}"', s)
h.write_text(s, encoding='utf-8')
print('version', v)
