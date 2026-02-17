import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const WEBHOOK_GERADOR = "https://editor-n8n.automacoesai.com/webhook/gerador";
const WEBHOOK_DESCONECTAR = "https://editor-n8n.automacoesai.com/webhook/desconectar";

function normalizeConnectionName(input: string) {
  let v = String(input || "").trim().toLowerCase();
  v = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  v = v.replace(/[^a-z0-9]/g, "");
  return v;
}

function buildQrDataUrl(payload: any) {
  const root = Array.isArray(payload) ? payload?.[0] : payload;
  const mimeType = String(root?.mimeType || root?.mime || "image/png");
  const raw =
    root?.qrCodeBase64 ||
    root?.qrcodeBase64 ||
    root?.qr_base64 ||
    root?.qr ||
    root?.qrcode ||
    root?.base64 ||
    root?.imageBase64 ||
    root?.dataUrl ||
    root?.dataURL ||
    null;

  if (!raw) return null;
  const s = String(raw);
  if (s.startsWith("data:image/")) return s;
  return `data:${mimeType};base64,${s}`;
}

export default function Conexao() {
  const [connectionName, setConnectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null); // 'open', 'close', 'qrcode_generated', etc.
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const normalizedInput = useMemo(() => normalizeConnectionName(connectionName), [connectionName]);
  const valid = normalizedInput.length > 0;

  // 1. Obter User ID e verificar estado inicial
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Tentar buscar sessão existente para esse usuário? 
        // Por enquanto, vamos deixar o usuário digitar o nome, 
        // mas idealmente poderíamos listar as sessões do usuário.
      }
    }
    init();
  }, []);

  // 2. Realtime Subscription
  useEffect(() => {
    if (!activeSessionId) return;

    // Escutar mudanças na tabela whatsapp_sessions para este session_id (activeSessionId)
    const channel = supabase
      .channel(`whatsapp_sessions:${activeSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "whatsapp_sessions",
          filter: `session_id=eq.${activeSessionId}`
        },
        (payload) => {
          console.log("Realtime update:", payload);
          const newStatus = payload.new.status;
          if (newStatus) setStatus(newStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  // Se o status for 'open' ou 'connected', garantimos que o QR some
  const isConnected = status === "open" || status === "connected";

  async function submit() {
    setError(null);
    setQrDataUrl(null);
    setStatus(null);

    if (!valid) {
      setError("Informe um nome de conexão válido (apenas letras minúsculas e números).");
      return;
    }
    if (!userId) {
      setError("Usuário não identificado. Recarregue a página.");
      return;
    }

    setLoading(true);
    const startedAt = Date.now();

    try {
      // 0. Gerar Nome Sequencial
      // Buscar sessões que começam com o nome base para encontrar o próximo índice
      let finalName = `${normalizedInput}_001`; // Padrão

      const { data: similarSessions } = await supabase
        .from("whatsapp_sessions")
        .select("session_id")
        .eq("user_id", userId)
        .ilike("session_id", `${normalizedInput}_%`);

      if (similarSessions && similarSessions.length > 0) {
        // Extrair sufixos e encontrar o maior
        const suffixes = similarSessions.map(s => {
          const parts = s.session_id?.split("_");
          const last = parts ? parts[parts.length - 1] : "0";
          return parseInt(last, 10);
        }).filter(n => !isNaN(n));

        if (suffixes.length > 0) {
          const max = Math.max(...suffixes);
          const next = max + 1;
          finalName = `${normalizedInput}_${String(next).padStart(3, "0")}`;
        }
      }

      setActiveSessionId(finalName);
      console.log("Gerando para:", finalName);

      // 1. Criar/Atualizar registro no Supabase
      const { data: existing } = await supabase
        .from("whatsapp_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("session_id", finalName)
        .single();

      if (existing) {
        await supabase.from("whatsapp_sessions").update({
          status: "qrcode_generating",
          updated_at: new Date().toISOString()
        }).eq("id", existing.id);
      } else {
        await supabase.from("whatsapp_sessions").insert({
          user_id: userId,
          session_id: finalName,
          status: "qrcode_generating"
        });
      }

      // 2. Chamar Webhook n8n
      const res = await fetch(WEBHOOK_GERADOR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionName: finalName, // Enviar o nome gerado
          userId: userId
        })
      });

      // Processar resposta (igual anterior)
      const ct = res.headers.get("content-type") || "";
      let payload: any = null;
      if (ct.includes("application/json")) {
        try { payload = await res.json(); } catch {
          const txt = await res.text(); try { payload = JSON.parse(txt); } catch { payload = txt; }
        }
      } else {
        const txt = await res.text();
        try { payload = JSON.parse(txt); } catch { payload = txt; }
      }

      if (!res.ok) {
        if (res.status === 404) setError("Webhook n8n não encontrado.");
        else setError(`Erro ao gerar QR (HTTP ${res.status}).`);
        return;
      }

      // Delay minímo UX
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1000) await new Promise((r) => setTimeout(r, 1000 - elapsed));

      // Extrair QR
      const qr = Array.isArray(payload) ? (payload[0]?.qrcode || payload[0]?.base64) : (payload?.qrcode || payload?.base64);

      if (qr && typeof qr === "string") {
        setQrDataUrl(qr.startsWith("data:image/") ? qr : `data:image/png;base64,${qr}`);
        setStatus("qrcode_generated");
        return;
      }

      const dataUrl = typeof payload === "string" ? null : buildQrDataUrl(payload);
      if (dataUrl) {
        setQrDataUrl(dataUrl);
        setStatus("qrcode_generated");
        return;
      }

      if (typeof payload === "string" && payload.trim()) {
        const s = payload.trim();
        if (s.startsWith("data:image/")) setQrDataUrl(s);
        else setQrDataUrl(`data:image/png;base64,${s}`);
        setStatus("qrcode_generated");
        return;
      }

      setError("Resposta do n8n sem QR Code válido.");
    } catch (e) {
      console.error(e);
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!userId || !activeSessionId) return;
    setLoading(true);
    try {
      await fetch(WEBHOOK_DESCONECTAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionName: activeSessionId,
          userId: userId
        })
      });

      // Atualizar banco localmente para refletir desconexão imediata
      const { data: existing } = await supabase
        .from("whatsapp_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("session_id", activeSessionId)
        .single();

      if (existing) {
        await supabase.from("whatsapp_sessions").update({ status: "closed" }).eq("id", existing.id);
      }

      setStatus("closed");
      setQrDataUrl(null);
      // Mantemos o nome da conexão escrito, mas limpamos a sessão ativa?
      // Ou deixamos o activeSessionId até ele limpar?
      // Vamos limpar para permitir gerar novo.
      setActiveSessionId(null);
    } catch (e) {
      setError("Erro ao desconectar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#111b21" }}>Conexão WhatsApp</div>
        <div style={{ fontSize: 14, color: "#667781", marginTop: 4 }}>
          Gerencie a conexão da sua instância.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16, alignItems: "start" }}>

        {/* Coluna Mensagens de Erro */}
        <div style={{ gridColumn: "span 12" }}>
          {error && (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "#fff1f2", color: "#991b1b", border: "1px solid #fecaca", fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>

        {/* Card de Configuração */}
        <section style={{ background: "#fff", border: "1px solid #d1d7db", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111b21" }}>Nova Conexão</div>
          <div style={{ fontSize: 13, color: "#667781", marginTop: 4 }}>
            Nome único para identificar sua instância.
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#111b21", marginBottom: 6 }}>Nome da instância</label>
              <input
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="ex.: vendas01"
                disabled={loading || isConnected}
                style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #d1d7db", padding: "0 12px", outline: "none", fontSize: 14 }}
              />
              <div style={{ fontSize: 12, color: "#667781", marginTop: 6 }}>
                ID Base: <span style={{ fontFamily: "monospace" }}>{normalizedInput || "—"}</span>
                {activeSessionId && <span style={{ marginLeft: 10, color: "#008069", fontWeight: 600 }}>Gerado: {activeSessionId}</span>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {!isConnected ? (
                <>
                  <button
                    onClick={submit}
                    disabled={loading || !valid}
                    className="btn-primary"
                    style={{ padding: "10px 14px", borderRadius: 10, background: "#008069", color: "#fff", border: "none", cursor: loading ? "wait" : "pointer", opacity: (!valid || loading) ? 0.7 : 1 }}
                  >
                    {loading ? "Processando…" : "Gerar QRCode"}
                  </button>
                  <button
                    onClick={() => { setConnectionName(""); setQrDataUrl(null); setError(null); setStatus(null); setActiveSessionId(null); }}
                    disabled={loading}
                    style={{ padding: "10px 14px", borderRadius: 10, background: "#e9edef", color: "#111b21", border: "none", cursor: "pointer" }}
                  >
                    Limpar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  style={{ padding: "10px 14px", borderRadius: 10, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", width: "100%" }}
                >
                  {loading ? "Desconectando..." : "Desconectar Instância"}
                </button>
              )}

            </div>
          </div>
        </section>

        {/* Card de Status / QRCode */}
        <section style={{ background: "#fff", border: "1px solid #d1d7db", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111b21" }}>Status da Conexão</div>

          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", minHeight: 280, alignItems: "center" }}>

            {loading ? (
              <div style={{ width: 40, height: 40, border: "3px solid #e9edef", borderTopColor: "#008069", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            ) : isConnected ? (
              <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
                <div style={{
                  width: 100, height: 100, background: "#dcf8c6", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto"
                }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 style={{ margin: 0, color: "#111b21", fontSize: 20 }}>Conectado!</h3>
                <p style={{ margin: "8px 0 0 0", color: "#667781", fontSize: 14 }}>
                  Sua instância <b>{activeSessionId}</b> está ativa e pronta para uso.
                </p>
              </div>
            ) : qrDataUrl ? (
              <div style={{ display: "grid", gap: 10, justifyItems: "center", animation: "fadeIn 0.5s ease" }}>
                <div style={{ fontSize: 13, color: "#667781", textAlign: "center", marginBottom: 8 }}>
                  Escaneie o QR Code no seu WhatsApp <br />(Dispositivos Conectados {">"} Conectar Aparelho)
                </div>
                <img
                  src={qrDataUrl}
                  alt="QRCode"
                  style={{ width: 280, height: 280, borderRadius: 14, border: "1px solid #e9edef" }}
                />
              </div>
            ) : (
              <div style={{ color: "#8696a0", fontSize: 14, textAlign: "center", padding: 20 }}>
                Nenhuma conexão ativa ou QR Code gerado.<br />
                Inicie uma nova conexão ao lado.
              </div>
            )}

          </div>
        </section>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
