import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { InitialLoader } from './components/InitialLoader';
import { Message, ChatSession, Domain } from './types';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';

import { chatApi } from './utils/chatService';

// Mock data
const MOCK_SESSIONS: ChatSession[] = [
  // ... keep structure but maybe empty or static for UI placeholder
  { 
    id: '1', 
    title: 'Трансформаторы ТМГ', 
    date: new Date(), 
    preview: 'Характеристики ТМГ-1000...',
    messages: []
  },
];

export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeDomain, setActiveDomain] = useState<Domain>('transformers');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Initial loader effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2200); // 2.2s to allow exit animation overlap
    return () => clearTimeout(timer);
  }, []);
  
  // Persistent User ID for anonymous session separation
  const [userId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_user_id');
      if (stored) return stored;
      const newId = crypto.randomUUID();
      localStorage.setItem('app_user_id', newId);
      return newId;
    }
    return 'default-user';
  });

  // Current session ID (defaults to a new one on load or specific one selected)
  // We use a state for this now instead of deriving from domain only
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `${userId}-transformers-${Date.now()}`);

  // Fetch list of sessions on mount and when domain/user changes (conceptually could filter by domain)
  useEffect(() => {
    const loadSessions = async () => {
       const fetchedSessions = await chatApi.getSessions();
       // Optionally filter by domain if your logic requires it, for now show all
       setSessions(fetchedSessions);
    };
    loadSessions();
  }, [userId, activeDomain]); // reloading on domain change if we want to filter later

  // Load chat history when currentSessionId changes
  useEffect(() => {
    const loadHistory = async () => {
      // If it's a new generated session ID that doesn't exist in backend yet, messages are empty
      // But if we selected an old session, fetch it.
      const existingSession = sessions.find(s => s.id === currentSessionId);
      
      if (existingSession) {
          const history = await chatApi.getHistory(currentSessionId);
          setMessages(history);
      } else {
          // New session or not found in list yet
          // Check if it really has messages (e.g. reload page on active session)
          const history = await chatApi.getHistory(currentSessionId);
          setMessages(history);
      }
    };
    loadHistory();
  }, [currentSessionId, sessions]); // Add sessions dependency to retry if list loads later

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop, always keep sidebar open (or restore previous state, but strictly forcing open for now as per design)
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    const initialMobile = window.innerWidth < 768;
    setIsMobile(initialMobile);
    if (initialMobile) {
      setIsSidebarOpen(false);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme handling
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Don't log, state change will trigger effect
  };

  const handleNewChat = () => {
    // Generate new ID
    const newId = `${userId}-${activeDomain}-${Date.now()}`;
    setCurrentSessionId(newId);
    setMessages([]); // Clear visual messages immediately
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Save User Message to Supabase
    // Use currentSessionId state
    await chatApi.saveMessage(currentSessionId, userMsg);
    
    // Refresh session list if this is the first message of a new session
    if (messages.length === 0) {
        // A bit of a hack: wait a sec for DB to consistency or just locally append
        // For now, let's just re-fetch in background
        setTimeout(async () => {
            const fetched = await chatApi.getSessions();
            setSessions(fetched);
        }, 1000);
    }

    // Add "Typing" placeholder
    const aiTypingId = (Date.now() + 1).toString();
    const typingMsg: Message = {
      id: aiTypingId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMsg]);

    try {
      // Call n8n Webhook
      const aiText = await chatApi.sendToN8n(content, currentSessionId);

      setMessages(prev => {
        // Remove typing msg
        const filtered = prev.filter(m => m.id !== aiTypingId);
        
        const aiResponse: Message = {
          id: (Date.now() + 2).toString(),
          role: 'ai',
          content: aiText,
          timestamp: new Date(),
          // Sources could be parsed from aiText if n8n returns them, for now static or empty
          sources: [] 
        };
        
        // Save AI Message to Supabase (fire and forget)
        chatApi.saveMessage(currentSessionId, aiResponse);
        
        return [...filtered, aiResponse];
      });
    } catch (error) {
       console.error("Error in chat flow:", error);
       // Remove typing indicator if error
       setMessages(prev => prev.filter(m => m.id !== aiTypingId));
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <AnimatePresence>
        {isInitialLoading && <InitialLoader />}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        activeDomain={activeDomain}
        onDomainChange={(domain) => {
          setActiveDomain(domain);
          // When domain changes, we might want to start a new chat or filter sessions
          // For now, let's just start a new chat in that domain context
          const newId = `${userId}-${domain}-${Date.now()}`;
          setCurrentSessionId(newId);
          setMessages([]);
        }}
        sessions={sessions}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isMobile={isMobile}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Top Navigation Bar (Mobile/Toggle) */}
        <header className="flex items-center p-4 border-b h-14 bg-background/80 backdrop-blur z-10 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {activeDomain === 'transformers' && 'Трансформаторы'}
              {activeDomain === 'substations' && 'Подстанции'}
              {activeDomain === 'equipment' && 'Электрооборудование'}
              {activeDomain === 'general' && 'Общая база знаний'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Beta 0.9
            </span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
           <ChatArea 
             messages={messages} 
             onPromptSelect={handleSendMessage}
             isSidebarOpen={isSidebarOpen}
             activeDomain={activeDomain}
           />
           
           {/* Input Area (Pinned) */}
           <div className="bg-background border-t z-10">
              <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
           </div>
        </div>
      </div>
    </div>
  );
}

// Simple mock response generator
function generateMockResponse(query: string): string {
  if (query.toLowerCase().includes('трансформатор')) {
    return `### Силовые трансформаторы серии ТМГ

Трансформаторы масляные герметичные (ТМГ) предназначены для преобразования электроэнергии в сетях энергосистем и потребителей.

**Основные характеристики:**
- Номинальное напряжение ВН: 6, 10 кВ
- Номинальное напряжение НН: 0.4 кВ
- Схема и группа соединения обмоток: Д/Ун-11, У/Ун-0

**Преимущества конструкции:**
1.  **Герметичность.** Масло не контактирует с окружающей средой, что исключает его окисление и увлажнение.
2.  **Отсутствие расширителя.** Температурные изменения объема масла компенсируются упругой деформацией гофров бака.
3.  **Не требуют обслуживания.** Нет необходимости в замене масла и силикагеля в течение всего срока службы.

Согласно **ГОСТ 11677-85**, трансформаторы должны выдерживать кратковременные перегрузки.`;
  }
  
  if (query.toLowerCase().includes('пуэ')) {
    return `### Требования ПУЭ (Правила устройства электроустановок)

В соответствии с **ПУЭ (Глава 4.2)**, для распределительных устройств (РУ) должны соблюдаться следующие минимальные расстояния:

| Элемент | Расстояние (мм) |
| :--- | :--- |
| От токоведущих частей до заземленных конструкций | 120 |
| Между токоведущими частями разных фаз | 130 |
| От токоведущих частей до сплошного ограждения | 150 |

*Важно:* При проектировании КТП необходимо учитывать не только электрические зазоры, но и удобство обслуживания оборудования оперативным персоналом.`;
  }

  if (query.toLowerCase().includes('чертеж') || query.toLowerCase().includes('схема') || query.toLowerCase().includes('фото')) {
     return `### Техническая документация и чертежи

��о вашему запросу найдены следующие материалы из базы данных технической документации:

**1. Общий вид трансформаторной подстанции (КТП)**
![Общий вид КТП](https://s3.ru1.storage.beget.cloud/de1fd0c5e608-mastra/test1/05f2e685-ed36-4bdb-84c4-9260588acbd6.jpg)

**2. Схема электрическая принципиальная**
![Схема электрическая](https://s3.ru1.storage.beget.cloud/de1fd0c5e608-mastra/test1/289a2fc4-8c5d-4dad-aeb6-94c6e4b64586.jpg)

**3. Компоновочное решение**
![Компоновка оборудования](https://s3.ru1.storage.beget.cloud/de1fd0c5e608-mastra/test1/41aaf67a-b8b3-4f98-886c-32b0a4373732.jpg)

*Примечание: Все чертежи соответствуют типовому проекту 407-3-662.03 и могут быть использованы в качестве основы для проектирования.*`;
  }

  return `Я нашел информацию по вашему запросу: **"${query}"**.

Для точного ответа мне нужно уточнить контекст. Однако, в общей технической документации указано следующее:

В электроустановках напряжением до 1000 В с глухозаземленной нейтралью, нулевой защитный проводник (PE) должен быть проложен отдельно от нулевого рабочего проводника (N), начиная от точки разделения (система TN-C-S).

Рекомендую обратиться к:
*   Техническим регламентам вашего предприятия
*   Паспорту конкретного изделия
*   Нормам ПТЭЭП`;
}
