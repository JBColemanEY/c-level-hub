"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { FinanceDashboardData } from "@/lib/xero";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAdvisorProps {
  financialData: FinanceDashboardData | null;
}

export default function AIAdvisor({ financialData }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-generate opening brief on mount
  useEffect(() => {
    if (!financialData) return;
    generateInsight(
      "Analyse the current financial data and give me my executive brief. Start with the single most important thing I need to know right now.",
      []
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function generateInsight(userMessage: string, history: Message[]) {
    setLoading(true);
    setInitialising(false);
    try {
      const res = await fetch("/api/ai/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          financialData,
          conversationHistory: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const assistant: Message = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, assistant]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Unable to connect to AI. Check your API key." },
      ]);
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

  return (
    <div className="flex flex-col h-full bg-white/[0.02] rounded-xl border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <p className="text-white font-medium text-sm">AI Financial Advisor</p>
          <p className="text-white/40 text-xs">Powered by Claude · Live Xero data</p>
        </div>
        {loading && (
          <Loader2 size={14} className="ml-auto text-violet-400 animate-spin" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {initialising && (
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Analysing your financials…
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-violet-500/20 text-violet-100"
                  : "bg-white/[0.04] text-white/80 border border-white/[0.06]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
            placeholder="Ask your CFO anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg px-4 py-2.5 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {["Cash runway?", "Biggest risks?", "This month's expenses", "Action plan"].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="text-xs text-white/30 hover:text-white/60 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-md px-2.5 py-1 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
