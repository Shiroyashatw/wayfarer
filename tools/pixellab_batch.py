#!/usr/bin/env python3
"""用 PixelLab API 批次產圖：讀 docs/怪物提示詞.md、docs/圖示提示詞.md 裡的提示詞，一張一張送出，存成 PNG。

API 金鑰放環境變數，不要寫進程式或 commit：
    export PIXELLAB_API_KEY=你的token      # pixellab.ai/account 複製（Windows：set PIXELLAB_API_KEY=...）

用法：
    python3 tools/pixellab_batch.py balance                         # 看剩多少次數／點數
    python3 tools/pixellab_batch.py list docs/圖示提示詞.md          # 只列出會產哪些圖（不花錢）
    python3 tools/pixellab_batch.py run docs/圖示提示詞.md --only sk_ --limit 5
    python3 tools/pixellab_batch.py run docs/怪物提示詞.md --only m_ --size 64 --n 2

- 輸出到 art/new/（不會直接進遊戲）：每張 檔名.png，--n 2 以上是 檔名_1.png、檔名_2.png。挑好再搬到 art/monsters/ 或 art/icons/。
- 已經有的檔案（art/new、art/monsters、art/icons）會跳過，中斷了重跑會接著做。
- 尺寸沒指定時：sk_／sup_／gear_／unit_／tree_／asc_ 開頭用 32，其他（怪物）用 64。
- --extra 可以多傳 API 參數（JSON），預設 {"no_background": true}；API 不認得時會自動拿掉再試一次。
"""
import argparse, base64, json, os, pathlib, re, sys, time, urllib.error, urllib.request

API = 'https://api.pixellab.ai/v2'
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'art/new'
HAVE_DIRS = [OUT, ROOT / 'art/monsters', ROOT / 'art/icons']


def token():
    t = os.environ.get('PIXELLAB_API_KEY', '').strip()
    if not t:
        sys.exit('請先設定環境變數 PIXELLAB_API_KEY（pixellab.ai/account 的 API token）')
    return t


def call(method, path, body=None):
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b'{}')
        except ValueError:
            return e.code, {}


# ---------- 從文件讀提示詞：回傳 [(檔名, 提示詞)] ----------
def jobs_from(doc):
    t = pathlib.Path(doc).read_text(encoding='utf-8')
    out = []
    # 怪物：**名稱**　`檔名.png`… 下一行是 ``` 提示詞 ```
    for m in re.finditer(r'\*\*[^*\n]+\*\*　`([\w-]+)\.png`[^\n]*\n```\n(.*?)\n```', t, re.S):
        out.append((m.group(1), m.group(2)))
    # 舊格式／戰場單位：``` 提示詞 ``` 下一行是 `檔名.png`（名稱）
    for m in re.finditer(r'```\n(.*?)\n```\n`([\w-]+)\.png`', t, re.S):
        out.append((m.group(2), m.group(1)))
    # 圖示表格（技能、輔助寶石、裝備、戰場單位、天賦樹、昇華）：| `檔名` | … | `提示詞` |
    for m in re.finditer(r'^\| `([\w-]+)` \|.*\| `([^`]+)` \|$', t, re.M):
        out.append((m.group(1), m.group(2)))
    seen, res = set(), []
    for f, p in out:
        if f not in seen:
            seen.add(f)
            res.append((f, ' '.join(l.strip() for l in p.strip().splitlines())))
    return res


def have(name):
    return any((d / f'{name}.png').exists() or (d / f'{name}_1.png').exists() for d in HAVE_DIRS)


# ---------- 產一張：可能直接回圖，也可能回 background_job_id 要輪詢 ----------
def images_of(r):
    if not isinstance(r, dict):
        return []
    if r.get('image'):
        return [r['image']]
    if r.get('images'):
        return r['images']
    return images_of(r.get('last_response') or {})


def b64png(img):
    s = img.get('base64') if isinstance(img, dict) else img
    return base64.b64decode(s.split(',', 1)[-1])


def generate(prompt, size, extra, endpoint, height=None):
    body = {'description': prompt, 'image_size': {'width': size, 'height': height or size}, **extra}
    for attempt in range(8):
        code, r = call('POST', endpoint, body)
        if code == 422 and extra and any(k in json.dumps(r) for k in extra):
            print(f'    API 不認得 {list(extra)}，拿掉再試：{json.dumps(r, ensure_ascii=False)[:200]}')
            body = {k: v for k, v in body.items() if k not in extra}
            extra = {}
            continue
        if code in (429, 529):
            time.sleep(5 * (attempt + 1))
            continue
        if code == 402:
            sys.exit('點數／次數不夠了（402），先到 PixelLab 確認額度')
        if code == 401:
            sys.exit('API token 無效（401）')
        if code >= 300:
            raise RuntimeError(f'{code} {json.dumps(r, ensure_ascii=False)[:300]}')
        break
    else:
        raise RuntimeError('一直被限流（429），晚點再跑')
    job = r.get('background_job_id')
    while job:
        time.sleep(3)
        code, r = call('GET', f'/background-jobs/{job}')
        st = r.get('status')
        if st == 'completed':
            break
        if st == 'failed':
            raise RuntimeError(json.dumps(r.get('last_response'), ensure_ascii=False)[:300])
    ims = images_of(r)
    if not ims:
        raise RuntimeError('回應裡找不到圖：' + json.dumps(r, ensure_ascii=False)[:300])
    usd = (r.get('usage') or {}).get('usd')
    return b64png(ims[0]), usd


def main():
    ap = argparse.ArgumentParser(description='PixelLab 批次產圖')
    ap.add_argument('cmd', choices=['balance', 'list', 'run'])
    ap.add_argument('doc', nargs='?', help='docs/怪物提示詞.md 或 docs/圖示提示詞.md')
    ap.add_argument('--only', default='', help='只做檔名以這個開頭的（例：m_、sk_、gear_weapon）')
    ap.add_argument('--limit', type=int, default=0, help='最多做幾種（先小量試）')
    ap.add_argument('--n', type=int, default=1, help='每種產幾張候選')
    ap.add_argument('--size', type=int, default=0, help='邊長（預設：圖示 32、怪物 64）')
    ap.add_argument('--endpoint', default='/create-image-pixen', help='預設 /create-image-pixen；要更好品質可試 /generate-image-v2')
    ap.add_argument('--extra', default='{"no_background": true}', help='額外的 API 參數（JSON）')
    ap.add_argument('--force', action='store_true', help='已經有的也重做')
    a = ap.parse_args()

    if a.cmd == 'balance':
        code, r = call('GET', '/balance')
        print(code, json.dumps(r, ensure_ascii=False, indent=1))
        return
    if not a.doc:
        sys.exit('請指定提示詞文件，例如 docs/圖示提示詞.md')
    jobs = [(f, p) for f, p in jobs_from(a.doc) if f.startswith(a.only) and (a.force or not have(f))]
    if a.limit:
        jobs = jobs[: a.limit]
    print(f'{len(jobs)} 種 × {a.n} 張（約扣 {len(jobs) * a.n} 次）')
    if a.cmd == 'list':
        try:
            for f, p in jobs:
                print(f'{f}: {p[:90]}…')
        except BrokenPipeError:
            pass
        return
    OUT.mkdir(parents=True, exist_ok=True)
    extra, total = json.loads(a.extra), 0.0
    for k, (f, p) in enumerate(jobs, 1):
        size = a.size or (32 if re.match(r'(sk|sup|gear|unit|tree|asc)_', f) else 64)
        for i in range(1, a.n + 1):
            name = f if a.n == 1 else f'{f}_{i}'
            try:
                png, usd = generate(p, size, extra, a.endpoint)
            except RuntimeError as e:
                print(f'[{k}/{len(jobs)}] {name} 失敗：{e}')
                continue
            (OUT / f'{name}.png').write_bytes(png)
            total += usd or 0
            print(f'[{k}/{len(jobs)}] {name}.png（{size}px）' + (f' ${usd}' if usd is not None else ''))
    print(f'完成，輸出在 {OUT}' + (f'，共 ${total:.3f}' if total else ''))


if __name__ == '__main__':
    main()
