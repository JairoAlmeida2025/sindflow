## Diagnóstico
- O erro CORS vem do preflight (OPTIONS) que não retorna 200 OK.
- O endpoint real da função é o slug "smart-worker"; o frontend está invocando "evo-proxy" (caminho errado).
- A função está com "Verify JWT with legacy secret" ON, o que exige Authorization; preflight não envia Authorization.

## Correções Propostas
### 1) Ajustar chamada no frontend
- Trocar supabase.functions.invoke("evo-proxy") por supabase.functions.invoke("smart-worker").
- Em MasterWhatsapp e WhatsappConnect, atualizar todas as invocações: create, qrcode, status, logout.

### 2) Configurar CORS na função
- Garantir headers: Access-Control-Allow-Origin: *; Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type; Access-Control-Allow-Methods: GET,POST,DELETE,OPTIONS.
- Responder OPTIONS com 200 e esses headers.

### 3) JWT de verificação
- No Dashboard da função, DESLIGAR "Verify JWT with legacy secret" para facilitar teste.
- Alternativa: manter ligado, mas o supabase-js já envia Authorization; mesmo assim preflight precisa aceitar OPTIONS sem auth.

### 4) Variáveis da Evolution
- Definir na função: SERVER_URL=https://evolution.automacoesai.com/; AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D57E11; DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange.

### 5) Testes
- Testar via painel (Test) com body {action:"create"}; depois {action:"qrcode"} e verificar se vem base64.
- No browser, clicar "Conectar": deve criar instância e exibir QR.
- "Atualizar QR": deve renovar/mostrar QR.
- "Desconectar": deve encerrar sessão.

### 6) Padronização visual da Sidebar
- Confirmar header branco 64px com logo nas duas sidebars e evitar sobreposição com o header roxo.

Confirma que posso aplicar as alterações acima no frontend (troca do slug) e te guiar para os toggles no Dashboard?