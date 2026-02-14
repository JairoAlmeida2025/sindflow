import { useEffect, useRef, useState } from "react";
import { WHATSAPP_API_URL } from "../../lib/config";
import { supabase } from "../../lib/supabase";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chats, setChats] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const tenant = user ? `usr-${user.id}` : "default";
      const ws = new WebSocket(`${WHATSAPP_API_URL.replace("http", "ws")}/ws?tenantId=${encodeURIComponent(tenant)}`);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "qr" || msg.type === "status") return;
          if (msg.type === "messages") {
            setMessages((prev) => [...prev, ...(msg.payload?.messages || [])]);
          }
        } catch {}
      };
      wsRef.current = ws;
      setChats([{ id: "chat-default", name: "Conversas", last: "", time: "", auto: false }]);
      setSelectedId("chat-default");
    })();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const filtered = chats.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 320px", height: "calc(100vh - 64px)" }}>
      <aside style={{ borderRight: "1px solid #eee", background: "#f8f9fb" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", borderRadius: 8, padding: "8px 10px", border: "1px solid #ddd" }} />
        </div>
        <div style={{ overflowY: "auto" }}>
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)} style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "none", borderBottom: "1px solid #eee", background: selectedId === c.id ? "#eef2ff" : "transparent", cursor: "pointer" }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{c.last}</div>
            </button>
          ))}
        </div>
      </aside>
      <section style={{ display: "grid", gridTemplateRows: "56px 1fr 64px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #eee", background: "#fff" }}>
          <strong>{filtered.find(c => c.id === selectedId)?.name || "Conversas"}</strong>
        </div>
        <div style={{ padding: 16, background: "#e6ddd5", overflowY: "auto" }}>
          {messages.map((m, idx) => {
            const fromMe = m.key?.fromMe;
            const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
            return (
              <div key={idx} style={{ display: "flex", justifyContent: fromMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
                <div style={{ background: fromMe ? "#d9fdd3" : "#fff", padding: "8px 12px", borderRadius: 8, maxWidth: 560 }}>
                  <div style={{ fontSize: 14 }}>{text}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee", background: "#fff" }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Digite uma mensagem" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }} />
          <button className="btn-primary">Enviar</button>
        </div>
      </section>
      <aside style={{ borderLeft: "1px solid #eee", background: "#f8f9fb", padding: 16 }}>
        <strong>Detalhes</strong>
        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Etiquetas, contato e histórico.</div>
      </aside>
    </div>
  );
}
