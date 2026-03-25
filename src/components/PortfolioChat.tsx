"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Loader2, Paperclip, Mic, MicOff,
  X, MessageSquare, Maximize2, Minimize2,
} from 'lucide-react';
import { isStaticDeployment, browserChat } from '@/lib/utils/anthropic-browser';
import portfolioDataFallback from '@/data/portfolio.json';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface PortfolioChatProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
  portfolioData?: any;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function PortfolioChat({
  isOpen: initialIsOpen,
  onClose,
  embedded = false,
  portfolioData: portfolioDataProp,
}: PortfolioChatProps) {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [isStreaming, setIsStreaming]   = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isListening, setIsListening]   = useState(false);
  const [isOpen, setIsOpen]             = useState(initialIsOpen || false);
  const [isExpanded, setIsExpanded]     = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof initialIsOpen !== 'undefined') setIsOpen(initialIsOpen);
  }, [initialIsOpen]);

  useEffect(() => {
    if (isOpen || embedded) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, embedded]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    try {
      const r = new SR();
      recognitionRef.current = r;
      r.continuous = false; r.interimResults = false; r.lang = 'en-US';
      r.onstart  = () => setIsListening(true);
      r.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        setInput(p => (p.trim() ? `${p.trim()} ${t}` : t));
        setIsListening(false);
      };
      r.onerror  = () => setIsListening(false);
      r.onend    = () => { setIsListening(false); recognitionRef.current = null; };
      r.start();
    } catch { setIsListening(false); }
  };

  const handleNavigation = (text: string) => {
    const m = text.match(/\[\[NAVIGATE:([a-z_]+)\]\]/);
    if (m?.[1]) {
      const clean = text.replace(/\[\[NAVIGATE:[a-z_]+\]\]/g, '').trim();
      setTimeout(() => {
        const el = document.getElementById(m[1]);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      return clean;
    }
    return text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMsg   = input.trim();
    const userImage = attachedImage;
    setInput(''); setAttachedImage(null);
    setMessages(p => [...p, { role: 'user', content: userMsg, image: userImage || undefined }]);
    setIsLoading(true);

    try {
      if (isStaticDeployment()) {
        const pData = portfolioDataProp || portfolioDataFallback;
        const resp  = await browserChat(userMsg, messages, pData, userImage || undefined);
        setMessages(p => [...p, { role: 'assistant', content: handleNavigation(resp) }]);
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg,
            image: userImage,
            history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content })),
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.details || err.error || 'Failed to get response');
        }
        if (!response.body) throw new Error('No response body');

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText   = '';
        let firstChunk = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          if (firstChunk) {
            firstChunk = false;
            setIsLoading(false); setIsStreaming(true);
            setMessages(p => [...p, { role: 'assistant', content: fullText }]);
          } else {
            setMessages(p => {
              const msgs = [...p];
              if (msgs[msgs.length - 1]?.role === 'assistant')
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: fullText };
              return msgs;
            });
          }
        }
        setIsStreaming(false);
        const display = handleNavigation(fullText);
        if (display !== fullText) {
          setMessages(p => {
            const msgs = [...p];
            if (msgs[msgs.length - 1]?.role === 'assistant')
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: display };
            return msgs;
          });
        }
        if (firstChunk) setMessages(p => [...p, { role: 'assistant', content: 'Sorry, I received an empty response. Please try again.' }]);
      }
    } catch (err: any) {
      setIsStreaming(false);
      setMessages(p => [...p, { role: 'assistant', content: `Sorry, I ran into an error: ${err.message || 'Please try again.'}` }]);
    } finally {
      setIsLoading(false); setIsStreaming(false);
    }
  };

  /* ── Chat panel UI ── */
  const ChatContent = (
    <div className={`bg-white flex flex-col h-full ${embedded ? 'rounded-xl border border-slate-200' : 'rounded-2xl shadow-xl border border-slate-200 overflow-hidden'}`}>

      {/* Header */}
      <div className={`px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 ${embedded ? 'rounded-t-xl' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Portfolio Assistant</p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Online
            </p>
          </div>
        </div>
        {!embedded && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              onClick={() => { setIsOpen(false); onClose?.(); }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Bot size={24} className="text-blue-600" />
            </div>
            <p className="font-semibold text-slate-800 text-sm mb-1">Hi there!</p>
            <p className="text-xs text-slate-500 max-w-[220px] mx-auto leading-relaxed">
              Ask me anything about Jawad's background, projects, or skills.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                { label: 'See projects', q: 'Show me the projects section' },
                { label: 'View skills', q: 'What skills does Jawad have?' },
                { label: 'Experience', q: 'Tell me about his work experience' },
              ].map(({ label, q }) => (
                <button
                  key={label}
                  onClick={() => setInput(q)}
                  className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} className="text-blue-600" />
              </div>
            )}
            <div className="max-w-[82%] space-y-1.5">
              {msg.image && (
                <div className={`rounded-xl overflow-hidden border ${msg.role === 'user' ? 'border-blue-200' : 'border-slate-200'}`}>
                  <img src={msg.image} alt="Uploaded" className="max-w-full h-auto max-h-40 object-contain bg-black/5" />
                </div>
              )}
              <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap">
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                    <span className="inline-block w-0.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={13} className="text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && !isStreaming && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-none px-3.5 py-2.5 border border-slate-200 shadow-sm flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-blue-600" />
              <span className="text-xs text-slate-500">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg w-fit">
            <div className="w-9 h-9 rounded overflow-hidden bg-slate-200">
              <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-slate-600 font-medium">Image attached</span>
            <button onClick={() => setAttachedImage(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition">
              <X size={12} />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent focus-within:bg-white transition-all flex items-center gap-1 px-1 py-1">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition" title="Attach image">
              <Paperclip size={15} />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message…"
              disabled={isLoading}
              className="flex-1 px-1.5 py-1.5 bg-transparent focus:outline-none text-sm min-w-0 text-slate-800 placeholder-slate-400"
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-1.5 rounded-lg transition ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}
              title="Voice input"
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !attachedImage)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );

  /* ── Embedded mode (Admin Dashboard) ── */
  if (embedded) return ChatContent;

  /* ── Floating mode ── */
  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed right-5 z-50 flex flex-col shadow-2xl transition-all duration-200 ${
            isExpanded
              ? 'bottom-5 w-[90vw] h-[80vh] max-w-4xl left-1/2 -translate-x-1/2'
              : 'bottom-[5.5rem] w-[360px] h-[500px] max-h-[calc(100vh-7rem)]'
          }`}
        >
          {ChatContent}
        </div>
      )}

      {/* Toggle button — sits at bottom of the dock */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close chat' : 'Chat with AI'}
        className={`fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? 'bg-slate-800 text-white hover:bg-slate-700'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
        }`}
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </>
  );
}
