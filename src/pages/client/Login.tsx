import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      setError("");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Erro no login:", error);
        setError(error.message);
        return;
      }
      
      // Consultar role no profile
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        
        if (profile?.role === "master") {
          nav("/master/dashboard");
        } else {
          nav("/app/conversas");
        }
      }
    })();
  };
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--roxo-profundo)" }}>
      <div style={{ width: 380, background: "white", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.08)", border: "1px solid #eee", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img src="/logo/favico_90x90.png" alt="" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div style={{ display: "grid" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--preto-carbono)" }}>Sindflow A.I</span>
            <span style={{ fontSize: 12, color: "#667781" }}>Acesso ao painel</span>
          </div>
        </div>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <input 
            placeholder="E-mail" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #dfe4ea", outline: "none", fontSize: 14 }} 
          />
          <input 
            placeholder="Senha" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #dfe4ea", outline: "none", fontSize: 14 }} 
          />
          <button type="submit" className="btn-primary" style={{ padding: "12px 16px", borderRadius: 10, fontWeight: 600 }}>Entrar</button>
          <button type="button" className="btn-secondary" style={{ padding: "10px 16px", borderRadius: 10, background: "white", color: "var(--roxo-fluxo)", border: "1px solid #eee" }} onClick={() => setError("")}>Esqueci minha senha</button>
        </form>
        {error && <p style={{ color: "#ef4444", marginTop: 10, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}
