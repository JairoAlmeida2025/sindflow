## Estratégia Geral
- Cada usuário cria sua própria instância Evolution (multi‑tenant) e escaneia o QR no frontend.
- Toda chamada à Evolution passa pela Edge Function do Supabase (smart-worker) — nenhuma chave é exposta no navegador.

## Edge Function (smart-worker)
### Ações e endpoints (seguindo docs oficiais)
- create-instance → POST /instance/create
  - Headers: apikey
  - Body mínimo: {
    instanceName: "usr-<auth.uid>",
    integration: "WHATSAPP-BAILEYS",
    token: "<gerado no backend>",
    qrcode: true,
    webhook: { url: WEBHOOK_GLOBAL_URL, byEvents: true }
  }
- get-qrcode → GET /instance/connect/{instanceName}
- get-status → GET /instance/connectionState/{instanceName}
- logout → DELETE /instance/logout/{instanceName}

### CORS (resolver preflight)
- Responder OPTIONS com 200 e headers:
  - Access-Control-Allow-Origin: https://sindflow.vercel.app
  - Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
  - Access-Control-Allow-Methods: GET,POST,DELETE,OPTIONS
- Incluir os mesmos headers em TODAS as respostas (sucesso/erro).
- Observação: usar origem específica (sindflow.vercel.app) para evitar bloqueios intermediários.

### Segurança
- Durante testes iniciais: desligar "Verify JWT with legacy secret" para evitar bloqueio no preflight.
- Depois, reativar e aceitar Authorization do supabase-js; OPTIONS continua livre.
- Validar que a função só permite operar instâncias cujo instanceName pertence ao auth.uid.

## Frontend
- Botão Conectar:
  - Chama smart-worker { action: "create-instance" }
  - Logo após chama { action: "get-qrcode" } e exibe base64
  - Inicia polling { action: "get-status" } a cada 5s
- Botão Atualizar QR → { action: "get-qrcode" }
- Botão Desconectar → { action: "logout" }
- InstanceName: derivado do usuário (usr-<user.id>) para isolamento por cliente.

## Banco (Supabase)
- whatsapp_sessions: registrar { user_id, instance_name, status, last_connected_at, qr_image_url? }
- RLS: user_id = auth.uid(); master com select global (opcional).

## Variáveis de Ambiente (Easy Panel / Evolution)
- SERVER_URL = https://evolution.automacoesai.com/
- AUTHENTICATION_API_KEY = 429683C4C977415CAAFCCE10F7D57E11
- DATABASE_CONNECTION_CLIENT_NAME = evolution_exchange (já consta)
- WEBHOOK_GLOBAL_URL = https://sindflow.vercel.app/api/evo/webhook/
- Recomendações:
  - CORS_ORIGIN = https://sindflow.vercel.app (em vez de *)
  - CORS_METHODS inclua OPTIONS
  - Sempre manter AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false para não vazar token em payloads (se aplicável)
  - EVENTOS de webhook: manter pelo menos QRCODE_UPDATED, MESSAGES_* habilitados conforme necessidade

## Deploy e Validação
- Secrets da função (no Supabase): SERVER_URL, AUTHENTICATION_API_KEY, DATABASE_CONNECTION_CLIENT_NAME, WEBHOOK_GLOBAL_URL
- Painel da função → Test:
  - {action:"create-instance"} → 200 JSON
  - {action:"get-qrcode"} → base64
  - {action:"get-status"} → state
- Navegador: Conectar/QR/Status/Desconectar funcionando sem CORS.

## Contingências
- Se CORS ainda bloquear: validar que OPTIONS retorna 200 com os headers acima e que o slug é smart-worker.
- Se Evolution responder 401/403: checar apikey/headers.
- Se QR não vier base64: conferir se endpoint correto é connect/{instanceName} na sua versão.
