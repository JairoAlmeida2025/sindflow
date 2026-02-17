import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MasterLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav("/master");
  };
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--roxo-profundo)" }}>
      <div style={{ width: 380, background: "white", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.08)", border: "1px solid #eee", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img src="/logo/favico_90x90.png" alt="" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div style={{ display: "grid" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--preto-carbono)" }}>Sindflow A.I</span>
            <span style={{ fontSize: 12, color: "#667781" }}>Acesso Master</span>
          </div>
        </div>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
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
        </form>
      </div>
    </div>
  );
}
