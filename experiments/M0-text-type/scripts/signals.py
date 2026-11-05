# -*- coding: utf-8 -*-
"""
signals.py — AI 없이 지문에서 표면 신호를 뽑아 축 A·축 B 를 1차 판정한다.

이 판정기는 똑똑하지 않다. 일부러 그렇다.
AI 판정과 나란히 두고 둘이 어긋나는 자리를 찾는 것이 목적이다.
(둘이 어긋나면 교사에게 되묻는다 — 이것이 M1 의 설계다.)

사용: python scripts/signals.py            → out/pred-signals.json
"""
import json
import os
import re
from collections import Counter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── 축 B · 전개 방식 표지 ─────────────────────────────────────
METHOD_CUES = {
    "classification":   [r"\btypes? of\b", r"\bcategor(?:y|ies|ize[sd]?)\b", r"\bclassif(?:y|ied|ication)\b",
                         r"\b(?:two|three|four|several) (?:kinds?|types?|groups?)\b", r"\bfalls? into\b"],
    "cause_effect":     [r"\bbecause\b", r"\btherefore\b", r"\bas a result\b", r"\bconsequently\b",
                         r"\bleads? to\b", r"\bcauses?\b", r"\bresults? in\b", r"\bdue to\b", r"\bthus\b"],
    "definition":       [r"\bis defined as\b", r"\brefers? to\b", r"\bis known as\b", r"\bmeans that\b",
                         r"\bis a (?:kind|type|form) of\b", r"\bthat is to say\b", r"\bis called\b"],
    "elaboration":      [r"\bin other words\b", r"\bmore specifically\b", r"\bthat is,", r"\bin particular\b",
                         r"\bindeed\b", r"\bin fact\b"],
    "exemplification":  [r"\bfor example\b", r"\bfor instance\b", r"\bsuch as\b", r"\bconsider\b",
                         r"\be\.g\.", r"\bto illustrate\b", r"\bimagine\b"],
    "comparison":       [r"\bsimilarly\b", r"\blikewise\b", r"\bin the same way\b", r"\bjust as\b",
                         r"\bboth\b.*\band\b", r"\bas .{3,20} as\b"],
    "contrast":         [r"\bhowever\b", r"\bin contrast\b", r"\bwhereas\b", r"\bunlike\b",
                         r"\bon the other hand\b", r"\bnevertheless\b", r"\byet\b", r"\brather than\b",
                         r"\bdespite\b", r"\bwhile .{3,40}, "],
    "problem_solution": [r"\bproblems?\b", r"\bsolutions?\b", r"\bsolve[sd]?\b", r"\bchallenges?\b",
                         r"\bto address (?:this|the)\b", r"\bone way to\b", r"\bhow (?:can|do) we\b"],
}
TIME_CUES = [r"\bone day\b", r"\byears? (?:ago|later)\b", r"\bthen\b", r"\bfinally\b", r"\bafter(?:wards)?\b",
             r"\bthe next (?:day|morning|year)\b", r"\bwhen (?:he|she|they|i)\b", r"\bat last\b",
             r"\b(?:in|by) (?:1[6-9]|20)\d{2}\b"]
IRREG_PAST = {"was", "were", "had", "did", "said", "went", "came", "saw", "took", "got", "made",
              "knew", "thought", "found", "told", "began", "felt", "left", "put", "ran", "held",
              "brought", "wrote", "gave", "stood", "heard", "kept", "sat", "grew", "became"}

# ── 축 A · 목적 표지 ─────────────────────────────────────────
PURPOSE_CUES = {
    "social":        [r"^\s*dear\b", r"\bi am writing\b", r"\bsincerely\b", r"\bbest regards\b",
                      r"\blooking forward to hearing\b", r"\byours truly\b", r"\bthank you for your\b"],
    "informative":   [r"\bwill be held\b", r"\bplease (?:note|visit|contact|bring|register)\b",
                      r"\bregistration\b", r"\bdeadline\b", r"\badmission\b", r"\bfee\b",
                      r"\bopen(?:ing)? hours?\b", r"\bfor more information\b", r"\bdo not\b"],
    "argumentative": [r"\bshould\b", r"\bmust\b", r"\bwe need to\b", r"\bit is (?:important|essential|necessary)\b",
                      r"\bargue[sd]?\b", r"\bclaim[sd]?\b", r"\bmisconception\b", r"\bin my (?:view|opinion)\b"],
}


def sentences(t):
    return [s for s in re.split(r"(?<=[.!?])\s+", t.strip()) if s]


def count(pats, t):
    return sum(len(re.findall(p, t, re.I | re.M)) for p in pats)


def analyze(text):
    t = " ".join(text.split())
    low = t.lower()
    toks = re.findall(r"[a-z][a-z'-]*", low)
    sents = sentences(t)
    n_w, n_s = len(toks), max(1, len(sents))

    past = sum(1 for w in toks if w in IRREG_PAST or (w.endswith("ed") and len(w) > 4))
    feats = {
        "words": n_w,
        "sentences": len(sents),
        "words_per_sentence": round(n_w / n_s, 1),
        "longest_sentence_words": max((len(re.findall(r"[a-z'-]+", s.lower())) for s in sents), default=0),
        "past_ratio": round(past / max(1, n_w), 3),
        "first_person": count([r"\bi\b", r"\bmy\b", r"\bwe\b", r"\bour\b"], low),
        "second_person": count([r"\byou\b", r"\byour\b"], low),
        "quotes": t.count('"') + t.count("“"),
        "imperatives": sum(1 for s in sents if re.match(r"^(please\s+)?[a-z]+\b", s.strip(), re.I)
                           and re.match(r"^(please|do|don't|visit|bring|join|check|note|register|come|see)\b",
                                        s.strip(), re.I)),
        "numbers": len(re.findall(r"\b\d+(?:[.,]\d+)?\b", t)),
        "time_cues": count(TIME_CUES, low),
        "proper_nouns": len(set(re.findall(r"(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}\b", t))),
    }
    method_hits = {m: count(p, low) for m, p in METHOD_CUES.items()}
    # 서사는 어휘 표지가 아니라 '사람이 겪은 일이 시간 순으로 이어지는가'로 잡는다.
    # 과거시제만 세면 학술문("researchers found…")이 전부 서사로 잡힌다 —
    # 그래서 등장인물(3인칭 대명사·고유명사)이 있을 때만 점수를 준다.
    feats["third_person"] = count([r"\bhe\b", r"\bshe\b", r"\bhis\b", r"\bher\b", r"\bthey\b"], low)
    has_participants = feats["third_person"] >= 4 or feats["proper_nouns"] >= 3 or feats["quotes"] >= 2
    method_hits["narration"] = (
        ((2 if feats["past_ratio"] > 0.12 else 0)
         + min(2, feats["time_cues"])
         + (2 if feats["quotes"] >= 2 else 0))
        if has_participants else 0
    )

    purpose_hits = {k: count(p, low) for k, p in PURPOSE_CUES.items()}
    purpose_hits["narrative"] = method_hits["narration"]
    if feats["second_person"] >= 3 and purpose_hits["social"] > 0:
        purpose_hits["social"] += 2
    purpose_hits["informative"] += feats["imperatives"] + (1 if feats["numbers"] >= 4 else 0)

    top_m = max(method_hits.items(), key=lambda kv: kv[1])
    top_p = max(purpose_hits.items(), key=lambda kv: kv[1])
    ranked_m = sorted(method_hits.items(), key=lambda kv: -kv[1])

    # 1등과 2등이 붙어 있으면 확신하지 않는다
    margin = ranked_m[0][1] - ranked_m[1][1] if len(ranked_m) > 1 else 0
    confident = top_m[1] >= 2 and margin >= 2

    return {
        "features": feats,
        "method_hits": method_hits,
        "purpose_hits": purpose_hits,
        "method": top_m[0] if top_m[1] > 0 else None,
        "method_runner_up": ranked_m[1][0] if len(ranked_m) > 1 and ranked_m[1][1] > 0 else None,
        "purpose": top_p[0] if top_p[1] > 0 else None,
        "confident": confident,
    }


def main():
    src = json.load(open(os.path.join(HERE, "data", "gold-set.json"), encoding="utf-8"))
    preds = []
    for p in src["passages"]:
        a = analyze(p["text"])
        preds.append({"gid": p["gid"], "purpose": a["purpose"], "method": a["method"],
                      "method_runner_up": a["method_runner_up"], "confident": a["confident"],
                      "features": a["features"], "method_hits": a["method_hits"]})
    out = os.path.join(HERE, "out", "pred-signals.json")
    json.dump({"judge": "signals", "predictions": preds}, open(out, "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print(f"[signals] {len(preds)}편 판정 → out/pred-signals.json")
    print("  전개 방식 분포:", dict(Counter(p["method"] for p in preds)))
    print("  목적 분포     :", dict(Counter(p["purpose"] for p in preds)))
    print("  확신 있음     :", sum(1 for p in preds if p["confident"]), "/", len(preds))


if __name__ == "__main__":
    main()
