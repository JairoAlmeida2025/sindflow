import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason
} from "@whiskeysockets/baileys";
import Pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { saveMessage, normalizeJidFromMessage, updateContactAvatar } from "./supabase.js";

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
  const logger = Pino({ level: "silent" });
  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    logger
  });
  instances.set(tenantId, sock);
  states.set(tenantId, "disconnected");
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (u) => {
    const { qr, connection, lastDisconnect } = u;
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
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      instances.delete(tenantId);
      if (shouldReconnect) {
        setTimeout(() => {
          createOrGetInstance(tenantId, wsNotify).catch(() => {});
        }, 5000);
      }
    }
  });
  sock.ev.on("messages.upsert", async (m) => {
    if (wsNotify) wsNotify(tenantId, { type: "messages", payload: m });
    // Persist messages to Supabase
    for (const msg of m.messages) {
      try {
        const { jid, phone } = normalizeJidFromMessage(msg);
        const typeKey = Object.keys(msg.message || {})[0] || null;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || null;
        console.log(
          JSON.stringify({
            event: "message",
            tenantId,
            jid,
            phone,
            type: typeKey,
            text,
            fromMe: !!msg.key?.fromMe,
            id: msg.key?.id,
            ts: msg.messageTimestamp
          })
        );
      } catch {}
      try {
        const saved = await saveMessage(tenantId, msg);
        if (wsNotify && saved?.mediaUrl) {
          wsNotify(tenantId, { type: "media", payload: { remoteJid: saved.remoteJid, url: saved.mediaUrl, kind: saved.messageType, text: saved.text } });
        }
      } catch {}
    }
  });

  sock.ev.on("messaging-history.set", (history) => {
    // Process history: contacts, chats, messages
    const contacts = history.contacts || [];
    const chats = history.chats || [];
    const messages = history.messages || [];
    
    // Notify frontend
    if (wsNotify) {
      wsNotify(tenantId, { 
        type: "history", 
        payload: { 
          contacts: contacts.map(c => ({ id: c.id, name: c.name || c.notify })),
          chats: chats.map(c => ({ id: c.id, name: c.name, unread: c.unreadCount })),
          messages: messages.map(m => m) // Send raw messages for now, frontend will filter
        } 
      });
    }
  });
  sock.ev.on("messages.set", (payload) => {
    if (wsNotify) wsNotify(tenantId, { type: "messages_set", payload });
  });
  sock.ev.on("chats.set", (payload) => {
    if (wsNotify) wsNotify(tenantId, { type: "chats_set", payload });
  });
  sock.ev.on("contacts.set", (payload) => {
    if (wsNotify) wsNotify(tenantId, { type: "contacts_set", payload });
  });
  
  sock.ev.on("chats.update", (updates) => {
    if (wsNotify) wsNotify(tenantId, { type: "chat_update", payload: updates });
  });
  sock.ev.on("chats.delete", (deletes) => {
    if (wsNotify) wsNotify(tenantId, { type: "chat_delete", payload: deletes });
  });
  sock.ev.on("contacts.update", (updates) => {
    if (wsNotify) wsNotify(tenantId, { type: "contacts_update", payload: updates });
  });

  return sock;
}

export async function getProfilePic(tenantId, jid) {
  const sock = instances.get(tenantId);
  if (!sock) return null;
  try {
    // Normalize JID for consistency
    let normJid = jid;
    if (typeof normJid === "string" && normJid.endsWith("@lid")) {
      normJid = normJid.replace("@lid", "@s.whatsapp.net");
    }
    const url = await sock.profilePictureUrl(normJid, "image");
    if (url) {
      const userId = tenantId.replace("usr-", "");
      await updateContactAvatar(userId, normJid, url);
    }
    return url;
  } catch {
    return null;
  }
}

export function getQr(tenantId) {
  return qrs.get(tenantId) || null;
}

export function getStatus(tenantId) {
  return states.get(tenantId) || "disconnected";
}

export function getInstance(tenantId) {
  return instances.get(tenantId);
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
