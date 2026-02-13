import { Link, Outlet, useLocation } from "react-router-dom";
import SidebarMaster from "../components/SidebarMaster";

export default function MasterShell() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "100vh" }}>
      <SidebarMaster />
      <div style={{ display: "grid", gridTemplateRows: "64px 1fr", background: "#f5f5f5" }}>
        <header className="header" style={{ display: "flex", alignItems: "center", padding: "0 24px", background: "white", borderBottom: "1px solid #eee", color: "#333" }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Administração do Sistema</h2>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "#666" }}>Master Admin</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3A1C71", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              M
            </div>
          </div>
        </header>
        <main style={{ padding: 24, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}