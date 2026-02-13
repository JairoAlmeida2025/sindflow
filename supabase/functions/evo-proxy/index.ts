export default async function handler(req: Request): Promise<Response> {
  try {
    const url = Deno.env.get("SERVER_URL") || "https://evolution.automacoesai.com/";
    const apiKey = Deno.env.get("AUTHENTICATION_API_KEY") || "";
    const u = new URL(req.url);
    const path = u.pathname.replace("/evo-proxy", "");

    if (!apiKey) {
      return Response.json({ error: "Missing AUTHENTICATION_API_KEY" }, { status: 500 });
    }

    // Simple router: /qrcode, /status, /create
    let evoUrl = "";
    if (path.endsWith("/qrcode") || path.includes("/qrcode")) {
      evoUrl = `${url}qrcode?apikey=${apiKey}`;
    } else if (path.endsWith("/status") || path.includes("/status")) {
      evoUrl = `${url}status?apikey=${apiKey}`;
    } else if (path.endsWith("/create") || path.includes("/create")) {
      evoUrl = `${url}create?apikey=${apiKey}`;
    } else {
      evoUrl = `${url}?apikey=${apiKey}`;
    }

    const res = await fetch(evoUrl, { method: "GET" });
    const contentType = res.headers.get("content-type") || "application/json";
    const body = await (contentType.includes("application/json") ? res.json() : res.text());
    return Response.json({ ok: true, data: body });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

