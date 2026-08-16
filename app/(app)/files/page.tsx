"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrashIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toast";
import { SkeletonMessage } from "@/components/Skeleton";

type FileEntry = {
  id: string;
  attachmentUrl: string;
  attachmentType: string;
  attachmentName: string;
  createdAt: string;
  chat: { id: string; title: string };
};

export default function FilesPage() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error();
      setFiles(await res.json());
    } catch {
      showToast("Could not load files");
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (messageId: string) => {
    setDeleting(messageId);
    try {
      const res = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      if (!res.ok) throw new Error();
      setFiles((prev) => prev.filter((f) => f.id !== messageId));
      showToast("File deleted");
    } catch {
      showToast("Could not delete file");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => { loadFiles(); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Uploaded Files</h1>
        <p className="text-sm text-[var(--nicole-text-muted)] mt-1">
          All files attached to your chats. Deleting a file here removes it from disk but keeps the chat message.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          <SkeletonMessage />
          <SkeletonMessage />
        </div>
      )}

      {!loading && files.length === 0 && (
        <div className="text-center py-20 text-sm text-[var(--nicole-text-muted)]">
          No uploaded files yet.
        </div>
      )}

      {!loading && files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((f) => (
            <div
              key={f.id}
              className="group relative rounded-xl border border-[var(--nicole-border)] bg-white overflow-hidden"
            >
              {f.attachmentType.startsWith("image/") ? (
                <img
                  src={f.attachmentUrl}
                  alt={f.attachmentName}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 flex flex-col items-center justify-center bg-[var(--nicole-cream)] gap-2">
                  <DocumentIcon className="w-10 h-10 text-[var(--nicole-text-muted)]" />
                  <span className="text-xs font-medium text-[var(--nicole-text-muted)]">PDF</span>
                </div>
              )}

              <div className="p-2 space-y-1">
                <p className="text-xs font-medium truncate">{f.attachmentName}</p>
                <Link
                  href={"/chat/" + f.chat.id}
                  className="text-xs text-[var(--nicole-text-muted)] hover:underline truncate block"
                >
                  {f.chat.title}
                </Link>
                <p className="text-xs text-[var(--nicole-text-muted)]">
                  {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => deleteFile(f.id)}
                disabled={deleting === f.id}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-white border border-[var(--nicole-border)] flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-opacity disabled:opacity-50"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}