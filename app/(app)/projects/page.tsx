"use client";

import { useEffect, useState } from "react";
import { PlusIcon, FolderIcon } from "@heroicons/react/24/outline";
import ConfirmDelete from "@/components/ConfirmDelete";
import { useToast } from "@/components/Toast";
import { SkeletonCard } from "@/components/Skeleton";

type Project = { id: string; name: string; createdAt: string };

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch {
      showToast("Couldn't load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      setName("");
      await load();
      showToast("Project created", "success");
    } catch {
      showToast("Couldn't create project");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProject = async (id: string) => {
    const prev = projects;
    setProjects(projects.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setProjects(prev);
      showToast("Couldn't delete project");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Projects</h1>

      <form onSubmit={createProject} className="flex flex-col sm:flex-row gap-2 mb-6 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
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
      ) : projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--nicole-border)] rounded-2xl">
          <FolderIcon className="w-8 h-8 text-[var(--nicole-text-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--nicole-text-muted)]">No projects yet.</p>
          <p className="text-xs text-[var(--nicole-text-muted)] mt-1">Create one above to group related chats and tasks by course or rotation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white flex items-start justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <FolderIcon className="w-5 h-5 text-[var(--nicole-text-muted)] mt-0.5 shrink-0" />
                <p className="text-sm font-medium truncate">{p.name}</p>
              </div>
              <ConfirmDelete onConfirm={() => deleteProject(p.id)} className="shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

