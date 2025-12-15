export type MessageRole = 'user' | 'ai';

export interface Source {
  id: string;
  title: string;
  type: 'gost' | 'pue' | 'manual' | 'other';
  url?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: Source[];
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  date: Date;
  preview: string;
  messages: Message[];
}

export type Domain = 'transformers' | 'substations' | 'equipment' | 'general';
