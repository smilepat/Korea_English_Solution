# -*- coding: utf-8 -*-
"""
compare_sets.py — 표본 넷을 한 표에 놓는다.

묻는 것: 축 A(목적)의 낮은 κ 가 축의 한계였나, 수능 기출 표본의 한계였나.
표본마다 같은 판정자·같은 프롬프트·같은 순서 섞기로 잰 것을 나란히 둔다.

  set1  수능 기출 (aku)              30편  친교 0
  set2  KES 청정 창작지문            30편  편지 8 · 안내 7
  set3  실제 교과서 공개 견본        9편
  set4  개방 라이선스(VOA·NPS…)      27편  친교 9

사용: python scripts/compare_sets.py
"""
import itertools
import json
import os
from collections import Counter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "out")
SETS = [("set1", "", "수능 기출"), ("set2", "set2", "KES 청정"), ("set3", "set3", "교과서 견본"), ("set4", "set4", "개방 자료")]
SINGLE = ["flash", "pro", "g38"]
MULTI = ["m-flash", "m-pro", "m-g38"]


def load(prefix, rid, tag):
    p = os.path.join(OUT, f"{prefix}-{rid}{('.' + tag) if tag else ''}.json")
    if not os.path.exists(p):
        return None
    return {x["gid"]: x for x in json.load(open(p, encoding="utf-8"))["predictions"]}


def fleiss(rows):
    rows = [r for r in rows if all(r)]
    if len(rows) < 2:
        return None
    N, n = len(rows), len(rows[0])
    cats = {c for r in rows for c in r}
    if len(cats) < 2:
        return 1.0
    col = Counter()
    P = []
    for r in rows:
        cnt = Counter(r); col.update(r)
        P.append((sum(v * v for v in cnt.values()) - n) / (n * (n - 1)))
    Pe = sum((col[c] / (N * n)) ** 2 for c in cats)
    return None if Pe >= 1 else (sum(P) / N - Pe) / (1 - Pe)


def unanimity(rows):
    rows = [r for r in rows if all(r)]
    return sum(1 for r in rows if len(set(r)) == 1), len(rows)


def fmt(k):
    return "  —  " if k is None else f"{k:5.3f}"


def main():
    print("=" * 78)
    print(" 표본 넷 · 같은 판정자 3인(flash·pro·g38) · Fleiss κ · 합격선 0.67")
    print("=" * 78)
    hdr = f"{'표본':<12}{'n':>3}  {'축A 목적':>9}  {'축B 직접':>9}  {'축B 대표':>9}  {'대표 만장일치':>10}  {'재검사(대표)':>10}"
    print(hdr)
    print("-" * len(hdr))
    for key, tag, name in SETS:
        S = {r: load("pred", r, tag) for r in SINGLE}
        M = {r: load("multi", r, tag) for r in MULTI}
        if not all(S.values()) or not all(M.values()):
            print(f"{name:<12}  (아직 없음)")
            continue
        gids = sorted(S["flash"])
        kA = fleiss([[S[r][g]["purpose"] for r in SINGLE] for g in gids])
        kB = fleiss([[S[r][g]["method"] for r in SINGLE] for g in gids])
        kD = fleiss([[M[r][g]["dominant"] for r in MULTI] for g in gids])
        u, n = unanimity([[M[r][g]["dominant"] for r in MULTI] for g in gids])
        r2 = load("multi", "m-flash-r2", tag)
        rt = (sum(1 for g in gids if r2[g]["dominant"] == M["m-flash"][g]["dominant"]), len(gids)) if r2 else None
        rts = f"{rt[0]:>2}/{rt[1]:<2} ({rt[0]/rt[1]*100:3.0f}%)" if rt else "   —"
        print(f"{name:<12}{len(gids):>3}  {fmt(kA):>9}  {fmt(kB):>9}  {fmt(kD):>9}  {u:>4}/{n:<2}       {rts}")

    # 축 A 갈림의 정체 — 표본마다 어느 짝에서 갈리나
    print("\n축 A 에서 갈린 짝 (표본별)")
    for key, tag, name in SETS:
        S = {r: load("pred", r, tag) for r in SINGLE}
        if not all(S.values()):
            continue
        gids = sorted(S["flash"])
        conf = Counter()
        dist = Counter()
        for g in gids:
            labs = sorted({S[r][g]["purpose"] for r in SINGLE if S[r][g]["purpose"]})
            for a, b in itertools.combinations(labs, 2):
                conf[(a, b)] += 1
            for r in SINGLE:
                dist[S[r][g]["purpose"]] += 1
        top = " · ".join(f"{a}↔{b} {c}" for (a, b), c in conf.most_common(3)) or "없음"
        share = {k: round(v / (3 * len(gids)) * 100) for k, v in dist.items() if k}
        print(f"  {name:<12} 갈림 {top}")
        print(f"  {'':<12} 판정 분포(%) {share}")


if __name__ == "__main__":
    main()
