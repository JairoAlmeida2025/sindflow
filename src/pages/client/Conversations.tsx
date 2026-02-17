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
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
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
  const audioIncoming = useRef<HTMLAudioElement | null>(null);
  const audioSend = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    audioIncoming.current = new Audio("/sounds/message_incoming.mp3");
    audioSend.current = new Audio("/sounds/message_send.mp3");
  }, []);

  // Gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState<"idle" | "recording" | "review">("idle");
  const [recordTime, setRecordTime] = useState(0);
  const [recordDataUrl, setRecordDataUrl] = useState<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [levels, setLevels] = useState<number[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const firstHistoryLoadedRef = useRef(false);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; chatId: string | null }>({ open: false, x: 0, y: 0, chatId: null });
  const [attachOpen, setAttachOpen] = useState(false);
  const fileImgVidRef = useRef<HTMLInputElement | null>(null);
  const fileDocRef = useRef<HTMLInputElement | null>(null);
  const fileStickerRef = useRef<HTMLInputElement | null>(null);

  function formatTimeMMSS(totalSeconds: number) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";
    const s = Math.floor(totalSeconds);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function AudioMiniPlayer({ url, fromMe }: { url: string; fromMe: boolean }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
      const el = audioRef.current;
      if (!el) return;
      const onLoaded = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
      const onTime = () => setCurrent(el.currentTime || 0);
      const onEnd = () => setPlaying(false);
      el.addEventListener("loadedmetadata", onLoaded);
      el.addEventListener("timeupdate", onTime);
      el.addEventListener("ended", onEnd);
      return () => {
        el.removeEventListener("loadedmetadata", onLoaded);
        el.removeEventListener("timeupdate", onTime);
        el.removeEventListener("ended", onEnd);
      };
    }, [url]);

    const pct = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;

    const toggle = async () => {
      const el = audioRef.current;
      if (!el) return;
      try {
        if (playing) {
          el.pause();
          setPlaying(false);
        } else {
          await el.play();
          setPlaying(true);
        }
      } catch {
        setPlaying(false);
      }
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = audioRef.current;
      if (!el || !duration) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const next = Math.min(1, Math.max(0, x / rect.width)) * duration;
      el.currentTime = next;
      setCurrent(next);
    };

    const pillBg = fromMe ? "#d9fdd3" : "#fff";
    const accent = "#22c55e";
    const track = "#d1d7db";

    return (
      <div style={{ marginTop: 6, width: 280, maxWidth: "100%", display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: pillBg, borderRadius: 12 }}>
          <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 18, border: "none", background: accent, color: "#fff", cursor: "pointer", flex: "0 0 auto" }}>
            {playing ? "❚❚" : "▶"}
          </button>
          <div onClick={seek} style={{ height: 8, flex: 1, background: track, borderRadius: 999, cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: accent }} />
          </div>
          <div style={{ fontSize: 12, color: "#667781", width: 44, textAlign: "right", flex: "0 0 auto" }}>
            {formatTimeMMSS(duration - current)}
          </div>
        </div>
        <audio ref={audioRef} src={url} preload="metadata" style={{ display: "none" }} />
      </div>
    );
  }

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
              name: c.contact?.name || extractPhone(c.contact?.wa_number || ""),
              last: lastMsg?.text || "",
              time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString().slice(0, 5) : "",
              auto: false,
              pinned: false,
              muted: false,
              archived: false
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
          const inferMediaKind = (url?: string | null) => {
            const u = String(url || "");
            const path = u.split("?")[0].toLowerCase();
            if (path.endsWith(".ogg") || path.endsWith(".opus") || path.endsWith(".mp3") || path.endsWith(".m4a")) return "audio";
            if (path.endsWith(".mp4") || path.endsWith(".webm")) return "video";
            if (path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".png") || path.endsWith(".gif") || path.endsWith(".webp")) return "image";
            if (path.endsWith(".pdf")) return "pdf";
            return u ? "document" : "none";
          };
          const formattedMsgs = dbMessages.reverse().map(m => ({
            key: { 
              remoteJid: normalizeJid(m.conversation?.contact?.wa_number || ""), 
              fromMe: m.from_me, 
              id: m.id 
            },
            message: { 
              conversation: m.text,
              ...(inferMediaKind(m.media_url) === "image" ? { imageMessage: { url: m.media_url, caption: m.text } } : {}),
              ...(inferMediaKind(m.media_url) === "video" ? { videoMessage: { url: m.media_url } } : {}),
              ...(inferMediaKind(m.media_url) === "audio" ? { audioMessage: { url: m.media_url } } : {}),
              ...(inferMediaKind(m.media_url) === "pdf" || inferMediaKind(m.media_url) === "document" ? { documentMessage: { url: m.media_url, mimetype: inferMediaKind(m.media_url) === "pdf" ? "application/pdf" : "application/octet-stream" } } : {})
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
      const wsUrl = `${WHATSAPP_API_URL.replace("http", "ws")}/ws?tenantId=${encodeURIComponent(tenant)}`;
      let ws = new WebSocket(wsUrl);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "qr" || msg.type === "status") return;
          
          if (msg.type === "history") {
            const { contacts, chats, messages: histMessages } = msg.payload;
            const normalizedMsgs = (histMessages || []).map((m: any) => ({
              ...m,
              key: { ...m.key, remoteJid: normalizeJid(m.key?.remoteJid || "") }
            }));
            const normalizedChats = (chats || []).map((c: any) => ({
              id: normalizeJid(c.id),
              name: c.name || c.subject || extractPhone(c.id),
              last: "",
              time: "",
              auto: false
            }));
            if (!firstHistoryLoadedRef.current) {
              setMessages(normalizedMsgs);
              setChats(prev => {
                // merge com prev para manter itens existentes
                const map = new Map(prev.map(p => [p.id, p]));
                for (const c of normalizedChats) map.set(c.id, { ...(map.get(c.id) || c), name: c.name });
                return Array.from(map.values());
              });
              firstHistoryLoadedRef.current = true;
            } else {
              setMessages(prev => {
                const existing = new Set(prev.map(m => m.key.id));
                const add = normalizedMsgs.filter((m: any) => !existing.has(m.key.id));
                return [...prev, ...add];
              });
              setChats(prev => {
                const map = new Map(prev.map(p => [p.id, p]));
                for (const c of normalizedChats) map.set(c.id, { ...(map.get(c.id) || c), name: c.name });
                return Array.from(map.values());
              });
            }
          }
          if (msg.type === "messages_set") {
            const arr = (msg.payload?.messages || []).map((m: any) => ({
              ...m,
              key: { ...m.key, remoteJid: normalizeJid(m.key?.remoteJid || "") }
            }));
            setMessages(arr);
          }
          if (msg.type === "chats_set") {
            const arr = (msg.payload?.chats || []).map((c: any) => ({
              id: normalizeJid(c.id),
              name: c.name || c.subject || extractPhone(c.id),
              last: "",
              time: "",
              auto: false
            }));
            setChats(arr);
          }
          if (msg.type === "contacts_set") {
            const arr = msg.payload?.contacts || [];
            setChats(prev => prev.map(c => {
              const up = arr.find((u: any) => normalizeJid(u.id) === c.id);
              if (!up) return c;
              return { ...c, name: up.name || up.notify || c.name };
            }));
          }

          if (msg.type === "messages") {
            const newMessages = msg.payload?.messages || [];
            
            // Tocar som se houver mensagem nova recebida (não enviada por mim)
            const hasIncoming = newMessages.some((m: any) => !m.key.fromMe);
            if (hasIncoming) audioIncoming.current?.play().catch(() => {});

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
          if (msg.type === "media") {
            const { remoteJid, url, kind, text } = msg.payload || {};
            const add = {
              key: { remoteJid: normalizeJid(remoteJid || ""), fromMe: false, id: "media-" + Date.now() },
              message: {
                ...(kind === "imageMessage" ? { imageMessage: { url, caption: text || "" } } : {}),
                ...(kind === "videoMessage" ? { videoMessage: { url } } : {}),
                ...(kind === "audioMessage" ? { audioMessage: { url } } : {}),
                ...(kind === "documentMessage" ? { documentMessage: { url, mimetype: "application/octet-stream" } } : {}),
                ...(text ? { conversation: text } : {})
              },
              messageTimestamp: Date.now() / 1000
            };
            setMessages(prev => [...prev, add]);
          }
          if (msg.type === "chat_update") {
            const updates = msg.payload || [];
            setChats(prev => {
              const map = new Map(prev.map(c => [c.id, c]));
              for (const u of updates) {
                const id = normalizeJid(u.id);
                const name = u.name || u.subject || map.get(id)?.name || id.replace("@s.whatsapp.net", "");
                const last = map.get(id)?.last || "";
                const time = map.get(id)?.time || "";
                map.set(id, { id, name, last, time, auto: false });
              }
              return Array.from(map.values()).sort((a,b) => (b.time || "").localeCompare(a.time || ""));
            });
          }
          if (msg.type === "chat_delete") {
            const deletes = msg.payload || [];
            const ids = new Set(deletes.map((d: any) => normalizeJid(d)));
            setChats(prev => prev.filter(c => !ids.has(c.id)));
            setMessages(prev => prev.filter(m => !ids.has(normalizeJid(m.key?.remoteJid))));
          }
          if (msg.type === "contacts_update") {
            const updates = msg.payload || [];
            setChats(prev => prev.map(c => {
              const up = updates.find((u: any) => normalizeJid(u.id) === c.id);
              if (!up) return c;
              return { ...c, name: up.name || up.notify || c.name };
            }));
          }
        } catch {}
      };
      ws.onclose = () => {
        // tenta reconectar com backoff simples
        setTimeout(() => {
          try {
            const w = new WebSocket(wsUrl);
            w.onmessage = ws.onmessage!;
            w.onclose = ws.onclose!;
            wsRef.current = w;
          } catch {}
        }, 1500);
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
    audioSend.current?.play().catch(() => {});

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenant = user ? `usr-${user.id}` : "default";
      
      const res = await fetch(`${WHATSAPP_API_URL}/whatsapp/send-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant, jid: normalizeJid(selectedId), text })
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        console.error("Falha ao enviar:", json || res.statusText);
        throw new Error(json?.error || "Falha ao enviar");
      }
      
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
    if (recording === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = "audio/ogg;codecs=opus";
      const fallback = "audio/webm";
      const type = (window as any).MediaRecorder && (MediaRecorder as any).isTypeSupported && (MediaRecorder as any).isTypeSupported(preferred)
        ? preferred
        : fallback;
      const mr = new MediaRecorder(stream, { mimeType: type });
      recordChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(recordChunksRef.current, { type });
        const dataUrl = await blobToDataURL(blob);
        setRecordDataUrl(dataUrl);
        setRecording("review");
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording("recording");
      setRecordTime(0);
      recordTimerRef.current = window.setInterval(() => setRecordTime(t => t + 1), 1000);
      // waveform
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (recording !== "recording") return;
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setLevels(prev => {
          const next = [...prev, avg];
          return next.slice(-50);
        });
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } catch (err) {
      console.error("Falha ao iniciar gravação:", err);
    }
  }

  async function stopRecording() {
    if (recording !== "recording") return;
    setRecording("review");
    try {
      mediaRecorderRef.current?.stop();
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    } catch {}
  }
  async function pauseRecording() {
    if (recording !== "recording") return;
    try {
      mediaRecorderRef.current?.pause();
      setRecording("paused" as any);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    } catch {}
  }
  async function resumeRecording() {
    if (recording !== "paused") return;
    try {
      mediaRecorderRef.current?.resume();
      setRecording("recording");
      if (!recordTimerRef.current) {
        recordTimerRef.current = window.setInterval(() => setRecordTime(t => t + 1), 1000);
      }
      // reinicia loop de waveform
      const loop = () => {
        if (recording !== "recording") return;
        const analyser = analyserRef.current;
        if (!analyser) return;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setLevels(prev => {
          const next = [...prev, avg];
          return next.slice(-50);
        });
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
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
        body: JSON.stringify({ tenantId: tenant, jid: normalizeJid(selectedId), dataUrl, ptt: true })
      });
      audioSend.current?.play().catch(() => {});
      setRecording("idle");
      setRecordDataUrl(null);
      setLevels([]);
      setRecordTime(0);
    } catch (err) {
      console.error("Falha ao enviar áudio:", err);
    }
  }
  async function onPickImageVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!selectedId || files.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    const tenant = user ? `usr-${user.id}` : "default";
    for (const f of files) {
      const url = await uploadToSupabase(f, user?.id || "anon");
      if (!url) continue;
      const jid = normalizeJid(selectedId);
      if (f.type.startsWith("image")) {
        await fetch(`${WHATSAPP_API_URL}/whatsapp/send-image`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: tenant, jid, url }) });
      } else if (f.type.startsWith("video")) {
        await fetch(`${WHATSAPP_API_URL}/whatsapp/send-video`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: tenant, jid, url }) });
      }
    }
    setAttachOpen(false);
  }
  async function onPickDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!selectedId || files.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    const tenant = user ? `usr-${user.id}` : "default";
    for (const f of files) {
      const url = await uploadToSupabase(f, user?.id || "anon");
      if (!url) continue;
      const jid = normalizeJid(selectedId);
      await fetch(`${WHATSAPP_API_URL}/whatsapp/send-document`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: tenant, jid, url, fileName: f.name, mime: f.type }) });
    }
    setAttachOpen(false);
  }
  async function onPickSticker(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!selectedId || files.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    const tenant = user ? `usr-${user.id}` : "default";
    for (const f of files) {
      const url = await uploadToSupabase(f, user?.id || "anon");
      if (!url) continue;
      const jid = normalizeJid(selectedId);
      await fetch(`${WHATSAPP_API_URL}/whatsapp/send-sticker`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: tenant, jid, url }) });
    }
    setAttachOpen(false);
  }
  async function sendMyLocation() {
    if (!selectedId) return;
    const { data: { user } } = await supabase.auth.getUser();
    const tenant = user ? `usr-${user.id}` : "default";
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const jid = normalizeJid(selectedId);
      await fetch(`${WHATSAPP_API_URL}/whatsapp/send-location`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: tenant, jid, lat, lng }) });
      setAttachOpen(false);
    }, () => {});
  }
  async function sendActiveContact() {
    if (!selectedId) return;
    const name = activeChat?.name || extractPhone(selectedId);
    const phone = extractPhone(selectedId);
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${name};;;;`,
      `FN:${name}`,
      `TEL;type=CELL;type=VOICE;waid=${phone}:${phone}`,
      "END:VCARD"
    ].join("\n");
    const { data: { user } } = await supabase.auth.getUser();
    const tenant = user ? `usr-${user.id}` : "default";
    const jid = normalizeJid(selectedId);
    await fetch(`${WHATSAPP_API_URL}/whatsapp/send-contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: tenant, jid, vcard, displayName: name }) });
    setAttachOpen(false);
  }

  function normalizeJid(jid: string) {
    if (!jid) return jid;
    if (jid.endsWith("@lid")) return jid.replace("@lid", "@s.whatsapp.net");
    if (jid.endsWith("@c.us")) return jid.replace("@c.us", "@s.whatsapp.net");
    return jid;
  }
  function extractPhone(jid: string) {
    return (jid || "").replace(/@.*$/, "");
  }

  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  async function uploadToSupabase(file: File, userId: string): Promise<string | null> {
    try {
      const nameSafe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/uploads/${Date.now()}_${nameSafe}`;
      const { data, error } = await supabase.storage
        .from("chat-media")
        .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
      if (error) {
        console.error("Upload falhou:", error.message);
        return null;
      }
      const { data: pub } = supabase.storage.from("chat-media").getPublicUrl(path);
      return pub?.publicUrl || null;
    } catch (err) {
      console.error("Falha upload Supabase:", err);
      return null;
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filtered = chats
    .filter(i => !i.archived)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
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
              onContextMenu={(e) => {
                e.preventDefault();
                const bounds = (e.currentTarget.closest("aside") as HTMLElement)?.getBoundingClientRect();
                const offsetX = e.clientX - (bounds?.left || 0);
                const offsetY = e.clientY - (bounds?.top || 0);
                setContextMenu({ open: true, x: offsetX, y: offsetY, chatId: c.id });
              }}
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
          {contextMenu.open && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                left: contextMenu.x,
                top: contextMenu.y,
                background: "#fff",
                border: "1px solid #d1d7db",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: 6,
                zIndex: 9999,
                minWidth: 220
              }}
            >
              <button
                onClick={() => { if (contextMenu.chatId) setSelectedId(contextMenu.chatId); setContextMenu({ open: false, x: 0, y: 0, chatId: null }); }}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer" }}
              >
                Abrir conversa
              </button>
              <button
                onClick={() => {
                  const chatId = contextMenu.chatId;
                  if (!chatId) return;
                  setChats(prev => prev.map(c => c.id === chatId ? { ...c, pinned: !c.pinned } : c));
                  setContextMenu({ open: false, x: 0, y: 0, chatId: null });
                }}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer" }}
              >
                {chats.find(c => c.id === contextMenu.chatId)?.pinned ? "Desafixar" : "Fixar conversa"}
              </button>
              <button
                onClick={() => {
                  const chatId = contextMenu.chatId;
                  if (!chatId) return;
                  setChats(prev => prev.map(c => c.id === chatId ? { ...c, muted: !c.muted } : c));
                  setContextMenu({ open: false, x: 0, y: 0, chatId: null });
                }}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer" }}
              >
                {chats.find(c => c.id === contextMenu.chatId)?.muted ? "Reativar notificações" : "Silenciar"}
              </button>
              <button
                onClick={() => {
                  const chatId = contextMenu.chatId;
                  if (!chatId) return;
                  setChats(prev => prev.map(c => c.id === chatId ? { ...c, archived: true } : c));
                  setContextMenu({ open: false, x: 0, y: 0, chatId: null });
                }}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer" }}
              >
                Arquivar conversa
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const chatId = contextMenu.chatId;
                    if (!user || !chatId) return;
                    const { data: contact } = await supabase.from("contacts").select("id").eq("user_id", user.id).eq("wa_number", chatId).single();
                    if (contact?.id) {
                      const { data: conv } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("contact_id", contact.id).single();
                      if (conv?.id) {
                        await supabase.from("messages").delete().eq("conversation_id", conv.id);
                        await supabase.from("conversations").delete().eq("id", conv.id);
                      }
                    }
                    setChats(prev => prev.filter(c => c.id !== chatId));
                    setMessages(prev => prev.filter(m => m.key?.remoteJid !== chatId));
                    if (selectedId === chatId) setSelectedId(null);
                  } catch (err) {
                    console.error("Falha ao excluir conversa:", err);
                  } finally {
                    setContextMenu({ open: false, x: 0, y: 0, chatId: null });
                  }
                }}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer", color: "#ef4444" }}
              >
                Excluir conversa
              </button>
            </div>
          )}
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
                  const imageUrl = m.message?.imageMessage?.url;
                  const audioUrl = m.message?.audioMessage?.url || (m.message?.documentMessage?.mimetype?.startsWith("audio") ? m.message?.documentMessage?.url : null);
                  const videoUrl = m.message?.videoMessage?.url;
                  const docUrl = m.message?.documentMessage?.url;
                  const docName = (m.message as any)?.documentMessage?.fileName || (docUrl ? docUrl.split("/").pop() : "");
                  if (!text && !imageUrl && !audioUrl && !videoUrl && !docUrl) return null;
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
                        {text && <div>{text}</div>}
                        {imageUrl && <img src={imageUrl} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginTop: 6 }} />}
                        {audioUrl && <AudioMiniPlayer url={audioUrl} fromMe={!!fromMe} />}
                        {videoUrl && <video controls src={videoUrl} style={{ width: "100%", marginTop: 6, borderRadius: 8 }} />}
                        {docUrl && (
                          <a href={docUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, textDecoration: "none", color: "#111b21" }}>
                            <span style={{ fontSize: 18 }}>📄</span>
                            <span style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{docName || "Documento"}</span>
                          </a>
                        )}
                        <div style={{ fontSize: 11, color: "#667781", textAlign: "right", marginTop: 4, float: "right", marginLeft: 10 }}>
                          {new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Input de Mensagem */}
            <footer style={{ padding: "10px 16px", background: "#f0f2f5", display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: 24, color: "#54656f", cursor: "pointer" }}>😊</span>
              <span style={{ fontSize: 24, color: "#54656f", cursor: "pointer" }} onClick={() => setAttachOpen(v => !v)}>＋</span>
              {recording === "idle" && (
                <>
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
                    <button onClick={startRecording} style={{ padding: "8px 12px" }}>🎤</button>
                  )}
                  {attachOpen && (
                    <div style={{ position: "absolute", bottom: 56, left: 60, background: "#fff", border: "1px solid #d1d7db", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 8, display: "grid", gap: 6, zIndex: 9999, minWidth: 260 }}>
                      <button onClick={() => fileImgVidRef.current?.click()} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>Fotos e Vídeos</button>
                      <button onClick={() => fileDocRef.current?.click()} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>Documento</button>
                      <button onClick={() => fileStickerRef.current?.click()} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>Sticker</button>
                      <button onClick={sendMyLocation} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>Localização</button>
                      <button onClick={sendActiveContact} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>Contato</button>
                    </div>
                  )}
                  <input ref={fileImgVidRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={onPickImageVideo} />
                  <input ref={fileDocRef} type="file" style={{ display: "none" }} onChange={onPickDocument} />
                  <input ref={fileStickerRef} type="file" accept="image/webp" style={{ display: "none" }} onChange={onPickSticker} />
                </>
              )}
              {recording === "recording" && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#ef4444" }}>●</span>
                  <span style={{ width: 60, textAlign: "center" }}>
                    {String(Math.floor(recordTime / 60)).padStart(2, "0")}:
                    {String(recordTime % 60).padStart(2, "0")}
                  </span>
                  <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flex: 1, height: 24 }}>
                    {levels.map((l, i) => (
                      <div key={i} style={{ width: 2, height: Math.max(4, Math.min(24, (l / 255) * 24)), background: "#4b5563", borderRadius: 1 }} />
                    ))}
                  </div>
                  <button onClick={pauseRecording} className="btn-secondary" style={{ padding: "6px 10px" }}>Pausar</button>
                  <button onClick={stopRecording} className="btn-secondary" style={{ padding: "6px 10px" }}>Stop</button>
                </div>
              )}
              {recording === "paused" && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#ef4444" }}>●</span>
                  <span style={{ width: 60, textAlign: "center" }}>
                    {String(Math.floor(recordTime / 60)).padStart(2, "0")}:
                    {String(recordTime % 60).padStart(2, "0")}
                  </span>
                  <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flex: 1, height: 24 }}>
                    {levels.map((l, i) => (
                      <div key={i} style={{ width: 2, height: Math.max(4, Math.min(24, (l / 255) * 24)), background: "#9ca3af", borderRadius: 1 }} />
                    ))}
                  </div>
                  <button onClick={resumeRecording} className="btn-secondary" style={{ padding: "6px 10px" }}>Retomar</button>
                  <button onClick={stopRecording} className="btn-secondary" style={{ padding: "6px 10px" }}>Stop</button>
                </div>
              )}
              {recording === "review" && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  <audio controls src={recordDataUrl || undefined} style={{ flex: 1 }} />
                  <button onClick={() => { setRecording("idle"); setRecordDataUrl(null); setLevels([]); setRecordTime(0); }} className="btn-secondary" style={{ padding: "6px 10px" }}>Descartar</button>
                  <button onClick={() => recordDataUrl && sendAudio(recordDataUrl)} className="btn-primary" style={{ padding: "6px 12px" }}>Enviar</button>
                </div>
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
             <div style={{ display: "grid", gap: 8, width: "80%", marginTop: 12 }}>
               <input
                 value={activeChat?.name || ""}
                 onChange={e => setChats(prev => prev.map(c => c.id === activeChat?.id ? { ...c, name: e.target.value } : c))}
                 placeholder="Nome do contato"
                 style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }}
               />
               <button
                 className="btn-primary"
                 onClick={async () => {
                   try {
                     const { data: { user } } = await supabase.auth.getUser();
                     const name = (chats.find(c => c.id === activeChat?.id)?.name || "").trim();
                     if (!user || !activeChat?.id) return;
                     await supabase.from("contacts").upsert({
                       user_id: user.id,
                       wa_number: activeChat.id,
                       name
                     }, { onConflict: "user_id, wa_number" });
                   } catch (err) {
                     console.error("Falha ao salvar contato:", err);
                   }
                 }}
               >
                 Salvar contato
               </button>
             </div>
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
