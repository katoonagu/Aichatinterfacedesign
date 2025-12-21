import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  Zap, 
  BookOpen, 
  Grid, 
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatSession, Domain } from '../types';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  activeDomain: Domain;
  onDomainChange: (domain: Domain) => void;
  isMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ 
  isOpen, 
  toggleSidebar, 
  isDarkMode, 
  toggleTheme,
  activeDomain,
  onDomainChange,
  sessions,
  onSessionSelect,
  isMobile,
  onCloseMobile,
  onNewChat
}: SidebarProps & { onNewChat: () => void }) {
  const sidebarContent = (
    <div className="p-4 flex flex-col gap-4 h-full w-[280px]">
        {/* Header / New Chat */}
        <Button 
          variant="outline" 
          onClick={onNewChat}
          className="w-full justify-start gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary transition-all font-medium h-10 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Новый чат</span>
        </Button>

        {/* Domain Filter */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Домен поиска</h3>
          <div className="grid gap-1">
            <DomainItem 
              icon={<Zap className="w-4 h-4" />} 
              label="Трансформаторы" 
              isActive={activeDomain === 'transformers'} 
              onClick={() => {
                onDomainChange('transformers');
                if (isMobile) onCloseMobile();
              }}
            />
            <DomainItem 
              icon={<Grid className="w-4 h-4" />} 
              label="Подстанции" 
              isActive={activeDomain === 'substations'} 
              onClick={() => {
                onDomainChange('substations');
                if (isMobile) onCloseMobile();
              }}
            />
            <DomainItem 
              icon={<Settings className="w-4 h-4" />} 
              label="Оборудование" 
              isActive={activeDomain === 'equipment'} 
              onClick={() => {
                onDomainChange('equipment');
                if (isMobile) onCloseMobile();
              }}
            />
            <DomainItem 
              icon={<BookOpen className="w-4 h-4" />} 
              label="Общая база" 
              isActive={activeDomain === 'general'} 
              onClick={() => {
                onDomainChange('general');
                if (isMobile) onCloseMobile();
              }}
            />
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* History */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">История</h3>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSessionSelect(session.id);
                    if (isMobile) onCloseMobile();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/50 group transition-colors flex items-center gap-3 text-sm"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-foreground/90 font-medium text-[13px]">{session.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{session.preview}</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator className="bg-border/50" />

        {/* Footer actions */}
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
               AI
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-semibold leading-none">Engineer Pro</span>
               <span className="text-[10px] text-muted-foreground">Enterprise Plan</span>
             </div>
           </div>
           
           <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-muted-foreground">
             {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
           </Button>
        </div>
      </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[99] backdrop-blur-sm"
              onClick={onCloseMobile}
            />
          )}
        </AnimatePresence>
        
        {/* Mobile Sidebar */}
        <motion.div 
          initial={{ x: -280 }}
          animate={{ x: isOpen ? 0 : -280 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className={cn(
            "fixed top-0 left-0 bottom-0 z-[100] w-[280px] bg-background shadow-2xl border-r border-border",
            "flex flex-col"
          )}
        >
          {sidebarContent}
        </motion.div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <motion.div 
      initial={{ width: 280 }}
      animate={{ width: isOpen ? 280 : 0 }}
      className={cn(
        "h-screen border-r flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden relative",
        "border-border transition-colors duration-300",
        "flex-shrink-0" // Prevent shrinking in flex container
      )}
    >
      {sidebarContent}
    </motion.div>
  );
}

function DomainItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
      {isActive && <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  );
}
