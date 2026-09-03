"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PencilIcon, CheckIcon, XMarkIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ConfirmDelete from "@/components/ConfirmDelete";
import { useToast } from "@/components/Toast";
import { SkeletonLine } from "@/components/Skeleton";

type Chat = { id: string; title: string; updatedAt: string; createdAt: string };

export default function HistoryPage() {
  const { showToast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error();
      setChats(await res.json());
    } catch {
      showToast("Couldn't load chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    const prev = chats;
    setChats(chats.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c)));
    setEditingId(null);
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setChats(prev);
      showToast("Couldn't rename chat");
    }
  };

  const deleteChat = async (id: string) => {
    const prev = chats;
    setChats(chats.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setChats(prev);
      showToast("Couldn't delete chat");
    }
  };

  const grouped = groupByDate(chats);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-medium mb-6">Chat History</h1>

      {loading ? (
        <div className="space-y-2">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--nicole-border)] rounded-2xl">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-[var(--nicole-text-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--nicole-text-muted)]">No chats yet.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([label, items]) => (
          <div key={label} className="mb-6">
            <p className="text-xs font-medium text-[var(--nicole-text-muted)] mb-2 tracking-wide">{label.toUpperCase()}</p>
            <div className="space-y-1">
              {items.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)]"
                >
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(c.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        className="flex-1 min-w-0 border border-[var(--nicole-border)] rounded-lg px-2 py-1 text-sm outline-none"
                      />
                      <button onClick={() => saveEdit(c.id)} className="text-green-600 shrink-0">
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-[var(--nicole-text-muted)] shrink-0">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link href={`/chat/${c.id}`} className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-[var(--nicole-text-muted)]">
                          {new Date(c.updatedAt).toLocaleString()}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => startEdit(c)} className="text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)]">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <ConfirmDelete onConfirm={() => deleteChat(c.id)} />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function groupByDate(chats: Chat[]): Record<string, Chat[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, Chat[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };

  for (const chat of chats) {
    const d = new Date(chat.updatedAt);
    if (d >= today) groups["Today"].push(chat);
    else if (d >= yesterday) groups["Yesterday"].push(chat);
    else if (d >= weekAgo) groups["Previous 7 days"].push(chat);
    else groups["Older"].push(chat);
  }

  return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
}

