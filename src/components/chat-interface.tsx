import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, RefreshCw, ShoppingCart, KeyRound, MapPin, CheckCircle, ChevronUp, ArrowRight, Search } from "lucide-react";
import { ChatMessage } from "../types/mcp";
import { motion, AnimatePresence } from "motion/react";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  isSearching: boolean;
  currentStep: "search" | "cart" | "details" | "checkout";
  onQuickAction: (term: string) => void;
  activeLanguageContext?: string;
}

const QUICK_ACTIONS = [
  { label: "Cakes 🎂", query: "Mata choclate cake thiyenawada search karanna" },
  { label: "Flowers 💐", query: "Can you list some beautiful red roses bouquets?" },
  { label: "Fruit Baskets 🎁", query: "Oyala gawa fruit and flower gift baskets thiyeda?" },
  { label: "Soft Toys 🧸", query: "Mata watch and choose a teddy bear with price" },
];

export function ChatInterface({
  messages,
  onSendMessage,
  isThinking,
  isSearching,
  currentStep,
  onQuickAction,
  activeLanguageContext,
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isSearching]);

  // Funnel steps metadata
  const steps = [
    { key: "search", label: "Search", icon: Sparkles },
    { key: "cart", label: "Cart", icon: ShoppingCart },
    { key: "details", label: "Delivery", icon: MapPin },
    { key: "checkout", label: "Pay Link", icon: CheckCircle },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r border-[#E5E7EB] font-sans text-[#111827]" id="kapruka-chat-agent-panel">
      {/* Upper Brand / Funnel tracker with Deep blue header */}
      <div className="p-4 bg-[#0046be] text-white shrink-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#f5a623] flex items-center justify-center text-white font-bold text-base shadow-sm">
                K
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Kapruka AI Assistant</h1>
              <p className="text-[10px] text-white/80 uppercase tracking-widest font-mono">
                Multilingual Shopping Bot
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] opacity-85 uppercase font-mono">Delivery Client</div>
            <div className="text-[11px] font-bold text-[#f5a623]">Colombo, LK</div>
          </div>
        </div>

        {/* Funnel Progress Tracker inside Header */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between px-1">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isCompleted = steps.findIndex(x => x.key === currentStep) >= index;
            const isActive = s.key === currentStep;

            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                      isCompleted ? "bg-[#f5a623] text-white" : "bg-white/20 text-white/60"
                    } ${isActive ? "ring-2 ring-white scale-105" : ""}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className={`text-[9px] mt-1 font-semibold ${
                    isActive ? "text-[#f5a623] font-bold" : "text-white/80"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-[1.5px] w-4 shrink-0 rounded transition-all duration-300 ${
                    steps.findIndex(x => x.key === currentStep) > index ? "bg-[#f5a623]" : "bg-white/20"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            
            // Clean content to intercept and completely hide technical status updates or JSON-RPC jargon
            const cleanContent = (content: string): string => {
              if (!content) return "";
              const lines = content.split("\n");
              const filtered = lines.filter(line => {
                const l = line.toLowerCase();
                return !(
                  l.includes("connecting to") ||
                  l.includes("json-rpc") ||
                  l.includes("mcp node") ||
                  l.includes("searching kapruka") ||
                  l.startsWith("*searching") ||
                  l.includes("remote json-rpc")
                );
              });
              return filtered.join("\n").trim();
            };

            const cleanedText = isUser ? m.content : cleanContent(m.content);
            if (!isUser && !cleanedText) return null; // Hide pure technical logs messages

            return (
              <motion.div
                key={m.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#0046be] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    K
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#0046be] text-white rounded-tr-none shadow-xs"
                      : "bg-[#FFFFFF] text-[#1F2937] border border-[#E5E7EB] rounded-tl-none shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans">{cleanedText}</p>
                  
                  {/* Timestamp/Badge */}
                  <span className={`text-[9px] block mt-1.5 opacity-60 font-mono text-right`}>
                    {m.timestamp}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Unified polished theme-colored typing & search loader animation */}
        {(isThinking || isSearching) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex gap-3 justify-start"
            id="chat-loading-indicator"
          >
            <div className="w-8 h-8 rounded-full bg-[#0046be] text-white flex items-center justify-center text-xs font-bold shrink-0 animate-pulse">
              K
            </div>
            <div className="bg-white rounded-lg rounded-tl-none p-3.5 border border-[#E5E7EB] shadow-xs flex flex-col gap-2 min-w-[140px]">
              <div className="flex items-center gap-1.5">
                {isSearching ? (
                  <Search className="w-3.5 h-3.5 text-[#0046be] animate-pulse shrink-0" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f5a623] shrink-0" />
                )}
                <span className="text-[10px] font-bold text-[#111827] uppercase tracking-widest font-mono">
                  {isSearching ? "Searching Catalog" : "Thinking"}
                </span>
              </div>
              <div className="flex space-x-1.5 items-center justify-start py-0.5 pl-1">
                <span className="w-2 h-2 bg-[#f5a623] rounded-full animate-bounce inline-block" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#0046be] rounded-full animate-bounce inline-block" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#f5a623] rounded-full animate-bounce inline-block" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Access Suggestion Panel */}
      {messages.length < 3 && (
        <div className="p-3 bg-white shrink-0 border-t border-[#E5E7EB]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
            Browse Popular Categories
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                id={`quick-action-btn-${qa.label.toLowerCase().replace(/[^a-z]/g, "")}`}
                onClick={() => onQuickAction(qa.query)}
                className="py-1.5 px-3 bg-white hover:bg-gray-50 text-xs text-[#4B5563] font-medium border border-[#D1D5DB] rounded-full shadow-2xs cursor-pointer transition-all truncate"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Entry Actions Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#E5E7EB] shrink-0 bg-white" id="chat-input-form">
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[#D1D5DB] focus-within:border-[#0046be] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            id="chat-user-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask in Sinhala, English or Tanglish..."
            className="flex-1 bg-transparent border-none outline-hidden px-3 py-2 text-sm text-[#111827] placeholder-gray-400 w-full"
            disabled={isThinking || isSearching}
          />
          <button
            id="chat-send-message-btn"
            type="submit"
            disabled={!inputText.trim() || isThinking || isSearching}
            className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              inputText.trim() && !isThinking && !isSearching
                ? "bg-[#0046be] hover:bg-blue-700 text-white shadow-xs"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
