import { useState } from "react";
import { Link } from "react-router-dom";

export default function Payment() {
  const [status, setStatus] = useState<"idle" | "success">("idle");
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>Assine o SindFlow A.I</h1>
      <p>Plano mensal • Atendimento inteligente e Kanban de demandas</p>
      <h2>R$ 49,90 / mês</h2>
      <button onClick={() => setStatus("success")} className="btn-primary">
        Assinar com cartão
      </button>
      {status === "success" && (
        <div style={{ marginTop: 16 }}>
          <strong>Assinatura confirmada!</strong>
          <p>Redirecionando para login...</p>
          <Link to="/login">Ir para Login</Link>
        </div>
      )}
    </div>
  );
}
