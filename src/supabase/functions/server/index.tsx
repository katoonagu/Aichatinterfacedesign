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

// GET History
app.get("/make-server-a1078296/chat", async (c) => {
  const sessionId = c.req.query("sessionId") || "default";
  
  try {
    const { data, error } = await supabase
      .from("Message")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Map DB fields to frontend format
    // DB: id, role, content, created_at, session_id
    // Frontend: id, role, content, timestamp, sources?
    const messages = (data || []).map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at, // string ISO from DB is fine, frontend parses it
      sources: [] // If you add a jsonb column 'sources' later, map it here: msg.sources
    }));

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

    // Insert into 'Message' table
    const { error } = await supabase
      .from("Message")
      .insert({
        session_id: sessionId, // Ensure this column is Text if using 'transformers', or UUID if using valid UUIDs
        role: message.role,
        content: message.content,
        // created_at: let DB default to now() or use message.timestamp if critical
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
    .from("Message")
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
    // Use the Production URL provided by the user
    const N8N_URL = "https://loderi723.app.n8n.cloud/webhook/chat";
    
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