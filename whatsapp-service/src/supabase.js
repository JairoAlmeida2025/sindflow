import { createClient } from "@supabase/supabase-js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import Pino from "pino";

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // MUST be Service Role Key for backend

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Database persistence disabled.");
}

export function normalizeJidFromMessage(message) {
  try {
    const key = message?.key || {};
    let rjid = key.remoteJid || "";
    const alt = key.remoteJidAlt;
    if (typeof rjid === "string" && rjid.endsWith("@lid")) {
      if (alt && typeof alt === "string") {
        rjid = alt;
      } else {
        rjid = rjid.replace("@lid", "@s.whatsapp.net");
      }
    }
    // handle c.us to s.whatsapp.net normalization
    if (rjid.endsWith("@c.us")) {
      rjid = rjid.replace("@c.us", "@s.whatsapp.net");
    }
    const phone = rjid.replace(/@.*$/, "");
    return { jid: rjid, phone };
  } catch {
    const rjid = message?.key?.remoteJid || "";
    return { jid: rjid, phone: rjid.replace(/@.*$/, "") };
  }
}

export async function saveMessage(tenantId, message) {
  if (!supabase) return;

  try {
    const userId = tenantId.replace("usr-", "");
    const { key, messageTimestamp, pushName } = message;
    const { jid: remoteJidNorm, phone } = normalizeJidFromMessage(message);
    const fromMe = key.fromMe;
    const id = key.id;
    
    // Ignore status updates
    if (remoteJidNorm === "status@broadcast") return;

    // Extract text content
    const content = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || 
                    message.message?.imageMessage?.caption || 
                    message.message?.videoMessage?.caption ||
                    "";

    // Extract media
    let mediaUrl = null;
    const messageType = Object.keys(message.message || {})[0];
    if (
      messageType === "imageMessage" || 
      messageType === "videoMessage" || 
      messageType === "audioMessage" || 
      messageType === "stickerMessage" ||
      messageType === "documentMessage"
    ) {
        try {
            const buffer = await downloadMediaMessage(
                message,
                'buffer',
                { logger: Pino({ level: 'silent' }) }
            );
            
            const fileName = `${userId}/${remoteJidNorm}/${Date.now()}_${id}.${getContentType(messageType)}`;
            const { data, error } = await supabase.storage
                .from('chat-media')
                .upload(fileName, buffer, {
                    contentType: getMimeType(messageType),
                    upsert: true
                });
            
            if (!error && data) {
                const { data: publicUrl } = supabase.storage.from('chat-media').getPublicUrl(fileName);
                mediaUrl = publicUrl.publicUrl;
            } else {
                console.error("Failed to upload media:", error);
            }
        } catch (err) {
            console.error("Failed to download/save media:", err);
        }
    }

    // 1. Upsert Contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .upsert(
        { 
          user_id: userId, 
          wa_number: remoteJidNorm, 
          name: pushName || phone 
        }, 
        { onConflict: "user_id, wa_number" }
      )
      .select()
      .single();

    if (contactError) throw new Error(`Contact error: ${contactError.message}`);

    // 2. Upsert Conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .upsert(
        {
          user_id: userId,
          contact_id: contact.id,
          last_message_at: new Date(messageTimestamp * 1000).toISOString(),
          title: contact.name
        },
        { onConflict: "user_id, contact_id" }
      )
      .select()
      .single();

    if (convError) throw new Error(`Conversation error: ${convError.message}`);

    // 3. Insert Message
    const { error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        from_me: fromMe,
        text: content,
        media_url: mediaUrl,
        created_at: new Date(messageTimestamp * 1000).toISOString(),
        ai_generated: false
      });

    if (msgError) throw new Error(`Message error: ${msgError.message}`);

  } catch (err) {
    console.error("Failed to save message to Supabase:", err);
  }
}

export async function updateContactAvatar(userId, waNumber, url) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("contacts")
      .upsert(
        {
          user_id: userId,
          wa_number: waNumber,
          metadata: { avatar_url: url }
        },
        { onConflict: "user_id, wa_number" }
      );
    if (error) {
      console.error("Failed to upsert avatar_url:", error);
    }
  } catch (err) {
    console.error("Failed to update avatar_url:", err);
  }
}

function getContentType(type) {
    switch (type) {
        case "imageMessage": return "jpg";
        case "videoMessage": return "mp4";
        case "audioMessage": return "mp3";
        case "stickerMessage": return "webp";
        case "documentMessage": return "bin"; // or extract extension from fileName
        default: return "bin";
    }
}

function getMimeType(type) {
    switch (type) {
        case "imageMessage": return "image/jpeg";
        case "videoMessage": return "video/mp4";
        case "audioMessage": return "audio/ogg"; // Prefer opus from web recorder
        case "stickerMessage": return "image/webp";
        default: return "application/octet-stream";
    }
}
