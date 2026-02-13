import { useState } from "react";

export default function AccountSettings() {
  const [name, setName] = useState("Síndico Exemplo");
  const [email, setEmail] = useState("sindico@example.com");
  const [plan, setPlan] = useState("Mensal");
  const [paymentStatus, setPaymentStatus] = useState("Ativo");
  const [photo, setPhoto] = useState<File | null>(null);
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, display: "grid", gap: 12 }}>
      <div>
        <label>Nome</label>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label>E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label>Plano</label>
        <input value={plan} onChange={e => setPlan(e.target.value)} />
      </div>
      <div>
        <label>Status do pagamento</label>
        <input value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} />
      </div>
      <button>Alterar senha</button>
      <div>
        <label>Foto de perfil</label>
        <input type="file" onChange={e => setPhoto(e.target.files?.[0] || null)} />
      </div>
    </div>
  );
}
