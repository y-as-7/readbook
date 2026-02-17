"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Loader2, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeChatProps {
  isOpen: boolean;
  onClose: () => void;
  selectionContext?: string;
}

export default function ClaudeChat({
  isOpen,
  onClose,
  selectionContext,
}: ClaudeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectionContext && isOpen) {
      // Automatically ask Claude about the selection if it changes while open
      const prompt = `What is this: "${selectionContext}"? Please explain it in the context of this book.`;
      handleSend(prompt);
    }
  }, [selectionContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: textToSend },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: selectionContext,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.message },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Failed to connect to Claude. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 500 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 500 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-neutral-950/90 backdrop-blur-2xl border-l border-white/10 z-[100] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-tighter">
                  Claude AI
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest font-black text-neutral-500">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-white/5"
            >
              <X className="w-5 h-5 text-neutral-400 hover:text-white" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                <Sparkles className="w-12 h-12 text-blue-500" />
                <p className="text-sm font-medium max-w-[200px]">
                  Ask me anything about the book or select text to get an
                  explanation.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === "user" ? "bg-white/10" : "bg-blue-600"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-white/5 text-white rounded-tr-none border border-white/5"
                      : "bg-neutral-900 text-neutral-300 rounded-tl-none border border-white/5"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl rounded-tl-none border border-white/5">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/10 bg-neutral-950/50">
            {selectionContext && (
              <div className="mb-4 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1">
                    Analyzing Selection
                  </p>
                  <p className="text-xs text-neutral-400 line-clamp-2 italic">
                    "{selectionContext}"
                  </p>
                </div>
              </div>
            )}
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Claude..."
                className="w-full bg-neutral-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-blue-500/50 transition-all shadow-inner group-hover:border-white/20"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 transition-all shadow-lg active:scale-90 disabled:opacity-50 disabled:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-600 text-center mt-4 font-medium uppercase tracking-[0.2em]">
              Powered by Claude 3.5 Sonnet
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
