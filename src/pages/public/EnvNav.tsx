import { Link } from "react-router-dom";

export default function EnvNav() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>Ambientes do Sistema</h1>
      <ul style={{ display: "grid", gap: 12 }}>
        <li><Link to="/">Landing Page</Link></li>
        <li><Link to="/login">Login Cliente</Link></li>
        <li><Link to="/master/login">Login Master</Link></li>
        <li><Link to="/app/conversas">Dashboard Cliente</Link></li>
        <li><Link to="/master">Dashboard Master</Link></li>
      </ul>
    </div>
  );
}
