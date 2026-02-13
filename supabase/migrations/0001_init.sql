create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('master','user')),
  display_name text,
  photo_url text
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  key text not null,
  active boolean not null default true,
  available_to_clients boolean not null default true,
  created_at timestamp with time zone default now()
);

create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_enabled boolean not null default false,
  selected_provider_id uuid references api_keys(id),
  base_prompt text
);

create table whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text,
  status text,
  qr_image_url text,
  last_connected_at timestamp with time zone
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wa_number text not null,
  name text,
  source text,
  metadata jsonb
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  title text,
  last_message_at timestamp with time zone,
  kanban_status text,
  ai_handling boolean default false
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  from_me boolean not null,
  text text,
  media_url text,
  created_at timestamp with time zone default now(),
  ai_generated boolean default false,
  classification_label text
);

create table labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text
);

create table knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  tags text[]
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  color text,
  created_at timestamp with time zone default now()
);

create table usage_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text,
  tokens_in integer,
  tokens_out integer,
  cost_estimated numeric,
  created_at timestamp with time zone default now()
);

create table stripe_settings (
  id uuid primary key default gen_random_uuid(),
  public_key text,
  secret_key text,
  webhook_secret text,
  product_id text,
  status text
);

alter table api_keys enable row level security;
alter table user_settings enable row level security;
alter table whatsapp_sessions enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table labels enable row level security;
alter table knowledge_entries enable row level security;
alter table notes enable row level security;
alter table usage_metrics enable row level security;
alter table profiles enable row level security;
alter table stripe_settings enable row level security;

create policy user_is_owner on user_settings for all using (user_id = auth.uid());
create policy user_is_owner on whatsapp_sessions for all using (user_id = auth.uid());
create policy user_is_owner on contacts for all using (user_id = auth.uid());
create policy user_is_owner on conversations for all using (user_id = auth.uid());
create policy user_is_owner on messages for select using (exists (select 1 from conversations c where c.id = messages.conversation_id and c.user_id = auth.uid()));
create policy user_is_owner_iud on messages for insert with check (exists (select 1 from conversations c where c.id = messages.conversation_id and c.user_id = auth.uid()));
create policy user_is_owner_labels on labels for all using (user_id = auth.uid());
create policy user_is_owner_k on knowledge_entries for all using (user_id = auth.uid());
create policy user_is_owner_n on notes for all using (user_id = auth.uid());
create policy user_is_owner_u on usage_metrics for select using (user_id = auth.uid());
create policy user_is_self on profiles for select using (id = auth.uid());

