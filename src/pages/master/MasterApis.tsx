import { useState } from "react";

type ApiKey = { id: string; name: string; provider: string; active: boolean; availableToClients: boolean };

export default function MasterApis() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [form, setForm] = useState({ name: "", provider: "OpenAI", key: "", active: true });
  const add = () => {
    if (!form.name || !form.key) return;
    setKeys([...keys, { id: Math.random().toString(36).slice(2), name: form.name, provider: form.provider, active: form.active, availableToClients: true }]);
    setForm({ name: "", provider: "OpenAI", key: "", active: true });
  };
  return (
    <div style={{ padding: 24 }}>
      <h1>Gestão de APIs de I.A</h1>
      <button onClick={add}>Nova chave</button>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <input placeholder="Nome da chave" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}>
          <option>OpenAI</option>
          <option>Gemini</option>
        </select>
        <input placeholder="Chave da API" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} />
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
          Ativa
        </label>
      </div>
      <table style={{ width: "100%", marginTop: 16 }}>
        <thead>
          <tr>
            <th>Nome</th><th>Provedor</th><th>Status</th><th>Disponível</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id}>
              <td>{k.name}</td>
              <td>{k.provider}</td>
              <td>{k.active ? "Ativa" : "Inativa"}</td>
              <td>{k.availableToClients ? "Sim" : "Não"}</td>
              <td>
                <button onClick={() => setKeys(keys.map(x => x.id === k.id ? { ...x, active: !x.active } : x))}>Desativar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
