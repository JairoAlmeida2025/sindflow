import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AppShell() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "100vh" }}>
      <Sidebar />
      <div style={{ display: "grid", gridTemplateRows: "64px 1fr" }}>
        <header className="header" style={{ display: "flex", alignItems: "center", padding: "0 16px", background: "#3A1C71", color: "white", position: "relative" }}>
          <nav className="nav" style={{ display: "flex", gap: 12 }}>
            <Link to="/app/conversas" style={{ color: "white" }}>Conversas</Link>
            <Link to="/app/kanban" style={{ color: "white" }}>Solicitações</Link>
            <Link to="/app/agente" style={{ color: "white" }}>Agente IA</Link>
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "white" }}>Agente:</span>
            <span className="indicator-agente" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>Ativo</span>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ all: "unset", cursor: "pointer" }}>
              <img src="/logo/favico_90x90.png" alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%" }} />
            </button>
          </div>
          {menuOpen && (
            <div style={{
              position: "absolute",
              right: 16,
              top: 56,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
              padding: 8,
              minWidth: 180,
              color: "#1F1F1F",
              display: "grid",
              gap: 4
            }}>
              <Link to="/app/configuracoes" style={{ textDecoration: "none", color: "#1F1F1F", padding: "8px 10px", borderRadius: 8 }}>Perfil</Link>
              <button
                className="btn-secondary"
                onClick={async () => {
                  await supabase.auth.signOut();
                  nav("/login");
                }}
                style={{ width: "100%" }}
              >
                Sair
              </button>
            </div>
          )}
        </header>
        <main style={{ padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
