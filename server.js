import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "dist");
const PORT = parseInt(process.env.PORT || "3100", 10);

const app = express();

// Visitor country (best-effort) for the auto market selector.
// Prefers an edge/CDN header; falls back to an IP-geo lookup.
app.get("/api/geo", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const edge = req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"] || req.headers["x-country-code"];
  if (edge && edge !== "XX") return res.json({ country: String(edge).toUpperCase(), src: "edge" });

  const fwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || req.socket?.remoteAddress || "";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=countryCode`, { signal: ctrl.signal });
    clearTimeout(t);
    const d = await r.json();
    return res.json({ country: (d.countryCode || "").toUpperCase(), src: "ip-api" });
  } catch {
    return res.json({ country: "", src: "none" });
  }
});

// Statik dist/ → SPA
app.use(express.static(DIST, { maxAge: "7d" }));

// SPA fallback — react-router tüm route'ları yönetiyor
app.get("*", (_req, res) => {
  res.sendFile(join(DIST, "index.html"));
});

createServer(app).listen(PORT, "0.0.0.0", () => {
  console.log(`EquScore running on port ${PORT}`);
});
