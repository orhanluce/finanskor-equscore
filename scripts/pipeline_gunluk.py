"""
EquScore — günlük veri pipeline'ı (Task Scheduler bunu çalıştırır).

Zincir:  fetch'ler → veri bekçisi → meta.json → npm run build → data-only commit → push.
Bekçi düşerse: src/data git'ten geri yüklenir, commit/push YAPILMAZ (boş-veri kazası
2026-07-02'de canlıya gitmişti — bir daha asla).

Günlük (Paz-Per): tadawul, uae, egx, haberler (SA/AE/EG), SerpAPI piyasa manşetleri.
Perşembe ek (haftalık): Argaam Şeriat, SerpAPI youtube + trends (kota-bütçeli).

Kullanım:  py scripts/pipeline_gunluk.py            (tam çalışma)
           py scripts/pipeline_gunluk.py --quick    (LIMIT'li hızlı test, push YOK)
           py scripts/pipeline_gunluk.py --no-push  (her şey ama push yok)
"""
import datetime as dt
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
META = os.path.join(ROOT, "src", "data", "meta.json")
QUICK = "--quick" in sys.argv
NO_PUSH = "--no-push" in sys.argv or QUICK


def log(msg):
    print(f"[{dt.datetime.now():%H:%M:%S}] {msg}", flush=True)


def run_step(name, script, env_extra=None, args=None, timeout=1800):
    """Bir fetch adımını çalıştır; başarıyı döndür (tek adım düşse zincir devam eder)."""
    env = {**os.environ, "PYTHONIOENCODING": "utf-8", **(env_extra or {})}
    cmd = ["py", "-u", os.path.join(HERE, script)] + (args or [])
    log(f"adım: {name} ...")
    try:
        r = subprocess.run(cmd, cwd=ROOT, env=env, timeout=timeout,
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        tail = (r.stdout or "").strip().splitlines()[-2:]
        for line in tail:
            log(f"    {line}")
        if r.returncode != 0:
            log(f"    !! {name} rc={r.returncode}: {(r.stderr or '')[-200:]}")
            return False
        return True
    except subprocess.TimeoutExpired:
        log(f"    !! {name} zaman aşımı ({timeout}s)")
        return False
    except Exception as e:
        log(f"    !! {name} hata: {str(e)[:150]}")
        return False


def sh(args, timeout=600):
    """git/npm komutu (liste-form, shell YOK — injection/quoting güvenli); (rc, çıktı) döndürür."""
    exe = shutil.which(args[0]) or args[0]  # Windows'ta npm → npm.cmd çözümü
    r = subprocess.run([exe] + args[1:], cwd=ROOT, timeout=timeout,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def main():
    today = dt.datetime.now()
    weekly = today.weekday() == 3  # Perşembe: haftanın son işlem günü → haftalıklar
    log(f"pipeline başladı — {'HIZLI TEST' if QUICK else 'tam'} | haftalık adımlar: {weekly}")

    ok = {}
    quick_env = {"LIMIT": "8"} if QUICK else None

    # ── Günlük fetch'ler ──
    ok["tadawul"] = run_step("tadawul", "fetch_tadawul.py", env_extra=quick_env, timeout=2400)
    ok["uae"] = run_step("uae", "fetch_uae.py", env_extra={"LIMIT": "5"} if QUICK else None)
    ok["egx"] = run_step("egx", "fetch_egx.py")
    ok["news_sa"] = run_step("news_sa", "fetch_news.py", env_extra={"TOP": "5"} if QUICK else None)
    ok["news_uae"] = run_step("news_uae", "fetch_news_uae.py")
    ok["news_egx"] = run_step("news_egx", "fetch_news_egx.py")
    ok["serp_news"] = run_step("serp_news", "fetch_serpapi.py", args=["news"])

    # ── Haftalıklar (Perşembe) ──
    if weekly and not QUICK:
        ok["sharia_argaam"] = run_step("sharia_argaam", "fetch_sharia_argaam.py", timeout=1200)
        ok["serp_youtube"] = run_step("serp_youtube", "fetch_serpapi.py", args=["youtube"],
                                      env_extra={"TOP": "12"})
        ok["serp_trends"] = run_step("serp_trends", "fetch_serpapi.py", args=["trends"])

    basarili = sum(1 for v in ok.values() if v)
    log(f"fetch özeti: {basarili}/{len(ok)} adım başarılı — {ok}")

    # ── Veri bekçisi (kritik kapı) ──
    rc, out = sh(["py", os.path.join(HERE, "veri_bekcisi.py")])
    print(out, flush=True)
    if rc != 0:
        log("BEKÇİ DÜŞTÜ → src/data git'ten geri yükleniyor, commit/push YOK.")
        sh(["git", "checkout", "--", "src/data"])
        sys.exit(1)

    # ── meta.json: tazelik damgaları (haftalıklar korunur) ──
    meta = {}
    try:
        meta = json.load(open(META, encoding="utf-8"))
    except Exception:
        pass
    now_iso = today.strftime("%Y-%m-%dT%H:%M:%S")
    meta["lastRun"] = now_iso
    meta.setdefault("steps", {})
    for name, success in ok.items():
        if success:
            meta["steps"][name] = now_iso
    json.dump(meta, open(META, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    log("meta.json yazıldı")

    # ── build + data-only commit + push ──
    rc, out = sh(["npm", "run", "build"], timeout=900)
    if rc != 0:
        log(f"BUILD DÜŞTÜ → commit/push yok: {out[-300:]}")
        sys.exit(1)
    log("build tamam")

    sh(["git", "add", "src/data", "dist"])
    rc, out = sh(["git", "diff", "--cached", "--quiet"])
    if rc == 0:
        log("değişiklik yok — commit atlanıyor")
        return
    msg = f"data: otomatik veri güncellemesi {today:%Y-%m-%d %H:%M}"
    rc, out = sh(["git", "commit", "-m", msg])
    if rc != 0:
        log(f"commit düştü: {out[-200:]}")
        sys.exit(1)
    log(f"commit: {msg}")

    if NO_PUSH:
        log("push atlandı (--quick/--no-push)")
        return
    rc, out = sh(["git", "push", "origin", "main"], timeout=300)
    if rc != 0:
        log(f"PUSH DÜŞTÜ: {out[-200:]}")
        sys.exit(1)
    log("push tamam — Hostinger otomatik deploy edecek")


if __name__ == "__main__":
    main()
