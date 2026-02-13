import { useState } from "react";

type Contact = { id: string; name: string; number: string };

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
  const contacts: Contact[] = [
    { id: "1", name: "Morador 1", number: "5511999999999" },
    { id: "2", name: "Fornecedor 2", number: "5511888888888" }
  ];
  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding: 16 }}>
      <input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} />
      <ul style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {filtered.map(c => (
          <li key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{c.name}</strong> <span>{c.number}</span>
            </div>
            <button onClick={() => setModalOpen(true)}>Iniciar conversa</button>
          </li>
        ))}
      </ul>
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", display: "grid", placeItems: "center" }}>
          <div style={{ background: "#fff", padding: 16, borderRadius: 8, width: 400 }}>
            <h3>Primeira mensagem</h3>
            <textarea rows={4} value={firstMessage} onChange={e => setFirstMessage(e.target.value)} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setModalOpen(false)}>Cancelar</button>
              <button onClick={() => setModalOpen(false)}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
