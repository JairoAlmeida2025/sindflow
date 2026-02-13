import { useState } from "react";

type Entry = { id: string; title: string; content: string };

export default function Knowledge() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const add = () => {
    if (!title || !content) return;
    setEntries([...entries, { id: Math.random().toString(36).slice(2), title, content }]);
    setTitle("");
    setContent("");
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 16 }}>
      <div>
        <button onClick={add}>Novo material</button>
        <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea placeholder="Conteúdo" value={content} onChange={e => setContent(e.target.value)} rows={8} />
        <div>Material salvo</div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {entries.map(e => (
          <div key={e.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
            <strong>{e.title}</strong>
            <p>{e.content.slice(0, 120)}...</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button>Editar</button>
              <button onClick={() => setEntries(entries.filter(x => x.id !== e.id))}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
