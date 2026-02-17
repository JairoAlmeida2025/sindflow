import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import http from "http";
import { createOrGetInstance, getQr, getStatus, logout, getInstance, getProfilePic } from "./instanceManager.js";

const app = express();

const N8N_GERADOR_WEBHOOK = "https://editor-n8n.automacoesai.com/webhook/gerador";

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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

function normalizePhoneDigits(input) {
  return String(input || "").replace(/[^\d]/g, "");
}

function candidatePhonesFromInput(jidOrPhone) {
  const raw = String(jidOrPhone || "");
  const base = normalizePhoneDigits(raw.replace(/@.*$/, ""));
  const out = [];
  if (base) out.push(base);
  if (base.startsWith("55") && base.length >= 12) {
    if (base.charAt(2) === "0") {
      out.push("55" + base.slice(3));
    } else {
      out.push(base.slice(0, 2) + "0" + base.slice(2));
    }
  }
  return Array.from(new Set(out));
}

function candidateJidsFromInput(jidOrPhone) {
  const raw = String(jidOrPhone || "");
  const out = [];
  if (raw.includes("@")) {
    let jid = raw;
    if (jid.endsWith("@c.us")) jid = jid.replace("@c.us", "@s.whatsapp.net");
    out.push(jid);
  }
  const phones = candidatePhonesFromInput(raw);
  for (const p of phones) out.push(`${p}@s.whatsapp.net`);
  return Array.from(new Set(out.filter(Boolean)));
}

async function candidateJidsForSend(sock, jidOrPhone) {
  const base = candidateJidsFromInput(jidOrPhone);
  const out = [];
  for (const jid of base) {
    const isPn = typeof jid === "string" && jid.endsWith("@s.whatsapp.net");
    if (isPn) {
      const phone = normalizePhoneDigits(jid.replace(/@.*$/, ""));
      const getLidForPn = sock?.signalRepository?.lidMapping?.getLIDForPN;
      if (phone && typeof getLidForPn === "function") {
        try {
          const lid = await getLidForPn(phone);
          if (lid) out.push(String(lid));
        } catch {}
      }
    }
    out.push(jid);
  }
  return Array.from(new Set(out.filter(Boolean)));
}

async function sendWithFallback(sock, candidates, message) {
  let lastErr = null;
  for (const jid of candidates) {
    try {
      const sent = await sock.sendMessage(jid, message);
      return { sent, jidUsed: jid };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("send failed");
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  const mime = match[1];
  const b64 = match[2];
  const buffer = Buffer.from(b64, "base64");
  return { buffer, mime };
}

async function getBufferFromUrl(url) {
  const res = await fetch(String(url));
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  const mime = res.headers.get("content-type") || "application/octet-stream";
  return { buffer, mime };
}

// Endpoint de teste de CORS e saude
app.get("/health", (req, res) => res.json({ ok: true, timestamp: new Date() }));
app.get("/debug-cors", (req, res) => {
  res.json({
    ok: true,
    headers: req.headers,
    cors_origin_env: process.env.CORS_ORIGINS
  });
});

app.post("/n8n/gerador", async (req, res) => {
  try {
    const { connectionName } = req.body || {};
    if (!connectionName || typeof connectionName !== "string") {
      return res.status(400).json({ ok: false, error: "missing connectionName" });
    }
    const upstream = await fetch(N8N_GERADOR_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionName })
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (err) {
    console.error("Error proxying n8n gerador:", err);
    return res.status(500).json({ ok: false, error: "failed to call n8n" });
  }
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureReadyToSend(tenantId, sock, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = getStatus(tenantId);
    if (status === "connected" && sock?.user?.id) return { ok: true };
    if (status === "qr_required") {
      return { ok: false, status, qr: getQr(tenantId) };
    }
    await sleep(250);
  }
  return { ok: false, status: getStatus(tenantId), qr: getQr(tenantId) };
}

async function ensureInstance(tenantId) {
  let sock = getInstance(tenantId);
  if (!sock) {
    console.log(`[whatsapp] creating instance for tenant ${tenantId}`);
    sock = await createOrGetInstance(tenantId, wsNotify);
  }
  return sock;
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

  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });

  try {
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { text });
    console.log(`[whatsapp] sent text to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
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

  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });

  try {
    const match = String(dataUrl).match(/^data:(.*?);base64,(.*)$/);
    if (!match) return res.status(400).json({ ok: false, error: "invalid dataUrl" });
    let mime = match[1] || "audio/ogg";
    const b64 = match[2];
    const buffer = Buffer.from(b64, "base64");
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (mime === "audio/webm") {
      mime = "audio/ogg"; // força container aceito
    }
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { audio: buffer, mimetype: mime, ptt: true });
    console.log(`[whatsapp] sent audio to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending audio:", err);
    return res.status(500).json({ ok: false, error: "failed to send audio" });
  }
});

app.post("/whatsapp/send-image", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  const { jid, dataUrl, url, caption } = req.body || {};
  if (!jid || (!dataUrl && !url)) return res.status(400).json({ ok: false, error: "missing jid or media source" });
  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });
  try {
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { image: parsed.buffer, mimetype: parsed.mime || "image/jpeg", caption: caption || "" });
    console.log(`[whatsapp] sent image to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending image:", err);
    return res.status(500).json({ ok: false, error: "failed to send image" });
  }
});

app.post("/whatsapp/send-video", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  const { jid, dataUrl, url, caption } = req.body || {};
  if (!jid || (!dataUrl && !url)) return res.status(400).json({ ok: false, error: "missing jid or media source" });
  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });
  try {
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { video: parsed.buffer, mimetype: parsed.mime || "video/mp4", caption: caption || "" });
    console.log(`[whatsapp] sent video to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending video:", err);
    return res.status(500).json({ ok: false, error: "failed to send video" });
  }
});

app.post("/whatsapp/send-document", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  const { jid, dataUrl, url, fileName, mime } = req.body || {};
  if (!jid || (!dataUrl && !url)) return res.status(400).json({ ok: false, error: "missing jid or media source" });
  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });
  try {
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { document: parsed.buffer, fileName: fileName || "arquivo", mimetype: mime || parsed.mime || "application/octet-stream" });
    console.log(`[whatsapp] sent document to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending document:", err);
    return res.status(500).json({ ok: false, error: "failed to send document" });
  }
});

app.post("/whatsapp/send-sticker", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  const { jid, dataUrl, url } = req.body || {};
  if (!jid || (!dataUrl && !url)) return res.status(400).json({ ok: false, error: "missing jid or media source" });
  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });
  try {
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { sticker: parsed.buffer });
    console.log(`[whatsapp] sent sticker to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending sticker:", err);
    return res.status(500).json({ ok: false, error: "failed to send sticker" });
  }
});

app.post("/whatsapp/send-location", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  const { jid, lat, lng, name, address } = req.body || {};
  if (!jid || typeof lat !== "number" || typeof lng !== "number") return res.status(400).json({ ok: false, error: "missing jid or coordinates" });
  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });
  try {
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { location: { degreesLatitude: lat, degreesLongitude: lng, name, address } });
    console.log(`[whatsapp] sent location to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending location:", err);
    return res.status(500).json({ ok: false, error: "failed to send location" });
  }
});

app.post("/whatsapp/send-contact", async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(400).json({ ok: false, error: "missing tenantId" });
  const { jid, vcard, displayName } = req.body || {};
  if (!jid || !vcard) return res.status(400).json({ ok: false, error: "missing jid or vcard" });
  const sock = await ensureInstance(tenantId);
  const ready = await ensureReadyToSend(tenantId, sock);
  if (!ready.ok) return res.status(409).json({ ok: false, error: "not connected", status: ready.status, qr: ready.qr || null });
  try {
    const candidates = await candidateJidsForSend(sock, jid);
    if (candidates.length === 0) return res.status(400).json({ ok: false, error: "invalid jid" });
    const { sent, jidUsed } = await sendWithFallback(sock, candidates, { contacts: { displayName: displayName || "Contato", contacts: [{ vcard }] } });
    console.log(`[whatsapp] sent contact to ${jidUsed} by tenant ${tenantId} (tried=${candidates.join(",")})`);
    return res.json({ ok: true, data: sent });
  } catch (err) {
    console.error("Error sending contact:", err);
    return res.status(500).json({ ok: false, error: "failed to send contact" });
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
