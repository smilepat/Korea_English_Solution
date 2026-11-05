# -*- coding: utf-8 -*-
"""
score.py — K1 채점.

정답지(data/gold-labels.json)가 있으면 그것과 대조해 **K1 결과**를 낸다.
없으면 판정기끼리 얼마나 같은 답을 내는지만 보여 준다.
판정기끼리의 일치는 정확도가 아니다 — 셋 다 같이 틀릴 수 있다.

합격선: 축 B 24/30 (80%). 못 넘으면 M0 에서 멈춘다.

사용: python scripts/score.py
"""
import json
import os
from collections import Counter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASS_MARK = 24
N = 30

# aku(fable-5) 라벨 → 고시 전개 방식. 대응이 분명한 것만 옮긴다.
# 나머지는 '옮길 수 없음'으로 둔다 — 억지로 맞추면 비교가 거짓이 된다.
AKU_MAP = {
    "R-NARRATIVE": "narration",
    "R-HISTORICAL": "narration",
    "R-EXAMPLE": "exemplification",
    "R-ANALOGY": "comparison",
    "R-EXPERIMENT": "cause_effect",
    # R-EXPLANATION · R-ARGUMENT · R-DESCRIPTION 은 고시의 전개 방식 9종 중
    # 어느 하나에 대응하지 않는다(장르와 전개 방식을 섞은 축이기 때문).
}


def load(name):
    p = os.path.join(HERE, "data", name)
    if not os.path.exists(p):
        p = os.path.join(HERE, "out", name)
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else None


def agree(a, b):
    """둘 다 값이 있는 항목만 비교. (맞은 수, 견준 수)"""
    pairs = [(x, y) for x, y in zip(a, b) if x and y]
    return sum(1 for x, y in pairs if x == y), len(pairs)


def bar(hit, total, width=28):
    if not total:
        return ""
    f = int(round(width * hit / total))
    return "█" * f + "·" * (width - f)


def main():
    sig = {p["gid"]: p for p in load("pred-signals.json")["predictions"]}
    ai = {p["gid"]: p for p in load("pred-ai.json")["predictions"]}
    hidden = {x["gid"]: x for x in load("gold-set-hidden.json")["labels"]}
    goldf = load("gold-labels.json")
    gids = sorted(ai)

    print("=" * 64)
    print(" K1 · 유형 판정이 맞는가")
    print("=" * 64)

    if not goldf:
        print("\n  ⚠ 정답지(data/gold-labels.json)가 아직 없습니다.")
        print("    out/labeling-sheet.html 로 30편에 라벨을 붙인 뒤 다시 돌리세요.")
        print("    아래는 K1 결과가 아니라 '판정기끼리 얼마나 같은 답을 내는가'입니다.\n")

        for axis, key in (("목적  (축 A)", "purpose"), ("전개 방식 (축 B)", "method")):
            h, n = agree([sig[g][key] for g in gids], [ai[g][key] for g in gids])
            print(f"  {axis:<18} 신호 ↔ AI   {h:>2}/{n:<2}  {bar(h, n)}")

        h, n = agree([AKU_MAP.get(hidden[g]["aku_representation"]) for g in gids],
                     [ai[g]["method"] for g in gids])
        print(f"  {'전개 방식 (축 B)':<18} aku ↔ AI   {h:>2}/{n:<2}  {bar(h, n)}"
              f"   ← 옮길 수 있는 {n}편만")
        unmappable = sum(1 for g in gids if hidden[g]["aku_representation"] not in AKU_MAP)
        print(f"\n  aku 8종 중 고시 9종으로 옮길 수 없는 지문: {unmappable}/{len(gids)}편")
        print("  → 두 축은 같은 종류의 축이 아니다. aku 는 장르와 전개 방식을 섞어 놓았다.")
        print(f"\n  AI 가 스스로 되물음 표시한 지문: "
              f"{sum(1 for g in gids if ai[g]['confidence'] == 'ask')}/{len(gids)}")
        print(f"  신호 판정기가 확신한 지문      : "
              f"{sum(1 for g in gids if sig[g]['confident'])}/{len(gids)}")
        return

    gold = {x["gid"]: x for x in goldf["labels"]}
    labeled = [g for g in gids if gold.get(g, {}).get("method")]
    print(f"\n  정답지: {len(labeled)}/{len(gids)}편 라벨 완료"
          f" · 애매 표시 {sum(1 for g in labeled if gold[g].get('ambiguous'))}편\n")

    results = {}
    for name, pred in (("신호", sig), ("AI", ai)):
        for axis, key in (("목적", "purpose"), ("전개", "method")):
            h, n = agree([gold[g][key] for g in labeled], [pred[g][key] for g in labeled])
            results[(name, axis)] = (h, n)
            print(f"  {axis} · {name:<4} {h:>2}/{n:<2}  {bar(h, n)}  {h/n*100 if n else 0:5.1f}%")

    # 2순위까지 인정하면 얼마나 오르는가 — 되물음 설계의 값어치
    h2 = sum(1 for g in labeled
             if gold[g]["method"] in {ai[g]["method"], ai[g].get("second")})
    print(f"\n  전개 · AI 1·2순위 안  {h2:>2}/{len(labeled):<2}  {bar(h2, len(labeled))}"
          f"  {h2/len(labeled)*100:5.1f}%   ← 교사에게 둘을 보여 주고 고르게 할 때")

    hit, n = results[("AI", "전개")]
    print("\n" + "-" * 64)
    verdict = "통과" if hit >= PASS_MARK else "미달"
    print(f"  판정: 축 B {hit}/{n}  (합격선 {PASS_MARK}/{N})  →  {verdict}")
    if hit < PASS_MARK:
        print("  M0 에서 멈춘다. 축을 다시 짜기 전에는 M1 로 가지 않는다.")
    print("-" * 64)

    wrong = [g for g in labeled if gold[g]["method"] != ai[g]["method"]]
    if wrong:
        print("\n  틀린 자리 (정답 → AI):")
        for g in wrong:
            amb = " ·애매" if gold[g].get("ambiguous") else ""
            note = f"  {gold[g]['note']}" if gold[g].get("note") else ""
            print(f"    {g}  {gold[g]['method']:<18} → {ai[g]['method']:<18}"
                  f"{'(2순위 적중)' if gold[g]['method'] == ai[g].get('second') else ''}{amb}{note}")
        print("\n  자주 헷갈린 짝:", dict(Counter(
            (gold[g]["method"], ai[g]["method"]) for g in wrong).most_common(5)))


if __name__ == "__main__":
    main()
