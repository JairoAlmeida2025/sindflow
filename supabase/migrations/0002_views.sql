-- Colunas complementares
alter table profiles add column if not exists status text;
alter table profiles add column if not exists plan_name text;
alter table profiles add column if not exists stripe_customer_id text;
alter table notes add column if not exists title text;
alter table conversations add column if not exists created_at timestamp with time zone default now();

-- VIEW: usuario
create or replace view usuario as
select
  p.id,
  p.display_name as nome,
  (select u.email from auth.users u where u.id = p.id) as email,
  case when p.role = 'master' then 'MASTER' else 'CLIENTE' end as tipo_usuario,
  coalesce(p.status, 'ATIVO') as status,
  p.photo_url as foto_perfil_url,
  coalesce(us.agent_enabled, false) as agente_ativo,
  us.base_prompt as prompt_agente,
  ws.session_id as whatsapp_numero,
  ws.status as whatsapp_status,
  p.plan_name as plano_nome,
  p.stripe_customer_id,
  (select u.created_at from auth.users u where u.id = p.id) as criado_em
from profiles p
left join user_settings us on us.user_id = p.id
left join whatsapp_sessions ws on ws.user_id = p.id;

-- VIEW: conversa
create or replace view conversa as
select
  id,
  user_id as usuario_id,
  contact_id as contato_id,
  kanban_status as status_kanban,
  null::uuid as etiqueta_id,
  case when coalesce(ai_handling, false) then 'AUTOMATICO' else 'MANUAL' end as atendimento_tipo,
  last_message_at as ultima_mensagem_em,
  created_at as criado_em
from conversations;

-- VIEW: mensagem
create or replace view mensagem as
select
  id,
  conversation_id as conversa_id,
  case
    when ai_generated then 'AGENTE'
    when from_me then 'CLIENTE'
    else 'CONTATO'
  end as remetente_tipo,
  text as conteudo,
  case when media_url is not null then 'IMAGEM' else 'TEXTO' end as tipo_mensagem,
  created_at as enviada_em,
  'ENTREGUE'::text as status_envio
from messages;

-- VIEW: contato
create or replace view contato as
select
  id,
  user_id as usuario_id,
  name as nome,
  wa_number as telefone,
  source as origem,
  now() as criado_em
from contacts;

-- VIEW: etiqueta
create or replace view etiqueta as
select
  id,
  user_id as usuario_id,
  name as nome,
  color as cor,
  now() as criado_em
from labels;

-- VIEW: base_conhecimento
create or replace view base_conhecimento as
select
  id,
  user_id as usuario_id,
  title as titulo,
  content as conteudo,
  now() as criado_em,
  now() as atualizado_em
from knowledge_entries;

-- VIEW: anotacao
create or replace view anotacao as
select
  id,
  user_id as usuario_id,
  coalesce(title, 'Nota') as titulo,
  content as conteudo,
  color as cor,
  created_at as criado_em
from notes;

-- VIEW: api_key
create or replace view api_key as
select
  id,
  name as nome,
  provider as provedor,
  '***'::text as chave_api,
  case when active then 'ATIVA' else 'INATIVA' end as status,
  available_to_clients as disponivel_para_clientes,
  created_at as criado_em
from api_keys;

-- VIEW: uso_ia
create or replace view uso_ia as
select
  id,
  user_id as usuario_id,
  null::uuid as api_key_id,
  coalesce(tokens_in,0) + coalesce(tokens_out,0) as total_requisicoes,
  to_char(created_at, 'YYYY-MM') as mes_referencia,
  created_at as atualizado_em
from usage_metrics;

-- VIEW: configuracao_stripe
create or replace view configuracao_stripe as
select
  id,
  public_key,
  secret_key,
  webhook_secret,
  product_id,
  coalesce(status, 'NAO_CONFIGURADO') as status_conexao,
  true as pagamentos_ativos
from stripe_settings;
