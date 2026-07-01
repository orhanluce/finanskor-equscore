"""
EquScore — shared investing.com fetch helper (free, no API key).
Uses curl_cffi (browser-TLS impersonation) to get past Cloudflare, which blocks
plain urllib/requests. Two building blocks:
  * search_slug(query, exchange_hint) -> resolve a company name to its investing.com
    equity slug (e.g. "Commercial International Bank" -> "com-intl-bk").
  * fetch_ratios(slug) -> dict of parsed key-ratio numbers (price, mcap, pe, pb,
    dividend yield, ROE, ROA, EPS, beta) from the equity page's key-info panel.
Both are read-only scrapes of public pages; keep request rates modest (sleep between calls).
"""
import re
import time
from curl_cffi import requests

UA_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

_session = None


def _s():
    global _session
    if _session is None:
        _session = requests.Session(impersonate="chrome120")
    return _session


def _num(s):
    if not s:
        return None
    s = s.strip().replace(",", "")
    m = re.match(r"^-?[\d.]+", s)
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def _scaled(s):
    """Parse investing.com's '434.16B' / '4.44M' / '151.95K' magnitude suffixes."""
    if not s:
        return None
    s = s.strip()
    mult = {"K": 1e3, "M": 1e6, "B": 1e9, "T": 1e12}.get(s[-1:], None)
    base = _num(s[:-1] if mult else s)
    if base is None:
        return None
    return base * mult if mult else base


def search_slug(query, exchange_hint=None, retries=2):
    """Resolve a company name to its investing.com /equities/<slug>. Returns None if not found.
    exchange_hint: required substring of the 'exchange' field (e.g. 'Abu Dhabi', 'Egypt') —
    if given and no quote matches, returns None rather than guessing a cross-listing
    (foreign GDRs/OTC lines share the same base slug but wildly different mcap/currency)."""
    url = f"https://api.investing.com/api/search/v2/search?q={query}"
    headers = {"Accept": "application/json", "Accept-Language": "en-US,en;q=0.9"}
    for attempt in range(retries):
        try:
            r = _s().get(url, headers=headers, timeout=15)
            if r.status_code != 200:
                time.sleep(1)
                continue
            quotes = (r.json() or {}).get("quotes", [])
            if not quotes:
                return None
            if exchange_hint:
                pref = [q for q in quotes if exchange_hint.lower() in (q.get("exchange") or "").lower()]
                return pref[0]["url"].rsplit("/", 1)[-1] if pref else None
            return quotes[0]["url"].rsplit("/", 1)[-1]
        except Exception:
            time.sleep(1)
    return None


_LABEL_MAP = {
    "Market Cap": ("mcap", _scaled),
    "P/E Ratio": ("pe", _num),
    "Price/Book": ("pb", _num),
    "Dividend (Yield)": ("dy", lambda s: (lambda m: _num(m.group(1)) if m else None)(re.search(r"\(([\d.]+)%\)", s or ""))),
    "Return on Equity": ("roe", _num),
    "Return on Assets": ("roa", _num),
    "EPS": ("eps", _num),
    "Prev. Close": ("price", _num),
    "Beta": ("beta", _num),
    "Book Value / Share": ("bookValue", _num),
    "Shares Outstanding": ("sharesOut", _scaled),
}

_DTDD_RE = re.compile(r"<dt[^>]*>.*?<span>([^<]+)</span>.*?</dt>\s*<dd[^>]*>(.*?)</dd>", re.S)
_SPAN_RE = re.compile(r"<span[^>]*>([^<]*)</span>")


def fetch_ratios(slug, retries=2):
    """Fetch the key-ratios panel for an investing.com equity slug. Returns a dict with
    whatever of {mcap, pe, pb, dy, roe, roa, eps, price, beta, bookValue, sharesOut} was present,
    or None if the page could not be fetched."""
    url = f"https://www.investing.com/equities/{slug}"
    for attempt in range(retries):
        try:
            r = _s().get(url, headers=UA_HEADERS, timeout=20)
            if r.status_code != 200:
                time.sleep(1)
                continue
            html = r.text
            out = {}
            for m in _DTDD_RE.finditer(html):
                label = m.group(1).strip()
                if label not in _LABEL_MAP:
                    continue
                key, parser = _LABEL_MAP[label]
                spans = _SPAN_RE.findall(m.group(2))
                raw = "".join(spans).strip()
                try:
                    val = parser(raw) if raw else None
                except Exception:
                    val = None
                if val is not None:
                    out[key] = val
            return out or None
        except Exception:
            time.sleep(1)
    return None
