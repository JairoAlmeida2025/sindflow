import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import Pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const sessionsDir = process.env.WHATSAPP_SESSIONS_DIR
  ? path.resolve(process.env.WHATSAPP_SESSIONS_DIR)
  : path.resolve(process.cwd(), "whatsapp-service", "sessions");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

const instances = new Map();
const states = new Map();
const qrs = new Map();

export async function createOrGetInstance(tenantId, wsNotify) {
  if (instances.has(tenantId)) return instances.get(tenantId);
  const tenantDir = path.join(sessionsDir, tenantId);
  if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(tenantDir);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: Pino({ level: "silent" })
  });
  instances.set(tenantId, sock);
  states.set(tenantId, "disconnected");
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (u) => {
    const { qr, connection } = u;
    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr);
      qrs.set(tenantId, dataUrl);
      states.set(tenantId, "qr_required");
      if (wsNotify) wsNotify(tenantId, { type: "qr", qr: dataUrl });
    }
    if (connection === "open") {
      states.set(tenantId, "connected");
      qrs.delete(tenantId);
      if (wsNotify) wsNotify(tenantId, { type: "status", status: "connected" });
    }
    if (connection === "close") {
      states.set(tenantId, "disconnected");
      if (wsNotify) wsNotify(tenantId, { type: "status", status: "disconnected" });
    }
  });
  sock.ev.on("messages.upsert", (m) => {
    if (wsNotify) wsNotify(tenantId, { type: "messages", payload: m });
  });
  return sock;
}

export function getQr(tenantId) {
  return qrs.get(tenantId) || null;
}

export function getStatus(tenantId) {
  return states.get(tenantId) || "disconnected";
}

export async function logout(tenantId) {
  const sock = instances.get(tenantId);
  if (sock) {
    try { await sock.logout(); } catch {}
  }
  instances.delete(tenantId);
  states.set(tenantId, "disconnected");
  qrs.delete(tenantId);
  const tenantDir = path.join(sessionsDir, tenantId);
  try { fs.rmSync(tenantDir, { recursive: true, force: true }); } catch {}
  return true;
}
