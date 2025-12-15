import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
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

// Health check endpoint
app.get("/make-server-a1078296/health", (c) => {
  return c.json({ status: "ok" });
});

// --- Chat History (KV Store) ---
const CHAT_PREFIX = "chat:v1";

// GET History
app.get("/make-server-a1078296/chat", async (c) => {
  const sessionId = c.req.query("sessionId") || "default";
  const key = `${CHAT_PREFIX}:${sessionId}`;
  
  try {
    const messages = await kv.get(key);
    return c.json({ messages: messages || [] });
  } catch (err) {
    console.error("Error fetching chat:", err);
    return c.json({ messages: [] }, 500);
  }
});

// POST Message (Append)
app.post("/make-server-a1078296/chat", async (c) => {
  try {
    const { sessionId = "default", message, messages } = await c.req.json();
    const key = `${CHAT_PREFIX}:${sessionId}`;
    
    // If 'messages' array is provided, overwrite (sync full history)
    // If single 'message' is provided, append
    
    if (messages) {
      await kv.set(key, messages);
      return c.json({ status: "synced", count: messages.length });
    }
    
    if (message) {
      const current = (await kv.get(key)) || [];
      const updated = [...current, message];
      await kv.set(key, updated);
      return c.json({ status: "appended", count: updated.length });
    }
    
    return c.json({ error: "No message or messages provided" }, 400);
  } catch (err) {
    console.error("Error saving chat:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// DELETE History (Clear)
app.delete("/make-server-a1078296/chat", async (c) => {
  const sessionId = c.req.query("sessionId") || "default";
  const key = `${CHAT_PREFIX}:${sessionId}`;
  await kv.del(key);
  return c.json({ status: "cleared" });
});

// PROXY to N8N (Avoids CORS issues)
app.post("/make-server-a1078296/n8n-proxy", async (c) => {
  try {
    const body = await c.req.json();
    // Use the URL provided by the user. 
    // In production, this might be an env var, but here we hardcode or pass it.
    // The user provided: https://loderi723.app.n8n.cloud/webhook-test/chat
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
    return c.json({ error: "Failed to proxy request" }, 500);
  }
});

Deno.serve(app.fetch);