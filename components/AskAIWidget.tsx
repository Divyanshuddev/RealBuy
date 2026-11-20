'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Terminal } from 'lucide-react';
import { Product } from '@/lib/types';

interface AskAIWidgetProps {
  product: Product;
}

const SUGGESTED_QUESTIONS = [
  'Is this product worth buying?',
  'Is this good for students?',
  'What do customers complain about most?',
  'Does this product have durability problems?',
  'How does battery and performance hold up?'
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AskAIWidget({ product }: AskAIWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am **RealBuy AI**, your product assistant for the **${product.brand} ${product.name}**.\n\nI analyze all real community reviews, verified purchase receipts, and specifications to give you transparent answers. Ask me anything or select a prompt below!`,
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: questionText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${product.id}/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText.trim() }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.answer || 'I could not synthesize an answer based on available review data.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error connecting to RealBuy AI intelligence engine. Please try again.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0f0f0f] rounded-2xl border border-[#222] shadow-[0_4px_24px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#141414] border-b border-[#222] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black border border-[#ff6600] flex items-center justify-center text-[#ff6600]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase">
                ASK AI ABOUT PRODUCT
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ff6600] text-black font-bold">
                GROUNDED
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono">SYNTHESIZED FROM REAL REVIEWS</p>
          </div>
        </div>
      </div>

      {/* Suggested Chips Bar */}
      <div className="px-3.5 py-2 bg-[#0c0c0c] border-b border-[#1c1c1c] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono text-[#ff6600] shrink-0">&gt; PROMPT:</span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(q)}
            className="shrink-0 px-2.5 py-1 rounded text-[10px] font-mono bg-[#171717] hover:bg-[#ff6600] text-neutral-300 hover:text-black border border-[#262626] hover:border-[#ff6600] transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-[#1a140f] text-[#ff6600] border border-[#ff6600]/40 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed space-y-1 ${
                m.role === 'user'
                  ? 'bg-[#ff6600] text-black font-sans font-medium'
                  : 'bg-[#141414] text-neutral-200 border border-[#242424]'
              }`}
            >
              <div className="whitespace-pre-line prose-xs">{m.content}</div>
              <div className={`text-[9px] font-mono text-right pt-1 opacity-70 ${m.role === 'user' ? 'text-black/80' : 'text-neutral-500'}`}>
                {m.timestamp}
              </div>
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff6600] p-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>&gt; SCANNING REVIEW DATABASE...</span>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(input);
        }}
        className="p-3 bg-[#121212] border-t border-[#1f1f1f] flex items-center gap-2"
      >
        <span className="font-mono text-xs text-[#ff6600] pl-1">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${product.name}...`}
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#262626] bg-[#080808] text-white focus:outline-none focus:border-[#ff6600] font-sans"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg bg-[#ff6600] text-black hover:bg-[#ff7700] disabled:opacity-50 transition-colors shadow-[0_0_8px_rgba(255,102,0,0.3)]"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
