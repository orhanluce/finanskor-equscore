import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "dist");
const PORT = parseInt(process.env.PORT || "3100", 10);

const app = express();

// Statik dist/ → SPA
app.use(express.static(DIST, { maxAge: "7d" }));

// SPA fallback — react-router tüm route'ları yönetiyor
app.get("*", (_req, res) => {
  res.sendFile(join(DIST, "index.html"));
});

createServer(app).listen(PORT, "0.0.0.0", () => {
  console.log(`EquScore running on port ${PORT}`);
});
