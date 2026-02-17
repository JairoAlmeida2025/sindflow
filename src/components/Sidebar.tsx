import { NavLink } from "react-router-dom";

const items = [
  { to: "/app/conversas", label: "Conversas" },
  { to: "/app/whatsapp", label: "Conexão WhatsApp" },
  { to: "/app/conexao", label: "Conexão" },
  { to: "/app/agente", label: "Agente IA" },
  { to: "/app/kanban", label: "Solicitações" },
  { to: "/app/contatos", label: "Moradores" },
  { to: "/app/conhecimento", label: "Relatórios" },
  { to: "/app/configuracoes", label: "Configurações" }
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 260,
      background: "linear-gradient(180deg, #3A1C71 0%, #6A4BCB 100%)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      height: "100vh"
    }}>
      <div style={{
        height: 64,
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid rgba(0,0,0,0.1)"
      }}>
        <img src="/logo/logo_oficial.png" alt="Sindflow" style={{ maxHeight: "80%", maxWidth: "90%", objectFit: "contain" }} />
      </div>
      <nav style={{ display: "grid", gap: 8, padding: 16 }}>
        {items.map(i => (
          <NavLink
            key={i.to}
            to={i.to}
            style={({ isActive }) => ({
              padding: "10px 12px",
              borderRadius: 10,
              background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
              color: "#fff",
              textDecoration: "none"
            })}
          >
            {i.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
