"""
EquScore — veri bekçisi (data guard).
Commit/push edilmeden ÖNCE veri dosyalarının sağlığını doğrular; 2026-07-02'deki
"boş tadawul_live.json canlıya gitti" kazasının tekrarını imkânsızlaştırır.

Kontroller: JSON parse edilebilir + kayıt sayısı taban eşiğin üstünde + kritik
alanlar örnek kayıtta mevcut. Herhangi biri düşerse exit 1 (commit/pipeline durur).

Kullanım:  py scripts/veri_bekcisi.py          (tüm kontroller)
           py scripts/veri_bekcisi.py --quiet  (sadece hata yazdırır)
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "src", "data")
QUIET = "--quiet" in sys.argv

# dosya -> (tip, taban eşik, örnek kayıtta olması gereken alanlar)
RULES = {
    "tadawul_live.json": (list, 390, ["ticker", "price", "star", "sharia"]),
    "uae_live.json": (list, 30, ["ticker", "price", "star"]),
    "egx_live.json": (list, 10, ["ticker", "price", "star"]),
    "sharia_argaam.json": (dict, 350, None),
    "news_live.json": (dict, 10, None),
    "serp_market_news.json": (dict, 2, None),
}


def fail(msg):
    print(f"  [HATA] {msg}", flush=True)
    return False


def check(name, typ, min_n, fields):
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        return fail(f"{name}: dosya yok")
    try:
        d = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return fail(f"{name}: JSON parse edilemedi — {str(e)[:80]}")
    if not isinstance(d, typ):
        return fail(f"{name}: beklenen tip {typ.__name__}, gelen {type(d).__name__}")
    n = len(d)
    if n < min_n:
        return fail(f"{name}: {n} kayıt < taban {min_n} — VERİ BOŞALMIŞ OLABİLİR")
    if fields and isinstance(d, list) and d:
        sample = d[0]
        missing = [f for f in fields if f not in sample]
        if missing:
            return fail(f"{name}: örnek kayıtta eksik alanlar {missing}")
    if not QUIET:
        print(f"  [OK] {name}: {n} kayıt", flush=True)
    return True


def main():
    if not QUIET:
        print("Veri bekçisi çalışıyor...", flush=True)
    ok = all([check(n, *r) for n, r in RULES.items()])
    if not ok:
        print("\nVERİ BEKÇİSİ DURDURDU — veri dosyaları sağlıksız, commit/push yapılmadı.", flush=True)
        print("Kurtarma: git checkout -- src/data  (veya iyi bir commit'ten geri yükle)", flush=True)
        sys.exit(1)
    if not QUIET:
        print("Tüm veri dosyaları sağlıklı.", flush=True)


if __name__ == "__main__":
    main()
