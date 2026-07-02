"""
EquScore — batch headline sentiment (Arabic + English).
Real NLP instead of the English-only lexicon (research §4, T1.1): Cohere Command R+
is strong on Arabic, which the old keyword list couldn't read at all. One batched
call classifies many headlines at once, so it's quota-friendly.

Priority: Cohere → Groq → English lexicon fallback (never crashes, never blocks a fetch).
Returns a list of 'positive' | 'negative' | 'neutral' aligned to the input titles.
"""
import json
import os
import re
import urllib.request

_HERE = os.path.dirname(os.path.abspath(__file__))
_ENV = os.path.join(_HERE, "..", ".env")
_env = {}
try:
    for _l in open(_ENV, encoding="utf-8"):
        _l = _l.strip()
        if _l and not _l.startswith("#") and "=" in _l:
            _k, _v = _l.split("=", 1); _env[_k.strip()] = _v.strip()
except Exception:
    pass
COHERE_KEY = _env.get("cohere_api_key", "")
GROQ_KEY = _env.get("AI_API_KEY", "") or _env.get("GROQ_API_KEY", "")

POS = set("""profit profits growth grow surge surged surges jump jumps jumped rise rises rose gain gains gained
beat beats record high highs upgrade upgraded dividend dividends expansion expand wins win won awarded award contract
approval approved strong soar soared rally rallied boost boosted raises raised outperform buyback acquire acquisition
upbeat optimistic recovery rebound milestone partnership deal launch""".split())
NEG = set("""loss losses decline declines declined fall falls fell drop drops dropped plunge plunged plunges miss misses
missed cut cuts downgrade downgraded weak weakness warning warn warns fraud probe lawsuit sue resign resigns resigned
delay delays delayed halt halted suspend suspended slump slumped fears fear risk risks default fine fined penalty
investigation scandal writedown impairment bankruptcy debt-laden downturn slowdown""".split())


def _lexicon(title):
    words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", title.lower())
    p = sum(1 for w in words if w in POS)
    n = sum(1 for w in words if w in NEG)
    return "positive" if p > n else "negative" if n > p else "neutral"


def _norm(v):
    v = str(v).strip().lower()
    if v.startswith("pos"): return "positive"
    if v.startswith("neg"): return "negative"
    return "neutral"


def _cohere_batch(titles):
    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(titles))
    prompt = ("Classify the market sentiment of each numbered financial headline (Arabic or English) "
              "toward the company/market it mentions as positive, negative, or neutral. "
              "Reply ONLY with a JSON array of strings in the same order, e.g. [\"positive\",\"neutral\",...]. "
              f"No prose.\n\n{numbered}")
    body = json.dumps({"model": "command-r-plus-08-2024",
                       "messages": [{"role": "user", "content": prompt}],
                       "temperature": 0}).encode("utf-8")
    req = urllib.request.Request("https://api.cohere.com/v2/chat", data=body,
                                 headers={"Authorization": f"Bearer {COHERE_KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read())
    txt = "".join(p.get("text", "") for p in (d.get("message", {}).get("content") or []))
    arr = json.loads(re.search(r"\[.*\]", txt, re.S).group(0))
    return [_norm(x) for x in arr]


def _groq_batch(titles):
    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(titles))
    prompt = ("Classify each numbered financial headline's sentiment as positive, negative, or neutral. "
              "Reply ONLY a JSON array of strings in order.\n\n" + numbered)
    body = json.dumps({"model": "llama-3.3-70b-versatile",
                       "messages": [{"role": "user", "content": prompt}],
                       "temperature": 0}).encode("utf-8")
    req = urllib.request.Request("https://api.groq.com/openai/v1/chat/completions", data=body,
                                 headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read())
    txt = d["choices"][0]["message"]["content"]
    arr = json.loads(re.search(r"\[.*\]", txt, re.S).group(0))
    return [_norm(x) for x in arr]


def classify_titles(titles, chunk=60):
    """Batch-classify headlines. Cohere → Groq → lexicon. Always returns len(titles)."""
    titles = [str(t or "") for t in titles]
    if not titles:
        return []
    out = []
    for i in range(0, len(titles), chunk):
        part = titles[i:i + chunk]
        got = None
        for fn, key in ((_cohere_batch, COHERE_KEY), (_groq_batch, GROQ_KEY)):
            if not key:
                continue
            try:
                res = fn(part)
                if len(res) == len(part):
                    got = res
                    break
            except Exception:
                continue
        if got is None:
            got = [_lexicon(t) for t in part]
        out.extend(got)
    return out
