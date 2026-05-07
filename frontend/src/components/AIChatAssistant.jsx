import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, Trash2 } from "lucide-react";
import { askAI } from "../utils/aiEngine";
import { useAuth } from "../context/AuthContext";

const SUGGESTIONS = [
  "How many products are in the system?",
  "Are there any delays?",
  "Where is my product?",
  "Show me a summary",
];

export default function AIChatAssistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I'm the FairTrace AI Assistant. Ask me anything about your products, deliveries, or supply chain.\n\nTry asking:\n• \"Where is [product name]?\"\n• \"Any delays in the supply chain?\"\n• \"How many products do I have?\"",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  const handleSend = () => {
    const query = input.trim();
    if (!query) return;

    setMessages((prev) => [...prev, { role: "user", text: query, timestamp: new Date().toISOString() }]);
    setInput("");
    setTyping(true);

    // Simulate slight delay for natural feel
    setTimeout(() => {
      const response = askAI(query, user?.email);
      setMessages((prev) => [...prev, { role: "ai", text: response, timestamp: new Date().toISOString() }]);
      setTyping(false);
    }, 400 + Math.random() * 600);
  };

  const handleSuggestion = (text) => {
    setInput(text);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "user", text, timestamp: new Date().toISOString() }]);
      setTyping(true);
      setTimeout(() => {
        const response = askAI(text, user?.email);
        setMessages((prev) => [...prev, { role: "ai", text: response, timestamp: new Date().toISOString() }]);
        setTyping(false);
      }, 400 + Math.random() * 600);
    }, 100);
    setInput("");
  };

  const clearChat = () => {
    setMessages([
      {
        role: "ai",
        text: "Chat cleared. How can I help you?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Render markdown-like bold
  const renderText = (text) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });
      return (
        <span key={i}>
          {parts}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#e8604c] rounded-full flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </span>
        <div className="absolute right-16 bg-[#2c3e50] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg">
          AI Assistant
        </div>
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[#2a7c7c] text-white rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1d5c5c] transition"
        onClick={() => setMinimized(false)}>
        <Bot className="w-5 h-5" />
        <span className="text-sm font-semibold">AI Assistant</span>
        <button onClick={(e) => { e.stopPropagation(); setOpen(false); setMinimized(false); }}
          className="ml-2 text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#2a7c7c] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">FairTrace AI</h3>
            <p className="text-white/60 text-[10px]">Supply Chain Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="text-white/50 hover:text-white p-1 transition" title="Clear chat">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setMinimized(true)} className="text-white/50 hover:text-white p-1 transition">
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setOpen(false); setMinimized(false); }} className="text-white/50 hover:text-white p-1 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === "user"
                ? "bg-[#2a7c7c] text-white rounded-br-md"
                : "bg-white text-[#2c3e50] border border-gray-100 rounded-bl-md shadow-sm"
            }`}>
              {msg.role === "ai" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#e8604c]" />
                  <span className="text-[10px] font-semibold text-[#2a7c7c] uppercase tracking-wider">AI</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{renderText(msg.text)}</div>
              <div className={`text-[9px] mt-1 ${msg.role === "user" ? "text-white/40" : "text-gray-400"}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#2a7c7c] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#2a7c7c] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#2a7c7c] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (only if few messages) */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">Suggestions</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => handleSuggestion(s)}
                className="px-2.5 py-1 bg-[#f5f3ee] text-[#2c3e50] text-[11px] rounded-full hover:bg-[#2a7c7c] hover:text-white transition truncate">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2.5 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about your supply chain..."
            className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm text-[#2c3e50] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 transition"
          />
          <button onClick={handleSend} disabled={!input.trim() || typing}
            className="w-9 h-9 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white rounded-xl flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-[#2a7c7c] active:scale-95">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
