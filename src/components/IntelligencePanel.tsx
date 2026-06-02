"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IntelligencePanelProps {
  module: string;
  initialQuestion: string;
  compact?: boolean;
  quickQuestions?: string[];
}

const MODULE_QUESTIONS: Record<string, string[]> = {
  Finance: ["Cash runway?", "Biggest risks?", "Receivables strategy", "Action plan this week"],
  Overview: ["Morning priorities?", "Critical risks?", "Revenue outlook", "Cash position"],
  Operations: ["Capacity risks?", "Delivery health?", "Team bottlenecks?"],
  default: ["Key risks?", "Top priorities?", "What's trending?", "Action items"],
};

export default function IntelligencePanel({ module, initialQuestion, compact = false, quickQuestions }: IntelligencePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateInsight(initialQuestion, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function generateInsight(question: string, history: Message[]) {
    setLoading(true);
    setInitialising(false);
    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, question, history: history.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Unable to connect to intelligence layer. Check your API key." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    await generateInsight(input, updated.slice(0, -1));
  }

  function handleRefresh() {
    setMessages([]);
    generateInsight(initialQuestion, []);
  }

  const quickQs = quickQuestions || MODULE_QUESTIONS[module] || MODULE_QUESTIONS.default;
  const chatHeight = compact ? "h-48" : "h-80";

  return (
    <div className="flex flex-col bg-[#333332] rounded-xl border border-[#D7DF23]/15 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#D7DF23]/10 bg-[#D7DF23]/5">
        <div className="w-8 h-8 rounded-lg bg-[#D7DF23] flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-[#2A292A]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Executive Intelligence Brief</p>
          <p className="text-[#D1D3D4]/50 text-xs">Powered by Claude · Updated on refresh</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={14} className="text-[#D7DF23] animate-spin" />}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-[#D1D3D4]/40 hover:text-[#D7DF23] transition-colors disabled:opacity-30"
            title="Refresh Brief"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`${chatHeight} overflow-y-auto p-4 space-y-4`}>
        {initialising && (
          <div className="flex items-center gap-2 text-[#D1D3D4]/40 text-sm">
            <Loader2 size={14} className="animate-spin text-[#D7DF23]" />
            Generating executive brief…
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#D7DF23]/20 text-[#D7DF23] border border-[#D7DF23]/20"
                  : "bg-[#063F34]/20 text-[#D1D3D4] border border-[#063F34]/30"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#D7DF23]/10">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#2A292A] border border-[#D7DF23]/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#D1D3D4]/30 focus:outline-none focus:border-[#D7DF23]/40 transition-colors"
            placeholder="Ask the hub anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#D7DF23] hover:bg-[#c8cf1f] disabled:opacity-40 text-[#2A292A] font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        {!compact && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {quickQs.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs text-[#D1D3D4]/40 hover:text-[#D7DF23] bg-[#D7DF23]/5 hover:bg-[#D7DF23]/10 border border-[#D7DF23]/10 hover:border-[#D7DF23]/25 rounded-md px-2.5 py-1 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
