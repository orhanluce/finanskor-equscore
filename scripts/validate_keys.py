"""Validate EODHD + Twelve Data API keys and Tadawul coverage WITHOUT printing the keys."""
import os, json, urllib.request, urllib.parse

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


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:300]
    except Exception as e:
        return None, str(e)[:200]


print("=" * 56)
print("EODHD")
print("=" * 56)
# Try Saudi exchange codes; report which returns Aramco (2222)
for code in ["SR", "SAU", "TADAWUL"]:
    url = f"https://eodhd.com/api/eod/2222.{code}?api_token={EODHD}&fmt=json&from=2026-06-01&period=d"
    st, body = get(url)
    try:
        data = json.loads(body)
    except Exception:
        data = None
    if st == 200 and isinstance(data, list) and data:
        last = data[-1]
        print(f"  ✓ 2222.{code}: {len(data)} EOD rows | last {last.get('date')} close {last.get('close')} SAR")
        break
    else:
        n = len(data) if isinstance(data, list) else "—"
        print(f"  · 2222.{code}: HTTP {st} rows={n} {('' if st==200 else str(body)[:90])}")

# Account/limits check
st, body = get(f"https://eodhd.com/api/user?api_token={EODHD}&fmt=json")
try:
    u = json.loads(body)
    print(f"  account: plan={u.get('subscriptionType') or u.get('name')} apiRequests={u.get('apiRequests')}/{u.get('dailyRateLimit')}")
except Exception:
    print(f"  account check: HTTP {st}")

print()
print("=" * 56)
print("Twelve Data")
print("=" * 56)
for exch in ["Tadawul", "XSAU"]:
    url = f"https://api.twelvedata.com/quote?symbol=2222&exchange={urllib.parse.quote(exch)}&apikey={TD}"
    st, body = get(url)
    try:
        d = json.loads(body)
    except Exception:
        d = {}
    if st == 200 and d.get("close") is not None and "code" not in d:
        print(f"  ✓ 2222 @ {exch}: {d.get('name')} | close {d.get('close')} {d.get('currency')} ({d.get('datetime')})")
        break
    else:
        msg = d.get("message", body[:120] if isinstance(body, str) else "")
        print(f"  · 2222 @ {exch}: HTTP {st} {('code='+str(d.get('code'))) if d.get('code') else ''} {msg[:110]}")

# api usage
st, body = get(f"https://api.twelvedata.com/api_usage?apikey={TD}")
try:
    u = json.loads(body)
    print(f"  usage: {u.get('current_usage')}/{u.get('plan_limit')} credits ({u.get('plan_category')})")
except Exception:
    print(f"  usage check: HTTP {st}")
print("\nDONE")
