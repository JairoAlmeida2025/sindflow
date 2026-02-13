import { useState } from "react";

export default function AgentConfig() {
  const [enabled, setEnabled] = useState(true);
  const [prompt, setPrompt] = useState("Você é um agente de atendimento condominial.");
  const providers = ["OpenAI"];
  const [provider, setProvider] = useState(providers[0]);
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        Ativar agente
      </label>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={10} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Provedor:</span>
        <select value={provider} onChange={e => setProvider(e.target.value)}>
          {providers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button className="btn-primary">Salvar alterações</button>
      <p>Nenhum provedor disponível. Contate o suporte.</p>
    </div>
  );
}
