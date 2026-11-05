import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  User,
  Send,
  BookOpen,
  ExternalLink,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';

import { AssistantMessage } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';

export const AssistantPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isMock = isMockDataEnabled();

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello. I am the Flood Early Warning AI Assistant. You can ask me about documented river basin telemetry, emergency safety protocols, flood preparedness guidelines, and shelter recommendations. How can I assist your operational team today?',
      timestamp: new Date().toISOString(),
      sources: [
        {
          title: 'National Disaster Management Authority (NDMA) Protocols',
          url: 'https://ndma.gov.in',
          excerpt: 'Flood management guidelines, early warning system standard operating procedures.',
        },
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isGenerating) return;

    const userMessage: AssistantMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const currentLang = (i18n.resolvedLanguage || 'en') as 'en' | 'ta' | 'hi';

    const assistantPlaceholderId = `asst-${Date.now() + 1}`;
    const initialAssistantMessage: AssistantMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setInputQuery('');
    setIsGenerating(true);

    try {
      const response = await apiClient.chatWithAssistant(
        textToSend.trim(),
        currentLang,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      );

      // Once streaming finishes, attach sources
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? { ...msg, isStreaming: false, sources: response.sources }
            : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? {
                ...msg,
                isStreaming: false,
                content:
                  'An error occurred while connecting to the assistant backend. Please verify your connection or try again.',
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const starterPrompts = [
    'What are the official evacuation protocols if river levels reach Warning stage?',
    'What is the current telemetry status for Yamuna Old Railway Bridge?',
    'What precautions should be taken after flood waters begin to recede?',
    'What is the discharge status of Adyar Chembarambakkam Weir?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('assistant.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('assistant.subtitle')}
          </p>
        </div>
      </div>

      {/* Mandatory Honesty Rule Disclaimer */}
      <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
        <span>{t('assistant.disclaimer')}</span>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-5 shadow-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.isStreaming && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-semibold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating verified answer...
                </div>
              )}

              {/* RAG Source Citations */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                    {t('assistant.sources')}
                  </div>
                  {msg.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px]"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{src.title}</span>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                          >
                            Link <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{src.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}

              {msg.role === 'assistant' && !msg.isStreaming && (!msg.sources || msg.sources.length === 0) && (
                <div className="mt-2 text-[10px] text-slate-400 italic">
                  {t('assistant.noSources')}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Starter Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        {starterPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 whitespace-nowrap text-xs transition-colors flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t('assistant.inputPlaceholder')}
          disabled={isGenerating}
          className="flex-1 px-4 py-2.5 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || isGenerating}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold transition-colors shadow-xs"
          aria-label={t('assistant.send')}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
