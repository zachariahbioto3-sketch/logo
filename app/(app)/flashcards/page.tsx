"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, TrashIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toast";
import ConfirmDelete from "@/components/ConfirmDelete";

type Deck = { id: string; name: string; createdAt: string; _count: { cards: number } };
type Chat = { id: string; title: string };

export default function FlashcardsPage() {
  const { showToast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [generateDeckId, setGenerateDeckId] = useState("");
  const [generateChatId, setGenerateChatId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  const load = async () => {
    try {
      const [dr, cr] = await Promise.all([fetch("/api/decks"), fetch("/api/chats")]);
      setDecks(await dr.json());
      setChats(await cr.json());
    } catch { showToast("Could not load decks"); }
    finally { setLoading(false); }
  };

  const createDeck = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const deck = await res.json();
      setDecks((prev) => [{ ...deck, _count: { cards: 0 } }, ...prev]);
      setNewName("");
    } catch { showToast("Could not create deck"); }
    finally { setCreating(false); }
  };

  const deleteDeck = async (id: string) => {
    try {
      await fetch("/api/decks/" + id, { method: "DELETE" });
      setDecks((prev) => prev.filter((d) => d.id !== id));
    } catch { showToast("Could not delete deck"); }
  };

  const generate = async () => {
    if (!generateDeckId || !generateChatId || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/decks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: generateChatId, deckId: generateDeckId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Generated " + data.created + " cards");
      setShowGenerate(false);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Generation failed");
    } finally { setGenerating(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Flashcard Decks</h1>
        <button
          onClick={() => setShowGenerate((o) => !o)}
          className="flex items-center gap-1.5 text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-1.5 hover:bg-[var(--nicole-cream)]"
        >
          <SparklesIcon className="w-4 h-4" /> Generate from chat
        </button>
      </div>

      {showGenerate && (
        <div className="mb-6 p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] space-y-3">
          <p className="text-sm font-medium">Generate cards from a chat</p>
          <select
            value={generateChatId}
            onChange={(e) => setGenerateChatId(e.target.value)}
            className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 bg-[var(--nicole-cream)] outline-none"
          >
            <option value="">Select a chat...</option>
            {chats.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select
            value={generateDeckId}
            onChange={(e) => setGenerateDeckId(e.target.value)}
            className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 bg-[var(--nicole-cream)] outline-none"
          >
            <option value="">Select a deck...</option>
            {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button
            onClick={generate}
            disabled={!generateChatId || !generateDeckId || generating}
            className="w-full py-2 rounded-xl bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] text-sm disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") createDeck(); }}
          placeholder="New deck name..."
          className="flex-1 text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none"
        />
        <button
          onClick={createDeck}
          disabled={!newName.trim() || creating}
          className="w-9 h-9 rounded-xl bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] flex items-center justify-center disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {loading && <p className="text-sm text-[var(--nicole-text-muted)]">Loading...</p>}
      {!loading && decks.length === 0 && (
        <p className="text-sm text-[var(--nicole-text-muted)] text-center py-16">No decks yet. Create one above.</p>
      )}

      <div className="space-y-3">
        {decks.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] hover:border-[var(--nicole-peach)] transition-colors group">
            <Link href={"/flashcards/" + d.id} className="flex-1">
              <p className="font-medium text-sm">{d.name}</p>
              <p className="text-xs text-[var(--nicole-text-muted)] mt-0.5">{d._count.cards} card{d._count.cards !== 1 ? "s" : ""}</p>
            </Link>
            <ConfirmDelete onConfirm={() => deleteDeck(d.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}