"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

type Task = { id: string; title: string; status: string; createdAt: string };

const statuses = ["todo", "in_progress", "done"];
const statusLabels: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/tasks");
    setTasks(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <h1 className="text-2xl font-medium mb-6">Tasks</h1>

      <form onSubmit={createTask} className="flex gap-2 mb-6 max-w-md">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task (e.g. Review cardiology notes)"
          className="flex-1 border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="bg-[var(--nicole-text)] text-white rounded-lg px-4 py-2 text-sm flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[var(--nicole-text-muted)]">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-[var(--nicole-text-muted)]">No tasks yet. Add one above to start tracking your study to-dos.</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--nicole-border)] bg-white">
              <p className={`text-sm ${t.status === "done" ? "line-through text-[var(--nicole-text-muted)]" : ""}`}>{t.title}</p>
              <div className="flex items-center gap-2">
                <select
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value)}
                  className="text-xs border border-[var(--nicole-border)] rounded-lg px-2 py-1 outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
                <button onClick={() => deleteTask(t.id)} className="text-[var(--nicole-text-muted)] hover:text-red-500">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
