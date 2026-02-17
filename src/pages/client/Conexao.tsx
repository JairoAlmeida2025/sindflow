import { useMemo, useState } from "react";

const WEBHOOK_URL = "https://editor-n8n.automacoesai.com/webhook/gerador";

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

  const normalizedName = useMemo(() => normalizeConnectionName(connectionName), [connectionName]);

  const valid = normalizedName.length > 0;

  async function submit() {
    setError(null);
    setQrDataUrl(null);
    if (!valid) {
      setError("Informe um nome de conexão válido (apenas letras minúsculas e números, sem traços, pontos ou espaço).");
      return;
    }

    try {
      const raw = localStorage.getItem("sf_connections");
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      if (Array.isArray(list) && list.includes(normalizedName)) {
        setError("Esse nome de conexão já foi usado. Escolha outro nome único.");
        return;
      }
    } catch {}

    setLoading(true);
    const startedAt = Date.now();
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionName: normalizedName
        })
      });

      const ct = res.headers.get("content-type") || "";
      let payload: any = null;
      if (ct.includes("application/json")) {
        try {
          payload = await res.json();
        } catch {
          const rawText = await res.text();
          try { payload = JSON.parse(rawText); } catch { payload = rawText; }
        }
      } else {
        const rawText = await res.text();
        // Se parecer JSON, tentar parsear
        const looksJson = /^[\[{]/.test(rawText.trim());
        if (looksJson) {
          try { payload = JSON.parse(rawText); } catch { payload = rawText; }
        } else {
          payload = rawText;
        }
      }

      if (!res.ok) {
        if (res.status === 404) {
          setError("Webhook não encontrado/ativo no n8n. Ative o workflow e tente novamente.");
        } else {
          setError(`Falha ao gerar QRCode (HTTP ${res.status}).`);
        }
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < 10000) {
        await new Promise((r) => setTimeout(r, 10000 - elapsed));
      }

      const data = payload;
      const qr = Array.isArray(data) ? (data[0]?.qrcode || data[0]?.base64) : (data?.qrcode || data?.base64);
      if (qr && typeof qr === "string") {
        setQrDataUrl(qr.startsWith("data:image/") ? qr : `data:image/png;base64,${qr}`);
        try {
          const raw = localStorage.getItem("sf_connections");
          const list = raw ? (JSON.parse(raw) as string[]) : [];
          const next = Array.isArray(list) ? Array.from(new Set([...list, normalizedName])) : [normalizedName];
          localStorage.setItem("sf_connections", JSON.stringify(next));
        } catch {}
        return;
      }

      const dataUrl = typeof payload === "string" ? null : buildQrDataUrl(payload);
      if (dataUrl) {
        setQrDataUrl(dataUrl);
        try {
          const raw = localStorage.getItem("sf_connections");
          const list = raw ? (JSON.parse(raw) as string[]) : [];
          const next = Array.isArray(list) ? Array.from(new Set([...list, normalizedName])) : [normalizedName];
          localStorage.setItem("sf_connections", JSON.stringify(next));
        } catch {}
        return;
      }

      if (typeof payload === "string" && payload.trim()) {
        const s = payload.trim();
        if (s.startsWith("data:image/")) {
          setQrDataUrl(s);
          try {
            const raw = localStorage.getItem("sf_connections");
            const list = raw ? (JSON.parse(raw) as string[]) : [];
            const next = Array.isArray(list) ? Array.from(new Set([...list, normalizedName])) : [normalizedName];
            localStorage.setItem("sf_connections", JSON.stringify(next));
          } catch {}
          return;
        }
        setQrDataUrl(`data:image/png;base64,${s}`);
        try {
          const raw = localStorage.getItem("sf_connections");
          const list = raw ? (JSON.parse(raw) as string[]) : [];
          const next = Array.isArray(list) ? Array.from(new Set([...list, normalizedName])) : [normalizedName];
          localStorage.setItem("sf_connections", JSON.stringify(next));
        } catch {}
        return;
      }

      setError("Resposta do n8n não contém o campo qrcode/base64.");
    } catch (e) {
      setError("Falha de rede ao chamar o n8n. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#111b21" }}>Conexão</div>
        <div style={{ fontSize: 14, color: "#667781", marginTop: 4 }}>
          Informe o nome da conexão e gere o QRCode para escanear no WhatsApp.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16, alignItems: "start" }}>
        <div style={{ gridColumn: "span 12 / span 12" }}>
          {error ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #fecaca",
                background: "#fff1f2",
                color: "#991b1b",
                fontSize: 14
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <section
          style={{
            gridColumn: "auto",
            background: "#fff",
            border: "1px solid #d1d7db",
            borderRadius: 16,
            padding: 16
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111b21" }}>Adicionar conexão</div>
          <div style={{ fontSize: 13, color: "#667781", marginTop: 4 }}>
            Use um nome único (somente letras minúsculas e números, sem traços ou pontos).
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
            <div style={{ gridColumn: "span 12 / span 12" }}>
              <label style={{ display: "block", fontSize: 13, color: "#111b21", marginBottom: 6 }}>Nome da conexão</label>
              <input
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="ex.: atendimentomatriz"
                disabled={loading}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid #d1d7db",
                  padding: "0 12px",
                  outline: "none",
                  fontSize: 14
                }}
              />
              <div style={{ fontSize: 12, color: "#667781", marginTop: 6 }}>
                Normalizado: <span style={{ fontFamily: "monospace" }}>{normalizedName || "—"}</span>
              </div>
            </div>

            <div style={{ gridColumn: "span 12 / span 12", display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={submit}
                disabled={loading}
                className="btn-primary"
                style={{ padding: "10px 14px", borderRadius: 10 }}
              >
                {loading ? "Gerando…" : "Gerar QRCode"}
              </button>
              <button
                onClick={() => {
                  setConnectionName("");
                  setQrDataUrl(null);
                  setError(null);
                }}
                disabled={loading}
                className="btn-secondary"
                style={{ padding: "10px 14px", borderRadius: 10 }}
              >
                Limpar
              </button>
            </div>
          </div>
        </section>

        <section
          style={{
            gridColumn: "auto",
            background: "#fff",
            border: "1px solid #d1d7db",
            borderRadius: 16,
            padding: 16
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111b21" }}>QRCode</div>
          <div style={{ fontSize: 13, color: "#667781", marginTop: 4 }}>
            Abra o WhatsApp no celular &gt; Dispositivos conectados &gt; Conectar um dispositivo e escaneie.
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            {loading ? (
              <div
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: 14,
                  background: "#f0f2f5",
                  border: "1px solid #e9edef",
                  animation: "pulse 1.2s ease-in-out infinite"
                }}
              />
            ) : qrDataUrl ? (
              <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
                <img
                  src={qrDataUrl}
                  alt="QRCode para conexão do WhatsApp"
                  style={{ width: 300, height: 300, borderRadius: 14, border: "1px solid #e9edef", background: "#fff" }}
                />
                <button onClick={submit} disabled={loading} className="btn-secondary" style={{ padding: "10px 14px", borderRadius: 10 }}>
                  Gerar novamente
                </button>
              </div>
            ) : (
              <div
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: 14,
                  border: "1px dashed #d1d7db",
                  background: "#fafafa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#667781",
                  fontSize: 14,
                  textAlign: "center",
                  padding: 16
                }}
              >
                Envie o formulário para gerar o QRCode.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

