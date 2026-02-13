export default function MetricsBar() {
  const card = (title: string, value: string, color: string) => (
    <div className="card" style={{
      display: "grid",
      gap: 4,
      background: "linear-gradient(180deg, rgba(106,75,203,0.15), rgba(58,28,113,0.05))",
      border: "none",
      boxShadow: "0 10px 25px rgba(58,28,113,0.15)"
    }}>
      <div style={{ color: color, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {card("Mensagens Processadas", "12,450", "#F4C430")}
      {card("Atendimentos Resolvidos", "3,320", "#6A4BCB")}
      {card("Satisfação dos Moradores", "98%", "#3A1C71")}
      {card("WhatsApp Conectado", "Online", "#22c55e")}
    </div>
  );
}
