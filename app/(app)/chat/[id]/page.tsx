"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowUpIcon, PaperClipIcon, XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { SkeletonMessage } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
};

type Project = { id: string; name: string };

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [model, setModel] = useState("gemini-3.6-flash");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [attachment, setAttachment] = useState<{ url: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChat = async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages);
      if (data.agent) { setModel(data.agent.defaultModel); setAgentName(data.agent.name); }
      if (data.projectId) setProjectId(data.projectId);
    } catch {
      showToast("Couldn't load this chat");
    } finally {
      setPageLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data);
    } catch {}
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
      const data = await res.json();
      setAttachment({ url: data.url, type: data.type, name: data.name });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText ?? input;
    if ((!text.trim() && !attachment) || streaming) return;
    const sentAttachment = attachment;
    if (!overrideText) setInput("");
    setAttachment(null);

    setMessages((prev) => [
      ...prev,
      {
        id: "temp-user",
        role: "user",
        content: text,
        attachmentUrl: sentAttachment?.url,
        attachmentType: sentAttachment?.type,
        attachmentName: sentAttachment?.name,
      },
    ]);
    setStreaming(true);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          model,
          attachmentUrl: sentAttachment?.url || null,
          attachmentType: sentAttachment?.type || null,
          attachmentName: sentAttachment?.name || null,
        }),
      });

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { id: "temp-assistant", role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });

        if (assistantText.includes("__ERROR__:")) {
          const [before, errPart] = assistantText.split("__ERROR__:");
          showToast(errPart.trim());
          assistantText = before.trim();
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { id: "temp-assistant", role: "assistant", content: assistantText };
          return updated;
        });
      }
    } catch {
      showToast("Message failed to send. Try again.");
      setMessages((prev) => prev.filter((m) => m.id !== "temp-assistant" && m.id !== "temp-user"));
      if (!overrideText) setInput(text);
      setAttachment(sentAttachment);
    } finally {
      setStreaming(false);
    }
  };

  const assignProject = async (pid: string) => {
    setProjectId(pid);
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: pid || null }),
      });
    } catch {
      showToast("Couldn't assign project");
    }
  };

  const exportMarkdown = () => {
    const lines: string[] = [];
    lines.push("# " + (agentName ? "Chat with " + agentName : "Nicole Chat"));
    lines.push("_Exported " + new Date().toLocaleString() + "_");
    lines.push("");
    messages.forEach((m) => {
      if (m.role === "user") {
        lines.push("**You:**");
      } else {
        lines.push("**Nicole:**");
      }
      if (m.attachmentName) lines.push("_Attachment: " + m.attachmentName + "_");
      lines.push(m.content);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nicole-chat-" + chatId.slice(0, 8) + ".md";
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const exportPDF = () => {
    setExportOpen(false);
    setTimeout(() => window.print(), 100);
  };

  useEffect(() => {
    const pending = sessionStorage.getItem(`pending-message-${chatId}`);
    const pendingModel = sessionStorage.getItem(`pending-model-${chatId}`);
    if (pending) {
      sessionStorage.removeItem(`pending-message-${chatId}`);
      sessionStorage.removeItem(`pending-model-${chatId}`);
      if (pendingModel) setModel(pendingModel);
      setPageLoading(false);
      sendMessage(pending);
    } else {
      loadChat();
    }
    loadProjects();
  }, [chatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--nicole-border)] text-xs text-[var(--nicole-text-muted)]">
        {agentName ? (
          <span>Chatting with <span className="font-medium">{agentName}</span></span>
        ) : (
          <span className="text-[var(--nicole-text-muted)]">Nicole</span>
        )}
          <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={(e) => assignProject(e.target.value)}
              className="text-xs bg-transparent outline-none border border-[var(--nicole-border)] rounded-md px-2 py-1"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {messages.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setExportOpen((o) => !o)}
                className="flex items-center gap-1 text-xs text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)] border border-[var(--nicole-border)] rounded-md px-2 py-1"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-7 z-10 bg-white border border-[var(--nicole-border)] rounded-xl shadow-md overflow-hidden text-xs w-40">
                  <button
                    onClick={exportMarkdown}
                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--nicole-cream)] transition-colors"
                  >
                    Download Markdown
                  </button>
                  <button
                    onClick={exportPDF}
                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--nicole-cream)] transition-colors"
                  >
                    Save as PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {pageLoading && (<><SkeletonMessage /><SkeletonMessage mine /><SkeletonMessage /></>)}
        {!pageLoading && messages.length === 0 && (
          <p className="text-sm text-[var(--nicole-text-muted)] text-center mt-12">Start the conversation below.</p>
        )}
        {messages.map((m, i) => {
          const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
          const isActivelyStreaming = streaming && isLastAssistant;
          return (
            <div key={m.id + i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm space-y-2 ${
                m.role === "user"
                  ? "bg-[var(--nicole-text)] text-white"
                  : "bg-white border border-[var(--nicole-border)]"
              }`}>
                {m.attachmentUrl && (
                  <div className="text-xs opacity-75">
                    {m.attachmentType?.startsWith("image/") ? (
                      <img src={m.attachmentUrl} alt={m.attachmentName || "attachment"} className="max-w-xs rounded-lg" />
                    ) : (
                      <span>?? {m.attachmentName}</span>
                    )}
                  </div>
                )}
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-medium prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:font-semibold prose-hr:my-3 prose-table:text-xs prose-th:bg-[var(--nicole-cream)] prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-th:border prose-td:border prose-th:border-[var(--nicole-border)] prose-td:border-[var(--nicole-border)]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      {isActivelyStreaming && <span className="nicole-cursor" />}
                    </div>
                  ) : isActivelyStreaming ? (
                    <span className="nicole-shimmer-text font-medium">Nicole is thinking...</span>
                  ) : null
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--nicole-border)] pt-4 pb-2">
        {attachment && (
          <div className="flex items-center gap-2 px-1 pb-2 text-xs text-[var(--nicole-text-muted)]">
            <span>?? {attachment.name}</span>
            <button onClick={() => setAttachment(null)} className="hover:text-red-500">
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="rounded-2xl border border-[var(--nicole-border)] bg-white p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={agentName ? `Message ${agentName}...` : "Message Nicole..."}
            rows={1}
            className="w-full resize-none outline-none text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-[var(--nicole-text-muted)]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="hover:text-[var(--nicole-text)] disabled:opacity-50"
                title="Attach file"
              >
                <PaperClipIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="text-xs text-[var(--nicole-text-muted)] bg-transparent outline-none"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
              </select>
              <button
                onClick={() => sendMessage()}
                disabled={streaming || uploading}
                className={`w-7 h-7 rounded-full bg-[var(--nicole-text)] text-white flex items-center justify-center disabled:opacity-50 ${streaming ? "animate-pulse" : ""}`}
              >
                <ArrowUpIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
