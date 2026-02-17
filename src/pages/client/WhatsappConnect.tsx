import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { WHATSAPP_API_URL } from "../../lib/config";

export default function WhatsappConnect() {
  const [status, setStatus] = useState<"conectado" | "desconectado" | "reconectando">("desconectado");
  const [number, setNumber] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [instanceName, setInstanceName] = useState<string>("");

  async function connect() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const name = user ? `usr-${user.id}` : "default";
      setInstanceName(name);
      await fetch(`${WHATSAPP_API_URL}/whatsapp/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: name })
      });
      await getQr();
    } finally {
      setLoading(false);
    }
  }

  async function getQr() {
    setLoading(true);
    try {
      const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
      const res = await fetch(`${WHATSAPP_API_URL}/whatsapp/qrcode?tenantId=${encodeURIComponent(name)}`);
      const json = await res.json();
      const val = json.qr || null;
      setQrBase64(val ? (val.startsWith("data:") ? val : `data:image/png;base64,${val}`) : null);
      setStatus(json.status === "connected" ? "conectado" : json.status === "qr_required" ? "reconectando" : "desconectado");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    try {
      const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
      await fetch(`${WHATSAPP_API_URL}/whatsapp/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: name })
      });
      setStatus("desconectado");
      setQrBase64(null);
      setNumber(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    connect();
    const id = setInterval(async () => {
      const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
      const res = await fetch(`${WHATSAPP_API_URL}/whatsapp/status?tenantId=${encodeURIComponent(name)}`);
      const json = await res.json();
      const s = json.status || "desconectado";
      setStatus(s === "connected" ? "conectado" : s === "qr_required" ? "reconectando" : "desconectado");
    }, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      <h1>Conectar WhatsApp</h1>
      {status === "conectado" ? (
        <div style={{ 
          border: "1px solid #dcfce7", 
          background: "#f0fdf4", 
          borderRadius: 8, 
          height: 240, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          gap: 16
        }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            background: "#22c55e", 
            borderRadius: "50%", 
            display: "grid", 
            placeItems: "center",
            color: "white",
            fontSize: 32
          }}>
            ✓
          </div>
          <div style={{ color: "#166534", fontWeight: 600, fontSize: 18 }}>WhatsApp Conectado</div>
          <div style={{ color: "#15803d" }}>Sua integração está ativa e funcionando.</div>
        </div>
      ) : (
        <>
          <div style={{ border: "1px dashed #ccc", borderRadius: 8, height: 240, display: "grid", placeItems: "center" }}>
            {qrBase64 ? <img src={qrBase64} alt="QR Code" style={{ width: 220, height: 220 }} /> : <span>{status === "reconectando" ? "Reconectando..." : "Carregando QR Code..."}</span>}
          </div>
          <p>Escaneie com seu WhatsApp</p>
        </>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
        {status !== "conectado" && <button onClick={connect} disabled={loading || status === "reconectando"} className="btn-primary">Conectar</button>}
        {status !== "conectado" && <button onClick={getQr} disabled={loading} className="btn-secondary">Atualizar QR</button>}
        {status === "conectado" && <button onClick={disconnect} disabled={loading} className="btn-secondary" style={{ color: "#ef4444", borderColor: "#ef4444" }}>Desconectar</button>}
      </div>
      {number ? (
        <div style={{ display: "flex", gap: 8 }}>
          <span>Número conectado: {number}</span>
          <button onClick={() => { setNumber(null); setStatus("desconectado"); }}>Desconectar</button>
        </div>
      ) : null}
    </div>
  );
}
