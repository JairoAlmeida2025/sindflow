import { useState } from "react";

type Note = { id: string; title: string; text: string; color: string };

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [color, setColor] = useState("#fde68a");
  const add = () => {
    if (!title || !text) return;
    setNotes([...notes, { id: Math.random().toString(36).slice(2), title, text, color }]);
    setTitle("");
    setText("");
  };
  return (
    <div style={{ padding: 16 }}>
      <button onClick={add}>Nova anotação</button>
      <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea placeholder="Texto" value={text} onChange={e => setText(e.target.value)} rows={4} />
      <input type="color" value={color} onChange={e => setColor(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
        {notes.map(n => (
          <div key={n.id} style={{ background: n.color, padding: 12, borderRadius: 8 }}>
            <strong>{n.title}</strong>
            <p>{n.text}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button>Editar</button>
              <button onClick={() => setNotes(notes.filter(x => x.id !== n.id))}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
