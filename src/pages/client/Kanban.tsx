import { useState } from "react";

type Card = { id: string; name: string; type: string; last: string };
type Column = { id: string; title: string; cards: Card[] };

export default function Kanban() {
  const [columns, setColumns] = useState<Column[]>([
    { id: "novas", title: "Novas", cards: [{ id: "c1", name: "Morador 1", type: "Dúvida", last: "Onde fica a coleta?" }] },
    { id: "auto", title: "Em atendimento automático", cards: [{ id: "c2", name: "Morador 2", type: "Agendamento", last: "Agendar reunião" }] },
    { id: "pend", title: "Pendentes do síndico", cards: [] },
    { id: "fin", title: "Finalizadas", cards: [] }
  ]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: 12 }}>
      {columns.map(col => (
        <div key={col.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
          <h3>{col.title}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {col.cards.map(card => (
              <div key={card.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
                <strong>{card.name}</strong>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ background: "#eef2ff", padding: "2px 6px", borderRadius: 6 }}>{card.type}</span>
                  <span>{card.last}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
        <button onClick={() => {}} style={{ marginRight: 8 }}>Criar nova etiqueta</button>
        <input placeholder="Nome da etiqueta" value={newLabelName} onChange={e => setNewLabelName(e.target.value)} />
        <input type="color" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} />
      </div>
    </div>
  );
}
