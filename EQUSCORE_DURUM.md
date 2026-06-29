# EquScore — Proje Durumu & Session Devir Notu

**Canlı:** https://equscore.com · **Repo:** github.com/orhanluce/finanskor-equscore (branch `main`)
**Son güncelleme:** 2026-06-29 · **Yerel:** `C:\Users\orhan\finanskor-equscore`

MENA hisse skorlama platformu — FinanSkor (BIST) motorunun Körfez/Mısır'a uyarlanmış hali.
3 borsa: 🇸🇦 Tadawul · 🇦🇪 DFM+ADX · 🇪🇬 EGX. Ortak imza: Hisse Yıldızı (Equity Star /42),
Karar Aynası, Söylenti Termometresi, AI, JargonTip.

---

## 1. Mimari / Stack
- **Frontend:** Vite + React 18 + react-router 7 + Tailwind. `src/` altında pages/components/data/lib.
- **Sunucu:** `server.js` = minimal Express (statik `dist/` + SPA fallback + `/api/geo`). `.nvmrc`=22, `npm start`.
- **Deploy:** Hostinger Node.js sitesi, GitHub auto-deploy. **Hostinger KENDİ `npm run build`'ini çalıştırır** (kendi asset hash'i; ~2-15 dk gecikme). Döngü: `npm run build` (lokal test) → `git add -A && commit && push`.
- **Backend:** Supabase proje `zmfxcwdnjevgjnwtutet` (EquScore, eu-central-1). Tablolar: profiles, stocks, predictions, decisions, social_posts, brokers, leaderboard, **portfolio, memberships, verifications** + RLS + `is_admin()` (email allowlist: orhhanisik@gmail.com). Edge fn `ai-ask` (Groq llama-3.3-70b).

### ⚠️ KRİTİK: Supabase env
`.env` gitignore'lu + Hostinger build'i `.env`siz çalışır → `VITE_SUPABASE_*` bundle'a girmezdi.
**Çözüm:** `src/lib/supabaseClient.js`'te URL+anon key **fallback gömülü** (public, RLS korur). Bunlara dokunma.

## 2. Çok-ülke
- `src/data/countries.js` — registry (SA/AE/EG, `modules` bayrakları, regulator, sources).
- `src/data/stocks.js` — aktif-ülke selektörü (localStorage `equscore_country`; switch=reload). Pages değişmeden çalışır.
- IP-geo oto-tespit (`/api/geo`) + header'da CountrySwitcher.

## 3. Veri kaynakları & güncelleme komutları (hepsi `py scripts/...`)
| Veri | Komut | Kaynak / Not |
|---|---|---|
| Tadawul fiyat/skor | `py scripts/fetch_tadawul.py` | Yahoo `.SR` (401 hisse). SAHMK 100/gün. |
| UAE | `py scripts/fetch_uae.py` | DFM=Yahoo `.AE` canlı; **ADX curated** (ücretsiz kaynak yok). |
| Egypt | `py scripts/fetch_egx.py` | EODHD EOD canlı fiyat; **fundamental free-tier'da bloklu → estimate**. |
| Haber (Efsah) | `py scripts/fetch_news.py` (SA), `_uae`, `_egx` | Marketaux **search**-bazlı (symbol/exchange 0 döner) + Google fallback. Marketaux **100/gün**. |
| Sosyal/Söylenti (X) | `COUNTRY=SA py scripts/fetch_social.py` | twikit X scrape (AR+EN). x_cookies.json gerekir. Düşük bütçe → günde 1, ~12-15 hisse. |
| Telegram | `COUNTRY=SA py scripts/fetch_telegram.py` | X feed'ine merge. tg_session gerekir. SA zengin; AE/EG Arapça-ad alias eksik → düşük. |
| Telegram keşif | `COUNTRY=SA py scripts/discover_telegram.py` | Yeni kanal bul → telegram_channels.txt. |
| TradingView teknik | `COUNTRY=SA TOP=80 py scripts/fetch_tv.py` | tradingview_ta. **Burst throttle** → küçük parti/yavaş. |

## 4. ÖNEMLİ: gitignore'lu yerel dosyalar (git'te YOK)
Yedek: `C:\Users\orhan\equscore-secrets-backup\`. Yeni klonda geri koy:
- `.env` (tüm API anahtarları)
- `scripts/x_cookies.json` (X oturumu)
- `scripts/tg_session.session` (Telegram oturumu)
`.env` anahtarları: VITE_SUPABASE_*, SAHMK, MARKETAUX, EODHD, TWELVEDATA, X_*, TELEGRAM_*, OPENROUTER/CEREBRAS/HF/GITHUB_MODELS/OLLAMA/AI (çoklu-LLM, FinanSkor otomasyonundan aktarıldı).

## 5. Tamamlananlar
- 29 route: çekirdek (Market+Halka/Izgara, StockDetail **sekmeli**: Star/Flow/Fair Value/Stories/Social/Predictions, Sharia, Explore, Compare) + sinyaller (Fear&Greed, Money Flow, Rumors, Efsah Flash, Signals) + keşif (IPO, Strategies+detay, Baskets, Brokers, Stories) + kullanıcı (Account, Portfolio, Competition, Premium, Membership, Verify, Investors, Admin) + dashboard (MarketPulse/MacroStrip/SectorMomentum/EvidenceCorner) + DubaiRealEstate (DLD).
- Ülkeye özgü (CountryLens): EG FX-risk/reel büyüme/CIB konsantrasyon; UAE zero-tax/contrarian/board filtresi.
- 3B Halka (EquityRing), global arama, ShareButtons, JargonTip, AI Analiz + AiAsk, tema dark/light, logo (şeffaf + dark varyant).
- Söylenti = gerçek X+Telegram. TradingView grafik widget + teknik not.
- **Arapça i18n TEMELİ:** RTL + MENA'da AR varsayılan + EN/ع toggle + Arapça font. Çevrildi: header/nav/footer/arama/ülke-switcher/ana-sayfa-kahraman/market-çekirdek.

## 6. KALAN İŞLER (yeni session'larda)
1. **Arapça süpürme (en büyük):** `t()` ile sarmalanmamış sayfa gövdeleri → StockDetail sekme içerikleri + ~20 sayfa (Explore, Compare, Fear&Greed, Money Flow, Rumors, Efsah, Signals, IPO, Strategies, Baskets, Brokers, Stories, Account, Portfolio, Competition, Premium, Membership, Verify, Investors, Admin, Methodology, Journal, Predict, Leaderboard) + uzun paragraflar. Yöntem: string'i `{t('...')}` yap, çevirisini `src/i18n/ar.js`'e ekle (Claude doğrudan çeviriyor). RTL'de fiziksel sınıflar (ml-/left-) için mantıksal (ms-/start) iyileştirme opsiyonel.
2. **AE/EG Telegram:** hisselere `arName` (Arapça ad) alias ekle → Arapça kanallarda eşleşme artar.
3. **TradingView SA/EG:** throttle nedeniyle kısmi (SA 11, EG 12, AE 21) — küçük partilerle tamamla.
4. **Marketaux haber:** günde 1 tazeleme (100/gün). Egypt haberleri şu an Google fallback (Marketaux limiti) — yarın Marketaux ile tekrar.
5. **Opsiyonel genişleme:** Qatar (QSE), lisanslı feed'ler (ADX canlı, EGX fundamental — EODHD ücretli/ICE/MIST-WSI), Arapça LLM sentiment (heuristik yerine), nightly fetch zamanlaması (Task Scheduler).
6. **Güvenlik:** anahtarlar sohbetlerde paylaşıldı — periyodik rotate.

## 7. Yeni session başlangıcı
"EquScore'a devam" de → bu dosya + hafıza ([[equscore-deploy-canli]]) yükler. Lokal hazır; `.env`/cookies yerinde. Build: `npm run build`. Preview bu makinede bazen innerWidth=0 raporlar (ölçüm kör), gerçek tarayıcıda sorun yok.
