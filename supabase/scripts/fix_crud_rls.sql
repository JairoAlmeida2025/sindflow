-- 1. Políticas de Segurança (RLS) para as tabelas principais
-- Garantem que cada usuário só acesse seus próprios dados

-- Contacts (Clientes)
drop policy if exists user_is_owner on contacts;
create policy user_is_owner on contacts for all using (user_id = auth.uid());

-- Knowledge Entries (Base de Conhecimento)
drop policy if exists user_is_owner_k on knowledge_entries;
create policy user_is_owner_k on knowledge_entries for all using (user_id = auth.uid());

-- Labels (Etiquetas/Kanban)
drop policy if exists user_is_owner_labels on labels;
create policy user_is_owner_labels on labels for all using (user_id = auth.uid());

-- Notes (Anotações)
drop policy if exists user_is_owner_n on notes;
create policy user_is_owner_n on notes for all using (user_id = auth.uid());

-- User Settings (Configurações do Agente)
drop policy if exists user_is_owner on user_settings;
create policy user_is_owner on user_settings for all using (user_id = auth.uid());

-- Usage Metrics (Uso I.A.)
drop policy if exists user_is_owner_u on usage_metrics;
create policy user_is_owner_u on usage_metrics for all using (user_id = auth.uid());

-- Whatsapp Sessions
drop policy if exists user_is_owner on whatsapp_sessions;
create policy user_is_owner on whatsapp_sessions for all using (user_id = auth.uid());

-- Conversations
drop policy if exists user_is_owner on conversations;
create policy user_is_owner on conversations for all using (user_id = auth.uid());

-- Messages
drop policy if exists user_is_owner on messages;
drop policy if exists user_is_owner_iud on messages;
create policy user_is_owner on messages for select using (
  exists (select 1 from conversations c where c.id = messages.conversation_id and c.user_id = auth.uid())
);
create policy user_is_owner_iud on messages for insert with check (
  exists (select 1 from conversations c where c.id = messages.conversation_id and c.user_id = auth.uid())
);

-- Master Access: Permite que usuários com role='master' vejam TUDO (opcional, para dashboard admin)
-- Exemplo para tabela contacts:
create policy "Master view all contacts" on contacts for select
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'master')
);

-- Repita para outras tabelas se necessário o master ver dados dos clientes
create policy "Master view all usage" on usage_metrics for select
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'master')
);
