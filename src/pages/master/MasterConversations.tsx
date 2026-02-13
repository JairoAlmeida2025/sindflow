import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Conversation = {
  id: string;
  title: string | null;
  last_message_at: string | null;
};
type Message = {
  id: string;
  conversation_id: string;
  from_me: boolean;
  text: string | null;
  created_at: string;
};

export default function MasterConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("conversations")
        .select("id,title,last_message_at")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      setConversations(data || []);
      if (data && data.length > 0) {
        setActiveId(data[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!activeId) return;
      const { data } = await supabase
        .from("messages")
        .select("id,conversation_id,from_me,text,created_at")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    })();
  }, [activeId]);

  async function send() {
    if (!input.trim() || !activeId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const insert = {
      conversation_id: activeId,
      from_me: true,
      text: input,
    };
    const { data, error } = await supabase
      .from("messages")
      .insert(insert)
      .select();
    if (!error && data) {
      setMessages([...messages, ...(data as any)]);
      setInput("");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 300px", height: "calc(100vh - 64px)" }}>
      {/* Lista de conversas */}
      <aside style={{ background: "#f9fafb", borderRight: "1px solid #eee", overflowY: "auto" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 600 }}>Conversas</div>
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "12px 16px",
              border: "none",
              borderBottom: "1px solid #eee",
              background: activeId === c.id ? "#eef2ff" : "transparent",
              cursor: "pointer"
            }}
          >
            <div style={{ fontWeight: 600 }}>{c.title || "Sem título"}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{c.last_message_at ? new Date(c.last_message_at).toLocaleString() : ""}</div>
          </button>
        ))}
      </aside>

      {/* Thread */}
      <section style={{ display: "grid", gridTemplateRows: "1fr auto", background: "white" }}>
        <div style={{ padding: 16, overflowY: "auto" }}>
          {messages.map(m => (
            <div key={m.id} style={{
              display: "flex",
              justifyContent: m.from_me ? "flex-end" : "flex-start",
              marginBottom: 8
            }}>
              <div style={{
                background: m.from_me ? "#e0f2fe" : "#f3f4f6",
                padding: "8px 12px",
                borderRadius: 12,
                maxWidth: 560
              }}>
                <div style={{ fontSize: 14 }}>{m.text}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid #eee" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
          />
          <button onClick={send} className="btn-primary">Enviar</button>
        </div>
      </section>

      {/* Detalhes */}
      <aside style={{ background: "#f9fafb", borderLeft: "1px solid #eee", padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Detalhes</h3>
        <p style={{ color: "#666" }}>Informações do contato, etiquetas e histórico.</p>
      </aside>
    </div>
  );
}

