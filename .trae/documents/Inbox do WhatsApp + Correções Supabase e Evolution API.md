## Correções de Perfil e Supabase
- Validar variáveis de ambiente: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY; exibir aviso no app se ausentes
- Corrigir 406/400 na tabela profiles:
  - Garantir policies RLS: SELECT (id = auth.uid()), UPDATE e INSERT (id = auth.uid())
  - No upsert do perfil, sempre enviar `role` preservando valor atual
  - Tratar resposta 406/400 no frontend com mensagens claras

## Favicon e Avatar
- Adicionar `<link rel="icon" href="/logo/favico_90x90.png" />` no index.html
- Exibir foto real do usuário no topo direito (MasterShell) buscando `photo_url` em `profiles`

## Reformulação de UI (Master)
- Substituir item “Dashboard” por “Conversas” e tornar `/master/conversas` a rota padrão
- Remover cards de métricas e o card “Configuração do Agente IA” da página principal
- Criar layout Inbox estilo WhatsApp Web:
  - Coluna esquerda: lista de chats (contatos/chats com último trecho, hora, status)
  - Coluna central: thread de mensagens com envio, anexos, estado (✓ ✓✓)
  - Coluna direita: detalhes do contato, etiquetas e histórico
- Unificar paleta roxa no header superior (já aplicado) e deixar o logo da sidebar mais evidente

## Integração Evolution API (QR Code)
- Não expor a API key no frontend; criar Edge Function “evo-proxy” que:
  - Cria/obtém instância (nome = `evolution_exchange`)
  - Retorna QR Code: endpoint de QR (base64/PNG) para exibir e fazer polling até status “connected”
  - Encaminha webhooks de eventos para `/api/evo/webhook/`
- Variáveis (referência do seu ambiente):
  - SERVER_URL: https://evolution.automacoesai.com/
  - AUTHENTICATION_API_KEY: 429683C4C977415CAAFCCE10F7D57E11
  - WA_BUSINESS_URL: https://graph.facebook.com (se necessário para Business)
  - WEBHOOK_GLOBAL_URL: https://sindflow.vercel.app/api/evo/webhook/
- Persistência em Supabase:
  - Usar tabela `whatsapp_sessions` (já existe): salvar `session_id`, `status`, `qr_image_url`, `last_connected_at`
  - Criar/atualizar registros via Edge Function (evita chaves no cliente)

## Rotas e Páginas
- Adicionar páginas:
  - `/master/conversas` (Inbox)
  - `/master/whatsapp` (Conexão: QR Code, status, reconectar)
- Ajustar `main.tsx` para usar `Conversas` como index de `/master`

## CRUD e RLS (Demais Tabelas)
- Confirmar RLS consistente:
  - `contacts`, `conversations`, `messages`, `labels`, `knowledge_entries`, `notes`, `usage_metrics`, `user_settings`, `whatsapp_sessions` → policies `user_is_owner`
  - Policies adicionais de leitura para `master` (select global) quando necessário
- Testes de CRUD (frontend):
  - Criar utilitária de health-check que insere/seleciona/atualiza/apaga registros mínimos (somente ambiente dev)

## Entregáveis
- Atualizações de UI (Sidebar, Header, Inbox) e remoções dos cards
- Edge Function `evo-proxy` (create instance, get QR, status, webhooks)
- Ajustes de policies RLS e correções no fluxo de perfil
- Rotas atualizadas com “Conversas” como default
- Documentação curta de envs necessários (Supabase & Evolution)

Confirma a execução deste plano?