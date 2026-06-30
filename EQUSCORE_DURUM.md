# EquScore — Proje Durumu & Session Devir Notu

**Canlı:** https://equscore.com · **Repo:** github.com/orhanluce/finanskor-equscore (branch `main`)
**Son güncelleme:** 2026-07-01 · **Yerel:** `C:\Users\orhan\finanskor-equscore`
**Amaç:** Yeni session'ların buradan devam edebilmesi için mevcut durum + geliştirme özeti.

---

## 0. Genel Bakış

- **Ürün:** EquScore — MENA (TASI / DFM-ADX / EGX) perakende yatırımcıları için hesap verebilirlik & güven platformu. "Hype değil, sicil." TipRanks + Estimize + Xueqiu modeli + AAOIFI Şeriat taraması.
- **Kardeş ürün:** FinanSkor (BIST) — **AYRI** repo, ayrı session'lar. **Bu asistanın işi SADECE EquScore; FinanSkor'a karışılmıyor.**
- **Stack:** React + Vite SPA · Tailwind · react-router · Recharts · Supabase · lucide-react.
- **Deploy:** Hostinger (Node+Express, `server.js`). GitHub push → otomatik build & deploy.
- **Build akışı:** `npm run build` (vite) → `git add -A && commit && push`. **dist git'te.**
- **Supabase:** proje `zmfxcwdnjevgjnwtutet`. URL+anon key `src/lib/supabaseClient.js`'te public (RLS korumalı).
- **Edge fn:** `ai-ask` (Groq llama-3.3-70b) — AI Analysis, AI Fundamental Brief, AI'a Sor.
- **Çoklu pazar:** `src/data/countries.js` + `/api/geo` → ziyaretçi ülkesine göre pazar. `COUNTRY` aktif meta.

> **VERİ NOTU:** Prototip; veri örnek/EOD (Yahoo .SR) + bazı alanlar pipeline-besli (netFlowPct/SAHMK, social, foreignFlow). Z-Score web tarafında **illüstratif** (Health/Quality/Value yıldız + kaldıraçtan türetilmiş).

---

## 1. Dil / i18n (TAMAM)

- **Tüm site Arapça süpürmesi** yapıldı — her sayfa+bileşen `t()` ile sarıldı, `src/i18n/ar.js`'te ~500+ Arapça çeviri.
- **MENA varsayılan Arapça/RTL** (geo). `t(s)=AR[s]??s` (eksikse İngilizce'ye düşer). Yeni her özellik tam Arapça.

---

## 2. Bu Oturumda Eklenen Özellikler (hepsi CANLI)

| Özellik | Route | Dosya |
|---|---|---|
| Sektör Isı Haritası | `/heatmap` | `pages/HeatmapPage.jsx` (treemap, mcap-boyut, bugün%/Equity Star) |
| Screener presetleri (9, **Z-Solid** dahil) | `/explore` | `pages/ExplorePage.jsx` |
| Makro Pusula | `/macro` | `pages/MacroCompassPage.jsx` (makro sürücü→sektör matrisi SA/AE/EG) |
| AI Temel Brief | hisse sayfası | `pages/StockDetailPage.jsx` (7 bölüm, ai-ask, Arapça) |
| Vitrin Portföyü | `/showcase` | `pages/ShowcasePage.jsx` (public + skor + takip) |
| Yabancı Akış (QFI) | `/foreign-flow` | `pages/ForeignFlowPage.jsx` + `data/foreignFlow.js` |
| Sentiment Endeksi | `/sentiment` | `pages/SentimentPage.jsx` (social_posts → 0-100 + z-skor) |
| Yatırımcı Akademisi | `/academy` | `pages/AcademyPage.jsx` (12 ders, çapraz-link) |
| Tahmin Olayları | `/events` | `pages/EventsPage.jsx` + `data/predictionEvents.js` |
| **Altman Z-Score** (Finansal Sağlık) | hisse kartı + `/financial-health` | `data/zscore.js` + `pages/FinancialHealthPage.jsx` |

**Z-Score detay:** Z″=6.56A+3.26B+6.72C+1.05D; bölge (Güvenli/Gri/Sıkıntı) + sektör-percentile (mutlak eşik tek başına değil); banka/sigorta hariç→CAR/Solvency; TASI/DFM/EGX piyasa notları.

**Yeni helper dosyaları:** `data/zscore.js` · `data/foreignFlow.js` · `data/predictionEvents.js`.

---

## 3. Logo & Header (TAMAM)

- **Yeni pusula logosu** (compass + boğa/ayı + ağ + "equscore"). Arka plan kaldırıldı.
- **Dark/light normalize:** özdeş tuval **1017×648**, pusula aynı boyut+merkez → mod değişince kaymaz.
- **Dosya adı v3** (cache-bust): `public/logo-dark-v3.png` · `public/logo-light-v3.png`. Favicon = pusula medalyonu.
- **Header:** logo `h-16 sm:h-[105px]`, header `h-24 sm:h-32`. Menüler logoyla hizalı.
- **Hijri tarih** menülerin altına alındı (mutlak konum, `HijriLine` Header içinde). Ayrı strip kaldırıldı.

---

## 4. Supabase (zmfxcwdnjevgjnwtutet)

**Bu oturumda eklenen (RLS'li):** `showcase` · `showcase_follows` · `event_votes` + `portfolio`'ya "public showcase ise oku" SELECT politikası.
**Mevcut:** profiles, stocks, predictions, decisions, social_posts, brokers, leaderboard, portfolio, memberships, verifications.

---

## 5. Tüm Route Listesi (`src/App.jsx`)

`/` · `/market` · `/stock/:ticker` · `/sharia` · `/compare` · `/explore` · `/methodology`
**Sinyaller:** `/heatmap` · `/macro` · `/financial-health` · `/money-flow` · `/foreign-flow` · `/fear-greed` · `/efsah-flash` · `/rumors` · `/sentiment` · `/signals`
**Keşif:** `/strategies` · `/strategy/:slug` · `/baskets` · `/ipo` · `/brokers` · `/stories` · `/academy`
**Topluluk:** `/predict` · `/events` · `/competition` · `/leaderboard` · `/journal` · `/portfolio` · `/showcase` · `/investors`
**Hesap:** `/account` · `/premium` · `/membership` · `/verify` · `/admin`

---

## 6. Bekleyen / Sıradaki

- **Gerçek-veri pipeline'ları:** SAHMK money flow, Tadawul haftalık QFI, social — örnek/kısmi; pipeline doldurunca gerçekleşir.
- **Z-Score:** web illüstratif; gerçek bilanço gelirse `data/zscore.js` gerçeğe döner.
- **Premium ödeme (E2):** paywall var, ödeme bağlantısı bekliyor.
- **Açık uçlar:** AdminPage Arapça çevrilmedi (yalnız admin). Z-Score trend sparkline sentetik (geçmiş tutulursa gerçek).

---

## 7. Önemli Dosyalar

- `src/i18n/ar.js` — Arapça çeviriler (yeni anahtar buraya)
- `src/data/stocks.js` — STOCKS, COUNTRY, SECTORS, STAR_DIMS, SHARIA_LABEL, scoreColor
- `src/data/zscore.js` · `foreignFlow.js` · `predictionEvents.js` — yeni helper'lar
- `src/lib/db.js` — Supabase sorguları
- `src/components/Header.jsx` — nav + logo + HijriLine
- `src/pages/StockDetailPage.jsx` — hisse detayı (AI Analysis/Brief, Z-Score, QFI kartları, tab'lar)

---

## 8. Bağlam (VC)

$750K seed turunda. Pitch: `OneDrive/Documents/EquScore-Seed-Pitch.pdf`. 212 & Revo'ya başvuruldu; sıradaki Türk VC: Inveo, Kuveyt Türk Lonca/Albaraka (Şeriat ayağı), Boğaziçi Ventures, Maxis. "Canlı + çalışan ürün" anlatısı önemli.

İlişkili memory: [[finanskor-mena-yeni-ozellikler]] · [[equscore-deploy-canli]] · [[equscore-scope-only]]
