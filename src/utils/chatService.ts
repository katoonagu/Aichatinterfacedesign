import { Message } from '../types';
import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a1078296`;

export const chatApi = {
  async getSessions(): Promise<ChatSession[]> {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
      const data = await res.json();
      return data.sessions.map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }));
    } catch (e) {
      console.error("Failed to fetch sessions", e);
      return [];
    }
  },

  async getHistory(sessionId: string): Promise<Message[]> {
    try {
      const res = await fetch(`${API_BASE}/chat?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      const data = await res.json();
      return data.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        // Ensure sources are preserved if they exist
        sources: m.sources
      }));
    } catch (e) {
      console.error("Failed to fetch history", e);
      return [];
    }
  },

  async saveMessage(sessionId: string, message: Message): Promise<void> {
    try {
      // Create a copy of the message to sanitize if needed
      const msgToSave = {
        ...message,
        // Ensure timestamp is a string/ISO for consistency if logic differs
        timestamp: message.timestamp
      };

      await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ sessionId, message: msgToSave })
      });
    } catch (e) {
      console.error("Failed to save message", e);
    }
  },

  async clearHistory(sessionId: string): Promise<void> {
    try {
        await fetch(`${API_BASE}/chat?sessionId=${sessionId}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
    } catch (e) {
        console.error("Failed to clear history", e);
    }
  },

  async sendToN8n(prompt: string, sessionId: string): Promise<string> {
    // Direct connection to N8N Test Webhook (Bypassing Proxy)
    // Note: This often requires the N8N editor UI to be open for the webhook to trigger
    const WEBHOOK_URL = "https://loderi723.app.n8n.cloud/webhook-test/chat";
    
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // No Authorization header needed for public N8N webhooks usually
        },
        body: JSON.stringify({ 
          prompt, 
          sessionId, 
          timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`N8N Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      console.log("N8N Response:", data);

      return data.output || data.text || data.response || data.answer || data.content || JSON.stringify(data);
    } catch (e) {
      console.error("Failed to send to n8n", e);
      return `Ошибка соединения с AI: ${(e as Error).message}. Проверьте, активен ли сценарий в n8n (webhook-test требует открытой вкладки).`;
    }
  }
};
