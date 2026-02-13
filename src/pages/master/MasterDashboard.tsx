import { Users, Server, Activity, DollarSign } from "lucide-react";

export default function MasterDashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24, color: "#333" }}>Visão Geral</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
        
        {/* Card 1 */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, color: "#666", fontSize: 14 }}>Usuários Ativos</p>
              <h2 style={{ margin: "4px 0 0", fontSize: 28 }}>124</h2>
            </div>
            <div style={{ padding: 8, background: "#eef2ff", borderRadius: 8 }}>
              <Users size={20} color="#6A4BCB" />
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>+12% este mês</span>
        </div>

        {/* Card 2 */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, color: "#666", fontSize: 14 }}>Requisições I.A.</p>
              <h2 style={{ margin: "4px 0 0", fontSize: 28 }}>45.2k</h2>
            </div>
            <div style={{ padding: 8, background: "#fff7ed", borderRadius: 8 }}>
              <Activity size={20} color="#ea580c" />
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#666" }}>Total acumulado</span>
        </div>

        {/* Card 3 */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, color: "#666", fontSize: 14 }}>Receita Mensal</p>
              <h2 style={{ margin: "4px 0 0", fontSize: 28 }}>R$ 12.4k</h2>
            </div>
            <div style={{ padding: 8, background: "#f0fdf4", borderRadius: 8 }}>
              <DollarSign size={20} color="#15803d" />
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>+8% vs mês anterior</span>
        </div>

        {/* Card 4 */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, color: "#666", fontSize: 14 }}>Status do Sistema</p>
              <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#10b981" }}>Online</h2>
            </div>
            <div style={{ padding: 8, background: "#f0fdf4", borderRadius: 8 }}>
              <Server size={20} color="#10b981" />
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#666" }}>Todos os serviços operacionais</span>
        </div>

      </div>

      <div style={{ marginTop: 32, background: "white", padding: 24, borderRadius: 12, border: "1px solid #eee" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>Clientes Recentes</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
              <th style={{ padding: 12, color: "#666", fontWeight: 500 }}>Cliente</th>
              <th style={{ padding: 12, color: "#666", fontWeight: 500 }}>Plano</th>
              <th style={{ padding: 12, color: "#666", fontWeight: 500 }}>Status</th>
              <th style={{ padding: 12, color: "#666", fontWeight: 500 }}>Data</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 12 }}>Condomínio Jardins</td>
              <td style={{ padding: 12 }}>Pro</td>
              <td style={{ padding: 12 }}><span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>Ativo</span></td>
              <td style={{ padding: 12, color: "#666" }}>12/02/2026</td>
            </tr>
            <tr>
              <td style={{ padding: 12 }}>Residencial Parque</td>
              <td style={{ padding: 12 }}>Básico</td>
              <td style={{ padding: 12 }}><span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>Ativo</span></td>
              <td style={{ padding: 12, color: "#666" }}>10/02/2026</td>
            </tr>
            <tr>
              <td style={{ padding: 12 }}>Edifício Central</td>
              <td style={{ padding: 12 }}>Enterprise</td>
              <td style={{ padding: 12 }}><span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>Pendente</span></td>
              <td style={{ padding: 12, color: "#666" }}>09/02/2026</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
