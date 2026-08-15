"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PaperClipIcon, WrenchScrewdriverIcon, MicrophoneIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

export default function ChatInput() {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gemini-3.6-flash");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const startChat = async () => {
    if (!message.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/chats", { method: "POST" });
    const chat = await res.json();
    sessionStorage.setItem(`pending-message-${chat.id}`, message);
    sessionStorage.setItem(`pending-model-${chat.id}`, model);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-[var(--nicole-border)] bg-white shadow-sm p-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            startChat();
          }
        }}
        placeholder="Ask about a case, a concept, or exam prep..."
        rows={2}
        className="w-full resize-none outline-none text-sm placeholder:text-[var(--nicole-text-muted)]"
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-[var(--nicole-text-muted)]">
          <button className="hover:text-[var(--nicole-text)]"><PaperClipIcon className="w-4 h-4" /></button>
          <button className="hover:text-[var(--nicole-text)]"><WrenchScrewdriverIcon className="w-4 h-4" /></button>
          <button className="hover:text-[var(--nicole-text)]"><MicrophoneIcon className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="text-sm text-[var(--nicole-text-muted)] bg-transparent outline-none"
          >
            <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
          </select>
          <button
            onClick={startChat}
            disabled={creating}
            className="w-8 h-8 rounded-full bg-[var(--nicole-text)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50"
          >
            <ArrowUpIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


