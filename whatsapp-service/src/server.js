import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import http from "http";
import { createOrGetInstance, getQr, getStatus, logout } from "./instanceManager.js";

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET","POST","DELETE","OPTIONS"],
  credentials: false
}));

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
server.listen(PORT, () => {});
