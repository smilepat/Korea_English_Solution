# -*- coding: utf-8 -*-
"""
judge.py — Gemini 로 축 A(목적) · 축 B(전개 방식)를 판정한다.

정답지를 만드는 사람과 이 판정기는 서로를 보지 않는다.
판정기는 gold-labels.json 을 읽지 않고, 채점은 score.py 가 따로 한다.

사용: python scripts/judge.py [--model gemini-2.5-flash]
출력: out/pred-ai.json
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(HERE))
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def load_key():
    for name in (".env.local", ".env"):
        p = os.path.join(REPO, name)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding="utf-8", errors="ignore"):
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("GEMINI_API_KEY")


def build_prompt(tt, text):
    purposes = "\n".join(
        f'  - {p["id"]} · {p["name_ko"]} — {p["purpose_ko"]}' for p in tt["axis_a"]["purposes"])
    methods = "\n".join(
        f'  - {m["id"]} · {m["name_ko"]} — {m["gloss_ko"]}' for m in tt["axis_b"]["methods"])
    return f"""너는 한국 중·고등학교 영어 교사를 돕는 판정기다.
아래 영어 지문이 **무엇을 하려는 글인지(목적)** 와 **어떻게 펼쳐 가는지(전개 방식)** 를 판정한다.

두 축은 2022 개정 영어과 교육과정 고시가 직접 나열한 것이다. 이 목록 밖의 이름을 지어내지 마라.

[축 A · 목적] 하나만 고른다
{purposes}

[축 B · 전개 방식] 가장 두드러진 것 하나를 고른다
{methods}

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


def call(model, key, prompt, retries=3):
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }).encode()
    req = urllib.request.Request(
        API.format(model=model) + "?key=" + key, data=body,
        headers={"Content-Type": "application/json"})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                j = json.loads(r.read().decode())
            return j["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as e:
            detail = e.read().decode()[:200]
            if e.code in (429, 500, 503) and attempt < retries - 1:
                time.sleep(4 * (attempt + 1))
                continue
            raise SystemExit(f"Gemini {e.code}: {detail}")
        except Exception:
            if attempt < retries - 1:
                time.sleep(3)
                continue
            raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="gemini-2.5-flash")
    args = ap.parse_args()

    key = load_key()
    if not key:
        raise SystemExit("GEMINI_API_KEY 를 못 찾음 (.env.local 확인)")

    tt = json.load(open(os.path.join(HERE, "data", "text-types.json"), encoding="utf-8"))
    src = json.load(open(os.path.join(HERE, "data", "gold-set.json"), encoding="utf-8"))
    valid_p = {p["id"] for p in tt["axis_a"]["purposes"]}
    valid_m = {m["id"] for m in tt["axis_b"]["methods"]}

    preds, bad = [], 0
    for i, p in enumerate(src["passages"], 1):
        raw = call(args.model, key, build_prompt(tt, p["text"]))
        try:
            j = json.loads(re.search(r"\{[\s\S]*\}", raw).group(0))
        except Exception:
            j, bad = {}, bad + 1

        # 목록 밖 답은 버린다 — 지어낸 이름을 조용히 통과시키지 않는다
        purpose = j.get("purpose") if j.get("purpose") in valid_p else None
        method = j.get("method") if j.get("method") in valid_m else None
        second = j.get("second") if j.get("second") in valid_m else None

        # 근거가 지문에 실제로 있는지 결정론적으로 확인한다
        hay = " ".join(p["text"].split()).lower()
        ev = [e for e in (j.get("evidence") or []) if isinstance(e, str)]
        grounded = [e for e in ev if " ".join(e.split()).lower()[:60] in hay]

        preds.append({
            "gid": p["gid"], "purpose": purpose, "method": method, "second": second,
            "confidence": j.get("confidence"),
            "evidence": ev, "evidence_grounded": len(grounded), "evidence_total": len(ev),
            "off_list": bool(j) and (purpose is None or method is None),
        })
        print(f"  {p['gid']}  {purpose or '?':<14} {method or '?':<18} "
              f"근거 {len(grounded)}/{len(ev)}", flush=True)

    out = os.path.join(HERE, "out", "pred-ai.json")
    json.dump({"judge": "ai", "model": args.model, "predictions": preds},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    off = sum(1 for x in preds if x["off_list"])
    ung = sum(x["evidence_total"] - x["evidence_grounded"] for x in preds)
    tot = sum(x["evidence_total"] for x in preds)
    print(f"\n[judge] {len(preds)}편 · model={args.model} → out/pred-ai.json")
    print(f"  JSON 파싱 실패 : {bad}")
    print(f"  목록 밖 답     : {off}")
    print(f"  지문에 없는 근거: {ung}/{tot}")
    print(f"  되물음(ask)    : {sum(1 for x in preds if x['confidence'] == 'ask')}")


if __name__ == "__main__":
    main()
