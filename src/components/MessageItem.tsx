import React from 'react';
import { motion } from 'motion/react';
import { Bot, User, FileText, Check, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message, Source } from '../types';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full py-6 md:py-8 px-4 border-b border-transparent",
        isUser ? "bg-background" : "bg-muted/30" // Subtle differentiation
      )}
    >
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm",
            isUser 
              ? "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" 
              : "bg-primary border-primary/20 text-primary-foreground"
          )}>
            {isUser ? <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" /> : <Bot className="w-5 h-5" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {isUser ? 'Вы' : 'AI Assistant'}
            </span>
            {!isUser && (
               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
                   {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                 </Button>
               </div>
            )}
          </div>

          {/* Text Body */}
          <div className={cn(
            "prose prose-sm max-w-none break-words dark:prose-invert",
            "prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-p:leading-relaxed",
            "prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-border",
            isUser ? "text-foreground/90" : "text-foreground"
          )}>
            {message.isTyping ? (
               <div className="flex items-center gap-1 h-6">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
               </div>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>

          {/* Sources (AI only) */}
          {!isUser && message.sources && message.sources.length > 0 && !message.isTyping && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Источники
              </h4>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source) => (
                  <SourceChip key={source.id} source={source} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SourceChip({ source }: { source: Source }) {
  return (
    <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors shadow-sm">
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        source.type === 'gost' ? 'bg-red-500' : 
        source.type === 'pue' ? 'bg-yellow-500' : 
        'bg-blue-500'
      )} />
      {source.title}
    </button>
  );
}
