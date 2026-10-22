"""圖示與名稱對照：每件道具（與職業）用的圖示，原本畫的是什麼（從提示詞找），看名字對不對得上。

用法：
  python3 tools/icon_check.py            輸出 docs/圖示對照.md（全部道具的對照表＋還沒用到的圖示清單）
  python3 tools/icon_check.py 弓 bow     只在終端機列出名字、標籤、圖示或提示詞含關鍵字的道具與候選圖示

圖示是什麼，照這個順序找：
  1. art/icons/it_道具代號.png 有專屬圖 → 就是這件道具（提示詞在 docs/圖示提示詞.md 或 docs/提示詞封存.md）
  2. ic 指向的圖示（sk_／sup_／gear_／cur_／mat_／unit_…）→ 在 docs/提示詞封存.md、docs/圖示提示詞.md 找那一列
  3. ic 是 'a:怪物' → docs/怪物提示詞.md 找那隻怪
  4. 'p:鍵' 是程式畫的像素圖（sprites.js）
"""
import os
import re
import sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROW = re.compile(r"^\|\s*`([A-Za-z0-9_\-]+)`\s*\|\s*([^|]*?)\s*\|(.*)$")
BOIL = re.compile(
    r"^(single item icon of|game skill icon of|game icon of|game support gem icon of|a |an )\s*|,\s*(bold simple|diagonal from|front view|glowing|readable|centered|no text|game sprite|pixel art).*$",
    re.I,
)


def read(p):
    p = os.path.join(R, p)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""


def prompts():
    """圖示代號 → (中文名, 提示詞摘要)，封存的優先、再來是還沒產的"""
    out = {}
    for f in ["docs/提示詞封存.md", "docs/圖示提示詞.md", "docs/怪物提示詞.md"]:
        for line in read(f).splitlines():
            m = ROW.match(line)
            if not m:
                continue
            key, zh, rest = m.groups()
            pr = re.findall(r"`([^`]+)`", rest)
            desc = BOIL.sub("", pr[-1]).strip() if pr else ""
            desc = re.sub(r",\s*(bold|centered|readable|no text).*$", "", desc)
            out.setdefault(key, (zh, desc[:110]))
    # 怪物提示詞是段落格式：**名字**　`m_xxx.png`，另外還有「`m_xxx`（名字）」的清單
    t = read("docs/怪物提示詞.md")
    for m in re.finditer(r"\*\*([^*]+)\*\*\s*`([A-Za-z0-9_]+)\.png`", t):
        out.setdefault(m.group(2), (m.group(1), "怪物圖"))
    for m in re.finditer(r"`([A-Za-z0-9_]+)`（([^）]+)）", t):
        out.setdefault(m.group(1), (m.group(2), "怪物圖"))
    return out


def items():
    """從 js/items.js 讀 ITEMS（id、名字、星級、標籤、ic）與 CLASSES"""
    s = read("js/items.js")
    body = s[s.index("const ITEMS = [") : s.index("const ITEMI")]
    out = []
    for m in re.finditer(r"\{\s*id: '([^']+)',(.*?)ic: '([^']+)'", body, re.S):
        iid, mid, ic = m.groups()
        n = re.search(r"n: '([^']+)'", mid)
        st = re.search(r"star: (\d)", mid)
        tg = re.search(r"tags: \[([^\]]*)\]", mid)
        out.append(
            dict(
                id=iid,
                n=n.group(1) if n else iid,
                star=int(st.group(1)) if st else 0,
                tags=re.findall(r"'(\w+)'", tg.group(1)) if tg else [],
                ic=ic,
            )
        )
    cls = []
    cb = s[s.index("const CLASSES = [") : s.index("const CLSI")]
    for m in re.finditer(r"id: '([^']+)',(.*?)ic: '([^']+)'", cb, re.S):
        n = re.search(r"n: '([^']+)'", m.group(2))
        cls.append(dict(id=m.group(1), n=n.group(1) if n else m.group(1), star=0, tags=["職業"], ic=m.group(3)))
    return out, cls


def art_keys():
    """js/art.js 裡真的有的圖（候選只列這些；沒產出的提示詞不算）"""
    return set(re.findall(r"^  ([A-Za-z0-9_]+): \[", read("js/art.js"), re.M))


def own_icons():
    d = os.path.join(R, "art", "icons")
    return {f[3:-4] for f in os.listdir(d) if f.startswith("it_") and f.endswith(".png")} if os.path.isdir(d) else set()


def describe(it, P, own):
    if it["id"] in own:
        zh, de = P.get("it_" + it["id"], (it["n"], "（專屬圖）"))
        return "it_" + it["id"], zh, de
    ic = it["ic"]
    if ic.startswith("p:"):
        return ic, "程式像素圖", ic[2:]
    key = ic[2:] if ic.startswith("a:") else ic
    zh, de = P.get(key) or P.get(key[2:] if key.startswith("m_") else key) or ("？", "（找不到提示詞）")
    return ic, zh, de


def main():
    P = prompts()
    AK = art_keys()
    its, cls = items()
    own = own_icons()
    kw = [a.lower() for a in sys.argv[1:]]
    used = {}
    for it in its + cls:
        used.setdefault(it["ic"][2:] if it["ic"].startswith("a:") else it["ic"], []).append(it["n"])
    if kw:
        hit = lambda *xs: any(k in " ".join(xs).lower() for k in kw)
        print("## 道具")
        for it in its + cls:
            ic, zh, de = describe(it, P, own)
            if hit(it["n"], it["id"], " ".join(it["tags"]), ic, zh, de):
                print(f"{it['n']}（{it['id']} {it['star']}★ {'/'.join(it['tags'])}）→ {ic}：{zh}｜{de}")
        print("\n## 候選圖示（還沒被用到）")
        for k, (zh, de) in P.items():
            if k.startswith(("it_", "m_")) or k in used or k not in AK:
                continue
            if hit(k, zh, de):
                print(f"{k}：{zh}｜{de}")
        return
    L = [
        "# 圖示對照（自動產生：python3 tools/icon_check.py，不要手改）",
        "",
        "每件道具用的圖示原本畫的是什麼（從提示詞找）。名字跟「圖示原本是」對不起來的，換圖示或改名字（skill `icon-check`）。",
        "",
        "| 道具 | 星 | 標籤 | 圖示 | 圖示原本是 | 提示詞 | 共用 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for it in its + cls:
        ic, zh, de = describe(it, P, own)
        key = it["ic"][2:] if it["ic"].startswith("a:") else it["ic"]
        share = "、".join(x for x in used.get(key, []) if x != it["n"]) if it["id"] not in own else ""
        L.append(f"| {it['n']} | {it['star'] or ''} | {'/'.join(it['tags'])} | `{ic}` | {zh} | {de} | {share} |")
    L += ["", "## 還沒用到的圖示（候選）", "", "| 圖示 | 原本是 | 提示詞 |", "| --- | --- | --- |"]
    for k, (zh, de) in P.items():
        if k.startswith(("it_", "m_", "tree_", "asc_")) or k in used or k not in AK:
            continue
        L.append(f"| `{k}` | {zh} | {de} |")
    open(os.path.join(R, "docs", "圖示對照.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    print(f"docs/圖示對照.md：道具 {len(its)}、職業 {len(cls)}；專屬圖 {len(own)} 件；找不到提示詞的圖示：", end="")
    miss = [it["n"] for it in its + cls if describe(it, P, own)[1] == "？"]
    print("、".join(miss) or "無")


if __name__ == "__main__":
    main()
