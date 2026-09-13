# -*- coding: utf-8 -*-
"""
agreement.py — 판정자들이 같은 답에 모이는가.

정답지가 없어도 이 검사는 실패할 수 있다.
  · 서로 못 본 판정자들이 흩어지면 → 그 축은 글에서 안정적으로 읽히지 않는다.
    정답이 무엇이든 그 축으로 활동을 고를 수 없다. 축을 다시 짜야 한다.
  · 모이면 → 쓸 수 있다. 단 '맞다'는 뜻은 아니다. 다 같이 틀릴 수 있다.
    그래서 모인 뒤에는 교사가 표본을 훑어 축 자체가 엉뚱하지 않은지만 본다.

판정 기준 (Fleiss κ, 명목척도 관례)
  κ ≥ 0.67   쓸 수 있다
  0.40–0.67  거친 형태로만 — 헷갈리는 갈래를 묶어야 한다
  κ < 0.40   이 축은 글에서 안 읽힌다. 다시 짠다

사용: python scripts/agreement.py
"""
import itertools
import json
import os
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INDEPENDENT = ["flash", "pro", "gemma", "g38"]   # 서로 다른 모델 = 독립 판정자
RETEST = ("flash", "flash-r2")                   # 같은 모델, 선택지 순서만 다름


def load(rid):
    # SET_TAG=set2 → out/pred-<rid>.set2.json
    tag = os.environ.get("SET_TAG", "")
    p = os.path.join(HERE, "out", f"pred-{rid}{('.' + tag) if tag else ''}.json")
    if not os.path.exists(p):
        return None
    d = json.load(open(p, encoding="utf-8"))
    return {x["gid"]: x for x in d["predictions"]}


def fleiss_kappa(rows):
    """rows: 단위별 라벨 리스트. 라벨 수가 단위마다 같아야 한다."""
    rows = [r for r in rows if all(r) and len(r) == len(rows[0])]
    if not rows:
        return None, 0
    N, n = len(rows), len(rows[0])
    cats = sorted({c for r in rows for c in r})
    if len(cats) < 2:
        return 1.0, N
    P = []
    col = Counter()
    for r in rows:
        cnt = Counter(r)
        col.update(r)
        P.append((sum(v * v for v in cnt.values()) - n) / (n * (n - 1)))
    P_bar = sum(P) / N
    P_e = sum((col[c] / (N * n)) ** 2 for c in cats)
    if P_e >= 1:
        return 1.0, N
    return (P_bar - P_e) / (1 - P_e), N


def bar(x, width=26):
    f = max(0, min(width, int(round(width * x))))
    return "█" * f + "·" * (width - f)


def verdict(k):
    if k is None:
        return "—"
    return "쓸 수 있다" if k >= 0.67 else ("묶어야 한다" if k >= 0.40 else "다시 짜야 한다")


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--raters", help="쉼표로 구분. 생략하면 기본 독립 판정자 전부")
    args = ap.parse_args()
    names_wanted = args.raters.split(",") if args.raters else INDEPENDENT
    raters = {r: load(r) for r in names_wanted}
    missing = [r for r, v in raters.items() if not v]
    if missing:
        print("  판정 결과 없음:", ", ".join(missing), "— scripts/raters.py 를 먼저 돌리세요")
        raters = {r: v for r, v in raters.items() if v}
    if len(raters) < 2:
        raise SystemExit("판정자가 둘 미만이라 일치도를 못 잽니다.")

    gids = sorted(next(iter(raters.values())))
    names = list(raters)

    print("=" * 66)
    print(" K1′ · 서로 못 본 판정자들이 같은 답에 모이는가")
    print("=" * 66)
    print(f"\n 판정자 {len(names)} · 지문 {len(gids)}편 · 선택지 순서는 판정자마다 다르게 섞음")
    print(" " + " · ".join(names))

    for axis, key in (("축 A · 목적 (4갈래)", "purpose"), ("축 B · 전개 방식 (9갈래)", "method")):
        rows = [[raters[r][g][key] for r in names] for g in gids]
        k, n = fleiss_kappa(rows)
        print(f"\n─ {axis} ─")
        print(f"  Fleiss κ   {k:.3f}  {bar(max(0,k))}  → {verdict(k)}")

        agree_n = Counter(len(set(r)) for r in rows if all(r))
        full = agree_n.get(1, 0)
        print(f"  만장일치   {full}/{n}  ({full/n*100:.0f}%)   ← 되묻지 않고 그냥 쓸 수 있는 지문")
        print(f"  2갈래로 갈림 {agree_n.get(2,0)}/{n} · 3갈래 이상 {sum(v for kk,v in agree_n.items() if kk>=3)}/{n}")

        print("  두 판정자씩 맞대 보면")
        for a, b in itertools.combinations(names, 2):
            h = sum(1 for g in gids if raters[a][g][key] and raters[a][g][key] == raters[b][g][key])
            print(f"    {a:<7}↔ {b:<7} {h:>2}/{len(gids)}  {bar(h/len(gids))}")

        if key == "method":
            # 어느 갈래가 흔들리는가 — 한 판정자가 고를 때 남들이 따라오는 비율
            print("  갈래별 안정도 (한 판정자가 고를 때 다른 판정자들이 같이 고른 비율)")
            stab = defaultdict(lambda: [0, 0])
            for g in gids:
                labs = [raters[r][g][key] for r in names]
                for i, L in enumerate(labs):
                    if not L:
                        continue
                    others = [x for j, x in enumerate(labs) if j != i and x]
                    stab[L][0] += sum(1 for x in others if x == L)
                    stab[L][1] += len(others)
            for c, (h, t) in sorted(stab.items(), key=lambda kv: -kv[1][1]):
                if t:
                    print(f"    {c:<18} {h:>3}/{t:<3} {bar(h/t)} {h/t*100:5.1f}%")

            conf = Counter()
            for g in gids:
                labs = sorted({raters[r][g][key] for r in names if raters[r][g][key]})
                for a, b in itertools.combinations(labs, 2):
                    conf[(a, b)] += 1
            print("  가장 자주 갈린 짝")
            for (a, b), c in conf.most_common(6):
                print(f"    {a} ↔ {b}   {c}편")

    # ── 몇 갈래로 묶으면 읽히는가 ────────────────────────────
    # 가장 자주 갈린 짝부터 하나로 묶어 가며 κ 가 어떻게 오르는지 본다.
    # 묶는다는 것은 '그 둘을 교사에게 구별해 보여 주지 않는다'는 뜻이다.
    rows0 = [[raters[r][g]["method"] for r in names] for g in gids]
    print("\n─ 몇 갈래로 묶으면 읽히는가 ─")
    print("  자주 갈리는 갈래를 하나씩 합치며 κ 를 다시 잰다")
    merged = {}          # 원래 갈래 → 묶인 이름

    def apply(rows):
        return [[merged.get(x, x) if x else x for x in r] for r in rows]

    k0, _ = fleiss_kappa(rows0)
    n_cat = len({x for r in rows0 for x in r if x})
    print(f"    {n_cat}갈래 (원래)          κ {k0:.3f}  {bar(max(0,k0))}")
    for _ in range(5):
        rows = apply(rows0)
        conf = Counter()
        for r in rows:
            for a, b in itertools.combinations(sorted({x for x in r if x}), 2):
                conf[(a, b)] += 1
        if not conf:
            break
        (a, b), _c = conf.most_common(1)[0]
        name = f"{a}+{b}"
        for k_, v in list(merged.items()):
            if v in (a, b):
                merged[k_] = name
        for c in {x for r in rows0 for x in r if x}:
            if merged.get(c, c) in (a, b):
                merged[c] = name
        rows = apply(rows0)
        k, _ = fleiss_kappa(rows)
        n_cat = len({x for r in rows for x in r if x})
        mark = "  ← 쓸 수 있다" if k >= 0.67 else ""
        print(f"    {n_cat}갈래  {a} + {b}".ljust(38) + f"κ {k:.3f}  {bar(max(0,k))}{mark}")
        if k >= 0.67:
            break

    # ── 재검사: 같은 모델, 선택지 순서만 다름 ──────────────────
    a, b = RETEST
    ra, rb = load(a), load(b)
    if ra and rb:
        print("\n─ 재검사 · 같은 모델에 선택지 순서만 바꿔 다시 물음 ─")
        for axis, key in (("목적", "purpose"), ("전개 방식", "method")):
            h = sum(1 for g in gids if ra[g][key] and ra[g][key] == rb[g][key])
            print(f"  {axis:<8} {h:>2}/{len(gids)}  {bar(h/len(gids))}  {h/len(gids)*100:5.1f}%")
        print("  → 여기서 많이 바뀌면 글이 아니라 목록을 읽은 것이다.")

    # ── 갈린 지문만 모아 둔다: 사람이 볼 자리 ─────────────────
    split = [g for g in gids if len({raters[r][g]["method"] for r in names if raters[r][g]["method"]}) > 1]
    out = os.path.join(HERE, "out", "disputed.json")
    json.dump({"_note": "판정자들이 갈린 지문. 사람이 볼 자리는 여기뿐이다.",
               "n_total": len(gids), "n_disputed": len(split),
               "items": [{"gid": g, "votes": {r: raters[r][g]["method"] for r in names}}
                         for g in split]},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n 갈린 지문 {len(split)}/{len(gids)}편 → out/disputed.json")
    print(" 사람이 붙일 라벨은 30편 전부가 아니라 이 갈린 것들뿐이다.")


if __name__ == "__main__":
    main()
