export default function MasterDashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard Master</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <strong>Usuários ativos</strong>
          <div>0</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <strong>Requisições I.A (mês)</strong>
          <div>0</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <strong>Conexões WhatsApp ativas</strong>
          <div>0</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <strong>Status do sistema</strong>
          <div>🟢 OK</div>
        </div>
      </div>
    </div>
  );
}
