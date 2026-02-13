import React from "react";

export default function EnvWarning() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const show = !url || !key;
  if (!show) return null;
  return (
    <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, textAlign: "center", fontSize: 14 }}>
      Configuração do Supabase ausente (URL/KEY). Algumas funções podem falhar até você definir VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
    </div>
  );
}

