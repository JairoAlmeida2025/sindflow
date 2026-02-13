export default async function handler(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (req.method === "GET") {
    return new Response(JSON.stringify({ keys: [] }), { headers: { "Content-Type": "application/json" } });
  }
  if (req.method === "POST" && pathname.endsWith("/create")) {
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response("Not Found", { status: 404 });
}
