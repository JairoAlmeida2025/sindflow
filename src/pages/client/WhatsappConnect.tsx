import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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
      const name = user ? `usr-${user.id}` : "evolution_exchange";
      setInstanceName(name);
      await supabase.functions.invoke("smart-worker", { body: { action: "create-instance", instanceName: name } });
      await getQr();
    } finally {
      setLoading(false);
    }
  }

  async function getQr() {
    setLoading(true);
    try {
      const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
      const { data } = await supabase.functions.invoke("smart-worker", { body: { action: "get-qrcode", instanceName: name } });
      const payload = data?.data || data;
      setQrBase64(payload?.qr || payload?.qrcode || payload?.base64 || null);
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    try {
      const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
      await supabase.functions.invoke("smart-worker", { body: { action: "logout", instanceName: name } });
      setStatus("desconectado");
      setQrBase64(null);
      setNumber(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setInterval(async () => {
      const name = instanceName || `usr-${(await supabase.auth.getUser()).data.user?.id}`;
      const { data } = await supabase.functions.invoke("smart-worker", { body: { action: "get-status", instanceName: name } });
      const payload = data?.data || data;
      const s = payload?.status || payload?.instance?.state || "desconectado";
      setStatus(s.toLowerCase().includes("connect") ? "conectado" : "desconectado");
    }, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      <h1>Conectar WhatsApp</h1>
      <div style={{ border: "1px dashed #ccc", borderRadius: 8, height: 240, display: "grid", placeItems: "center" }}>
        {qrBase64 ? <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code" style={{ width: 220, height: 220 }} /> : <span>QR Code</span>}
      </div>
      <p>Escaneie com seu WhatsApp</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Status: {status}</span>
        <button onClick={connect} disabled={loading} className="btn-primary">Conectar</button>
        <button onClick={getQr} disabled={loading} className="btn-secondary">Atualizar QR</button>
        <button onClick={disconnect} disabled={loading} className="btn-secondary">Desconectar</button>
      </div>
      {status === "conectado" && <div>WhatsApp conectado com sucesso</div>}
      {number ? (
        <div style={{ display: "flex", gap: 8 }}>
          <span>Número conectado: {number}</span>
          <button onClick={() => { setNumber(null); setStatus("desconectado"); }}>Desconectar</button>
        </div>
      ) : null}
    </div>
  );
}
