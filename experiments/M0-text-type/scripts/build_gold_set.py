# -*- coding: utf-8 -*-
"""
build_gold_set.py — K1 킬 실험용 지문 30편 표본 추출

원칙
  · 표본은 aku 의 기출 지문(origin='exam')에서만 뽑는다. 생성 지문은 제외한다.
  · aku 의 representation 라벨은 fable-5(AI)가 붙인 것이므로 정답이 아니다.
    유형이 한쪽으로 쏠리지 않게 '층화 추출의 기준'으로만 쓰고, 라벨 자체는
    labeling sheet 에 절대 내보내지 않는다.
  · seed 고정 — 다시 돌려도 같은 30편이 나온다.

출력
  data/gold-set.json          사람이 라벨을 붙일 30편 (라벨 없음)
  data/gold-set-hidden.json   aku 의 AI 라벨 (채점 때만 연다)
"""
import json
import os
import random
import re
import sqlite3

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AKU_DB = r"C:\tmp\aku\db\aku.db"
SEED = 20260912
TARGET = 30

# aku 임시 라벨별 할당량 — 유형이 골고루 섞이게 한다
QUOTA = {
    "R-NARRATIVE": 5,
    "R-DESCRIPTION": 6,
    "R-ARGUMENT": 6,
    "R-EXPLANATION": 6,
    "R-EXPERIMENT": 2,
    "R-EXAMPLE": 2,
    "R-HISTORICAL": 2,
    "R-ANALOGY": 1,
}


def words(t):
    return len(re.findall(r"[A-Za-z][A-Za-z'-]*", t))


def main():
    if not os.path.exists(AKU_DB):
        raise SystemExit("aku.db 없음: " + AKU_DB)

    con = sqlite3.connect(AKU_DB)
    rows = con.execute(
        "SELECT id, representation_id, text FROM passages "
        "WHERE origin='exam' AND text IS NOT NULL AND representation_id IS NOT NULL"
    ).fetchall()
    con.close()

    by_rep = {}
    for pid, rep, text in rows:
        t = " ".join(text.split())
        if not (60 <= words(t) <= 400):      # 교실에서 한 차시에 쓸 만한 길이만
            continue
        by_rep.setdefault(rep, []).append((pid, t))

    rng = random.Random(SEED)
    picked = []
    for rep, n in QUOTA.items():
        pool = sorted(by_rep.get(rep, []))
        if len(pool) < n:
            print(f"  ! {rep}: 후보 {len(pool)}편뿐 — {len(pool)}편만 뽑음")
            n = len(pool)
        picked += [(rep, pid, t) for pid, t in rng.sample(pool, n)]

    rng.shuffle(picked)                       # 라벨 순서로 배열되지 않게 섞는다

    sheet, hidden = [], []
    for i, (rep, pid, t) in enumerate(picked, 1):
        gid = f"G{i:02d}"
        sheet.append({"gid": gid, "words": words(t), "text": t})
        hidden.append({"gid": gid, "aku_passage_id": pid, "aku_representation": rep})

    d = os.path.join(HERE, "data")
    with open(os.path.join(d, "gold-set.json"), "w", encoding="utf-8") as f:
        json.dump({"seed": SEED, "n": len(sheet), "passages": sheet}, f, ensure_ascii=False, indent=2)
    with open(os.path.join(d, "gold-set-hidden.json"), "w", encoding="utf-8") as f:
        json.dump({"_warning": "AI(fable-5) 라벨. 정답 아님. 채점 때 비교용으로만 연다.",
                   "labels": hidden}, f, ensure_ascii=False, indent=2)

    print(f"[gold-set] {len(sheet)}편 · seed={SEED}")
    print("  낱말수 분포:", sorted(p["words"] for p in sheet))


if __name__ == "__main__":
    main()
