export default async function handler(req: Request): Promise<Response> {
  try {
    const url = Deno.env.get("SERVER_URL") || "https://evolution.automacoesai.com/";
    const apiKey = Deno.env.get("AUTHENTICATION_API_KEY") || "";
    const instanceName = Deno.env.get("DATABASE_CONNECTION_CLIENT_NAME") || "evolution_exchange";
    const u = new URL(req.url);
    const path = u.pathname.replace("/evo-proxy", "");
    const body = await req.json().catch(() => ({}));
    const action = body?.action || (path.split("/").pop() || "").toLowerCase();

    if (!apiKey) {
      return Response.json({ error: "Missing AUTHENTICATION_API_KEY" }, { status: 500 });
    }

    // Simple router: /create, /qrcode, /status, /logout
    let evoUrl = "";
    if (action === "qrcode") {
      evoUrl = `${url}instances/${instanceName}/qrcode?apikey=${apiKey}`;
    } else if (action === "status") {
      evoUrl = `${url}instances/${instanceName}/status?apikey=${apiKey}`;
    } else if (action === "create") {
      evoUrl = `${url}instances/create?apikey=${apiKey}`;
    } else if (action === "logout" || action === "disconnect") {
      evoUrl = `${url}instances/${instanceName}/logout?apikey=${apiKey}`;
    } else {
      evoUrl = `${url}instances/${instanceName}?apikey=${apiKey}`;
    }

    const method = action === "create" || action === "logout" ? "POST" : "GET";
    const res = await fetch(evoUrl, { method, headers: { "accept": "application/json" } });
    const contentType = res.headers.get("content-type") || "application/json";
    const body = await (contentType.includes("application/json") ? res.json() : res.text());
    return Response.json({ ok: true, data: body });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

