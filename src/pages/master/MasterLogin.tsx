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
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h1>Login Master</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
