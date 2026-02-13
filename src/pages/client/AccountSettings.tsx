import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Upload, Save } from "lucide-react";

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.photo_url || "");
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const updates = {
        id: user.id,
        display_name: displayName,
        photo_url: avatarUrl,
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;

      setMessage("Perfil atualizado com sucesso!");
    } catch (error) {
      setMessage("Erro ao atualizar perfil.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setMessage("");
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Selecione uma imagem.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("public-assets").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      setMessage("Imagem enviada! Clique em Salvar para confirmar.");
      
    } catch (error: any) {
      setMessage(`Erro no upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Minha Conta</h1>
      
      <div style={{ maxWidth: 600, background: "white", padding: 32, borderRadius: 12, border: "1px solid #eee" }}>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ 
            width: 120, 
            height: 120, 
            borderRadius: "50%", 
            background: "#f0f0f0", 
            marginBottom: 16,
            backgroundImage: `url(${avatarUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "4px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }} />
          
          <label className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Upload size={16} />
            {uploading ? "Enviando..." : "Alterar Foto"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={uploadAvatar} 
              disabled={uploading}
              style={{ display: "none" }} 
            />
          </label>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Nome de Exibição</label>
            <input 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
              placeholder="Seu nome ou nome do condomínio"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>E-mail (não editável)</label>
            <input 
              value={email}
              disabled
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", color: "#666" }}
            />
          </div>

          <button 
            onClick={updateProfile}
            className="btn-primary"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}
          >
            <Save size={18} />
            Salvar Alterações
          </button>

          {message && (
            <p style={{ 
              textAlign: "center", 
              color: message.includes("Erro") ? "red" : "green",
              background: message.includes("Erro") ? "#fee2e2" : "#dcfce7",
              padding: 12,
              borderRadius: 8
            }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}