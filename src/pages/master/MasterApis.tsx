import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2, Eye, EyeOff, Save, Plus } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  provider: string;
  key: string;
  active: boolean;
  available_to_clients: boolean;
};

export default function MasterApis() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", provider: "OpenAI", key: "", active: true });
  const [showKey, setShowKey] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error("Erro ao buscar chaves:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveKey() {
    if (!form.name || !form.key) {
      alert("Preencha nome e chave.");
      return;
    }

    try {
      const { data, error } = await supabase.from("api_keys").insert([
        {
          name: form.name,
          provider: form.provider,
          key: form.key,
          active: form.active,
          available_to_clients: true
        }
      ]).select();

      if (error) throw error;

      setKeys([...(data || []), ...keys]);
      setForm({ name: "", provider: "OpenAI", key: "", active: true });
      alert("Chave salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar chave:", error);
      alert("Erro ao salvar chave.");
    }
  }

  async function deleteKey(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta chave?")) return;

    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
      setKeys(keys.filter(k => k.id !== id));
    } catch (error) {
      console.error("Erro ao excluir chave:", error);
      alert("Erro ao excluir chave.");
    }
  }

  async function toggleStatus(key: ApiKey) {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ active: !key.active })
        .eq("id", key.id);

      if (error) throw error;
      
      setKeys(keys.map(k => k.id === key.id ? { ...k, active: !k.active } : k));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Gestão de APIs de I.A</h1>
      
      <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #eee", marginBottom: 32 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nova Chave</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <input 
            placeholder="Nome da chave (ex: OpenAI Production)" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
          <select 
            value={form.provider} 
            onChange={e => setForm({ ...form, provider: e.target.value })}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          >
            <option value="OpenAI">OpenAI</option>
            <option value="Gemini">Gemini</option>
            <option value="Anthropic">Anthropic</option>
          </select>
          <input 
            placeholder="Chave da API (sk-...)" 
            value={form.key} 
            onChange={e => setForm({ ...form, key: e.target.value })} 
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input 
              type="checkbox" 
              checked={form.active} 
              onChange={e => setForm({ ...form, active: e.target.checked })} 
            />
            Ativa
          </label>
          
          <button 
            onClick={saveKey} 
            className="btn-primary" 
            style={{ width: "fit-content", display: "flex", alignItems: "center", gap: 8 }}
          >
            <Save size={18} /> Salvar Chave
          </button>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ padding: 16, textAlign: "left" }}>Nome</th>
              <th style={{ padding: 16, textAlign: "left" }}>Provedor</th>
              <th style={{ padding: 16, textAlign: "left" }}>Chave</th>
              <th style={{ padding: 16, textAlign: "left" }}>Status</th>
              <th style={{ padding: 16, textAlign: "left" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 16 }}>{k.name}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ 
                    padding: "4px 8px", 
                    borderRadius: 6, 
                    background: "#f3f4f6", 
                    fontSize: 12, 
                    fontWeight: 500 
                  }}>
                    {k.provider}
                  </span>
                </td>
                <td style={{ padding: 16, fontFamily: "monospace", color: "#666" }}>
                  {showKey[k.id] ? k.key : `${k.key.substring(0, 5)}...`}
                  <button 
                    onClick={() => setShowKey({ ...showKey, [k.id]: !showKey[k.id] })}
                    style={{ background: "none", border: "none", marginLeft: 8, cursor: "pointer", verticalAlign: "middle" }}
                  >
                    {showKey[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </td>
                <td style={{ padding: 16 }}>
                  <span style={{ 
                    color: k.active ? "#166534" : "#991b1b",
                    background: k.active ? "#dcfce7" : "#fee2e2",
                    padding: "4px 8px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {k.active ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td style={{ padding: 16, display: "flex", gap: 8 }}>
                  <button 
                    onClick={() => toggleStatus(k)}
                    style={{ 
                      padding: "6px 12px", 
                      borderRadius: 6, 
                      border: "1px solid #ddd", 
                      background: "white", 
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    {k.active ? "Desativar" : "Ativar"}
                  </button>
                  <button 
                    onClick={() => deleteKey(k.id)}
                    style={{ 
                      padding: 6, 
                      borderRadius: 6, 
                      border: "1px solid #fee2e2", 
                      background: "#fff1f2", 
                      color: "#e11d48",
                      cursor: "pointer"
                    }}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#666" }}>
                  Nenhuma chave cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}