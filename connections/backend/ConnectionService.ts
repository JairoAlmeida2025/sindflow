import makeWASocket, { WASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from "baileys"
import { initAuthCreds } from "baileys"
import { EventEmitter } from "events"
import NodeCache from "node-cache"

type Connection = {
  id: string
  companyId: number
  name: string
}

type AuthState = {
  creds: ReturnType<typeof initAuthCreds>
  keys: any
}

export type StartResult = {
  socket: WASocket
  events: EventEmitter
}

export function createInMemoryAuth(): AuthState {
  const creds = initAuthCreds()
  const cache = new NodeCache()
  const keys = makeCacheableSignalKeyStore(
    {
      get: async (type: string, ids: string[]) => {
        const map: { [key: string]: any } = {}
        ids.forEach(id => {
          const key = `${type}:${id}`
          const val = cache.get(key)
          if (val) map[id] = val
        })
        return map
      },
      set: async (data: { [key: string]: { [id: string]: any } }) => {
        Object.keys(data).forEach(type => {
          Object.keys(data[type]).forEach(id => {
            const key = `${type}:${id}`
            cache.set(key, data[type][id])
          })
        })
      },
      clear: async () => {
        cache.flushAll()
      }
    },
    console,
    new NodeCache()
  )
  return { creds, keys }
}

export async function startConnection(conn: Connection): Promise<StartResult> {
  const { version } = await fetchLatestBaileysVersion()
  const auth = createInMemoryAuth()
  const socket = makeWASocket({
    version,
    auth: { creds: auth.creds, keys: auth.keys },
    printQRInTerminal: false,
    browser: [conn.name, "Chrome", "1.0"]
  })
  const events = new EventEmitter()
  socket.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => {
    events.emit("connection", { connection, qr, lastDisconnect })
  })
  socket.ev.on("messages.upsert", ({ messages, type }) => {
    events.emit("messages", { messages, type })
  })
  socket.ev.on("creds.update", () => {
    events.emit("auth.update", {})
  })
  return { socket, events }
}
