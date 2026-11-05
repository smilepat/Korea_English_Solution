# -*- coding: utf-8 -*-
"""
raters.py — 서로 못 본 판정자 여럿에게 같은 30편을 보인다.

왜 이렇게 바꿨는가
  텍스트 유형에는 객관적 정답이 없다. 교사 한 분의 라벨도 '진실'이 아니라
  또 하나의 의견이다. 그래서 '정답을 맞혔는가' 대신 '서로 못 본 판정자들이
  같은 답에 모이는가'를 잰다.

  이 검사는 여전히 실패할 수 있다 —
  판정자들이 흩어지면 그 축은 글에서 안정적으로 읽히지 않는다는 뜻이고,
  그러면 정답지가 있든 없든 그 축으로 활동을 고를 수 없다.
  (다만 모인다고 해서 '맞다'는 뜻은 아니다. 다 같이 틀릴 수 있다.)

판정자를 진짜로 독립시키기 위해
  · 서로의 답을 보여 주지 않는다
  · 모델 계열을 섞는다 (Gemini 2.5 / Gemma 4 / Gemini 3.x)
  · 선택지 순서를 판정자마다 다르게 섞는다 — 목록 맨 위를 고르는 버릇을 깬다
  · 같은 모델을 순서만 바꿔 두 번 돌린다 (재검사) — 순서 때문에 답이 바뀌면
    그건 글을 읽은 게 아니라 목록을 읽은 것이다

사용:
  python scripts/raters.py                 # 전체 판정자
  python scripts/raters.py --only pro      # 하나만
"""
import argparse
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(HERE))
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# id, 모델, 선택지 섞기 seed
RATERS = [
    ("flash",     "gemini-2.5-flash", 101),
    ("pro",       "gemini-2.5-pro",   202),
    ("gemma",     "gemma-4-31b-it",   303),
    ("g38",       "gemini-3.8-flash", 404),
    ("flash-r2",  "gemini-2.5-flash", 999),   # 재검사 — 같은 모델, 순서만 다름
]


def load_key():
    for name in (".env.local", ".env"):
        p = os.path.join(REPO, name)
        if os.path.exists(p):
            for line in open(p, encoding="utf-8", errors="ignore"):
                if line.startswith("GEMINI_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("GEMINI_API_KEY")


def build_prompt(tt, text, seed):
    rng = random.Random(seed)
    purposes = tt["axis_a"]["purposes"][:]
    methods = tt["axis_b"]["methods"][:]
    rng.shuffle(purposes)
    rng.shuffle(methods)
    p_list = "\n".join(f'  - {p["id"]} · {p["name_ko"]} — {p["purpose_ko"]}' for p in purposes)
    m_list = "\n".join(f'  - {m["id"]} · {m["name_ko"]} — {m["gloss_ko"]}' for m in methods)
    return f"""너는 한국 중·고등학교 영어 교사를 돕는 판정기다.
아래 영어 지문이 **무엇을 하려는 글인지(목적)** 와 **어떻게 펼쳐 가는지(전개 방식)** 를 판정한다.

두 축은 2022 개정 영어과 교육과정 고시가 직접 나열한 것이다. 이 목록 밖의 이름을 지어내지 마라.
목록의 차례는 아무 뜻이 없다. 섞어 놓았다.

[축 A · 목적] 하나만 고른다
{p_list}

[축 B · 전개 방식] 가장 두드러진 것 하나를 고른다
{m_list}

판정 규칙
1. 난이도는 판정하지 않는다. 종류만 말한다.
2. 근거는 반드시 지문에 **그대로 있는 문장**을 인용한다. 바꿔 쓰지 마라.
3. 두 전개 방식이 비슷하게 강하면 confidence 를 "ask" 로 하고 second 에 나머지 하나를 적는다.
4. 오직 JSON 만 출력한다.

{{"purpose":"<축 A id>","method":"<축 B id>","second":"<축 B id 또는 null>",
  "confidence":"high"|"ask","evidence":["지문 원문 문장","지문 원문 문장"]}}

지문:
\"\"\"
{text}
\"\"\""""


def call(model, key, prompt, retries=4):
    cfg = {"temperature": 0}
    if not model.startswith("gemma"):          # gemma 는 responseMimeType 미지원
        cfg["responseMimeType"] = "application/json"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}],
                       "generationConfig": cfg}).encode()
    for attempt in range(retries):
        req = urllib.request.Request(API.format(model=model) + "?key=" + key, data=body,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                j = json.loads(r.read().decode())
            return j["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as e:
            detail = e.read().decode()[:160]
            if e.code in (429, 500, 503) and attempt < retries - 1:
                time.sleep(6 * (attempt + 1))
                continue
            print(f"    ! HTTP {e.code} {detail}", flush=True)
            return None
        except Exception as ex:
            if attempt < retries - 1:
                time.sleep(4)
                continue
            print(f"    ! {ex}", flush=True)
            return None


def run(rid, model, seed, tt, src, key, valid_p, valid_m):
    preds = []
    for p in src["passages"]:
        raw = call(model, key, build_prompt(tt, p["text"], seed))
        j = {}
        if raw:
            try:
                j = json.loads(re.search(r"\{[\s\S]*\}", raw).group(0))
            except Exception:
                j = {}
        hay = " ".join(p["text"].split()).lower()
        ev = [e for e in (j.get("evidence") or []) if isinstance(e, str)]
        preds.append({
            "gid": p["gid"],
            "purpose": j.get("purpose") if j.get("purpose") in valid_p else None,
            "method": j.get("method") if j.get("method") in valid_m else None,
            "second": j.get("second") if j.get("second") in valid_m else None,
            "confidence": j.get("confidence"),
            "evidence_grounded": sum(1 for e in ev if " ".join(e.split()).lower()[:60] in hay),
            "evidence_total": len(ev),
        })
        sys.stdout.write("."); sys.stdout.flush()
    print()
    out = os.path.join(HERE, "out", f"pred-{rid}.json")
    json.dump({"judge": rid, "model": model, "option_seed": seed, "predictions": preds},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    ok = sum(1 for x in preds if x["method"])
    ung = sum(x["evidence_total"] - x["evidence_grounded"] for x in preds)
    tot = sum(x["evidence_total"] for x in preds)
    print(f"  [{rid}] {model}  판정 {ok}/{len(preds)} · 없는 근거 {ung}/{tot} · "
          f"되물음 {sum(1 for x in preds if x['confidence']=='ask')}")
    return preds


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    args = ap.parse_args()

    key = load_key()
    if not key:
        raise SystemExit("GEMINI_API_KEY 없음")
    tt = json.load(open(os.path.join(HERE, "data", "text-types.json"), encoding="utf-8"))
    # GOLD_SET=gold-set-2.json SET_TAG=set2  →  data/gold-set-2.json 을 읽고 out/pred-<rid>.set2.json 에 쓴다
    src = json.load(open(os.path.join(HERE, "data", os.environ.get("GOLD_SET", "gold-set.json")), encoding="utf-8"))
    tag = os.environ.get("SET_TAG", "")
    valid_p = {p["id"] for p in tt["axis_a"]["purposes"]}
    valid_m = {m["id"] for m in tt["axis_b"]["methods"]}

    for rid, model, seed in RATERS:
        if args.only and args.only != rid:
            continue
        print(f"\n{rid} · {model} · 선택지 seed {seed}" + (f" · {tag}" if tag else ""))
        run(rid + (f".{tag}" if tag else ""), model, seed, tt, src, key, valid_p, valid_m)


if __name__ == "__main__":
    main()
