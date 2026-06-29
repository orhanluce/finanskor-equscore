"""
twikit YAMASI — X, 'ondemand.s' webpack chunk formatini ~18 Mart 2026'da degistirdi
ve twikit'in ClientTransaction'i koptu: "Couldn't get KEY_BYTE indices" (issue #408/#409).
Bu, login DAHIL tum API cagrilarini etkiler (x-client-transaction-id uretilemiyor).

Bu modul d60/twikit PR #416'daki duzeltmeyi RUNTIME'da uygular (PR henuz release edilmedi).
site-packages'a DOKUNMAZ -> `pip install -U twikit` ile silinmez, taşınabilir.

Kullanim: X cekimi yapan her script, twikit'i kullanmadan ONCE bunu import etmeli:
    import twikit_patch  # noqa  (yan etki: ClientTransaction.get_indices'i yamalar)

Eski format:  "ondemand.s":"<hash>"
Yeni format:  ...,<chunkId>:"ondemand.s"...  +  ayrı yerde  <chunkId>:"<hash>"
"""
import os
import re

try:
    from twikit.x_client_transaction import transaction as _tx
except Exception as e:  # twikit yoksa sessizce gec
    _tx = None
    print(f"twikit_patch: twikit bulunamadi, yama atlandi ({str(e)[:60]})")

# Yeni webpack formatinda chunk-id -> 'ondemand.s' eslemesi
_CHUNK_NAME_REGEX = re.compile(r'(\d+):"ondemand\.s"')


async def _patched_get_indices(self, home_page_response, session, headers):
    key_byte_indices = []
    response = self.validate_response(home_page_response) or self.home_page_response
    response_str = str(response)

    # 1) ESKI format (eski X surumleri / onbellek) — once dene
    on_demand_file = _tx.ON_DEMAND_FILE_REGEX.search(response_str)
    file_hash = on_demand_file.group(1) if on_demand_file else None

    # 2) YENI webpack format — chunk-id bul, ardindan o chunk'in hash'ini bul
    if not file_hash:
        chunk_id_match = _CHUNK_NAME_REGEX.search(response_str)
        if chunk_id_match:
            chunk_id = chunk_id_match.group(1)
            hash_pattern = re.compile(rf'{chunk_id}:"([\w]+)"')
            for m in hash_pattern.finditer(response_str):
                val = m.group(1)
                if val != "ondemand" and len(val) <= 12:
                    file_hash = val
                    break

    _dbg = os.getenv("X_DEBUG") == "1"
    if _dbg:
        print(f"[X_DEBUG] home_page_response uzunluk={len(response_str)}")
        print(f"[X_DEBUG] eski_regex_match={bool(on_demand_file)} 'ondemand.s' icerikte={'ondemand.s' in response_str}")
        print(f"[X_DEBUG] file_hash={file_hash}")

    if file_hash:
        on_demand_file_url = (
            f"https://abs.twimg.com/responsive-web/client-web/ondemand.s.{file_hash}a.js"
        )
        on_demand_file_response = await session.request(
            method="GET", url=on_demand_file_url, headers=headers
        )
        js_text = str(on_demand_file_response.text)
        for item in _tx.INDICES_REGEX.finditer(js_text):
            key_byte_indices.append(item.group(2))
        if _dbg:
            print(f"[X_DEBUG] ondemand.s.js uzunluk={len(js_text)} indices_bulundu={len(key_byte_indices)}")

    if not key_byte_indices:
        raise Exception("Couldn't get KEY_BYTE indices")
    key_byte_indices = list(map(int, key_byte_indices))
    return key_byte_indices[0], key_byte_indices[1:]


if _tx is not None:
    _tx.ClientTransaction.get_indices = _patched_get_indices
    print("twikit_patch: ondemand.s yeni webpack formati yamasi uygulandi (PR #416).")

# ── SearchTimeline GraphQL sorgu ID'si (X bunu sik dondurur) ──
# twikit'teki ve topluluk PR'larindaki ID'ler bayatlayip 404 verir. Guncel ID'yi
# .env'den X_SEARCH_QID ile gecersen aramalar calisir. ID'yi tarayicidan al:
#   x.com'da bir sey aratip DevTools > Network > "SearchTimeline" istegine bak;
#   URL: .../i/api/graphql/<BU_ID>/SearchTimeline  -> <BU_ID>'yi kopyala.
try:  # patch import-time'da calisir; .env henuz yuklenmemis olabilir
    from dotenv import load_dotenv as _ld
    _ld()
except Exception:
    pass
_qid = os.getenv("X_SEARCH_QID")
if _qid:
    try:
        from twikit.client.gql import Endpoint
        Endpoint.SEARCH_TIMELINE = Endpoint.url(f"{_qid.strip()}/SearchTimeline")
        print(f"twikit_patch: SearchTimeline sorgu ID'si .env'den uygulandi ({_qid.strip()[:10]}...).")
    except Exception as e:
        print(f"twikit_patch: X_SEARCH_QID uygulanamadi ({str(e)[:60]})")
