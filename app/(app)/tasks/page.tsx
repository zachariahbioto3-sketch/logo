"use client";

import { useEffect, useState } from "react";
import { PlusIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import ConfirmDelete from "@/components/ConfirmDelete";
import { useToast } from "@/components/Toast";
import { SkeletonLine } from "@/components/Skeleton";

type Task = { id: string; title: string; status: string; createdAt: string };

const statuses = ["todo", "in_progress", "done"];
const statusLabels: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export default function TasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      showToast("Couldn't load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      await load();
    } catch {
      showToast("Couldn't create task");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const prev = tasks;
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev);
      showToast("Couldn't update task");
    }
  };

  const deleteTask = async (id: string) => {
    const prev = tasks;
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev);
      showToast("Couldn't delete task");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Tasks</h1>

      <form onSubmit={createTask} className="flex flex-col sm:flex-row gap-2 mb-6 max-w-md">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task, e.g. Review cardiology notes"
          className="flex-1 border border-[var(--nicole-border)] rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-[var(--nicole-btn)] text-[var(--nicole-btn-text)] rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" /> {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {loading ? (
        <div className="space-y-2 max-w-2xl">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--nicole-border)] rounded-2xl max-w-2xl">
          <CheckCircleIcon className="w-8 h-8 text-[var(--nicole-text-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--nicole-text-muted)]">No tasks yet.</p>
          <p className="text-xs text-[var(--nicole-text-muted)] mt-1">Add one above to start tracking your study to-dos.</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {tasks.map((t) => (
            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)]">
              <p className={`text-sm break-words ${t.status === "done" ? "line-through text-[var(--nicole-text-muted)]" : ""}`}>{t.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value)}
                  className="text-xs border border-[var(--nicole-border)] rounded-lg px-2 py-1 outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
                <ConfirmDelete onConfirm={() => deleteTask(t.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

