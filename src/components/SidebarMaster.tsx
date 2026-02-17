import { NavLink } from "react-router-dom";

const items = [
  { to: "/master/conversas", label: "Conversas" },
  { to: "/master/clientes", label: "Clientes" },
  { to: "/master/apis", label: "Configurar APIs" },
];

export default function SidebarMaster() {
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
        height: 64, // Ajustado para 64px para alinhar com o header
        background: "white", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        padding: 0 // Remove padding extra se houver
      }}>
        <img src="/logo/logo_oficial.png" alt="Sindflow Master" style={{ maxHeight: "80%", maxWidth: "90%", objectFit: "contain" }} />
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
