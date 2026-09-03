"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toast";

type Card = {
  id: string;
  front: string;
  back: string;
  interval: number;
  repetitions: number;
  nextReview: string;
};

const RATINGS = [
  { label: "Again", value: 0, color: "bg-red-100 text-red-700 hover:bg-red-200" },
  { label: "Hard", value: 1, color: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
  { label: "Good", value: 2, color: "bg-green-100 text-green-700 hover:bg-green-200" },
  { label: "Easy", value: 3, color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
];

export default function StudyPage() {
  const params = useParams();
  const deckId = params.id as string;
  const { showToast } = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [adding, setAdding] = useState(false);

  const loadCards = async () => {
    try {
      const [cr, dr] = await Promise.all([
        fetch("/api/decks/" + deckId + "/cards"),
        fetch("/api/decks"),
      ]);
      const allCards: Card[] = await cr.json();
      const allDecks = await dr.json();
      const deck = allDecks.find((d: { id: string; name: string }) => d.id === deckId);
      if (deck) setDeckName(deck.name);

      const due = allCards.filter((c) => new Date(c.nextReview) <= new Date());
      setCards(due);
      if (due.length === 0) setDone(true);
    } catch { showToast("Could not load cards"); }
    finally { setLoading(false); }
  };

  const rate = async (rating: number) => {
    const card = cards[index];
    try {
      await fetch("/api/decks/" + deckId + "/cards/" + card.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
    } catch { showToast("Could not save rating"); }

    const next = index + 1;
    if (next >= cards.length) {
      setDone(true);
    } else {
      setIndex(next);
      setFlipped(false);
    }
  };

  const addCard = async () => {
    if (!newFront.trim() || !newBack.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/decks/" + deckId + "/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: newFront, back: newBack }),
      });
      if (!res.ok) throw new Error();
      const card = await res.json();
      setCards((prev) => [...prev, card]);
      setNewFront("");
      setNewBack("");
      setShowAdd(false);
      showToast("Card added");
      if (done) setDone(false);
    } catch { showToast("Could not add card"); }
    finally { setAdding(false); }
  };

  useEffect(() => { loadCards(); }, [deckId]);

  const current = cards[index];
  const progress = cards.length > 0 ? Math.round((index / cards.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/flashcards" className="flex items-center gap-1.5 text-sm text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)]">
          <ArrowLeftIcon className="w-4 h-4" /> Decks
        </Link>
        <h1 className="text-base font-semibold">{deckName}</h1>
        <button
          onClick={() => setShowAdd((o) => !o)}
          className="flex items-center gap-1 text-sm border border-[var(--nicole-border)] rounded-xl px-2.5 py-1 hover:bg-[var(--nicole-cream)]"
        >
          <PlusIcon className="w-4 h-4" /> Add card
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] space-y-3">
          <textarea
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            placeholder="Front (question)..."
            rows={2}
            className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none resize-none"
          />
          <textarea
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            placeholder="Back (answer)..."
            rows={3}
            className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none resize-none"
          />
          <button
            onClick={addCard}
            disabled={adding || !newFront.trim() || !newBack.trim()}
            className="w-full py-2 rounded-xl bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] text-sm disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-[var(--nicole-text-muted)] text-center py-16">Loading cards...</p>}

      {!loading && done && (
        <div className="text-center py-20 space-y-3">
          <p className="text-2xl">All done</p>
          <p className="text-sm text-[var(--nicole-text-muted)]">No cards due right now. Come back later or add more cards.</p>
          <Link href="/flashcards" className="inline-block mt-4 text-sm underline text-[var(--nicole-text-muted)]">Back to decks</Link>
        </div>
      )}

      {!loading && !done && current && (
        <div className="space-y-4">
          <div className="w-full h-1.5 bg-[var(--nicole-border)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--nicole-peach)] rounded-full transition-all" style={{ width: progress + "%" }} />
          </div>
          <p className="text-xs text-[var(--nicole-text-muted)] text-right">{index + 1} / {cards.length}</p>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="w-full min-h-60 p-8 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] text-center cursor-pointer hover:border-[var(--nicole-peach)] transition-colors flex items-center justify-center"
          >
            <div>
              <p className="text-xs text-[var(--nicole-text-muted)] mb-4">{flipped ? "Answer" : "Question — tap to reveal"}</p>
              <p className="text-base leading-relaxed">{flipped ? current.back : current.front}</p>
            </div>
          </button>

          {flipped && (
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => rate(r.value)}
                  className={"py-2 rounded-xl text-sm font-medium transition-colors " + r.color}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {!flipped && (
            <p className="text-xs text-center text-[var(--nicole-text-muted)]">Tap the card to see the answer</p>
          )}
        </div>
      )}
    </div>
  );
}