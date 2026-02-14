import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { WHATSAPP_API_URL } from "../../lib/config";

export default function MasterWhatsapp() {
  const [loading, setLoading] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [instanceName, setInstanceName] = useState<string>("");

  async function connect() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const name = user ? `usr-${user.id}` : "evolution_exchange";
      setInstanceName(name);
      await fetch(`${WHATSAPP_API_URL}/whatsapp/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: name })
      });
      await getQr();
    } catch (e) {
      console.error(e);
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
      setQrBase64(json.qr || null);
      setStatus(json.status || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
        const res = await fetch(`${WHATSAPP_API_URL}/whatsapp/status?tenantId=${encodeURIComponent(name)}`);
        const json = await res.json();
        const s = json.status || "disconnected";
        setStatus(s);
        setConnected(s === "connected" || s === "CONNECTED");
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, []);

  async function disconnect() {
    setLoading(true);
    try {
      const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
      await fetch(`${WHATSAPP_API_URL}/whatsapp/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: name })
      });
      setConnected(false);
      setQrBase64(null);
      setStatus("disconnected");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Conexão WhatsApp</h1>
      <p style={{ color: "#666" }}>Escaneie o QR Code abaixo no WhatsApp para conectar sua instância.</p>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {qrBase64 ? (
            <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code" style={{ width: 280, height: 280 }} />
          ) : (
            <div style={{ color: "#666" }}>{loading ? "Carregando QR..." : "QR indisponível"}</div>
          )}
        </div>
        <div>
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
            <h3>Status</h3>
            <p>{status || "Desconectado"}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={connect} className="btn-primary" disabled={loading || connected}>Conectar</button>
              <button onClick={getQr} className="btn-secondary" disabled={loading}>Atualizar QR</button>
              <button onClick={disconnect} className="btn-secondary" disabled={loading || !connected}>Desconectar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

