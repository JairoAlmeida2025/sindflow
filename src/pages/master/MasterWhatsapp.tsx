import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function MasterWhatsapp() {
  const [loading, setLoading] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function getQr() {
    setLoading(true);
    try {
      const res = await fetch("/api/evo/qrcode");
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
    getQr();
    const id = setInterval(() => getQr(), 5000);
    return () => clearInterval(id);
  }, []);

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
            <button onClick={getQr} className="btn-secondary">Atualizar QR</button>
          </div>
        </div>
      </div>
    </div>
  );
}

