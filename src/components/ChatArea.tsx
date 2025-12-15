import React, { useRef, useEffect } from 'react';
import { Message, Domain } from '../types';
import { MessageItem } from './MessageItem';
import { WelcomeScreen } from './WelcomeScreen';

interface ChatAreaProps {
  messages: Message[];
  onPromptSelect: (prompt: string) => void;
  isSidebarOpen: boolean;
  activeDomain: Domain;
}

export function ChatArea({ messages, onPromptSelect, isSidebarOpen, activeDomain }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
        <div className="flex-1 overflow-y-auto">
            <WelcomeScreen onPromptSelect={onPromptSelect} domain={activeDomain} />
        </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="flex flex-col min-h-full pb-4">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        <div ref={scrollRef} className="h-4" />
      </div>
    </div>
  );
}
