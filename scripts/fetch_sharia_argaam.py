"""
EquScore — real Shariah-board certification data (Argaam.com, free public pages).
Replaces the sector-heuristic auto_sharia() in fetch_tadawul.py with actual certified
compliance lists from 4 real Shariah boards (institution-based whitelist pages).

Institutions: 1=Al Rajhi Financial, 2=Dr. Al-Osaimi, 3=Tanmiah/Development, 6=Al-Bilad.
Markets: 3=TASI, 14=NOMU.
Each institution page lists the companies IT certifies as Sharia-compliant, plus a
per-share purification amount when impure income exists. A company not listed under
any of the 4 boards is left to fetch_tadawul.py's heuristic (absence != non-compliant;
it may simply be reviewed by a different board).

Writes src/data/sharia_argaam.json: { "<code>": {"boards": [...], "purification": <SAR|null>} }

Run: py scripts/fetch_sharia_argaam.py
"""
import json
import os
import re
import time
from curl_cffi import requests

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "src", "data", "sharia_argaam.json")

INSTITUTIONS = {1: "Al Rajhi Financial", 2: "Dr. Al-Osaimi", 3: "Tanmiah", 6: "Al-Bilad"}
MARKETS = {3: "TASI", 14: "NOMU"}

ROW_RE = re.compile(
    r'<tr>\s*<td class="">(\d+)</td>\s*'
    r'<td class="argaam-font"><a[^>]*>([^<]+)</a></td>\s*'
    r'<td class="center">([^<]*)</td>\s*'
    r'<td class="center">([^<]*)</td>\s*</tr>',
    re.S,
)

session = requests.Session(impersonate="chrome120")
HEADERS = {"Accept": "text/html,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9"}


def fetch_board(inst_id, market_id):
    url = f"https://www.argaam.com/ar/company/shariahcompaniesbyinstitution/{inst_id}?marketid={market_id}"
    try:
        r = session.get(url, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            return []
    except Exception as e:
        print(f"  ERR institution={inst_id} market={market_id}: {e}")
        return []
    rows = []
    for m in ROW_RE.finditer(r.text):
        code, name, purif, classification = m.groups()
        purif = purif.strip()
        purif_val = None
        pm = re.match(r"^-?[\d.]+", purif)
        if pm and purif != "-":
            try:
                purif_val = float(pm.group(0))
            except ValueError:
                pass
        rows.append({"code": code, "name": name.strip(), "purification": purif_val,
                     "note": classification.strip() if classification.strip() != "-" else None})
    return rows


def main():
    out = {}
    for inst_id, inst_name in INSTITUTIONS.items():
        for market_id, market_name in MARKETS.items():
            rows = fetch_board(inst_id, market_id)
            print(f"  {inst_name} / {market_name}: {len(rows)} companies")
            for row in rows:
                code = row["code"]
                rec = out.setdefault(code, {"name": row["name"], "boards": [], "purification": None})
                rec["boards"].append(inst_name)
                if row["purification"] is not None:
                    rec["purification"] = row["purification"]
                if row["note"]:
                    rec["note"] = row["note"]
            time.sleep(1)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"\nWrote {len(out)} Shariah-certified companies -> {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()
