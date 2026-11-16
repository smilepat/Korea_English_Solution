# -*- coding: utf-8 -*-
"""
raters_multi.py — 질문을 바꿔 다시 묻는다.

단일 선택 판정이 흔들린 이유를 이렇게 본다.
  한 지문에 인과도 있고 예시도 있는데 "하나만 고르라"고 하니
  판정자가 매번 다른 것을 고른다. 분류 체계가 틀린 게 아니라 질문이 틀렸다.

그래서 묻는 법을 바꾼다.
  전(前)  "이 글의 전개 방식은 9개 중 무엇인가"        → 하나 고르기
  후(後)  "이 글에 이 전개 방식이 쓰였는가"  × 9개      → 각각 예/아니오

앱에도 이쪽이 맞다. 앱이 필요한 것은 '이 글의 정체' 하나가 아니라
'이 글로 어떤 활동을 걸 수 있는가' 여럿이기 때문이다.
인과와 예시가 둘 다 있으면 활동도 둘 다 걸면 된다.

사용: python scripts/raters_multi.py
출력: out/multi-<rater>.json
"""
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

RATERS = [
    ("m-flash", "gemini-2.5-flash", 111),
    ("m-pro",   "gemini-2.5-pro",   222),
    ("m-g38",   "gemini-3.8-flash", 333),
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
    methods = tt["axis_b"]["methods"][:]
    random.Random(seed).shuffle(methods)
    lines = "\n".join(f'  - {m["id"]} · {m["name_ko"]} — {m["gloss_ko"]}' for m in methods)
    return f"""너는 한국 중·고등학교 영어 교사를 돕는 판정기다.
아래 영어 지문에 각각의 전개 방식이 **쓰였는지 아닌지**를 하나씩 판정한다.
하나만 고르는 것이 아니다. 여러 개가 함께 쓰였으면 여러 개가 모두 true 다.

전개 방식 (2022 개정 영어과 교육과정 고시가 나열한 것. 차례는 섞어 놓았고 아무 뜻이 없다)
{lines}

판정 규칙
1. "글 전체가 그 방식이다"가 아니라 **"그 방식이 이 글 안에서 실제로 쓰였다"**면 true 다.
   다만 한 문장 스치듯 나온 것은 false 로 한다 — 그 방식으로 수업 활동 하나를
   만들 수 있을 만큼 재료가 있어야 true 다.
2. true 인 것은 반드시 지문에 **그대로 있는 문장**을 근거로 댄다. 바꿔 쓰지 마라.
3. 난이도는 판정하지 않는다.
4. 오직 JSON 만 출력한다. 9개 전부에 답한다.

{{"methods":{{"<id>":{{"present":true,"evidence":"지문 원문 문장"}},
              "<id>":{{"present":false,"evidence":null}}, ...}},
  "dominant":"<가장 두드러진 id>"}}

지문:
\"\"\"
{text}
\"\"\""""


def call(model, key, prompt, retries=4):
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }).encode()
    for attempt in range(retries):
        req = urllib.request.Request(API.format(model=model) + "?key=" + key, data=body,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=150) as r:
                j = json.loads(r.read().decode())
            return j["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as e:
            e.read()
            if e.code in (429, 500, 503) and attempt < retries - 1:
                time.sleep(6 * (attempt + 1)); continue
            return None
        except Exception:
            if attempt < retries - 1:
                time.sleep(4); continue
            return None


def main():
    key = load_key()
    tt = json.load(open(os.path.join(HERE, "data", "text-types.json"), encoding="utf-8"))
    # GOLD_SET=gold-set-2.json SET_TAG=set2  →  data/gold-set-2.json 을 읽고 out/multi-<rid>.set2.json 에 쓴다
    src = json.load(open(os.path.join(HERE, "data", os.environ.get("GOLD_SET", "gold-set.json")), encoding="utf-8"))
    tag = os.environ.get("SET_TAG", "")
    ids = [m["id"] for m in tt["axis_b"]["methods"]]

    for rid, model, seed in RATERS:
        rid = rid + (f".{tag}" if tag else "")
        print(f"\n{rid} · {model}")
        preds = []
        for p in src["passages"]:
            raw = call(model, key, build_prompt(tt, p["text"], seed))
            j = {}
            if raw:
                try:
                    j = json.loads(re.search(r"\{[\s\S]*\}", raw).group(0))
                except Exception:
                    j = {}
            ms = j.get("methods") or {}
            hay = " ".join(p["text"].split()).lower()
            present, grounded, total = {}, 0, 0
            for mid in ids:
                cell = ms.get(mid) or {}
                on = bool(cell.get("present")) if isinstance(cell, dict) else bool(cell)
                present[mid] = on
                ev = cell.get("evidence") if isinstance(cell, dict) else None
                if on and isinstance(ev, str) and ev.strip():
                    total += 1
                    if " ".join(ev.split()).lower()[:60] in hay:
                        grounded += 1
            preds.append({"gid": p["gid"], "present": present,
                          "dominant": j.get("dominant") if j.get("dominant") in ids else None,
                          "n_present": sum(present.values()),
                          "evidence_grounded": grounded, "evidence_total": total,
                          "ok": bool(ms)})
            sys.stdout.write("." if ms else "x"); sys.stdout.flush()
        print()
        out = os.path.join(HERE, "out", f"multi-{rid}.json")
        json.dump({"judge": rid, "model": model, "option_seed": seed, "methods": ids,
                   "predictions": preds}, open(out, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        ok = sum(1 for x in preds if x["ok"])
        avg = sum(x["n_present"] for x in preds if x["ok"]) / max(1, ok)
        ung = sum(x["evidence_total"] - x["evidence_grounded"] for x in preds)
        tot = sum(x["evidence_total"] for x in preds)
        print(f"  판정 {ok}/{len(preds)} · 지문당 평균 {avg:.1f}개 방식 · 없는 근거 {ung}/{tot}")


if __name__ == "__main__":
    main()

# 재검사용 — 같은 모델, 선택지 순서만 다르게 한 번 더
RETEST = [("m-flash-r2", "gemini-2.5-flash", 777)]
