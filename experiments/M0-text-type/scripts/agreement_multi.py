# -*- coding: utf-8 -*-
"""
agreement_multi.py — 질문을 바꾼 뒤 판정이 안정되는가.

단일 선택(9개 중 하나)에서는 판정자들이 흩어졌다.
여기서는 방식마다 따로 '있다/없다'를 물었을 때 얼마나 모이는지 본다.

세 가지를 본다
  1. 방식별 κ — 어느 방식이 안정적으로 읽히고 어느 것이 안 읽히는가
  2. 흔한 정도 — 9개 중 8개가 늘 '있다'면 라벨이 아무것도 안 가른다
  3. ★ 지문당 '전원 있다' 방식 개수 — 활동을 안전하게 걸 수 있는 자리 수.
     이게 1개 이상이면 앱이 늘 근거 있는 활동을 낼 수 있다.

사용: python scripts/agreement_multi.py
"""
import itertools
import json
import os
from collections import Counter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RATERS = ["m-flash", "m-pro", "m-g38"]


def load(rid):
    # SET_TAG=set2 → out/multi-<rid>.set2.json
    tag = os.environ.get("SET_TAG", "")
    p = os.path.join(HERE, "out", f"multi-{rid}{('.' + tag) if tag else ''}.json")
    if not os.path.exists(p):
        return None
    d = json.load(open(p, encoding="utf-8"))
    return d, {x["gid"]: x for x in d["predictions"]}


def binary_kappa(rows):
    """rows: 단위별 [True/False, ...]. 명목 2범주 Fleiss κ."""
    rows = [r for r in rows if len(r) == len(rows[0])]
    N, n = len(rows), len(rows[0])
    if N == 0 or n < 2:
        return None
    yes_tot = sum(sum(1 for x in r if x) for r in rows)
    p_yes = yes_tot / (N * n)
    if p_yes in (0.0, 1.0):
        return None                       # 전원이 늘 같은 답 → κ 정의 안 됨
    P = []
    for r in rows:
        y = sum(1 for x in r if x)
        no = n - y
        P.append((y * y + no * no - n) / (n * (n - 1)))
    P_bar = sum(P) / N
    P_e = p_yes ** 2 + (1 - p_yes) ** 2
    return None if P_e >= 1 else (P_bar - P_e) / (1 - P_e)


def bar(x, width=24):
    if x is None:
        return "—"
    f = max(0, min(width, int(round(width * x))))
    return "█" * f + "·" * (width - f)


def main():
    loaded = {r: load(r) for r in RATERS}
    have = {r: v for r, v in loaded.items() if v}
    if len(have) < 2:
        raise SystemExit("multi 판정 결과가 둘 미만입니다. scripts/raters_multi.py 를 먼저 돌리세요.")
    names = list(have)
    methods = have[names[0]][0]["methods"]
    preds = {r: have[r][1] for r in names}
    gids = [g for g in sorted(preds[names[0]])
            if all(preds[r].get(g, {}).get("ok") for r in names)]

    print("=" * 66)
    print(" K1″ · 묻는 법을 바꾼 뒤 — 방식마다 '있다/없다'")
    print("=" * 66)
    print(f"\n 판정자 {len(names)} · 지문 {len(gids)}편 · " + " · ".join(names))

    print("\n─ 방식별 ─")
    print(f"  {'방식':<20}{'κ':>7}  {'':<24} {'있다 비율':>8}")
    kappas = []
    for m in methods:
        rows = [[preds[r][g]["present"][m] for r in names] for g in gids]
        k = binary_kappa(rows)
        prev = sum(sum(1 for x in r if x) for r in rows) / (len(rows) * len(names))
        if k is not None:
            kappas.append(k)
        ks = f"{k:.3f}" if k is not None else "  —  "
        print(f"  {m:<20}{ks:>7}  {bar(k if k is not None else 0)} {prev*100:6.0f}%")
    if kappas:
        print(f"\n  방식별 κ 평균 {sum(kappas)/len(kappas):.3f}"
              f"  (단일 선택일 때는 0.560 이었다)")

    print("\n─ 판정자끼리 얼마나 겹치는가 (Jaccard) ─")
    for a, b in itertools.combinations(names, 2):
        js = []
        for g in gids:
            A = {m for m in methods if preds[a][g]["present"][m]}
            B = {m for m in methods if preds[b][g]["present"][m]}
            if A | B:
                js.append(len(A & B) / len(A | B))
        print(f"  {a:<9}↔ {b:<9} {sum(js)/len(js):.2f}  {bar(sum(js)/len(js))}")

    print("\n─ ★ 활동을 걸 수 있는 자리 ─")
    unan, any_, per = [], [], Counter()
    for g in gids:
        sets = [{m for m in methods if preds[r][g]["present"][m]} for r in names]
        u = set.intersection(*sets)
        unan.append(len(u))
        any_.append(len(set.union(*sets)))
        for m in u:
            per[m] += 1
    n = len(gids)
    print(f"  지문당 '전원 있다' 방식   평균 {sum(unan)/n:.1f}개  (분포 {dict(sorted(Counter(unan).items()))})")
    print(f"  지문당 '누구든 있다' 방식 평균 {sum(any_)/n:.1f}개")
    zero = sum(1 for x in unan if x == 0)
    print(f"  전원 동의가 하나도 없는 지문 {zero}/{n}편"
          f"{'  ← 이런 지문은 앱이 근거 있는 활동을 못 낸다' if zero else '  ← 모든 지문이 활동을 걸 자리를 갖는다'}")
    print("\n  전원 동의로 가장 자주 잡힌 방식")
    for m, c in per.most_common():
        print(f"    {m:<20} {c:>2}/{n}  {bar(c/n)}")

    out = os.path.join(HERE, "out", "multi-summary.json")
    json.dump({"raters": names, "n": n,
               "unanimous_per_passage": unan,
               "mean_unanimous": sum(unan)/n,
               "unanimous_by_method": dict(per)},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n → out/multi-summary.json")


if __name__ == "__main__":
    main()
