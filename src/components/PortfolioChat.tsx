"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Paperclip, Mic, MicOff, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { isStaticDeployment, browserChat } from '@/lib/utils/gemini-browser';
import portfolioDataFallback from '@/data/portfolio.json';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface PortfolioChatProps {
    isOpen?: boolean;
    onClose?: () => void;
    embedded?: boolean; // For when used inside the Admin Dashboard
    portfolioData?: any; // Optional: pass portfolio data from parent
}

// Add global type definition for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function PortfolioChat({ isOpen: initialIsOpen, onClose, embedded = false, portfolioData: portfolioDataProp }: PortfolioChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Local state for floating mode if not controlled
  const [isOpen, setIsOpen] = useState(initialIsOpen || false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop if provided
  useEffect(() => {
    if (typeof initialIsOpen !== 'undefined') {
        setIsOpen(initialIsOpen);
    }
  }, [initialIsOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen || embedded) {
        scrollToBottom();
    }
  }, [messages, isOpen, embedded]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add ref to hold the recognition instance
  const recognitionRef = useRef<any>(null);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => {
             const trimmed = prev.trim();
             return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
        
        // Auto-stop after a single phrase for better UX in simple chat
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        
        // Optional: Auto submit if user pauses (might be annoying, so maybe just let them click send)
      };
      
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsListening(false);
    }
  };

  const handleNavigation = (text: string) => {
    // Check for navigation command [[NAVIGATE:section_id]]
    const navMatch = text.match(/\[\[NAVIGATE:([a-z_]+)\]\]/);
    if (navMatch && navMatch[1]) {
        const sectionId = navMatch[1];
        
        // Remove the command from the displayed text
        const cleanText = text.replace(/\[\[NAVIGATE:[a-z_]+\]\]/g, '').trim();
        
        // Execute navigation after a short delay
        setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                // Optional: Highlight the section
                element.classList.add('ring-2', 'ring-purple-500', 'transition-all', 'duration-1000');
                setTimeout(() => element.classList.remove('ring-2', 'ring-purple-500'), 2000);
            }
        }, 500);
        
        return cleanText;
    }
    return text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMessage = input.trim();
    const userImage = attachedImage;
    
    setInput('');
    setAttachedImage(null);
    
    setMessages((prev) => [...prev, { 
        role: 'user', 
        content: userMessage,
        image: userImage || undefined
    }]);
    
    setIsLoading(true);

    try {
      let responseText: string;

      if (isStaticDeployment()) {
        // Use client-side Gemini directly (no API route needed)
        const pData = portfolioDataProp || portfolioDataFallback;
        responseText = await browserChat(userMessage, messages, pData, userImage || undefined);
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            image: userImage,
            history: messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              content: m.content
            }))
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(errorData.details || errorData.error || 'Failed to get response');
        }

        const data = await response.json();
        responseText = data.response;
      }
      
      // Handle navigation commands in response
      const displayContent = handleNavigation(responseText);
      
      setMessages((prev) => [...prev, { role: 'assistant', content: displayContent }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render content logic
  const ChatContent = (
    <div className={`bg-white flex flex-col h-full ${embedded ? 'rounded-xl shadow-sm border border-slate-200' : 'rounded-2xl shadow-2xl border border-slate-200 overflow-hidden'}`}>
      <div className={`p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between ${embedded ? 'rounded-t-xl' : ''}`}>
        <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-white" />
            <h3 className="font-semibold">Portfolio Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-purple-100 bg-white/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Online
            </span>
            {!embedded && (
                <div className="flex items-center gap-1 ml-2">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-white/20 rounded-lg transition"
                        title={isExpanded ? "Minimize" : "Maximize"}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            if (onClose) onClose();
                        }}
                        className="p-1 hover:bg-white/20 rounded-lg transition"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-10">
            <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Hi there! 👋</h4>
            <p className="text-sm mt-2 max-w-xs mx-auto text-slate-600">
              I&apos;m your AI assistant. I can answer questions, browse the web, analyze images, and help you navigate Jawad&apos;s portfolio.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button 
                    onClick={() => setInput("Show me the projects section")}
                    className="text-xs bg-white text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-50 transition border border-purple-100 shadow-sm"
                >
                    Show projects 🚀
                </button>
                <button 
                    onClick={() => setInput("What skills does Jawad have?")}
                    className="text-xs bg-white text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition border border-blue-100 shadow-sm"
                >
                    View Skills 💡
                </button>
                <button 
                    onClick={() => setInput("Can you check this design screenshot?")}
                    className="text-xs bg-white text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-50 transition border border-emerald-100 shadow-sm"
                >
                    Analyze Image 🖼️
                </button>
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 border border-purple-200 shadow-sm">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
            )}
            
            <div className={`max-w-[85%] space-y-2`}>
                {msg.image && (
                    <div className={`rounded-xl overflow-hidden border ${msg.role === 'user' ? 'border-purple-200' : 'border-slate-200'}`}>
                        <img src={msg.image} alt="Uploaded" className="max-w-full h-auto max-h-48 object-contain bg-black/5" />
                    </div>
                )}
                <div
                className={`rounded-2xl p-3.5 shadow-sm ${
                    msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                }`}
                >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-300">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 border border-purple-200">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div className="bg-white rounded-2xl p-3.5 rounded-bl-none flex items-center gap-2 border border-slate-200 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-xs text-slate-500 font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200">
        {attachedImage && (
            <div className="mb-2 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 w-fit">
                <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden">
                    <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700">Image attached</span>
                    <span className="text-[10px] text-slate-500">Ready to send</span>
                </div>
                <button 
                    onClick={() => setAttachedImage(null)}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-500 ml-1"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent focus-within:bg-white transition-all flex items-center gap-1 p-1">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                title="Attach image"
            >
                <Paperclip className="w-4 h-4" />
            </button>
            
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message..."
                className="flex-1 px-2 py-2 bg-transparent focus:outline-none text-sm min-w-0"
                disabled={isLoading}
            />
            
            <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-xl transition ${
                    isListening 
                        ? 'text-red-500 bg-red-50 hover:bg-red-100 animate-pulse' 
                        : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title="Voice input"
            >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={(isLoading || (!input.trim() && !attachedImage))}
            className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 transform duration-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  // If embedded (e.g. in Admin Dashboard), return just the content
  if (embedded) {
    return ChatContent;
  }

  // Floating Bubble Implementation
  return (
    <>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`fixed bottom-24 right-6 z-50 flex flex-col shadow-2xl ${
                        isExpanded 
                            ? 'w-[90vw] h-[80vh] max-w-4xl' 
                            : 'w-[380px] h-[600px] max-h-[80vh]'
                    }`}
                >
                    {ChatContent}
                </motion.div>
            )}
        </AnimatePresence>

        <motion.button
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                isOpen 
                    ? 'bg-slate-800 text-white rotate-90' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/30'
            }`}
        >
            {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.button>
    </>
  );
}
