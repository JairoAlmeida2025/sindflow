**Paleta de Cores (Tokens e Aplicação)**
- Criar arquivo de tema com tokens CSS e aplicar em toda a UI:
  - --roxo-profundo: #3A1C71 (sidebar, header, elementos estruturais)
  - --roxo-fluxo: #6A4BCB (botões secundários, cards ativos, indicadores agente)
  - --amarelo-inteligente: #F4C430 (CTAs: Ativar IA, Conectar WhatsApp, Salvar)
  - --cinza-nevoa: #F7F7FB (fundos, Kanban, áreas de leitura)
  - --preto-carbono: #1F1F1F (textos principais e títulos)
- Adicionar estilos utilitários (btn-primário, btn-secundário, bg, texto) e substituir estilos inline nas páginas (Landing, AppShell, Conversas, Kanban, etc.).

**Imagens da Landing**
- Usar os arquivos em c:\trae\sindflow\sindflow\images\landingpage\:
  - landingpage_001.png ... landingpage_005.png e mockup.png
- Distribuição:
  - Hero: mockup.png + título/subtítulo
  - Seção Benefícios: grid com landingpage_001–003
  - Seção Como funciona: ilustrações landingpage_004–005
- Ajustar caminhos na Landing para /images/landingpage/... (manter logo em /logo/logo_oficial.png).

**Acesso ao Front (Validação Visual)**
- Rotas para testar localmente:
  - Landing: http://localhost:5173/
  - Navegação técnica: http://localhost:5173/ambientes.html (arquivo em /public)
- Se necessário, adicionar link discreto para /ambientes.html no rodapé apenas em ambiente de desenvolvimento.
- O aviso de HMR WebSocket do Vite pode aparecer em alguns ambientes; não impede navegação. Se persistir, avalio configurar server.hmr (host/port) no vite.config.

**Banco de Dados (Alinhamento ao Modelo Proposto)**
- Manter tabelas já criadas (conversations, messages, contacts, labels, knowledge_entries, notes, api_keys, usage_metrics, stripe_settings, profiles, user_settings, whatsapp_sessions).
- Criar VIEWS com nomenclatura em PT-BR para compatibilidade com o domínio:
  - usuario: agrega profiles + user_settings + whatsapp_sessions + stripe_settings
    - Campos: id, nome (display_name), email (do auth.users via profiles.id), tipo_usuario (role), status (novo campo em profiles), foto_perfil_url (photo_url), agente_ativo (user_settings.agent_enabled), prompt_agente (user_settings.base_prompt), whatsapp_numero/status (whatsapp_sessions), plano_nome (novo campo em profiles), stripe_customer_id (novo campo), criado_em (auth.users.created_at)
  - conversa: mapeia conversations (status_kanban=kanban_status, atendimento_tipo=ai_handling -> AUTOMATICO/MANUAL, ultima_mensagem_em=last_message_at, criado_em=created_at)
  - mensagem: mapeia messages (remetente_tipo derivado: CLIENTE se from_me; AGENTE se ai_generated; senão CONTATO)
  - contato: mapeia contacts (telefone=wa_number, origem=source, criado_em=created_at)
  - etiqueta: mapeia labels
  - base_conhecimento: mapeia knowledge_entries (criado_em, atualizado_em)
  - anotacao: mapeia notes (titulo+conteudo por extensão; hoje notes tem ‘content’, incluo ‘titulo’ como novo campo)
  - api_key: mapeia api_keys (chave_api ocultada; permanece server-side)
  - uso_ia: mapeia usage_metrics + api_key_id, mes_referencia
  - configuracao_stripe: mapeia stripe_settings com status_conexao/pagamentos_ativos
- Complementar com colunas mínimas nas tabelas existentes quando necessário (ex.: profiles.status/plano_nome/stripe_customer_id; notes.titulo; conversations.created_at).
- RLS: manter por user_id; expor VIEWS com segurança (políticas que filtram por auth.uid()).

**Aplicação da Paleta no Kanban e Conversas**
- Sidebar/header com Roxo Profundo.
- Indicador de agente ativo com Roxo Fluxo.
- CTAs (Ativar IA, Conectar WhatsApp, Salvar) em Amarelo Inteligente.
- Fundo geral Cinza Névoa; textos principais em Preto Carbono.

**Entrega Planejada**
1) Criar tema CSS e utilitários; aplicar na Landing, AppShell e principais componentes.
2) Inserir imagens da pasta landingpage na Landing em seções Hero/Benefícios/Como funciona.
3) Criar VIEWS conforme mapeamento e adicionar colunas faltantes nas tabelas para compatibilidade.
4) Garantir acesso a / e /ambientes.html e (se necessário) ajustar Vite HMR para estabilidade.

Após aprovação, executo as mudanças de estilo, atualizo a Landing com as imagens de /images/landingpage, e preparo as migrations para as VIEWS e colunas complementares no banco, mantendo RLS e segurança das chaves. 