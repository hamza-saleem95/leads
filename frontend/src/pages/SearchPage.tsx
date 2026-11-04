import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useSearchStore } from '../stores/useSearchStore.js';
import { SearchStrategy } from '../types/index.js';
import { QuestionnaireModal } from '../components/search/QuestionnaireModal.js';
import { StrategyCard } from '../components/search/StrategyCard.js';
import { JobProgressModal } from '../components/search/JobProgressModal.js';
import {
  Sparkles,
  Send,
  SlidersHorizontal,
  Bot,
  User,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  strategy?: SearchStrategy;
  timestamp: string;
}

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStrategy, setStrategy, startJob, isSearching } = useSearchStore();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "Hello! I am your AI Lead Search Assistant. I can discover registered businesses across any country or industry, extract public contact info, and calculate lead quality scores.\n\nYou can describe your target market in natural language below or click 'Interactive Questionnaire' to walk through target parameters step by step.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSendPrompt = async (textToSend?: string) => {
    const text = textToSend || prompt;
    if (!text.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setIsGenerating(true);

    try {
      const strategy = await api.generateStrategy({ prompt: text });
      setStrategy(strategy);

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: `I have analyzed your request for "${strategy.industry}" in ${strategy.country}. I formulated ${strategy.searchQueries.length} targeted queries mapped across Tavily, SerpAPI, Google Places, and Bing. Please inspect the strategy card below and click 'Approve & Launch Discovery' to begin.`,
        strategy,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'ai',
        text: `Failed to generate strategy: ${err.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionnaireSubmit = async (formData: any) => {
    setIsQuestionnaireOpen(false);
    setIsGenerating(true);

    const userSummary = `Target: ${formData.quantity} ${formData.industry} businesses in ${formData.country} (${formData.cities}). Required: ${
      [
        formData.needEmails ? 'emails' : '',
        formData.needPhones ? 'phones' : '',
        formData.needWebsites ? 'websites' : '',
        formData.needAddresses ? 'addresses' : '',
        formData.needLinkedin ? 'linkedin' : '',
      ].filter(Boolean).join(', ')
    }. Requirements: ${formData.additionalRequirements}`;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userSummary,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const strategy = await api.generateStrategy({
        prompt: userSummary,
        questionnaire: {
          ...formData,
          cities: formData.cities ? formData.cities.split(',').map((c: string) => c.trim()) : [],
        },
      });

      setStrategy(strategy);

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: `Search strategy structured from your questionnaire criteria. Review the queries and providers below before launch.`,
        strategy,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveStrategy = async () => {
    if (!currentStrategy) return;
    setIsLaunching(true);

    try {
      const { projectId, jobId } = await api.launchSearch({
        strategy: currentStrategy,
        projectName: `${currentStrategy.industry} (${currentStrategy.country})`,
      });

      startJob(projectId, jobId);
      setIsProgressModalOpen(true);
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Lead Search Assistant
          </h2>
          <p className="text-xs text-slate-400">
            Formulate multi-provider discovery queries with OpenAI structured outputs and human-in-the-loop approval.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsQuestionnaireOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span>Interactive 11-Step Questionnaire</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-semibold text-slate-400 shrink-0">Try prompt:</span>
        {[
          '500 freight forwarding companies in the United Kingdom, mainly London & Manchester, with business emails, websites and phone numbers',
          '100 SaaS companies in the United States with verified corporate emails and websites',
          '50 commercial solar installation contractors in Australia with phone numbers and addresses',
        ].map((example, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(example)}
            className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white truncate max-w-xs transition-colors shrink-0"
          >
            "{example}"
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4 min-h-[300px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`space-y-3 max-w-3xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-md rounded-tr-none'
                    : 'bg-[#111827] border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span className="text-[10px] opacity-60 block mt-1.5 text-right">{msg.timestamp}</span>
              </div>

              {/* Strategy Card Preview inside conversation */}
              {msg.strategy && (
                <StrategyCard
                  strategy={msg.strategy}
                  onApprove={handleApproveStrategy}
                  onModify={() => setIsQuestionnaireOpen(true)}
                  isLaunching={isLaunching}
                />
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-3 items-center text-xs text-indigo-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
            <span>AI Assistant formulating targeted search strategy & queries...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="sticky bottom-6 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="relative flex items-center bg-[#111827] border border-slate-700/80 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500 transition-all"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your lead discovery goal (e.g. '500 logistics firms in UK with emails and phone numbers')..."
            className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder-slate-400 outline-none"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-md active:scale-95"
          >
            <span>Analyze</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Modals */}
      <QuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        onSubmit={handleQuestionnaireSubmit}
        isLoading={isGenerating}
      />

      <JobProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        onViewAllLeads={() => navigate('/leads')}
      />
    </div>
  );
};
