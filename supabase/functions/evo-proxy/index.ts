
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SERVER_URL") || "https://evolution.automacoesai.com/";
    const apiKey = Deno.env.get("AUTHENTICATION_API_KEY") || "";
    const instanceName = Deno.env.get("DATABASE_CONNECTION_CLIENT_NAME") || "evolution_exchange";

    const reqBody = await req.json().catch(() => ({}));
    const action = reqBody?.action || "";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing AUTHENTICATION_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simple router: /create, /qrcode, /status, /logout
    let evoUrl = "";
    let method = "GET";
    let bodyToSend = null;

    if (action === "qrcode") {
      evoUrl = `${url}instance/connect/${instanceName}`; // Ajustado para endpoint correto de QR (v2) ou usar o fetchInstances se v1
      // Nota: Evolution v2 geralmente é /instance/connect/{name} ou v1 /instance/qrcode/{name}
      // Vamos tentar o endpoint de connect que retorna base64
      evoUrl = `${url}instance/connect/${instanceName}`; 
    } else if (action === "status") {
      evoUrl = `${url}instance/connectionState/${instanceName}`;
    } else if (action === "create") {
      evoUrl = `${url}instance/create`;
      method = "POST";
      bodyToSend = { instanceName, token: apiKey, qrcode: true };
    } else if (action === "logout" || action === "disconnect") {
      evoUrl = `${url}instance/logout/${instanceName}`;
      method = "DELETE";
    } else {
      // Default info
      evoUrl = `${url}instance/fetchInstances?instanceName=${instanceName}`;
    }

    // Ajuste de URL e headers para Evolution API
    // Se for V2, endpoints são diferentes. Assumindo V2 padrão Evolution API
    
    // Tentativa genérica para Evolution V2
    if (action === "create") {
        // Create Instance
        const createRes = await fetch(`${url}instance/create`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "apikey": apiKey 
            },
            body: JSON.stringify({ instanceName })
        });
        const createData = await createRes.json();
        
        return new Response(JSON.stringify({ ok: true, data: createData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (action === "qrcode") {
        // Get QR Code - Evolution v2: /instance/connect/{instance}
        const qrRes = await fetch(`${url}instance/connect/${instanceName}`, {
            method: "GET",
            headers: { "apikey": apiKey }
        });
        const qrData = await qrRes.json(); // { base64: "...", code: "..." }
        return new Response(JSON.stringify({ ok: true, data: qrData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (action === "status") {
        // Get Connection State
        const statusRes = await fetch(`${url}instance/connectionState/${instanceName}`, {
            method: "GET",
            headers: { "apikey": apiKey }
        });
        const statusData = await statusRes.json(); // { instance: { state: "open" } }
        return new Response(JSON.stringify({ ok: true, data: statusData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
    
    if (action === "logout") {
        const logoutRes = await fetch(`${url}instance/logout/${instanceName}`, {
            method: "DELETE",
            headers: { "apikey": apiKey }
        });
        const logoutData = await logoutRes.json();
        return new Response(JSON.stringify({ ok: true, data: logoutData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ ok: false, error: "Invalid action" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
