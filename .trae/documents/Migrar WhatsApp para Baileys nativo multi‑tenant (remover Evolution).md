## Visão Geral
- Remover totalmente a abordagem Evolution API e usar Baileys direto no backend (modelo Whaticket).
- Cada tenant (cliente) possui uma instância Baileys própria, isolada em /sessions/{tenantId}.
- Fluxo: Conectar → emitir QR → escanear → persistir sessão → reconectar automático → expor mensagens/status via WebSocket e endpoints REST.

## Arquitetura Backend
- Serviço Node.js dedicado (whatsapp-service) com:
  - Dependencies: @whiskeysockets/baileys, express, ws, pino, qrcode, jsonwebtoken.
  - Pastas:
    - /sessions/{tenantId} (useMultiFileAuthState)
    - /src/baileys/InstanceManager.ts (gerenciar sockets por tenant)
    - /src/server.ts (Express + WebSocket + rotas)
  - Autenticação: JWT do Supabase; extrair userId/tenantId do token (sub ou claim companyId).
  - Estados: disconnected | qr_required | connected; reconexão automática.

### Código base (resumo)
- InstanceManager:
  - createOrGet(tenantId): inicializa Baileys com useMultiFileAuthState("sessions/${tenantId}").
  - Eventos: connection.update → QR (emitir base64 via qrcode.toDataURL), open, close.
  - messages.upsert → emitir via WebSocket e opcionalmente salvar em DB (conversations/messages existentes).
- Rotas REST:
  - POST /whatsapp/connect {tenantId} → cria/reusa instância; retorna {status}.
  - GET /whatsapp/qrcode?tenantId → último QR base64 (se houver) + status.
  - GET /whatsapp/status?tenantId → estado atual.
  - POST /whatsapp/logout {tenantId} → encerra sessão e limpa pasta.
- WebSocket:
  - /ws?tenantId → push de QR, status, mensagens em tempo real.

## Integração Frontend
- Substituir todas chamadas a supabase.functions (smart-worker/evo-proxy) por endpoints do whatsapp-service.
- Página “Conexão WhatsApp”:
  - Botões: Conectar, Atualizar QR, Desconectar.
  - Polling GET /whatsapp/qrcode e /whatsapp/status (ou WebSocket para QR/status).
- Página “Conversas” (igual WhatsApp Web):
  - Layout 3 colunas: lista de chats (esquerda), thread de mensagens (centro), detalhes/etiquetas (direita).
  - Usar WebSocket para receber mensagens e atualizar em tempo real; enviar via REST (POST /messages/send opcional futuro).
- Remover quaisquer dependências de Evolution (UI e chamadas).

## Persistência
- Reutilizar tabelas existentes:
  - whatsapp_sessions: registrar {tenantId, status, last_connected_at}.
  - conversations/messages: salvar recepção (from_me=false) e envios (from_me=true).

## Segurança e Limites
- Uma sessão por tenant.
- Validar JWT em todas as rotas; mapear tenantId corretamente.
- Limitar reconexões e proteger endpoints contra abuso.

## Deploy
- Hospedar whatsapp-service em Node (VM/Container/Render/Fly.io), com volume persistente para /sessions.
- CORS: permitir origem do app; WebSocket com autenticação via token.

## Passos de Migração
1) Criar whatsapp-service (Node) com InstanceManager e rotas.
2) Remover referências de Evolution no frontend (Conexão WhatsApp e Conversas) e apontar para novos endpoints.
3) Ajustar layout da página “Conversas” para estilo WhatsApp Web.
4) Persistir sessão e status em whatsapp_sessions; integrar mensagens às tabelas existentes.
5) Testar: Conectar → QR → Conectado → Receber mensagens → Logout.

## Entregáveis
- Serviço Node com Baileys multi-tenant.
- Endpoints: POST /whatsapp/connect, GET /whatsapp/qrcode, GET /whatsapp/status, POST /whatsapp/logout.
- WebSocket /ws para QR, status e mensagens.
- Frontend atualizado (Conexão e Conversas com layout WhatsApp Web).