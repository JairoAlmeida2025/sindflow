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

async function resolveSendJid(sock, jidOrPhone) {
  const phones = candidatePhonesFromInput(jidOrPhone);
  for (const phone of phones) {
    try {
      const iswa = await sock.onWhatsApp(phone);
      if (iswa?.[0]?.exists) {
        return { ok: true, jid: `${phone}@s.whatsapp.net`, phone, tried: phones };
      }
    } catch {}
  }
  const phone = phones[0] || "";
  return { ok: false, jid: phone ? `${phone}@s.whatsapp.net` : String(jidOrPhone || ""), phone, tried: phones };
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

  try {
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    const sent = await sock.sendMessage(resolved.jid, { text });
    console.log(`[whatsapp] sent text to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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

  try {
    const match = String(dataUrl).match(/^data:(.*?);base64,(.*)$/);
    if (!match) return res.status(400).json({ ok: false, error: "invalid dataUrl" });
    let mime = match[1] || "audio/ogg";
    const b64 = match[2];
    const buffer = Buffer.from(b64, "base64");
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    if (mime === "audio/webm") {
      mime = "audio/ogg"; // força container aceito
    }
    const sent = await sock.sendMessage(resolved.jid, { audio: buffer, mimetype: mime, ptt: true });
    console.log(`[whatsapp] sent audio to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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
  try {
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const sent = await sock.sendMessage(resolved.jid, { image: parsed.buffer, mimetype: parsed.mime || "image/jpeg", caption: caption || "" });
    console.log(`[whatsapp] sent image to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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
  try {
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const sent = await sock.sendMessage(resolved.jid, { video: parsed.buffer, mimetype: parsed.mime || "video/mp4", caption: caption || "" });
    console.log(`[whatsapp] sent video to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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
  try {
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const sent = await sock.sendMessage(resolved.jid, { document: parsed.buffer, fileName: fileName || "arquivo", mimetype: mime || parsed.mime || "application/octet-stream" });
    console.log(`[whatsapp] sent document to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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
  try {
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    const parsed = dataUrl ? parseDataUrl(dataUrl) : await getBufferFromUrl(url);
    const sent = await sock.sendMessage(resolved.jid, { sticker: parsed.buffer });
    console.log(`[whatsapp] sent sticker to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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
  try {
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    const sent = await sock.sendMessage(resolved.jid, { location: { degreesLatitude: lat, degreesLongitude: lng, name, address } });
    console.log(`[whatsapp] sent location to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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
  try {
    const resolved = await resolveSendJid(sock, jid);
    if (!resolved.phone) return res.status(400).json({ ok: false, error: "invalid jid" });
    if (!resolved.ok) return res.status(400).json({ ok: false, error: "number not on whatsapp", tried: resolved.tried });
    const sent = await sock.sendMessage(resolved.jid, { contacts: { displayName: displayName || "Contato", contacts: [{ vcard }] } });
    console.log(`[whatsapp] sent contact to ${resolved.jid} by tenant ${tenantId} (tried=${resolved.tried.join(",")})`);
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
