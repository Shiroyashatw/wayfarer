#!/usr/bin/env python3
"""把多檔專案打包成單一 HTML，給 Claude Artifact 預覽測試用。
用法：python3 tools/build_artifact.py [輸出路徑]（預設 dist/wayfarer_artifact.html）
Artifact 環境會擋外部連線，所以雲端存檔在預覽裡不會連線，只用本機存檔。"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'<link rel="stylesheet" href="css/style.css">',
              lambda _: '<style>\n' + (root / 'css/style.css').read_text(encoding='utf-8') + '</style>', html)
html = re.sub(r'<script src="(js/[^"]+)"></script>',
              lambda mo: '<script>\n' + (root / mo.group(1)).read_text(encoding='utf-8') + '</script>', html)
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist/wayfarer_artifact.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'已輸出 {out}（{len(html)//1024} KB）')
