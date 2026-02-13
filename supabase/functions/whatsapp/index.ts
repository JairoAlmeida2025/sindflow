export default async function handler(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (req.method === "GET" && pathname.endsWith("/qr")) {
    return new Response(JSON.stringify({ qr: "data:image/png;base64," }), { headers: { "Content-Type": "application/json" } });
  }
  if (req.method === "POST" && pathname.endsWith("/send")) {
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }
  if (req.method === "POST" && pathname.endsWith("/webhook")) {
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response("Not Found", { status: 404 });
}
