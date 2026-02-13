import { useState } from "react";

export default function MasterPayments() {
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState<"conectado" | "nao" | "erro">("nao");
  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1>Configuração de Pagamentos</h1>
      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="Public Key" value={publicKey} onChange={e => setPublicKey(e.target.value)} />
        <input placeholder="Secret Key" value={secretKey} onChange={e => setSecretKey(e.target.value)} />
        <input placeholder="Webhook Secret" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} />
        <input placeholder="ID do Produto / Plano" value={productId} onChange={e => setProductId(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button>Salvar Configurações</button>
          <button onClick={() => setStatus("conectado")}>Testar Conexão</button>
        </div>
        <div>
          {status === "conectado" ? "Stripe configurado com sucesso" : status === "erro" ? "Erro ao validar credenciais" : "Não configurado"}
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <h2>Status do Sistema de Pagamento</h2>
        <div>Assinaturas ativas: 0</div>
        <div>Assinaturas canceladas: 0</div>
        <div>Receita mensal estimada: R$ 0,00</div>
        <div>Status do webhook: Inativo</div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <h2>Ações Administrativas</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button>Desativar pagamentos</button>
          <button>Reativar pagamentos</button>
        </div>
        <div>Desativar pagamentos impede novas assinaturas</div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div>Integração Stripe não configurada. A plataforma não poderá receber pagamentos.</div>
        <div>Webhook não validado. Assinaturas podem não ser sincronizadas.</div>
      </div>
    </div>
  );
}
