# WhatsApp Service (Baileys)

## Endpoints
- POST /whatsapp/connect { tenantId }
- GET /whatsapp/qrcode?tenantId=...
- GET /whatsapp/status?tenantId=...
- POST /whatsapp/logout { tenantId }
- WS: /ws?tenantId=...

## Deploy (Render/Railway/Fly)
1. Create a Node service with persistent disk mounted to `/app/whatsapp-service/sessions` or use Dockerfile and mount `/data`.
2. Start command: `node src/server.js`
3. Expose port `4000`
4. Point the frontend env `VITE_WHATSAPP_API_URL` to the public URL, e.g. `https://whatsapp.yourdomain.com`

## Notes
- Sessions persist under `whatsapp-service/sessions/{tenantId}`
- One session per tenant
