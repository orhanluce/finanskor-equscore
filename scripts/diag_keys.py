"""Diagnose EODHD Saudi coverage + Twelve Data key validity, without printing keys."""
import os, json, re, urllib.request, urllib.parse

ENV = os.path.join(os.path.dirname(__file__), "..", ".env")
env = {}
with open(ENV, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
EODHD = env.get("EODHD_API_KEY", "")
TD = env.get("TWELVEDATA_API_KEY", "")


def get(url, t=25):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=t) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:200]
    except Exception as e:
        return None, str(e)[:160]


print("==== EODHD: find Saudi exchange code ====")
st, body = get(f"https://eodhd.com/api/exchanges-list/?api_token={EODHD}&fmt=json")
try:
    ex = json.loads(body)
    sa = [e for e in ex if "saudi" in (e.get("Name", "") + e.get("Country", "")).lower()
          or e.get("Code") in ("SR", "SAU", "XSAU", "TADAWUL")]
    print(f"  exchanges-list: HTTP {st}, total {len(ex)}")
    for e in sa:
        print(f"    -> {e.get('Name')} | Code={e.get('Code')} | Country={e.get('Country')}")
    if not sa:
        print("    NO Saudi exchange in this plan's list (likely not covered on free plan).")
except Exception:
    print(f"  exchanges-list HTTP {st}: {str(body)[:160]}")

print("\n==== Twelve Data: key sanity (no value shown) ====")
print(f"  length={len(TD)}  hex_only={bool(re.fullmatch(r'[0-9a-fA-F]+', TD))}  "
      f"has_space={' ' in TD}  has_quote={any(c in TD for c in chr(34)+chr(39))}")
# Test on AAPL (US, covered on every plan) to isolate key vs coverage
st, body = get(f"https://api.twelvedata.com/quote?symbol=AAPL&apikey={TD}")
try:
    d = json.loads(body)
except Exception:
    d = {}
if st == 200 and d.get("close") and "code" not in d:
    print(f"  AAPL test: OK -> key is VALID (close {d.get('close')}). So issue is Saudi symbol/coverage, not the key.")
else:
    print(f"  AAPL test: HTTP {st} code={d.get('code')} msg={str(d.get('message'))[:120]}")
    print("  -> Key REJECTED even for AAPL => key value is wrong/truncated. Re-copy from twelvedata.com dashboard.")
print("\nDONE")
