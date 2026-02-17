import { Request, Response } from "express"
import { startConnection } from "./ConnectionService"

type ConnRecord = {
  id: string
  companyId: number
  name: string
  status: "CONNECTED" | "DISCONNECTED" | "QR"
  qr?: string
}

const connections = new Map<string, ConnRecord>()
const sockets = new Map<string, any>()
const events = new Map<string, any>()

export const create = async (req: Request, res: Response): Promise<Response> => {
  const { id, name } = req.body as { id: string; name: string }
  const companyId = req.user?.companyId || 0
  const conn = { id, companyId, name, status: "DISCONNECTED" } as ConnRecord
  connections.set(id, conn)
  const { socket, events: ev } = await startConnection(conn)
  sockets.set(id, socket)
  events.set(id, ev)
  ev.on("connection", ({ connection, qr }: any) => {
    const current = connections.get(id)
    if (!current) return
    if (qr) {
      current.status = "QR"
      current.qr = qr
    }
    if (connection === "open") current.status = "CONNECTED"
    if (connection === "close") current.status = "DISCONNECTED"
  })
  return res.json({ id, status: "created" })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params
  const conn = connections.get(id)
  if (!conn) return res.status(404).json({ error: "not_found" })
  return res.json(conn)
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params
  const sock = sockets.get(id)
  if (sock) {
    try { await sock.logout() } catch {}
    try { sock.end() } catch {}
  }
  sockets.delete(id)
  events.delete(id)
  connections.delete(id)
  return res.json({ id, status: "removed" })
}
