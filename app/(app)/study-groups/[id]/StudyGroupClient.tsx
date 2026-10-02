"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon, ClipboardIcon, ClipboardDocumentCheckIcon,
  TrashIcon, SparklesIcon, PlusIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toast";

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string | null; email: string };
};

type Agent = { id: string; name: string; systemPrompt: string; defaultModel: string };

type Group = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  myRole: string;
  members: Member[];
  agents: Agent[];
};

export default function StudyGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { showToast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentModel, setAgentModel] = useState("gemini-3.6-flash");
  const [addingAgent, setAddingAgent] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/study-groups/" + groupId);
      if (!res.ok) throw new Error();
      setGroup(await res.json());
    } catch { showToast("Could not load group"); }
    finally { setLoading(false); }
  };

  const copyInvite = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = async (userId: string) => {
    try {
      const res = await fetch("/api/study-groups/" + groupId + "/members/" + userId, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setGroup((g) => g ? { ...g, members: g.members.filter((m) => m.user.id !== userId) } : g);
    } catch { showToast("Could not remove member"); }
  };

  const changeRole = async (userId: string, role: string) => {
    try {
      await fetch("/api/study-groups/" + groupId + "/members/" + userId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setGroup((g) => g ? {
        ...g,
        members: g.members.map((m) => m.user.id === userId ? { ...m, role } : m),
      } : g);
    } catch { showToast("Could not update role"); }
  };

  const leaveOrDelete = async () => {
    try {
      const res = await fetch("/api/study-groups/" + groupId, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.action === "deleted" ? "Group deleted" : "Left group");
      router.push("/study-groups");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not leave group");
    }
  };

  const addAgent = async () => {
    if (!agentName.trim() || !agentPrompt.trim() || addingAgent) return;
    setAddingAgent(true);
    try {
      const res = await fetch("/api/study-groups/" + groupId + "/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName, systemPrompt: agentPrompt, defaultModel: agentModel }),
      });
      if (!res.ok) throw new Error();
      const agent = await res.json();
      setGroup((g) => g ? { ...g, agents: [agent, ...g.agents] } : g);
      setAgentName(""); setAgentPrompt(""); setShowAddAgent(false);
      showToast("Shared agent added");
    } catch { showToast("Could not add agent"); }
    finally { setAddingAgent(false); }
  };

  const startChatWithAgent = async (agent: Agent) => {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: agent.id }),
    });
    const chat = await res.json();
    router.push("/chat/" + chat.id);
  };

  useEffect(() => { load(); }, [groupId]);

  if (loading) return <div className="p-8 text-sm text-[var(--nicole-text-muted)]">Loading...</div>;
  if (!group) return <div className="p-8 text-sm text-[var(--nicole-text-muted)]">Group not found.</div>;

  const isOwner = group.myRole === "owner";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/study-groups" className="flex items-center gap-1.5 text-sm text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)]">
          <ArrowLeftIcon className="w-4 h-4" /> Groups
        </Link>
        <button
          onClick={leaveOrDelete}
          className="text-xs text-red-500 hover:text-red-600 border border-red-200 rounded-xl px-3 py-1.5"
        >
          {isOwner ? "Delete group" : "Leave group"}
        </button>
      </div>

      <div>
        <h1 className="text-xl font-semibold">{group.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-[var(--nicole-text-muted)] font-mono bg-[var(--nicole-cream)] px-3 py-1.5 rounded-lg">{group.inviteCode}</p>
          <button
            onClick={copyInvite}
            className="flex items-center gap-1 text-xs text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)] border border-[var(--nicole-border)] rounded-lg px-2.5 py-1.5"
          >
            {copied ? <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy invite code"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--nicole-text-muted)] uppercase tracking-wider mb-3">Members ({group.members.length})</p>
        <div className="space-y-2">
          {group.members.map((m) => (
            <div key={m.user.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)]">
              <div>
                <p className="text-sm font-medium">{m.user.name || m.user.email}</p>
                <p className="text-xs text-[var(--nicole-text-muted)]">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && m.user.id !== group.ownerId ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.user.id, e.target.value)}
                      className="text-xs border border-[var(--nicole-border)] rounded-lg px-2 py-1 bg-[var(--nicole-cream)] outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                    </select>
                    <button onClick={() => removeMember(m.user.id)} className="hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-[var(--nicole-text-muted)] bg-[var(--nicole-cream)] px-2 py-1 rounded-lg capitalize">{m.role}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-[var(--nicole-text-muted)] uppercase tracking-wider">Shared Agents</p>
          {isOwner && (
            <button
              onClick={() => setShowAddAgent((o) => !o)}
              className="flex items-center gap-1 text-xs border border-[var(--nicole-border)] rounded-xl px-2.5 py-1 hover:bg-[var(--nicole-cream)]"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Add agent
            </button>
          )}
        </div>

        {showAddAgent && (
          <div className="mb-4 p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] space-y-3">
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent name..."
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none"
            />
            <textarea
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              placeholder="System prompt..."
              rows={3}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none resize-none"
            />
            <select
              value={agentModel}
              onChange={(e) => setAgentModel(e.target.value)}
              className="w-full text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none bg-[var(--nicole-cream)]"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
            </select>
            <button
              onClick={addAgent}
              disabled={addingAgent || !agentName.trim() || !agentPrompt.trim()}
              className="w-full py-2 rounded-xl bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] text-sm disabled:opacity-50"
            >
              {addingAgent ? "Adding..." : "Add shared agent"}
            </button>
          </div>
        )}

        {group.agents.length === 0 && (
          <p className="text-sm text-[var(--nicole-text-muted)] text-center py-6">No shared agents yet.</p>
        )}

        <div className="space-y-2">
          {group.agents.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)]">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-[var(--nicole-text-muted)] truncate max-w-xs">{a.systemPrompt}</p>
              </div>
              <button
                onClick={() => startChatWithAgent(a)}
                className="flex items-center gap-1 text-xs border border-[var(--nicole-border)] rounded-xl px-2.5 py-1.5 hover:bg-[var(--nicole-cream)]"
              >
                <SparklesIcon className="w-3.5 h-3.5" /> Chat
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}