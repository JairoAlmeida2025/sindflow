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
  
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  
  // Audio feedback via WebAudio (sem arquivos)
  const audioCtxRef = useRef<AudioContext | null>(null);
  function playBeep(freq: number, ms = 140) {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.2;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      }, ms);
    } catch {}
  }
  const playIncoming = () => playBeep(880);
  const playSend = () => playBeep(660);

  // Gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Load initial data from Supabase
      try {
        // Load conversations
        const { data: dbChats } = await supabase
          .from("conversations")
          .select(`
            id, 
            contact:contacts(wa_number, name, metadata), 
            last_message_at,
            messages(text, created_at, from_me)
          `)
          .order("last_message_at", { ascending: false });

        if (dbChats) {
          const formattedChats = dbChats.map(c => {
            const lastMsg = c.messages?.[0]; // Assuming order or just taking one, ideally should be sorted in query or aggregate
            // Better: use the view or just fetch last message
            return {
              id: normalizeJid(c.contact?.wa_number || ""),
              name: c.contact?.name || c.contact?.wa_number || "Desconhecido",
              last: lastMsg?.text || "",
              time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString().slice(0, 5) : "",
              auto: false
            };
          }).filter(c => c.id);
          setChats(formattedChats);
          // Avatar inicial via metadata
          const initialPics: Record<string, string> = {};
          for (const c of dbChats) {
            const jid = normalizeJid(c.contact?.wa_number || "");
            const url = c.contact?.metadata?.avatar_url;
            if (jid && url) initialPics[jid] = url;
          }
          setProfilePics(prev => ({ ...initialPics, ...prev }));
        }

        // Load recent messages for all chats (or optimize to load on select)
        // For now, let's just load messages for the active chat when selected, 
        // but to keep state simple with the current implementation, we might want to pre-load some.
        // Actually, the current implementation filters `messages` state by `selectedId`.
        // So we should probably load all recent messages or change the strategy.
        // Let's load the last 50 messages globally for now to populate the view.
        
        const { data: dbMessages } = await supabase
          .from("messages")
          .select(`
            id,
            text,
            created_at,
            from_me,
            media_url,
            conversation:conversations(contact:contacts(wa_number))
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (dbMessages) {
          const formattedMsgs = dbMessages.reverse().map(m => ({
            key: { 
              remoteJid: normalizeJid(m.conversation?.contact?.wa_number || ""), 
              fromMe: m.from_me, 
              id: m.id 
            },
            message: { 
              conversation: m.text,
              ...(m.media_url ? { imageMessage: { url: m.media_url, caption: m.text } } : {}) 
            },
            messageTimestamp: new Date(m.created_at).getTime() / 1000,
            pushName: "" // DB doesn't store pushName on message
          }));
          setMessages(formattedMsgs);
        }

      } catch (err) {
        console.error("Error loading initial data:", err);
      }

      const tenant = user ? `usr-${user.id}` : "default";
      const ws = new WebSocket(`${WHATSAPP_API_URL.replace("http", "ws")}/ws?tenantId=${encodeURIComponent(tenant)}`);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "qr" || msg.type === "status") return;
          
          if (msg.type === "history") {
            const { contacts, chats, messages: histMessages } = msg.payload;
            // Processar histórico inicial
            // TODO: Implementar lógica mais robusta de merge
            // Por enquanto, apenas adiciona mensagens se não existirem
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.key.id));
              const newMsgs = histMessages.filter((m: any) => !existingIds.has(m.key.id));
              return [...prev, ...newMsgs];
            });
            // Atualizar chats baseado no histórico
             // Simplificação: Criar chats a partir das mensagens recentes ou lista de chats
          }

          if (msg.type === "messages") {
            const newMessages = msg.payload?.messages || [];
            
            // Tocar som se houver mensagem nova recebida (não enviada por mim)
            const hasIncoming = newMessages.some((m: any) => !m.key.fromMe);
            if (hasIncoming) playIncoming();

            setMessages((prev) => {
              // Evitar duplicatas baseado no key.id
              const existingIds = new Set(prev.map(m => m.key.id));
              const uniqueNew = newMessages
                .map((m: any) => ({
                  ...m,
                  key: { ...m.key, remoteJid: normalizeJid(m.key.remoteJid) }
                }))
                .filter((m: any) => !existingIds.has(m.key.id));
              return [...prev, ...uniqueNew];
            });
            
            // Atualizar lista de conversas com a última mensagem
            if (newMessages.length > 0) {
              const lastMsg = newMessages[newMessages.length - 1];
              const remoteJid = normalizeJid(lastMsg.key.remoteJid);
              const text = lastMsg.message?.conversation || lastMsg.message?.extendedTextMessage?.text || "Imagem/Arquivo";
              const pushName = lastMsg.pushName || remoteJid.replace("@s.whatsapp.net", "");
              
              setChats(prevChats => {
                const existingIndex = prevChats.findIndex(c => c.id === remoteJid);
                // Buscar foto se não tiver
                if (!profilePics[remoteJid]) {
                    fetch(`${WHATSAPP_API_URL}/whatsapp/profile-pic?tenantId=${tenant}&jid=${remoteJid}`)
                      .then(r => r.json())
                      .then(d => { if(d.ok && d.url) setProfilePics(p => ({...p, [remoteJid]: d.url})) });
                }

                if (existingIndex >= 0) {
                   const updated = [...prevChats];
                   updated[existingIndex] = { 
                     ...updated[existingIndex], 
                     last: text, 
                     time: new Date().toLocaleTimeString().slice(0, 5) 
                   };
                   // Move para o topo
                   updated.unshift(updated.splice(existingIndex, 1)[0]);
                   return updated;
                } else {
                   return [{ id: remoteJid, name: pushName, last: text, time: new Date().toLocaleTimeString().slice(0, 5), auto: false }, ...prevChats];
                }
              });
            }
          }
        } catch {}
      };
      wsRef.current = ws;
    })();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  async function sendMessage() {
    if (!input.trim() || !selectedId) return;
    const text = input.trim();
    setInput("");
    
    // Otimisticamente adicionar a mensagem na UI
    const tempId = "temp-" + Date.now();
    const optimisticMsg = {
      key: { remoteJid: selectedId, fromMe: true, id: tempId },
      message: { conversation: text },
      messageTimestamp: Date.now() / 1000,
      status: "sending"
    };
    setMessages(prev => [...prev, optimisticMsg]);
    playSend();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenant = user ? `usr-${user.id}` : "default";
      
      const res = await fetch(`${WHATSAPP_API_URL}/whatsapp/send-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant, jid: selectedId, text })
      });
      
      if (!res.ok) throw new Error("Falha ao enviar");
      
      // Atualizar conversa na lista lateral
      setChats(prevChats => {
        const existingIndex = prevChats.findIndex(c => c.id === selectedId);
        if (existingIndex >= 0) {
           const updated = [...prevChats];
           updated[existingIndex] = { 
             ...updated[existingIndex], 
             last: text, 
             time: new Date().toLocaleTimeString().slice(0, 5) 
           };
           updated.unshift(updated.splice(existingIndex, 1)[0]);
           return updated;
        }
        return prevChats;
      });

    } catch (err) {
      console.error(err);
      // Opcional: Marcar mensagem como erro na UI
    }
  }

  async function startRecording() {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
        const dataUrl = await blobToDataURL(blob);
        await sendAudio(dataUrl);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Falha ao iniciar gravação:", err);
    }
  }

  async function stopRecording() {
    if (!isRecording) return;
    setIsRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
  }

  async function sendAudio(dataUrl: string) {
    if (!selectedId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenant = user ? `usr-${user.id}` : "default";
      await fetch(`${WHATSAPP_API_URL}/whatsapp/send-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant, jid: selectedId, dataUrl, ptt: true })
      });
      playSend();
    } catch (err) {
      console.error("Falha ao enviar áudio:", err);
    }
  }

  function normalizeJid(jid: string) {
    if (!jid) return jid;
    if (jid.endsWith("@lid")) return jid.replace("@lid", "@s.whatsapp.net");
    if (jid.endsWith("@c.us")) return jid.replace("@c.us", "@s.whatsapp.net");
    return jid;
  }

  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

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
              <div style={{ width: 49, height: 49, borderRadius: "50%", background: "#dfe5e7", marginRight: 15, overflow: "hidden" }}>
                {profilePics[c.id] ? (
                  <img src={profilePics[c.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
              </div>
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
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dfe5e7", marginRight: 15, overflow: "hidden" }}>
                  {profilePics[activeChat?.id || ""] ? (
                    <img src={profilePics[activeChat?.id || ""]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                </div>
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
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Digite uma mensagem" 
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "none", outline: "none", fontSize: 15 }} 
              />
              {input ? (
                <button onClick={sendMessage} className="btn-primary" style={{ padding: "8px 16px" }}>➤</button>
              ) : (
                <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} style={{ padding: "8px 12px" }}>
                  {isRecording ? "Gravando..." : "🎤"}
                </button>
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
             <div style={{ width: 200, height: 200, borderRadius: "50%", background: "#dfe5e7", marginBottom: 15, overflow: "hidden" }}>
                {profilePics[activeChat?.id || ""] ? (
                  <img src={profilePics[activeChat?.id || ""]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
             </div>
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
