import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import SidebarMaster from "../components/SidebarMaster";
import { supabase } from "../lib/supabase";

export default function MasterShell() {
  const nav = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav("/login");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "100vh" }}>
      <SidebarMaster />
      <div style={{ display: "grid", gridTemplateRows: "64px 1fr", background: "#f5f5f5" }}>
        <header className="header" style={{ display: "flex", alignItems: "center", padding: "0 24px", background: "white", borderBottom: "1px solid #eee", color: "#333" }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Administração do Sistema</h2>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <Link to="/master/perfil" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#333" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3A1C71", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Master Admin</span>
            </Link>
            <button 
              onClick={handleLogout}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", gap: 4 }}
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <main style={{ padding: 24, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}