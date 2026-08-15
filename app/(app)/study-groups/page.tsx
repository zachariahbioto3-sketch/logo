"use client";

import { useEffect, useState } from "react";
import { PlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import ConfirmDelete from "@/components/ConfirmDelete";
import { useToast } from "@/components/Toast";
import { SkeletonCard } from "@/components/Skeleton";

type Group = { id: string; name: string; projects: { id: string }[] };

export default function StudyGroupsPage() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/study-groups");
      if (!res.ok) throw new Error();
      setGroups(await res.json());
    } catch {
      showToast("Couldn't load study groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/study-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      setName("");
      await load();
      showToast("Study group created", "success");
    } catch {
      showToast("Couldn't create study group");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGroup = async (id: string) => {
    const prev = groups;
    setGroups(groups.filter((g) => g.id !== id));
    try {
      const res = await fetch(`/api/study-groups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setGroups(prev);
      showToast("Couldn't delete study group");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Study Groups</h1>

      <form onSubmit={createGroup} className="flex flex-col sm:flex-row gap-2 mb-6 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New study group name"
          className="flex-1 border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-[var(--nicole-text)] text-white rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" /> {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--nicole-border)] rounded-2xl">
          <UserGroupIcon className="w-8 h-8 text-[var(--nicole-text-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--nicole-text-muted)]">No study groups yet.</p>
          <p className="text-xs text-[var(--nicole-text-muted)] mt-1">Create one to organize shared projects with classmates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {groups.map((g) => (
            <div key={g.id} className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white flex items-start justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <UserGroupIcon className="w-5 h-5 text-[var(--nicole-text-muted)] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <p className="text-xs text-[var(--nicole-text-muted)]">{g.projects.length} project(s)</p>
                </div>
              </div>
              <ConfirmDelete onConfirm={() => deleteGroup(g.id)} className="shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

