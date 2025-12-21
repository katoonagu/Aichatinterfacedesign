import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Init Supabase Client
// Note: These env vars are automatically available in Supabase Edge Functions
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Health check endpoint
app.get("/make-server-a1078296/health", (c) => {
  return c.json({ status: "ok" });
});

// --- Chat History (Supabase DB: 'Message' table) ---

// GET Sessions (List of unique conversations)
app.get("/make-server-a1078296/sessions", async (c) => {
  try {
    // Fetch all messages to group them by session (not efficient for production, but works for prototype without custom SQL views)
    // We only need session_id and message content to generate titles/previews
    const { data, error } = await supabase
      .from("n8n_chat_histories")
      .select("session_id, message, id")
      .order("id", { ascending: true });

    if (error) throw error;

    // Group by session_id
    const sessionsMap = new Map();
    
    (data || []).forEach((row: any) => {
      const sId = row.session_id;
      if (!sessionsMap.has(sId)) {
        // Found a new session
        const msgContent = row.message?.content || "";
        const title = msgContent.slice(0, 30) + (msgContent.length > 30 ? "..." : "");
        
        sessionsMap.set(sId, {
          id: sId,
          title: title || "Новый чат",
          date: new Date().toISOString(), // We don't have real date in this table, using placeholder or could be improved later
          preview: msgContent.slice(0, 50),
          messages: [] // Placeholder
        });
      }
    });

    const sessions = Array.from(sessionsMap.values());
    return c.json({ sessions });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return c.json({ sessions: [], error: (err as Error).message }, 500);
  }
});

// GET History
app.get("/make-server-a1078296/chat", async (c) => {
  const sessionId = c.req.query("sessionId") || "default";
  
  try {
    // Map DB fields from n8n_chat_histories
    // DB: id, session_id, message: { type: 'human'|'ai', content: string }
    const { data, error } = await supabase
      .from("n8n_chat_histories")
      .select("*")
      .eq("session_id", sessionId)
      .order("id", { ascending: true }); // Using 'id' for ordering as created_at might be missing

    if (error) {
      throw error;
    }

    const messages = (data || []).map((row: any) => {
      const msg = row.message || {};
      return {
        id: row.id.toString(),
        role: msg.type === "human" ? "user" : "ai",
        content: msg.content || "",
        timestamp: new Date().toISOString(), // Timestamp is not standard in n8n table, using now as fallback
      };
    });

    return c.json({ messages });
  } catch (err) {
    console.error("Error fetching chat:", err);
    return c.json({ messages: [], error: (err as Error).message }, 500);
  }
});

// POST Message (Append)
app.post("/make-server-a1078296/chat", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId = "default", message } = body;
    
    // We ignore body.messages (bulk sync) now as we want to insert individual messages
    // to leverage the DB properly.
    
    if (!message) {
      return c.json({ error: "No message provided" }, 400);
    }

    // Insert into 'n8n_chat_histories' table
    // Format: session_id, message: { type: 'human'|'ai', content: ... }
    const { error } = await supabase
      .from("n8n_chat_histories")
      .insert({
        session_id: sessionId,
        message: {
          type: message.role === "user" ? "human" : "ai",
          content: message.content,
        }
      });

    if (error) {
      throw error;
    }

    return c.json({ status: "saved" });
  } catch (err) {
    console.error("Error saving chat:", err);
    return c.json({ error: "Internal Server Error", details: (err as Error).message }, 500);
  }
});

// DELETE History (Clear)
app.delete("/make-server-a1078296/chat", async (c) => {
  const sessionId = c.req.query("sessionId") || "default";
  
  const { error } = await supabase
    .from("n8n_chat_histories")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    console.error("Error clearing chat:", error);
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ status: "cleared" });
});

// PROXY to N8N (Avoids CORS issues)
app.post("/make-server-a1078296/n8n-proxy", async (c) => {
  try {
    const body = await c.req.json();
    // Use the Test URL as requested for debugging
    const N8N_URL = "https://loderi723.app.n8n.cloud/webhook-test/chat";
    
    const response = await fetch(N8N_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`N8N Error (${response.status}): ${text}`);
      return c.json({ error: `N8N responded with ${response.status}`, details: text }, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (err) {
    console.error("Proxy Error:", err);
    return c.json({ error: "Failed to proxy request", details: (err as Error).message }, 500);
  }
});

Deno.serve(app.fetch);