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
        setError("E-mail ou senha inválidos");
        return;
      }
      nav("/app/conversas");
    })();
  };
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h1>Entrar</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="btn-primary">Entrar</button>
        <button type="button" onClick={() => setError("")}>Esqueci minha senha</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
