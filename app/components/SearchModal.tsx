"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Chat = { id: string; title: string; updatedAt: string };

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/chats/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const goToChat = (id: string) => {
    router.push(`/chat/${id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-start justify-center pt-24 z-50" onClick={onClose}>
      <div
        className="bg-[var(--nicole-cream)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--nicole-border)]">
          <MagnifyingGlassIcon className="w-4 h-4 text-[var(--nicole-text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 outline-none text-sm"
          />
          <button onClick={onClose} className="text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)]">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && <p className="px-4 py-3 text-sm text-[var(--nicole-text-muted)]">Searching...</p>}
          {!loading && query.trim() && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--nicole-text-muted)]">No chats found.</p>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => goToChat(c.id)}
              className="w-full text-left px-4 py-3 hover:bg-[var(--nicole-cream)] transition-colors"
            >
              <p className="text-sm font-medium truncate">{c.title}</p>
              <p className="text-xs text-[var(--nicole-text-muted)]">
                {new Date(c.updatedAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
