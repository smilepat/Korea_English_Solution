# -*- coding: utf-8 -*-
"""
build_gold_set_3.py — 3차 표본: 실제 교과서 공개 견본 지문 (미래엔·NE능률)

출처
  2026-09-13 Fable 5 조사 에이전트가 출판사 공개 견본(로그인 없음)에서 텍스트로 얻은 9편.
  미래엔 22txbook 샘플 e-book(중1 Unit1 · 공통영어1 L3 · 영어I L1) 6편,
  NE능률 NE Teacher 공개 자료실 '본문 텍스트.hwp' (공통영어1 민·오 L1) 2편 + 1편.

이용 조건
  출판사 공개 견본에서 측정용 소량 인용. 저작권은 출판사·저자. 재배포 금지.
  → 본문(gold-set-3.json)은 저장소에 넣지 않는다. 출처·제목만 gold-set-3-ids.json 에 남긴다.

입력: 스크래치패드 passages.txt  ('#### Pn | 출처 | 제목' 머리글 + 본문)
출력: data/gold-set-3.json · data/gold-set-3-ids.json
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.environ.get("LOCALAPPDATA", ""), "Temp", "claude", "C--Users-eltko",
    "32a2a6f3-e7b2-4662-84da-d219e8081925", "scratchpad", "passages.txt")


def words(t):
    return len(re.findall(r"[A-Za-z][A-Za-z'-]*", t))


def main():
    raw = open(SRC, encoding="utf-8").read()
    blocks = re.split(r"^#### ", raw, flags=re.M)
    passages, ids = [], []
    for b in blocks:
        b = b.strip()
        if not b:
            continue
        head, _, body = b.partition("\n")
        parts = [p.strip() for p in head.split("|")]
        pid, source, title = (parts + ["", ""])[:3]
        # 절 제목 굵게 표시(**…**)와 인용 기호는 본문이 아니다
        body = re.sub(r"^\s*>\s?", "", body, flags=re.M)
        body = body.replace("**", "")
        text = " ".join(body.split())
        gid = f"T{len(passages) + 1:02d}"
        passages.append({"gid": gid, "words": words(text), "text": text})
        ids.append({"gid": gid, "agent_id": pid, "source": source, "title": title, "words": words(text)})

    d = os.path.join(HERE, "data")
    json.dump({"n": len(passages), "source": "출판사 공개 견본 (미래엔 22txbook · NE Teacher)", "passages": passages},
              open(os.path.join(d, "gold-set-3.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump({"_note": "실제 교과서 견본. 본문은 gold-set-3.json (gitignore). 출판사 공개 견본에서 측정용 소량 인용, 재배포 금지.",
               "labels": ids},
              open(os.path.join(d, "gold-set-3-ids.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"[gold-set-3] {len(passages)}편")
    for x in ids:
        flag = "  ← 60낱말 미만" if x["words"] < 60 else ""
        print(f"  {x['gid']} {x['words']:>4}w  {x['source'][:34]:<34} {x['title'][:40]}{flag}")


if __name__ == "__main__":
    main()
