
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const allowedOrigin = Deno.env.get("CORS_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
};

function decodeJwtSub(authHeader?: string): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload?.sub || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SERVER_URL") || "https://evolution.automacoesai.com/";
    const apiKey = Deno.env.get("AUTHENTICATION_API_KEY") || "";
    const defaultInstance = Deno.env.get("DATABASE_CONNECTION_CLIENT_NAME") || "evolution_exchange";
    const webhookUrl = Deno.env.get("WEBHOOK_GLOBAL_URL") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const authHeader = req.headers.get("Authorization") || undefined;
    const userId = decodeJwtSub(authHeader || undefined);
    const sb = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    const reqBody = await req.json().catch(() => ({}));
    const action = (reqBody?.action || "").toLowerCase();
    const instanceName = (reqBody?.instanceName as string) || (userId ? `usr-${userId}` : defaultInstance);
    const token = (reqBody?.token as string) || crypto.randomUUID().replace(/-/g, "");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing AUTHENTICATION_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Router: create-instance, get-qrcode, get-status, logout
    // Evolution v2 API per docs
    let evoUrl = "";
    let method = "GET";

    if (action === "create-instance") {
      evoUrl = `${url}instance/create`;
      method = "POST";
      const body = {
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        token,
        qrcode: true,
        webhook: webhookUrl ? { url: webhookUrl, byEvents: true, base64: true } : undefined,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true,
        syncFullHistory: false,
      };
      const createRes = await fetch(evoUrl, {
        method,
        headers: { "Content-Type": "application/json", "apikey": apiKey },
        body: JSON.stringify(body),
      });
      const createData = await createRes.json();
      // Persist session if possible
      if (sb && userId) {
        await sb.from("whatsapp_sessions").upsert({
          user_id: userId,
          session_id: instanceName,
          status: createData?.instance?.state || "created",
          last_connected_at: null,
        });
      }
      return new Response(JSON.stringify({ ok: true, data: createData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-qrcode") {
      const qrRes = await fetch(`${url}instance/connect/${instanceName}`, {
        method: "GET",
        headers: { "apikey": apiKey },
      });
      const qrData = await qrRes.json(); // { base64, code, ... }
      if (sb && userId) {
        await sb.from("whatsapp_sessions").upsert({
          user_id: userId,
          session_id: instanceName,
          status: "qr",
          qr_image_url: qrData?.base64 || null,
        });
      }
      return new Response(JSON.stringify({ ok: true, data: qrData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-status") {
      const statusRes = await fetch(`${url}instance/connectionState/${instanceName}`, {
        method: "GET",
        headers: { "apikey": apiKey },
      });
      const statusData = await statusRes.json(); // { instance: { state } }
      const state = statusData?.instance?.state || statusData?.state || "unknown";
      if (sb && userId) {
        await sb.from("whatsapp_sessions").upsert({
          user_id: userId,
          session_id: instanceName,
          status: state,
          last_connected_at: state === "open" ? new Date().toISOString() : null,
        });
      }
      return new Response(JSON.stringify({ ok: true, data: statusData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "logout") {
      const logoutRes = await fetch(`${url}instance/logout/${instanceName}`, {
        method: "DELETE",
        headers: { "apikey": apiKey },
      });
      const logoutData = await logoutRes.json();
      if (sb && userId) {
        await sb.from("whatsapp_sessions").upsert({
          user_id: userId,
          session_id: instanceName,
          status: "logout",
        });
      }
      return new Response(JSON.stringify({ ok: true, data: logoutData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
