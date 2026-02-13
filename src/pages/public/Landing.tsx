import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header className="header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <img src="/logo/logo_oficial.png" alt="Sindflow A.I" style={{ height: 40 }} />
        <nav className="nav" style={{ display: "flex", gap: 12 }}>
          <Link className="btn-secondary" to="/login">Entrar</Link>
          <Link className="btn-primary" to="/pagamento">Assinar agora</Link>
        </nav>
      </header>
      <section style={{ marginTop: 48 }}>
        <h1>Automatize o atendimento do seu condomínio com I.A</h1>
        <p>Centralize conversas do WhatsApp e reduza respostas repetitivas com um agente de I.A.</p>
        <img src="/images/landingpage/mockup.png" alt="Mockup" style={{ width: "100%", marginTop: 24, borderRadius: 12 }} />
      </section>
      <section style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div className="card">
          <img src="/images/landingpage/landingpage_001.png" alt="Benefício 1" style={{ width: "100%", borderRadius: 8 }} />
          <h3>Classificação automática</h3>
          <p>Organize por intenção com etiquetas e Kanban.</p>
        </div>
        <div className="card">
          <img src="/images/landingpage/landingpage_002.png" alt="Benefício 2" style={{ width: "100%", borderRadius: 8 }} />
          <h3>Respostas inteligentes</h3>
          <p>FAQs e agendamentos com rapidez.</p>
        </div>
        <div className="card">
          <img src="/images/landingpage/landingpage_003.png" alt="Benefício 3" style={{ width: "100%", borderRadius: 8 }} />
          <h3>Controle total</h3>
          <p>Ative/desative o agente a qualquer momento.</p>
        </div>
      </section>
      <section style={{ marginTop: 48 }}>
        <h2>Como funciona</h2>
        <ol>
          <li>Conecte seu WhatsApp via QR Code</li>
          <li>Ative o agente e configure o prompt</li>
          <li>Veja o Kanban organizar suas conversas</li>
        </ol>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <img src="/images/landingpage/landingpage_004.png" alt="Passo a passo 1" style={{ width: "100%", borderRadius: 8 }} />
          <img src="/images/landingpage/landingpage_005.png" alt="Passo a passo 2" style={{ width: "100%", borderRadius: 8 }} />
        </div>
      </section>
      <footer style={{ marginTop: 64, display: "flex", gap: 16 }}>
        <Link to="#">Termos</Link>
        <Link to="#">Política de privacidade</Link>
        <Link to="#">Contato</Link>
        <Link to="/ambientes.html">Ambientes (dev)</Link>
      </footer>
    </div>
  );
}
