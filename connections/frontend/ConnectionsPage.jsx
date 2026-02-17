import React, { useState, useEffect } from "react"
import io from "socket.io-client"
import api from "./api"

export default function ConnectionsPage() {
  const [connId, setConnId] = useState("")
  const [status, setStatus] = useState("DISCONNECTED")
  const [qr, setQr] = useState("")

  useEffect(() => {
    const url = process.env.REACT_APP_SOCKET_URL || window.location.origin
    const socket = io(url)
    if (connId) {
      socket.on(`conn-${connId}-qr`, data => {
        setQr(data.qr)
        setStatus("QR")
      })
    }
    return () => { socket.close() }
  }, [connId])

  const handleCreate = async () => {
    if (!connId) return
    await api.post("/connections", { id: connId, name: "SaaS Connection" })
    const { data } = await api.get(`/connections/${connId}`)
    setStatus(data.status)
    setQr(data.qr || "")
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Conexões WhatsApp</h2>
      <input
        placeholder="ID da conexão"
        value={connId}
        onChange={e => setConnId(e.target.value)}
        style={{ padding: 8, marginRight: 8 }}
      />
      <button onClick={handleCreate} style={{ padding: 8 }}>Criar</button>
      <div style={{ marginTop: 24 }}>
        <div>Status: {status}</div>
        {qr && (
          <img
            alt="QR"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qr)}`}
            style={{ marginTop: 16, border: "1px solid #ccc" }}
          />
        )}
      </div>
    </div>
  )
}
