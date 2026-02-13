import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function MasterWhatsapp() {
  const [loading, setLoading] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  async function connect() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("evo-proxy", {
        body: { action: "create" }
      });
      if (error) throw error;
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
      const { data, error } = await supabase.functions.invoke("evo-proxy", {
        body: { action: "qrcode" }
      });
      if (error) throw error;
      const payload = data?.data || data;
      setQrBase64(payload?.qr || payload?.qrcode || null);
      setStatus(payload?.status || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("evo-proxy", {
          body: { action: "status" }
        });
        const payload = data?.data || data;
        const s = payload?.status || payload?.state || "disconnected";
        setStatus(s);
        setConnected(s === "connected" || s === "CONNECTED");
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, []);

  async function disconnect() {
    setLoading(true);
    try {
      await supabase.functions.invoke("evo-proxy", { body: { action: "logout" } });
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

