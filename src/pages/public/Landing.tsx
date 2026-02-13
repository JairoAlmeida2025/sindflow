import { Link } from "react-router-dom";
import { Bot, MessageSquare, ShieldCheck, ArrowRight, CheckCircle2, QrCode, Settings2, Kanban } from "lucide-react";

export default function Landing() {
  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      {/* Header */}
      <header className="header" style={{ padding: "16px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "white", padding: 6, borderRadius: 8 }}>
              <Bot size={24} color="#3A1C71" />
            </div>
            <span style={{ fontWeight: "bold", fontSize: 20 }}>Sindflow A.I</span>
          </div>
          <nav className="nav" style={{ display: "flex", gap: 16 }}>
            <Link className="btn-secondary" to="/login" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)" }}>Entrar</Link>
            <Link className="btn-primary" to="/pagamento" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Assinar agora <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, padding: "8px 16px", background: "#eef2ff", border: "1px solid #e0e7ff" }}>
            <span style={{ width: 8, height: 8, background: "#6A4BCB", borderRadius: "50%" }}></span>
            I.A Premium para Condomínios
          </div>
          <h1 className="landing-h1">
            Automatize o atendimento do<br />
            <span style={{ color: "var(--roxo-fluxo)" }}>seu condomínio com I.A</span>
          </h1>
          <p className="landing-subtitle">
            Centralize conversas do WhatsApp, reduza respostas repetitivas em até 80% e ofereça suporte 24/7 para seus moradores com um agente inteligente.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 64 }}>
            <Link to="/pagamento" className="btn-primary" style={{ fontSize: 18, padding: "16px 32px" }}>Começar agora</Link>
            <Link to="/ambientes.html" className="btn-secondary" style={{ fontSize: 18, padding: "16px 32px", background: "white", color: "var(--roxo-fluxo)", border: "1px solid #eee" }}>Ver Demo</Link>
          </div>
          
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)", border: "1px solid #eee" }}>
            <img src="/images/landingpage/mockup.png" alt="Dashboard do Sindflow" style={{ width: "100%", display: "block" }} />
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section style={{ padding: "80px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: 48, color: "var(--preto-carbono)" }}>Por que escolher o Sindflow?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            <div className="benefit-card">
              <div style={{ width: 48, height: 48, background: "#ede9fe", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Kanban size={24} color="#6A4BCB" />
              </div>
              <h3>Classificação Automática</h3>
              <p style={{ color: "#666", lineHeight: 1.6 }}>O agente identifica a intenção do morador e organiza os cards no Kanban automaticamente (Reclamação, Dúvida, Agendamento).</p>
            </div>
            <div className="benefit-card">
              <div style={{ width: 48, height: 48, background: "#fff7ed", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <MessageSquare size={24} color="#ea580c" />
              </div>
              <h3>Respostas Inteligentes</h3>
              <p style={{ color: "#666", lineHeight: 1.6 }}>Treine sua base de conhecimento e deixe a IA responder dúvidas frequentes sobre boletos, áreas comuns e regras.</p>
            </div>
            <div className="benefit-card">
              <div style={{ width: 48, height: 48, background: "#ecfccb", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <ShieldCheck size={24} color="#65a30d" />
              </div>
              <h3>Controle Total</h3>
              <p style={{ color: "#666", lineHeight: 1.6 }}>Assuma a conversa quando quiser. Ative ou desative o piloto automático com um clique e monitore tudo em tempo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "2.5rem", marginBottom: 32, color: "var(--preto-carbono)" }}>Implementação em minutos</h2>
            <div className="step-item">
              <div className="step-number"><QrCode size={18} /></div>
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>Conecte seu WhatsApp</h4>
                <p style={{ margin: 0, color: "#666" }}>Escaneie o QR Code para vincular o número do condomínio.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number"><Settings2 size={18} /></div>
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>Configure o Agente</h4>
                <p style={{ margin: 0, color: "#666" }}>Defina o tom de voz e faça upload dos documentos (Regimento, Atas).</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number"><CheckCircle2 size={18} /></div>
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>Pronto para usar</h4>
                <p style={{ margin: 0, color: "#666" }}>Veja as conversas chegando e sendo organizadas magicamente.</p>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <img src="/images/landingpage/landingpage_004.png" alt="Interface 1" style={{ width: "100%", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
            <img src="/images/landingpage/landingpage_005.png" alt="Interface 2" style={{ width: "100%", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", marginLeft: 24 }} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "var(--preto-carbono)", color: "white", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <Bot size={24} color="#F4C430" />
              <span style={{ fontWeight: "bold", fontSize: 20 }}>Sindflow A.I</span>
            </div>
            <p style={{ color: "#999", maxWidth: 300 }}>A revolução no atendimento condominial.</p>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            <Link to="#" style={{ color: "#ccc", textDecoration: "none" }}>Termos de Uso</Link>
            <Link to="#" style={{ color: "#ccc", textDecoration: "none" }}>Privacidade</Link>
            <Link to="#" style={{ color: "#ccc", textDecoration: "none" }}>Suporte</Link>
            <Link to="/ambientes.html" style={{ color: "#F4C430", textDecoration: "none" }}>Área do Desenvolvedor</Link>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "48px auto 0", borderTop: "1px solid #333", paddingTop: 24, textAlign: "center", color: "#666", fontSize: 14 }}>
          © 2026 Sindflow A.I. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}