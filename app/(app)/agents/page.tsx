"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, CpuChipIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ConfirmDelete from "@/components/ConfirmDelete";
import { useToast } from "@/components/Toast";
import { SkeletonCard } from "@/components/Skeleton";

type Agent = { id: string; name: string; systemPrompt: string; defaultModel: string };

const presetExamples = [
  { name: "Case Study Tutor", systemPrompt: "You are a clinical reasoning tutor. Walk students through cases using differential diagnosis, asking guiding questions rather than giving answers immediately." },
  { name: "Board Exam Coach", systemPrompt: "You are a USMLE-style exam coach. Generate practice questions with explanations, and identify knowledge gaps based on the student answers." },
  { name: "the blind spot", systemPrompt: "H AVING the whole being illuminated, walking in the fulness of the light—this is the special point of the text. How many of us realise the splendid privilege? Many are wholly blind concerning spiritual realities, and many believers see only imperfectly, intermittently, partially.Of these latter we now propose to speak"}
];

export default function AgentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [defaultModel, setDefaultModel] = useState("gemini-3.6-flash");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error();
      setAgents(await res.json());
    } catch {
      showToast("Couldn't load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, systemPrompt, defaultModel }),
      });
      if (!res.ok) throw new Error();
      setName("");
      setSystemPrompt("");
      setShowForm(false);
      load();
      showToast("Agent created", "success");
    } catch {
      showToast("Couldn't create agent");
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      load();
    } catch {
      showToast("Couldn't delete agent");
    }
  };

  const startChatWithAgent = async (agentId: string) => {
    setStartingId(agentId);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) throw new Error();
      const chat = await res.json();
      router.push(`/chat/${chat.id}`);
    } catch {
      showToast("Couldn't start chat with this agent");
      setStartingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">Agents</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] rounded-lg px-4 py-2 text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> New agent
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAgent} className="mb-6 max-w-xl p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agent name, e.g. Case Study Tutor"
            className="w-full border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="System prompt: how should this agent behave?"
            rows={4}
            className="w-full border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none resize-none"
          />
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
          </select>
          <div className="flex gap-2 flex-wrap items-center">
            <button type="submit" className="bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] rounded-lg px-4 py-2 text-sm">
              Create agent
            </button>
            {presetExamples.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => { setName(p.name); setSystemPrompt(p.systemPrompt); }}
                className="text-xs text-[var(--nicole-text-muted)] border border-[var(--nicole-border)] rounded-lg px-2 py-1 hover:bg-[var(--nicole-cream)]"
              >
                Use {p.name} template
              </button>
            ))}
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 max-w-3xl">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : agents.length === 0 ? (
        <p className="text-sm text-[var(--nicole-text-muted)]">No agents yet. Create one above to save a reusable prompt and model setup, then start chats with it.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-w-3xl">
          {agents.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <CpuChipIcon className="w-5 h-5 text-[var(--nicole-text-muted)] mt-0.5" />
                  <p className="text-sm font-medium">{a.name}</p>
                </div>
                <ConfirmDelete onConfirm={() => deleteAgent(a.id)} />
              </div>
              <p className="text-xs text-[var(--nicole-text-muted)] mt-2 line-clamp-2 flex-1">{a.systemPrompt}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-[var(--nicole-text-muted)] italic">{a.defaultModel}</p>
                <button
                  onClick={() => startChatWithAgent(a.id)}
                  disabled={startingId === a.id}
                  className="flex items-center gap-1 text-xs bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] rounded-lg px-3 py-1.5 disabled:opacity-50"
                >
                  <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                  {startingId === a.id ? "Starting..." : "Start chat"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

