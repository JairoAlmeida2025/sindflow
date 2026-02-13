import { useState } from "react";
// Removido MetricsBar e cards para focar em Inbox estilo WhatsApp

type Conversation = {
  id: string;
  name: string;
  last: string;
  time: string;
  auto: boolean;
  label?: string;
};

export default function Conversations() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const items: Conversation[] = [
    { id: "1", name: "Morador 1", last: "Olá!", time: "10:30", auto: true, label: "Dúvida" },
    { id: "2", name: "Fornecedor 2", last: "Agenda manutenção", time: "09:10", auto: false, label: "Agendamento" }
  ];
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
      <div>
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong>Chat com Moradores</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} style={{ borderRadius: 8, padding: "8px 10px" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 12, marginTop: 12 }}>
            <aside style={{ display: "grid", gap: 8 }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(c)} className="card" style={{ cursor: "pointer", border: selected?.id === c.id ? "2px solid #6A4BCB" : "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{c.name}</strong>
                    <span>{c.time}</span>
                  </div>
                  <div>{c.last}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span>{c.auto ? "🤖" : "👤"}</span>
                    {c.label && <span className="chip">{c.label}</span>}
                  </div>
                </div>
              ))}
            </aside>
            <section style={{ display: "grid", gridTemplateRows: "48px 1fr 64px", height: 540 }}>
              {!selected ? (
                <div style={{ display: "grid", placeItems: "center" }}>Selecione uma conversa</div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#6A4BCB", color: "#fff", borderRadius: 8, padding: "10px 12px" }}>
                    <div><strong>{selected.name}</strong> <span style={{ opacity: 0.9 }}>• Online</span></div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-secondary">Assumir conversa</button>
                    </div>
                  </div>
                  <div style={{
                    background:
                      "repeating-linear-gradient(45deg, #f9f7ff, #f9f7ff 10px, #f4f0ff 10px, #f4f0ff 20px)",
                    borderRadius: 12,
                    padding: 12,
                    overflow: "auto",
                    boxShadow: "inset 0 1px 6px rgba(0,0,0,0.06)"
                  }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ justifySelf: "start", maxWidth: 420, background: "#fff", padding: 10, borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                        Olá, o salão de festas está disponível para sábado?
                      </div>
                      <div style={{ justifySelf: "end", maxWidth: 420, background: "#F4C430", padding: 10, borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                        Olá Ana! Sim, está disponível. Qual horário prefere?
                      </div>
                      <div style={{ justifySelf: "start", maxWidth: 420, background: "#fff", padding: 10, borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                        Das 18h às 23h, por favor!
                      </div>
                      <div style={{ justifySelf: "end", maxWidth: 420, background: "#F4C430", padding: 10, borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                        Reserva confirmada das 18h às 23h. Obrigado!
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8 }}>
                    <input style={{ borderRadius: 8, padding: "10px 12px" }} placeholder="Digite sua mensagem..." />
                    <button className="btn-primary">Enviar</button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
      <div />
    </div>
  );
}
