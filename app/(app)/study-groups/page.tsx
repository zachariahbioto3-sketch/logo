"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { PlusIcon, TrashIcon, UserGroupIcon } from "@heroicons/react/24/outline";

type Group = { id: string; name: string; projects: { id: string }[] };

export default function StudyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/study-groups");
    setGroups(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/study-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  };

  const deleteGroup = async (id: string) => {
    await fetch(`/api/study-groups/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <h1 className="text-2xl font-medium mb-6">Study Groups</h1>

      <form onSubmit={createGroup} className="flex gap-2 mb-6 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New study group name"
          className="flex-1 border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="bg-[var(--nicole-text)] text-white rounded-lg px-4 py-2 text-sm flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[var(--nicole-text-muted)]">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-[var(--nicole-text-muted)]">No study groups yet. Create one to organize shared projects with classmates.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {groups.map((g) => (
            <div key={g.id} className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white flex items-start justify-between">
              <div className="flex items-start gap-2">
                <UserGroupIcon className="w-5 h-5 text-[var(--nicole-text-muted)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-[var(--nicole-text-muted)]">{g.projects.length} project(s)</p>
                </div>
              </div>
              <button onClick={() => deleteGroup(g.id)} className="text-[var(--nicole-text-muted)] hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
