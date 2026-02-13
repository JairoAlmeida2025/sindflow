**[1] Nome do Projeto**
- Sindflow A.I

**[2] Visão Geral do App**
- Plataforma web e mobile (PWA) para síndicos e administradores automatizarem atendimento via WhatsApp através de um agente de I.A.
- Painel estilo WhatsApp Web centraliza conversas; agente classifica e responde demandas simples automaticamente.
- Foco v1: reduzir mensagens repetitivas (FAQs, agendamentos, solicitações básicas) liberando tempo para tarefas estratégicas.

**[3] Objetivos da Primeira Versão (v1)**
- Validar confiança no agente de I.A no atendimento inicial.
- Reduzir tempo gasto com respostas repetitivas no WhatsApp.
- Organizar conversas em categorias visuais (Kanban) para priorização.
- Permitir controle total de ativar/desativar o agente.

**[4] Personas Prioritárias**
- Síndico profissional: alto volume, necessidade de respostas rápidas, automatizável.
- Administrador de condomínio: organiza solicitações, dúvidas, agendamentos; WhatsApp é o canal principal.

**[5] Funcionalidades Essenciais (MVP)**
1) Conexão com WhatsApp (QR Code, sync realtime, histórico básico)
2) Painel de Conversas (estilo WhatsApp Web; lista esquerda, mensagens direita, identificação do atendimento por agente)
3) Ativar/Desativar Agente (botão global, indicador, assumir conversa manual, editar prompt base)
4) Classificação Automática (intenção, etiqueta, coluna Kanban; CRUD de etiquetas)
5) Kanban (Novas, Em atendimento automático, Pendentes do síndico, Finalizadas; drag and drop)
6) Respostas Automáticas Inteligentes (FAQs, agendamentos, handoff humano, consulta à base de conhecimento)
7) Base de Conhecimento (mini cards editáveis por usuário)
8) Sincronização de Contatos (Google opcional; WhatsApp nativo; exibir nome)
9) Anotações (post-its coloridos)
10) Lista de Contatos (agenda + iniciar conversa)

**[6] Fluxo Principal (Síndico)**
- Acessa, faz login, configura prompt, adiciona materiais, conecta WhatsApp, visualiza conversas, ativa agente, recebe novas mensagens, agente classifica/responde, Kanban organiza, assume quando necessário, finaliza.

**[6.2] Fluxo Principal (Master/Admin)**
- Login admin, dashboard geral, gestão de APIs (cadastrar/ativar/desativar chaves), definir disponibilidade para clientes, monitorar consumo I.A, listar clientes, ativar/suspender/bloquear, acompanhar conexões WhatsApp, ver plano e status de pagamento.
- v1: painel master simples; monitoramento numérico; sem automações de bloqueio por limite — apenas controle manual.

**[7] Requisitos Não-Funcionais**
- Desenvolvimento via Trae I.A; Vite/React/TS; Web responsiva (desktop prioritário, mobile PWA);
- Frontend Vercel (free); Backend/DB/Auth Supabase; e-mail/senha; armazenamento seguro;
- PT-BR; até 200 usuários ativos simultâneos; caixa de entrada igual WhatsApp Web;
- Landing com “Entrar” → Login e “Assinar” → Pagamento;
- Página HTML de navegação técnica entre ambientes para teste local;
- Seeds: Master (contato.automacoesai@gmail.com / Almeid@C@m@rgo26), Usuário teste (jairotemplovivo@gmail.com / Abc1234**).

**Integração com WhatsApp**
- Evolution API em VPS (Easypanel); sync contínuo pós QR; reconexão automática; v1: 1 número por usuário.

**Integração com LLM (I.A)**
- Provedores: OpenAI (ativo), Gemini (preparado/inativo).
- Painel Master oculta chaves; cliente só vê nome do provedor disponível; seleção manual.

**Uso pelo Cliente Final**
- Seleciona provedor se houver mais de um; se um só, uso automático; se nenhum, alerta para suporte.

**Performance do Agente**
- Resposta < 5s; limite mensal por cliente (controle de custo); registro de consumo por usuário.

**Base de Conhecimento**
- Conteúdos criados na plataforma, cards editáveis, vinculados ao cliente; agente consulta apenas conteúdos do usuário.

**Monetização**
- Stripe com assinatura mensal; sem cobrança por uso v1 (monitoramento interno).

**Ferramentas e Custos**
- Trae I.A $10/mês; Vercel free; Supabase free; Evolution API (sem licença); OpenAI ~US$5/mês inicial; Brevo free; Stripe taxa por transação.

**Observação Estratégica (MVP)**
- Ativar apenas OpenAI; preparar múltiplos provedores com Gemini inoperante; sem balanceamento automático; seleção manual via master.

**[8] Fora de Escopo (v1)**
- Apps nativos; integrações condominiais; relatórios avançados; disparos em massa; múltiplos números por conta; cobrança automática; NPS automático.

**[9] Indicadores de Sucesso**
- 30 síndicos conectados em 30 dias; redução percebida ≥30% no tempo de atendimento; ≥50% das mensagens classificadas automaticamente.

**Mapa de Telas e Rotas**
- Público: /
 1) Landing → /; 2) Pagamento → /pagamento; 3) Ambientes (teste) → /ambientes
- Cliente: /app
 4) Login → /login; 5) Conversas → /app/conversas; 6) Kanban → /app/kanban; 7) Agente → /app/agente; 8) Conhecimento → /app/conhecimento; 9) Contatos → /app/contatos; 10) Anotações → /app/anotacoes; 11) Conta → /app/configuracoes; 12) WhatsApp → /app/whatsapp
- Master: /master
 13) Login Master → /master/login; 14) Dashboard → /master; 15) APIs I.A → /master/apis; 16) Clientes → /master/clientes; 17) Uso → /master/uso; 18) Pagamentos → /master/pagamentos

**Componentes por Tela (Obrigatórios)**
- Landing: logo topo ([logo_oficial.png](file:///c:/trae/sindflow/sindflow/logo/logo_oficial.png)), título “Automatize…”, subtítulo, Benefícios (3–4 ícones+texto), Como funciona, botões Entrar/Assinar, rodapé (Termos/Privacidade/Contato). Imagem hero: [mockup.png](file:///c:/trae/sindflow/sindflow/images/mockup.png)
- Pagamento: título “Assine…”, resumo plano, valor, “Assinar com cartão” (Stripe), sucesso “Assinatura confirmada!”, redireciona para /login.
- Ambientes (teste): título, botões (Landing, Login Cliente, Login Master, Dashboard Cliente, Dashboard Master). Não publicado em produção.
- Login Cliente: e-mail, senha, “Entrar”, “Esqueci minha senha”, erro “E-mail ou senha inválidos”, redirect /app/conversas.
- Conexão WhatsApp: título, QR central, texto “Escaneie…”, status (Conectado/Desconectado/Reconectando), “Atualizar QR Code”, sucesso “WhatsApp conectado…”, se conectado: exibir número e “Desconectar”.
- Conversas: esquerda (busca, lista com nome/última/hora/🤖|👤/etiqueta), direita (cabeçalho: nome, número, “Assumir conversa”, status agente; histórico; input; “Enviar”), topo global (toggle Agente Ativo/Desativado + indicador). Vazio quando nada selecionado.
- Kanban: colunas fixas (Novas, Em atendimento automático, Pendentes, Finalizadas), cards (nome, tipo/etiqueta, última mensagem), drag and drop, “Criar nova etiqueta” + modal (nome, cor).
- Configuração do Agente: toggle “Ativar agente”, campo grande “Prompt do agente”, “Salvar alterações”, seletor de provedor (nome), aviso se nenhum provedor.
- Base de Conhecimento: “Novo material”, cards (título, trecho, Editar, Excluir), editor simples, “Material salvo”.
- Contatos: busca, lista (nome, número), “Iniciar conversa” + modal primeira mensagem.
- Anotações: “Nova anotação”, cards coloridos (título, texto, editar, excluir).
- Configurações da Conta: nome, e-mail, plano, status pagamento, “Alterar senha”, upload foto perfil.
- Login Master: e-mail, senha, “Entrar”.
- Dashboard Master: total usuários ativos, total requisições IA/mês, conexões WhatsApp ativas, status geral.
- Gestão de APIs: “Nova chave”, tabela (nome, provedor, status, disponível para clientes, Editar, Desativar), modal (nome, provedor OpenAI/Gemini, chave, status).
- Gestão de Clientes: lista (nome, e-mail, plano, status, WhatsApp conectado), ações (Suspender, Bloquear, Reativar).
- Monitoramento de Uso: por usuário (nome, total requisições no mês, provedor, status).
- Pagamentos (Stripe):
 - Seção 1 Configuração: título “Configuração de Pagamentos”, campos Public Key/Secret/Webhook/Produto, “Salvar Configurações”, “Testar Conexão”, status 🟢/🔴/🟡, mensagens sucesso/erro.
 - Seção 2 Status: assinaturas ativas/canceladas, receita mensal, status webhook.
 - Seção 3 Ações: “Desativar pagamentos”, “Reativar pagamentos”, aviso “Desativar pagamentos impede novas assinaturas”. Alertas quando sem chave ou webhook inativo.

**Implementação Técnica**
- Frontend: Vite/React/TS; rotas conforme mapa; layout estilo WhatsApp Web; estado global para agente e sessão; PWA.
- Edge Functions (Supabase): WhatsApp (QR, status, webhook, send, reconexão), AI Gateway (OpenAI; Gemini preparado), Classification (intenção/etiqueta), Knowledge Search (texto; preparado para pgvector), Admin Providers (CRUD), Stripe Webhook.
- Banco (Supabase): profiles, api_keys, user_settings, whatsapp_sessions, conversations, messages, labels, contacts, knowledge_entries, notes, usage_metrics, stripe_settings.
- Segurança/RLS: políticas por user_id; admin-only por role; Edge Functions com JWT e validação de ownership.
- Desempenho: timebox <5s em IA; Realtime mínimo; paginação; cache curto.
- Seeds: usuários conforme credenciais; conversas/mensagens mock.
- Deploy: Vercel (frontend); Supabase (DB/Auth/Functions); Stripe Checkout; Evolution API.

**Identidade Visual**
- Usar [logo_oficial.png](file:///c:/trae/sindflow/sindflow/logo/logo_oficial.png) e [mockup.png](file:///c:/trae/sindflow/sindflow/images/mockup.png) na Landing; referência interna [modelo_visual_sistema.png](file:///c:/trae/sindflow/sindflow/images/modelo_visual_sistema.png).

—

**Anexo: Mapa de Telas (Conteúdo Adicionado a partir da linha 119)**
Ambiente Público
1. Landing Page – Apresentação da plataforma e direcionamento para login ou assinatura
2. Página de Pagamento – Assinatura via Stripe
3. Página de Navegação de Ambientes – Navegação entre ambientes (teste local)
Ambiente do Cliente (Síndico / Administrador)
4. Login – Autenticação por e-mail e senha
5. Dashboard Principal (Conversas) – Caixa de entrada estilo WhatsApp Web
6. Kanban de Demandas – Organização visual das conversas
7. Configuração do Agente – Ativar/desativar agente e editar prompt
8. Base de Conhecimento – Gerenciar conteúdos utilizados pelo agente
9. Contatos – Lista estilo agenda + iniciar nova conversa
10. Anotações – Post-its coloridos editáveis
11. Configurações da Conta – Informações básicas + provedor de I.A
12. Conexão WhatsApp – Conectar número via QR Code
Ambiente Master (Dono da Plataforma)
13. Login Master – Acesso administrativo
14. Dashboard Master – Visão geral da plataforma
15. Gestão de APIs de I.A – Cadastro e controle de chaves
16. Gestão de Clientes – Controle de contas
17. Monitoramento de Uso – Consumo de I.A por cliente
18. Gestão de Pagamentos (Stripe) – Configuração da API Stripe e status da integração
—
🔵 Ambiente Público
Tela: Landing Page
• Objetivo: apresentar e direcionar para login/assinatura.
• Componentes: Logo topo; Título “Automatize o atendimento do seu condomínio com I.A”; Subtítulo; Benefícios (3–4 ícones+texto); Como funciona; Botões “Entrar” e “Assinar agora”; Rodapé (Termos, Privacidade, Contato).
Tela: Página de Pagamento
• Objetivo: assinatura mensal.
• Componentes: Título “Assine o SindFlow A.I”; Resumo do plano; Valor mensal; “Assinar com cartão” (Stripe); sucesso “Assinatura confirmada!”; redireciona para Login.
Tela: Página de Navegação de Ambientes (teste local)
• Objetivo: navegação técnica; disponível apenas na pasta do projeto.
• Componentes: Título “Ambientes do Sistema”; Botões: Landing, Login Cliente, Login Master, Dashboard Cliente, Dashboard Master.
—
🔐 Ambiente Cliente
Tela: Login
• Objetivo: autenticar usuário.
• Componentes: E-mail, Senha, “Entrar”, “Esqueci minha senha”, erro “E-mail ou senha inválidos”, redirect Dashboard.
Tela: Conexão WhatsApp
• Objetivo: conectar via QR.
• Componentes: Título, QR central, “Escaneie com seu WhatsApp”, status (Conectado/Desconectado/Reconectando), “Atualizar QR Code”, sucesso “WhatsApp conectado com sucesso”.
• Condições: se já conectado → exibir número e “Desconectar”.
Tela: Dashboard Principal (Conversas)
• Objetivo: visualizar/responder mensagens; estilo WhatsApp Web.
• Esquerda: busca; lista conversas (nome, última, horário, 🤖/👤, etiqueta).
• Direita: cabeçalho (nome, número, “Assumir conversa”, status agente); histórico; input; “Enviar”.
• Topo: toggle “Agente Ativo/Desativado” + indicador verde/vermelho; vazio quando sem conversa.
Tela: Kanban de Demandas
• Objetivo: organizar por status.
• Colunas: Novas; Em atendimento automático; Pendentes do síndico; Finalizadas.
• Componentes: cards (nome, tipo/etiqueta, última); drag and drop; “Criar nova etiqueta” + modal (nome, cor).
Tela: Configuração do Agente
• Objetivo: configurar comportamento.
• Componentes: toggle “Ativar agente”; “Prompt do agente”; “Salvar alterações”; seletor de provedor (nome); aviso sem provedor.
Tela: Base de Conhecimento
• Objetivo: gerenciar conteúdos.
• Componentes: “Novo material”; cards (título, trecho, Editar, Excluir); editor simples; “Material salvo”.
Tela: Contatos
• Objetivo: agenda + iniciar conversa.
• Componentes: busca; lista (nome, número); “Iniciar conversa” + modal primeira mensagem.
Tela: Anotações
• Objetivo: post-its internos.
• Componentes: “Nova anotação”; cards coloridos (título, texto, editar, excluir).
Tela: Configurações da Conta
• Objetivo: dados da conta.
• Componentes: nome; e-mail; plano ativo; status pagamento; “Alterar senha”; upload foto.
—
🔴 Ambiente Master
Tela: Login Master
• Componentes: E-mail; Senha; “Entrar”.
Tela: Dashboard Master
• Objetivo: visão geral.
• Componentes: total usuários ativos; total requisições I.A/mês; conexões WhatsApp ativas; status geral.
Tela: Gestão de APIs de I.A
• Objetivo: gerenciar chaves.
• Componentes: “Nova chave”; tabela (nome, provedor, status, disponível para clientes, Editar, Desativar); modal (nome, provedor, chave, status).
Tela: Gestão de Clientes
• Lista: nome, e-mail, plano, status (Ativo/Suspenso/Bloqueado), WhatsApp conectado (Sim/Não); ações (Suspender, Bloquear, Reativar).
Tela: Monitoramento de Uso
• Lista: nome; total requisições/mês; provedor utilizado; status.
Tela: Gestão de Pagamentos (Stripe)
• Objetivo: configurar/monitorar Stripe.
• Seção 1 – Configuração: Título “Configuração de Pagamentos”; Public Key; Secret Key; Webhook Secret; ID Produto/Plano; “Salvar Configurações”; “Testar Conexão”; status 🟢/🔴/🟡; mensagens.
• Seção 2 – Status: assinaturas ativas; canceladas; receita mensal; status webhook.
• Seção 3 – Ações: “Desativar pagamentos”; “Reativar pagamentos”; aviso “Desativar pagamentos impede novas assinaturas”.
• Condições: alertas quando sem chave; alerta quando webhook inativo.
