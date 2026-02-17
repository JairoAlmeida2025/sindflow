import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import http from "http";
import { createOrGetInstance, getQr, getStatus, logout, getInstance, getProfilePic } from "./instanceManager.js";

const app = express();

// Middleware Manual de CORS (Força Bruta) - Executa antes de tudo
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method !== "OPTIONS") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// Endpoint de teste de CORS e saude
app.get("/health", (req, res) => res.json({ ok: true, timestamp: new Date() }));
app.get("/debug-cors", (req, res) => {
  res.json({
    ok: true,
    headers: req.headers,
    cors_origin_env: process.env.CORS_ORIGINS
  });
});

function getTenantId(req) {
  const b = req.body?.tenantId;
  if (b) return String(b);
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.decode(token);
      return String(decoded?.sub || decoded?.tenantId || decoded?.companyId || "");
    } catch {}
  }
  return "";
}

let wsClients = new Map();
function wsNotify(tenantId, data) {
  const set = wsClients.get(tenantId);
  if (!set) return;
  for (const ws of set) {
    try { ws.send(JSON.stringify(data)); } catch {}
  }
}

app.post("/whatsapp/connect", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  await createOrGetInstance(tenantId, wsNotify);
  return res.json({ ok: true, status: getStatus(tenantId) });
});

app.get("/whatsapp/qrcode", async (req, res) => {
  const tenantId = String(req.query.tenantId || "");
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  return res.json({ ok: true, status: getStatus(tenantId), qr: getQr(tenantId) });
});

app.get("/whatsapp/status", async (req, res) => {
  const tenantId = String(req.query.tenantId || "");
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  return res.json({ ok: true, status: getStatus(tenantId) });
});

app.post("/whatsapp/send-text", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  
  const { jid, text } = req.body;
  if (!jid || !text) return res.status(400).json({ ok: false, error: "missing jid or text" });

  const sock = getInstance(tenantId);
  if (!sock) return res.status(404).json({ ok: false, error: "instance not found" });

  try {
    const sent = await sock.sendMessage(jid, { text });
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({ ok: false, error: "failed to send" });
  }
});

app.post("/whatsapp/send-audio", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  const { jid, dataUrl, ptt } = req.body || {};
  if (!jid || !dataUrl) return res.status(400).json({ ok: false, error: "missing jid or dataUrl" });

  const sock = getInstance(tenantId);
  if (!sock) return res.status(404).json({ ok: false, error: "instance not found" });

  try {
    const match = String(dataUrl).match(/^data:(.*?);base64,(.*)$/);
    if (!match) return res.status(400).json({ ok: false, error: "invalid dataUrl" });
    const mime = match[1] || "audio/ogg";
    const b64 = match[2];
    const buffer = Buffer.from(b64, "base64");
    const sent = await sock.sendMessage(jid, { audio: buffer, mimetype: mime, ptt: !!ptt });
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending audio:", err);
    return res.status(500).json({ ok: false, error: "failed to send audio" });
  }
});

app.get("/whatsapp/profile-pic", async (req, res) => {
  const tenantId = String(req.query.tenantId || "");
  const jid = String(req.query.jid || "");
  if (!tenantId || !jid) return res.status(400).json({ ok: false, error: "missing params" });
  
  const url = await getProfilePic(tenantId, jid);
  return res.json({ ok: true, url });
});

app.post("/whatsapp/logout", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  await logout(tenantId);
  return res.json({ ok: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws, req) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const tenantId = String(url.searchParams.get("tenantId") || "");
    if (!wsClients.has(tenantId)) wsClients.set(tenantId, new Set());
    wsClients.get(tenantId).add(ws);
    ws.on("close", () => {
      const set = wsClients.get(tenantId);
      if (set) set.delete(ws);
    });
  } catch {}
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed for: * (Permissive Mode)`);
});
