import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Zap, Grid, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Domain } from '../types';

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
  domain: Domain;
}

export function WelcomeScreen({ onPromptSelect, domain }: WelcomeScreenProps) {
  const getContent = () => {
    switch (domain) {
      case 'transformers':
        return {
          title: 'Трансформаторы',
          description: 'Помощник по силовым трансформаторам, их характеристикам, диагностике и обслуживанию.',
          icon: <Zap className="w-8 h-8 text-white" />,
          suggestions: [
             { title: "Устройство трансформатора", prompt: "Как устроен силовой трансформатор 10 кВ? Опиши основные узлы." },
             { title: "Типы охлаждения", prompt: "Какие существуют системы охлаждения силовых трансформаторов (ONAN, ONAF)?" },
             { title: "Сравнение ТМГ и ТДН", prompt: "Чем отличается трансформатор типа ТМГ от ТДН? Сравни характеристики." },
             { title: "Диагностика", prompt: "Какие параметры проверяются при хроматографическом анализе масла?" }
          ]
        };
      case 'substations':
        return {
          title: 'Подстанции',
          description: 'Техническая документация, нормы проектирования и эксплуатации подстанций (КТП, РП, ТП).',
          icon: <Grid className="w-8 h-8 text-white" />,
          suggestions: [
             { title: "Нормативы ПУЭ", prompt: "Найди требования ПУЭ для комплектных трансформаторных подстанций (КТП)." },
             { title: "Схемы РУ", prompt: "Опиши типовые схемы распределительных устройств 10 кВ." },
             { title: "Заземление", prompt: "Как рассчитывается контур заземления для КТП?" },
             { title: "Обслуживание", prompt: "Периодичность осмотров трансформаторных подстанций без персонала." }
          ]
        };
      case 'equipment':
        return {
          title: 'Электрооборудование',
          description: 'Справочник по высоковольтному и низковольтному оборудованию, коммутационным аппаратам и защите.',
          icon: <Settings className="w-8 h-8 text-white" />,
          suggestions: [
             { title: "Выключатели", prompt: "Сравни вакуумные и элегазовые выключатели 10 кВ." },
             { title: "Разъединители", prompt: "Назначение и принцип работы разъединителя РЛНД." },
             { title: "Кабельные линии", prompt: "Как выбрать сечение кабеля 10 кВ по току короткого замыкания?" },
             { title: "Релейная защита", prompt: "Основные виды защит на отходящих линиях 10 кВ." }
          ]
        };
      default:
        return {
          title: 'Инженерный AI-ассистент',
          description: 'Помощник по технической документации, нормам и оборудованию. Задайте вопрос или выберите тему ниже.',
          icon: <Sparkles className="w-8 h-8 text-white" />,
          suggestions: [
            { title: "Силовые трансформаторы", prompt: "Как устроен силовой трансформатор 10 кВ? Опиши основные узлы." },
            { title: "Нормативы ПУЭ", prompt: "Найди требования ПУЭ для комплектных трансформаторных подстанций (КТП)." },
            { title: "Сравнение оборудования", prompt: "Чем отличается трансформатор типа ТМГ от ТДН? Сравни характеристики." },
            { title: "ГОСТ и допуски", prompt: "Какие существуют допуски и нормы испытаний по ГОСТ для высоковольтных выключателей?" }
          ]
        };
    }
  };

  const { title, description, icon, suggestions } = getContent();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[50vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={domain}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-4xl flex flex-col items-center"
        >
          <div className="text-center max-w-2xl mx-auto space-y-6 mb-12">
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300
                ${domain === 'transformers' ? 'bg-gradient-to-br from-amber-700 to-yellow-900 shadow-amber-900/20' : ''}
                ${domain === 'substations' ? 'bg-gradient-to-br from-blue-800 to-slate-800 shadow-blue-900/20' : ''}
                ${domain === 'equipment' ? 'bg-gradient-to-br from-emerald-700 to-teal-900 shadow-emerald-900/20' : ''}
                ${(!['transformers', 'substations', 'equipment'].includes(domain)) ? 'bg-gradient-to-br from-slate-700 to-zinc-900 shadow-zinc-900/20' : ''}
              `}>
                 {icon}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {suggestions.map((item, idx) => (
              <motion.button
                key={`${domain}-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + (idx * 0.05), duration: 0.4 }}
                onClick={() => onPromptSelect(item.prompt)}
                className="group flex flex-col text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {item.title}
                </span>
                <span className="text-sm text-muted-foreground line-clamp-2">
                  "{item.prompt}"
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
