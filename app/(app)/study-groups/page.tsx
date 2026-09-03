"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, UserGroupIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toast";

type Member = { id: string; name: string | null; email: string };
type Group = { id: string; name: string; inviteCode: string; _count: { members: number }; members: { user: Member }[] };

export default function StudyGroupsPage() {
  const { showToast } = useToast();
  const [owned, setOwned] = useState<Group[]>([]);
  const [joined, setJoined] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/study-groups");
      const data = await res.json();
      setOwned(data.owned || []);
      setJoined(data.joined || []);
    } catch { showToast("Could not load groups"); }
    finally { setLoading(false); }
  };

  const create = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/study-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error();
      setNewName("");
      load();
    } catch { showToast("Could not create group"); }
    finally { setCreating(false); }
  };

  const join = async () => {
    if (!inviteCode.trim() || joining) return;
    setJoining(true);
    try {
      const res = await fetch("/api/study-groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Joined " + data.groupName);
      setInviteCode("");
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not join group");
    } finally { setJoining(false); }
  };

  useEffect(() => { load(); }, []);

  const GroupCard = ({ g }: { g: Group }) => (
    <Link
      href={"/study-groups/" + g.id}
      className="flex items-center justify-between p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] hover:border-[var(--nicole-peach)] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--nicole-peach-light)] flex items-center justify-center">
          <UserGroupIcon className="w-5 h-5 text-[var(--nicole-text-muted)]" />
        </div>
        <div>
          <p className="text-sm font-medium">{g.name}</p>
          <p className="text-xs text-[var(--nicole-text-muted)]">{g._count.members} member{g._count.members !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Study Groups</h1>
        <p className="text-sm text-[var(--nicole-text-muted)] mt-1">Collaborate with classmates, share agents, and study together.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") create(); }}
            placeholder="New group name..."
            className="flex-1 text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none"
          />
          <button
            onClick={create}
            disabled={!newName.trim() || creating}
            className="w-9 h-9 rounded-xl bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] flex items-center justify-center disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") join(); }}
            placeholder="Invite code..."
            className="flex-1 text-sm border border-[var(--nicole-border)] rounded-xl px-3 py-2 outline-none"
          />
          <button
            onClick={join}
            disabled={!inviteCode.trim() || joining}
            className="w-9 h-9 rounded-xl border border-[var(--nicole-border)] flex items-center justify-center disabled:opacity-50 hover:bg-[var(--nicole-cream)]"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-[var(--nicole-text-muted)]">Loading...</p>}

      {!loading && owned.length === 0 && joined.length === 0 && (
        <p className="text-sm text-center text-[var(--nicole-text-muted)] py-16">No groups yet. Create one or join with an invite code.</p>
      )}

      {owned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-[var(--nicole-text-muted)] uppercase tracking-wider mb-3">Your groups</p>
          <div className="space-y-2">{owned.map((g) => <GroupCard key={g.id} g={g} />)}</div>
        </div>
      )}

      {joined.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--nicole-text-muted)] uppercase tracking-wider mb-3">Joined</p>
          <div className="space-y-2">{joined.map((g) => <GroupCard key={g.id} g={g} />)}</div>
        </div>
      )}
    </div>
  );
}