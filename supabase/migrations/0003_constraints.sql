-- Adiciona constraints para garantir unicidade e facilitar upserts
-- Tabela contacts: Um contato é único por user_id e wa_number
ALTER TABLE contacts
DROP CONSTRAINT IF EXISTS contacts_user_wa_number_key;
ALTER TABLE contacts
ADD CONSTRAINT contacts_user_wa_number_key UNIQUE (user_id, wa_number);

-- Tabela conversations: Uma conversa é única por user_id e contact_id
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_user_contact_key;
ALTER TABLE conversations
ADD CONSTRAINT conversations_user_contact_key UNIQUE (user_id, contact_id);

-- Cria bucket de armazenamento para mídias do WhatsApp se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket (permitir upload autenticado e leitura pública ou autenticada)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service Role Upload" ON storage.objects;
CREATE POLICY "Service Role Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-media'); -- Service role bypasses RLS anyway but good to be explicit if using user context

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);