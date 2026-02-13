export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await req.text();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}
