"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { PlusIcon, TrashIcon, FolderIcon } from "@heroicons/react/24/outline";

type Project = { id: string; name: string; createdAt: string };

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (!name.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  };

  const deleteProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <h1 className="text-2xl font-medium mb-6">Projects</h1>

      <form onSubmit={createProject} className="flex gap-2 mb-6 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
          className="flex-1 border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="bg-[var(--nicole-text)] text-white rounded-lg px-4 py-2 text-sm flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[var(--nicole-text-muted)]">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-[var(--nicole-text-muted)]">No projects yet. Create one above to group related chats and tasks.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {projects.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white flex items-start justify-between">
              <div className="flex items-start gap-2">
                <FolderIcon className="w-5 h-5 text-[var(--nicole-text-muted)] mt-0.5" />
                <p className="text-sm font-medium">{p.name}</p>
              </div>
              <button onClick={() => deleteProject(p.id)} className="text-[var(--nicole-text-muted)] hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

