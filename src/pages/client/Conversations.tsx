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

  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
            const newMessages = msg.payload?.messages || [];
            setMessages((prev) => [...prev, ...newMessages]);
            
            // Atualizar lista de conversas com a última mensagem
            if (newMessages.length > 0) {
              const lastMsg = newMessages[newMessages.length - 1];
              const remoteJid = lastMsg.key.remoteJid;
              const text = lastMsg.message?.conversation || lastMsg.message?.extendedTextMessage?.text || "Imagem/Arquivo";
              
              setChats(prevChats => {
                const existing = prevChats.find(c => c.id === remoteJid);
                if (existing) {
                   return prevChats.map(c => c.id === remoteJid ? { ...c, last: text, time: new Date().toLocaleTimeString().slice(0, 5) } : c);
                } else {
                   return [...prevChats, { id: remoteJid, name: lastMsg.pushName || remoteJid.replace("@s.whatsapp.net", ""), last: text, time: new Date().toLocaleTimeString().slice(0, 5), auto: false }];
                }
              });
            }
          }
        } catch {}
      };
      wsRef.current = ws;
      // Mock inicial removido para usar dados reais ou estado vazio
      // setChats([{ id: "chat-default", name: "Conversas", last: "", time: "", auto: false }]);
      // setSelectedId("chat-default");
    })();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filtered = chats.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const activeChat = chats.find(c => c.id === selectedId);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#f0f2f5" }}>
      {/* Sidebar Esquerda - Lista de Conversas */}
      <aside style={{ width: 350, borderRight: "1px solid #d1d7db", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div style={{ padding: "10px 16px", background: "#f0f2f5", borderBottom: "1px solid #d1d7db" }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: 12, color: "#54656f" }}>🔍</span>
            <input 
              placeholder="Pesquisar ou começar uma nova conversa" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ width: "100%", border: "none", outline: "none", fontSize: 14 }} 
            />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedId(c.id)} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "12px 16px", 
                cursor: "pointer", 
                background: selectedId === c.id ? "#f0f2f5" : "transparent",
                borderBottom: "1px solid #f0f2f5"
              }}
            >
              <div style={{ width: 49, height: 49, borderRadius: "50%", background: "#dfe5e7", marginRight: 15 }}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 17, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: "#667781" }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 14, color: "#667781", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.last}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#667781" }}>Nenhuma conversa encontrada</div>}
        </div>
      </aside>

      {/* Área Central - Chat */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "#efeae2", position: "relative" }}>
        {selectedId ? (
          <>
            {/* Header do Chat */}
            <header style={{ padding: "10px 16px", background: "#f0f2f5", borderBottom: "1px solid #d1d7db", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => setShowDetails(!showDetails)}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dfe5e7", marginRight: 15 }}></div>
                <div>
                  <div style={{ fontSize: 16, color: "#111b21" }}>{activeChat?.name}</div>
                  <div style={{ fontSize: 13, color: "#667781" }}>clique para dados do contato</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, color: "#54656f" }}>
                <span>🔍</span>
                <span onClick={() => setShowDetails(!showDetails)} style={{ cursor: "pointer" }}>⋮</span>
              </div>
            </header>

            {/* Mensagens */}
            <div ref={scrollRef} style={{ flex: 1, padding: "20px 60px", overflowY: "auto", backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: "repeat" }}>
              {messages
                .filter(m => m.key?.remoteJid === selectedId)
                .map((m, idx) => {
                  const fromMe = m.key?.fromMe;
                  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
                  if (!text) return null;
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: fromMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
                      <div style={{ 
                        background: fromMe ? "#d9fdd3" : "#fff", 
                        padding: "6px 7px 8px 9px", 
                        borderRadius: 8, 
                        maxWidth: "65%", 
                        boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
                        fontSize: 14.2,
                        lineHeight: "19px",
                        color: "#111b21",
                        position: "relative"
                      }}>
                        <div>{text}</div>
                        <div style={{ fontSize: 11, color: "#667781", textAlign: "right", marginTop: 4, float: "right", marginLeft: 10 }}>
                          {new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Input de Mensagem */}
            <footer style={{ padding: "10px 16px", background: "#f0f2f5", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, color: "#54656f", cursor: "pointer" }}>😊</span>
              <span style={{ fontSize: 24, color: "#54656f", cursor: "pointer" }}>＋</span>
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Digite uma mensagem" 
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "none", outline: "none", fontSize: 15 }} 
              />
              {input ? (
                <button className="btn-primary" style={{ padding: "8px 16px" }}>➤</button>
              ) : (
                <span style={{ fontSize: 24, color: "#54656f", cursor: "pointer" }}>🎤</span>
              )}
            </footer>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#41525d", borderBottom: "6px solid #43c655" }}>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: "#41525d", marginBottom: 10 }}>SindFlow Web</h1>
            <div style={{ fontSize: 14 }}>Envie e receba mensagens sem precisar manter seu celular conectado.</div>
          </div>
        )}
      </main>

      {/* Sidebar Direita - Detalhes (Colapsável) */}
      {showDetails && selectedId && (
        <aside style={{ width: 300, background: "#fff", borderLeft: "1px solid #d1d7db", display: "flex", flexDirection: "column" }}>
          <header style={{ height: 60, padding: "0 24px", display: "flex", alignItems: "center", background: "#f0f2f5", borderBottom: "1px solid #d1d7db" }}>
            <span style={{ cursor: "pointer", marginRight: 20, color: "#54656f" }} onClick={() => setShowDetails(false)}>✕</span>
            <span style={{ fontSize: 16, color: "#111b21" }}>Dados do contato</span>
          </header>
          <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "10px solid #f0f2f5" }}>
             <div style={{ width: 200, height: 200, borderRadius: "50%", background: "#dfe5e7", marginBottom: 15 }}></div>
             <h2 style={{ fontSize: 22, color: "#111b21", fontWeight: 400 }}>{activeChat?.name}</h2>
             <span style={{ fontSize: 16, color: "#667781" }}>{activeChat?.id?.replace("@s.whatsapp.net", "")}</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 14, color: "#667781", marginBottom: 8 }}>Etiquetas</div>
            <div style={{ display: "flex", gap: 8 }}>
               <span style={{ background: "#e9edef", padding: "4px 8px", borderRadius: 4, fontSize: 12, color: "#111b21" }}>Novo Cliente</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
