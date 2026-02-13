import { useState } from "react";

export default function WhatsappConnect() {
  const [status, setStatus] = useState<"conectado" | "desconectado" | "reconectando">("desconectado");
  const [number, setNumber] = useState<string | null>(null);
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      <h1>Conectar WhatsApp</h1>
      <div style={{ border: "1px dashed #ccc", borderRadius: 8, height: 240, display: "grid", placeItems: "center" }}>
        <span>QR Code</span>
      </div>
      <p>Escaneie com seu WhatsApp</p>
      <div style={{ display: "flex", gap: 8 }}>
        <span>Status: {status}</span>
        <button onClick={() => setStatus("reconectando")}>Atualizar QR Code</button>
      </div>
      <div>WhatsApp conectado com sucesso</div>
      {number ? (
        <div style={{ display: "flex", gap: 8 }}>
          <span>Número conectado: {number}</span>
          <button onClick={() => { setNumber(null); setStatus("desconectado"); }}>Desconectar</button>
        </div>
      ) : null}
    </div>
  );
}
