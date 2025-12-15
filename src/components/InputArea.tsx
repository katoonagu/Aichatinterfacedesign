import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Mic } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea'; // Assuming shadcn textarea exists or I use standard
import { cn } from '../lib/utils';

interface InputAreaProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export function InputArea({ onSendMessage, isLoading }: InputAreaProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || isLoading) return;
    onSendMessage(content);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6 pt-2">
      <div className={cn(
        "flex items-end gap-2 p-2 rounded-xl border bg-background shadow-sm transition-all duration-300",
        "focus-within:shadow-md focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20"
      )}>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full shrink-0 mb-0.5 ml-1">
          <Paperclip className="w-5 h-5" />
        </Button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Задайте вопрос по документации, оборудованию или регламентам..."
          className="flex-1 min-h-[44px] py-2.5 bg-transparent border-0 focus:ring-0 resize-none text-base max-h-[200px] scrollbar-hide placeholder:text-muted-foreground/60"
          style={{ height: '44px' }}
        />

        <Button 
            onClick={() => handleSubmit()}
            disabled={!content.trim() || isLoading}
            size="icon" 
            className={cn(
              "h-9 w-9 rounded-lg transition-all duration-200 shrink-0 mb-0.5 mr-1",
              content.trim() 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
        </Button>
      </div>
      <div className="text-center mt-2">
         <p className="text-[10px] text-muted-foreground/60">
           AI-ассистент может допускать ошибки. Проверяйте важную информацию в официальной документации.
         </p>
      </div>
    </div>
  );
}
