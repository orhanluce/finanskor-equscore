"""
EquScore — Telegram chatter for the Rumor Thermometer (Telethon), MERGED into the X feed.
Reads the curated public channels (scripts/telegram_channels.txt, per-country section),
scans recent messages, finds the stock mentioned (ticker code / cashtag / name), scores
sentiment (bilingual heuristic), and folds the counts + sample posts into social_{cc}.json
alongside X. Recomputes the relative rumor level over the combined volume.

Run:  COUNTRY=SA py scripts/fetch_telegram.py     (also AE, EG)
      GUN=3 COUNTRY=EG py scripts/fetch_telegram.py
"""
import os, re, sys, json, asyncio
from datetime import datetime, timezone, timedelta
HERE = os.path.dirname(os.path.abspath(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(HERE, "..", ".env"))
from telethon import TelegramClient

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DATA = os.path.join(HERE, "..", "src", "data")
SESSION = os.path.join(HERE, "tg_session")
CHAN_FILE = os.path.join(HERE, "telegram_channels.txt")
API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")
COUNTRY = os.environ.get("COUNTRY", "SA").upper()
GUN = int(os.environ.get("GUN", "4"))
PER = int(os.environ.get("TG_LIMIT", "200"))
MAX_TICKER_PER_MSG = 6

LIVE = {"SA": "tadawul_live.json", "AE": "uae_live.json", "EG": "egx_live.json"}[COUNTRY]
OUT = {"SA": "social_sa.json", "AE": "social_ae.json", "EG": "social_eg.json"}[COUNTRY]

POS = set("""buy bull bullish long strong rally breakout target upside undervalued gain gains surge moon
accumulate growth beat upgrade rocket support pump green outperform
شراء صعود قوي هدف فرصة ارتفاع تجميع ربح ايجابي اخضر صاعد دعم مكاسب توصية دخول""".split())
NEG = set("""sell bear bearish short dump crash drop overvalued loss downgrade avoid bubble fall miss warning
risk weak red panic correction
بيع هبوط ضعيف خساره خسارة خطر انخفاض سلبي فقاعه فقاعة تحذير احمر هابط مخاطر تصحيح خروج وقف""".split())
_WORD = re.compile(r"[A-Za-z؀-ۿ]+", re.UNICODE)


def classify(text):
    ws = [w.lower() for w in _WORD.findall(text)]
    p = sum(1 for w in ws if any(w.startswith(x) for x in POS))
    n = sum(1 for w in ws if any(w.startswith(x) for x in NEG))
    if p + n == 0:
        return "neutral"
    sc = (p - n) / (p + n)
    return "positive" if sc >= 0.2 else "negative" if sc <= -0.2 else "neutral"


def load_channels():
    out, cur = [], None
    for line in open(CHAN_FILE, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"\[([A-Z]{2})\]", line)
        if m:
            cur = m.group(1); continue
        if cur == COUNTRY and line.startswith("@"):
            out.append(line)
    return out


def build_matchers(stocks):
    """ticker -> compiled regex matching the code (cashtag/#/bare) or a distinctive name token."""
    m = {}
    for s in stocks:
        t = re.escape(s["ticker"])
        # code as standalone token, optional $/# prefix (finance channels use 4-digit codes / cashtags)
        pat = rf"(?<![A-Za-z0-9])[$#]?{t}(?![A-Za-z0-9])"
        m[s["ticker"]] = re.compile(pat)
    return m


async def main():
    channels = load_channels()
    if not channels:
        print(f"{COUNTRY}: telegram_channels.txt'te kanal yok"); return
    stocks = json.load(open(os.path.join(DATA, LIVE), encoding="utf-8"))
    matchers = build_matchers(stocks)
    name_by = {s["ticker"]: s["name"] for s in stocks}
    print(f"{COUNTRY}: {len(channels)} kanal, son {GUN} gün taranıyor", flush=True)

    tg = {}  # ticker -> {n,pos,neg,items}
    since = datetime.now(timezone.utc) - timedelta(days=GUN)
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start()
    for ch in channels:
        cnt = 0
        try:
            async for msg in client.iter_messages(ch, limit=PER):
                if not msg.text:
                    continue
                if msg.date and msg.date < since:
                    break
                hits = [t for t, rgx in matchers.items() if rgx.search(msg.text)]
                if not hits or len(hits) > MAX_TICKER_PER_MSG:
                    continue
                sent = classify(msg.text)
                for t in hits:
                    d = tg.setdefault(t, {"n": 0, "pos": 0, "neg": 0, "items": []})
                    d["n"] += 1
                    if sent == "positive": d["pos"] += 1
                    elif sent == "negative": d["neg"] += 1
                    if len(d["items"]) < 8:
                        d["items"].append({
                            "text": msg.text[:280].replace("\n", " "),
                            "author": ch, "sentiment": sent,
                            "url": f"https://t.me/{ch.lstrip('@')}/{msg.id}", "src": "telegram",
                        })
                cnt += 1
            print(f"  {ch:<26} {cnt} alakalı mesaj", flush=True)
        except Exception as e:
            print(f"  {ch:<26} HATA {str(e)[:45]}", flush=True)
        await asyncio.sleep(1)
    await client.disconnect()

    # ── merge into existing X feed ──
    try:
        base = json.load(open(os.path.join(DATA, OUT), encoding="utf-8"))
    except Exception:
        base = {}
    for t in set(list(base.keys()) + list(tg.keys())):
        b = base.get(t, {"n": 0, "pos": 0, "neg": 0, "items": []})
        g = tg.get(t, {"n": 0, "pos": 0, "neg": 0, "items": []})
        n = b.get("n", 0) + g["n"]
        pos = b.get("pos", 0) + g["pos"]
        neg = b.get("neg", 0) + g["neg"]
        items = (b.get("items", []) + g["items"])[:8]
        mood = "positive" if pos - neg >= 1 else "negative" if neg - pos >= 1 else "neutral"
        base[t] = {"n": n, "pos": pos, "neg": neg, "mood": mood, "items": items,
                   "x_n": b.get("n", 0), "tg_n": g["n"], "heat": n}
    # relative level over combined volume
    ranked = sorted(base.items(), key=lambda kv: kv[1]["heat"], reverse=True)
    N = max(1, len(ranked) - 1)
    for idx, (t, v) in enumerate(ranked):
        q = idx / N
        v["level"] = "danger" if q < 0.12 else "high" if q < 0.4 else "medium" if q < 0.75 else "low"
        v["spike"] = v["level"] == "danger" and abs(v["pos"] - v["neg"]) >= max(3, v["n"] * 0.5)
        v.pop("heat", None)
    json.dump(base, open(os.path.join(DATA, OUT), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    tg_total = sum(v["n"] for v in tg.values())
    print(f"\nTelegram: {len(tg)} hisse, {tg_total} mesaj X feed'ine eklendi -> src/data/{OUT}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
