## Diagnóstico
- O endpoint correto da função é o slug "smart-worker" (nome interno), e o frontend deve invocar exatamente esse slug.
- O erro de CORS indica que o preflight (OPTIONS) não retorna 200 com os headers CORS esperados.
- Quando "Verify JWT with legacy secret" está ON, o gateway pode interceptar a requisição antes da função responder ao OPTIONS, causando bloqueio.

## Correções propostas
### 1) Frontend
- Garantir que todas as chamadas usem supabase.functions.invoke("smart-worker") (Conectar, QR, Status, Desconectar).
- Se persistir bloqueio, trocar temporariamente para fetch direto do endpoint da função com mode: "cors" e método POST, apenas para verificar.

### 2) Função (código)
- Responder OPTIONS: retornar 200 com headers:
  - Access-Control-Allow-Origin: *
  - Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
  - Access-Control-Allow-Methods: GET,POST,DELETE,OPTIONS
- Incluir esses headers em todas as respostas (sucesso/erro). 
- Mapear ações para Evolution API v2: create, connect(qrcode), connectionState(status), logout.

### 3) Painel Supabase
- Em Edge Functions > smart-worker:
  - Secrets: SERVER_URL, AUTHENTICATION_API_KEY, DATABASE_CONNECTION_CLIENT_NAME
  - Desligar "Verify JWT with legacy secret" para testes iniciais, depois podemos reativar.
  - Usar botão "Test":
    - Body {action:"create"} → deve responder JSON
    - Body {action:"qrcode"} → deve trazer base64
    - Body {action:"status"} → deve trazer state (open/connected)

### 4) Validação no App
- Botão Conectar: criar instância + chamar qrcode e exibir imagem.
- Atualizar QR: revalidar QR.
- Desconectar: encerrar sessão e limpar QR.
- Polling de Status: atualizar estado a cada 5s.

### 5) UI e Layout
- Confirmar sidebar com cabeçalho branco (64px) e logo, sem sobreposição.
- Conversas como inbox (sem cards), com bolhas e barra de envio.

Confirma para eu aplicar essas alterações (slug, CORS definitivo, e instruções de painel), e validar no app com você? 