"""
EquScore — discover MENA finance Telegram channels (Telethon contacts.Search).
Searches Arabic + English finance keywords per country, ranks PUBLIC channels by
subscriber count, prints candidates. Review the output, then paste the legit @handles
into scripts/telegram_channels.txt for the reader (fetch_telegram.py, later).

Run:  COUNTRY=SA py scripts/discover_telegram.py     (also AE, EG)
"""
import os, sys, asyncio
HERE = os.path.dirname(os.path.abspath(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(HERE, "..", ".env"))
from telethon import TelegramClient, functions
from telethon.tl.types import Channel

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")
SESSION = os.path.join(HERE, "tg_session")
COUNTRY = os.environ.get("COUNTRY", "SA").upper()

KEYWORDS = {
    "SA": ["تداول", "الاسهم السعودية", "السوق السعودي", "اسهم", "Tadawul", "TASI", "Saudi stocks"],
    "AE": ["سوق دبي المالي", "اسهم الامارات", "ابوظبي للاوراق", "DFM", "ADX", "UAE stocks"],
    "EG": ["البورصة المصرية", "اسهم مصر", "بورصة مصر", "EGX", "Egypt stocks"],
}


async def main():
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start()
    seen = {}
    for kw in KEYWORDS[COUNTRY]:
        try:
            res = await client(functions.contacts.SearchRequest(q=kw, limit=30))
        except Exception as e:
            print(f"search '{kw}' err: {str(e)[:50]}"); continue
        for ch in res.chats:
            if not isinstance(ch, Channel) or not ch.username:
                continue
            if ch.username in seen:
                continue
            subs = None
            try:
                full = await client(functions.channels.GetFullChannelRequest(channel=ch))
                subs = full.full_chat.participants_count
            except Exception:
                pass
            seen[ch.username] = {
                "title": ch.title, "username": ch.username, "subs": subs or 0,
                "broadcast": bool(ch.broadcast), "kw": kw,
            }
        await asyncio.sleep(1)

    ranked = sorted(seen.values(), key=lambda c: c["subs"], reverse=True)
    print(f"\n=== {COUNTRY}: {len(ranked)} aday kanal (abone sayısına göre) ===")
    for c in ranked[:40]:
        kind = "📢" if c["broadcast"] else "👥"
        print(f"  {kind} @{c['username']:<28} {c['subs']:>9,} abone  — {c['title'][:40]}")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
