## Correções de Erros (406/400) e Perfil
- Garantir uso do cliente Supabase (supabase-js) em todas as chamadas; evitar fetch direto ao endpoint REST sem cabeçalho apikey
- Validar envs VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ao iniciar (banner de aviso já criado)
- Manter `role` no upsert de profiles (feito); revisar policies RLS de UPDATE/INSERT (script pronto)

## Padronização Visual da Sidebar
- Aplicar cabeçalho da sidebar com fundo branco (64px), mesmo logo e sem sobreposição, igual ao Master
- Garantir z-index e grid/layout para a barra de título não invadir o conteúdo

## Reformulação para Caixa de Entrada (Conversas)
- Trocar o item de menu “Dashboard” por “Conversas”; index de /master → Conversas
- Remover cards de métricas e card “Configuração do Agente IA” da página principal
- Criar Inbox estilo WhatsApp Web:
  - Coluna esquerda: lista de conversas (título, último trecho, hora)
  - Coluna central: thread com bolhas (eu vs contato), barra de envio (texto/anexo)
  - Coluna direita: detalhes do contato, etiquetas e histórico
- Usar tabelas já existentes: conversations, messages, contacts, labels

## Conexão WhatsApp (Evolution API)
- Botões: “Conectar” (cria/obtém instância e busca QR) e “Desconectar” (encerra sessão)
- Integração via Edge Function `evo-proxy` com rotas dedicadas:
  - POST /instances/create → chama SERVER_URL + endpoint apropriado (apikey)
  - GET /instances/qrcode → retorna base64 para exibir
  - GET /instances/status → conectado/desconectado
  - POST /instances/logout → desconectar
- Persistência em whatsapp_sessions: session_id, status, qr_image_url, last_connected_at
- Polling de status com feedback visual e reconexão

## Ajustes de Rotas
- Atualizar rotas /master para incluir:
  - /master/conversas (Inbox)
  - /master/whatsapp (Conexão com QR, Conectar/Desconectar)
  - Index redireciona para /master/conversas

## Refinos de UI
- Bolhas com cores da paleta (eu: azul claro; contato: cinza)
- Barra de busca, ícones de enviar/anexar; timestamps e ticks de entrega/leitura
- Header roxo no topo (já aplicado) e avatar real do usuário (feito)

## Validação
- Testar CRUD em conversations/messages (criar, listar, enviar, atualizar, excluir)
- Testar fluxo de conexão: Conectar → QR → Status → Desconectar
- Verificar se policies RLS não bloqueiam operações

Confirma execução imediata dessas alterações e integração dos endpoints exatos da Evolution (create/qr/status/logout) com persistência em whatsapp_sessions e padronização visual da sidebar?