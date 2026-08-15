"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import { SkeletonMessage } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { id: string; role: string; content: string };

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [model, setModel] = useState("gemini-3.6-flash");
  const [agentName, setAgentName] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChat = async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages);
      if (data.agent) {
        setModel(data.agent.defaultModel);
        setAgentName(data.agent.name);
      }
    } catch {
      showToast("Couldn't load this chat");
    } finally {
      setPageLoading(false);
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim() || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { id: "temp-user", role: "user", content: text }]);
    setStreaming(true);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, model }),
      });

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { id: "temp-assistant", role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });

        if (assistantText.includes("__ERROR__:")) {
          const [before, errPart] = assistantText.split("__ERROR__:");
          showToast(errPart.trim());
          assistantText = before.trim();
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { id: "temp-assistant", role: "assistant", content: assistantText };
          return updated;
        });
      }
    } catch {
      showToast("Message failed to send. Try again.");
      setMessages((prev) => prev.filter((m) => m.id !== "temp-assistant"));
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    const pending = sessionStorage.getItem(`pending-message-${chatId}`);
    const pendingModel = sessionStorage.getItem(`pending-model-${chatId}`);
    if (pending) {
      sessionStorage.removeItem(`pending-message-${chatId}`);
      sessionStorage.removeItem(`pending-model-${chatId}`);
      if (pendingModel) setModel(pendingModel);
      setPageLoading(false);
      sendMessage(pending);
    } else {
      loadChat();
    }
  }, [chatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {agentName && (
        <div className="text-xs text-[var(--nicole-text-muted)] text-center py-2 border-b border-[var(--nicole-border)]">
          Chatting with <span className="font-medium">{agentName}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {pageLoading && (
          <>
            <SkeletonMessage />
            <SkeletonMessage mine />
            <SkeletonMessage />
          </>
        )}
        {!pageLoading && messages.length === 0 && (
          <p className="text-sm text-[var(--nicole-text-muted)] text-center mt-12">
            Start the conversation below.
          </p>
        )}
        {messages.map((m, i) => {
          const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
          const isActivelyStreaming = streaming && isLastAssistant;

          return (
            <div key={m.id + i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-[var(--nicole-text)] text-white whitespace-pre-wrap"
                    : "bg-white border border-[var(--nicole-border)]"
                }`}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-medium prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:font-semibold prose-hr:my-3 prose-table:text-xs prose-th:bg-[var(--nicole-cream)] prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-th:border prose-td:border prose-th:border-[var(--nicole-border)] prose-td:border-[var(--nicole-border)]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      {isActivelyStreaming && <span className="nicole-cursor" />}
                    </div>
                  ) : isActivelyStreaming ? (
                    <span className="nicole-shimmer-text font-medium">Nicole is thinking...</span>
                  ) : null
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--nicole-border)] pt-4 pb-2">
        <div className="rounded-2xl border border-[var(--nicole-border)] bg-white p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={agentName ? `Message ${agentName}...` : "Message Nicole..."}
            rows={1}
            className="w-full resize-none outline-none text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-xs text-[var(--nicole-text-muted)] bg-transparent outline-none"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
            </select>
            <button
              onClick={() => sendMessage()}
              disabled={streaming}
              className={`w-7 h-7 rounded-full bg-[var(--nicole-text)] text-white flex items-center justify-center disabled:opacity-50 ${streaming ? "animate-pulse" : ""}`}
            >
              <ArrowUpIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



