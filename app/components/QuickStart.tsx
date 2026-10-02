"use client";

import {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  DocumentMagnifyingGlassIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

const cards = [
  { Icon: ClipboardDocumentListIcon, title: "Analyze a case", subtitle: "Walk through a clinical case: history, differentials, and next steps.", prompt: "Let us analyze a clinical case. Please present me with a case." },
  { Icon: AcademicCapIcon, title: "Quiz me", subtitle: "Practice questions for boards or an upcoming exam, with explanations.", prompt: "Quiz me with a medical board-style question. Start with one question and explain the answer after I respond." },
  { Icon: DocumentMagnifyingGlassIcon, title: "Review literature", subtitle: "Summarize a paper or help draft a literature review.", prompt: "Help me review medical literature. I will paste an abstract or topic and you summarize the key findings." },
  { Icon: PuzzlePieceIcon, title: "Explain a concept", subtitle: "Break down a tricky topic in physiology, pharm, or pathology.", prompt: "Explain a medical concept to me. Ask me which topic I want to understand better." },
];

export default function QuickStart() {
  const router = useRouter();

  const startChat = async (prompt: string) => {
    const res = await fetch("/api/chats", { method: "POST" });
    const chat = await res.json();
    sessionStorage.setItem("pending-message-" + chat.id, prompt);
    router.push("/chat/" + chat.id);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      {cards.map(({ Icon, title, subtitle, prompt }) => (
        <button
          key={title}
          onClick={() => startChat(prompt)}
          className="group text-left p-4 rounded-2xl border border-[var(--nicole-border)] bg-[var(--nicole-cream)] hover:border-[var(--nicole-peach)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <Icon className="w-5 h-5 text-[var(--nicole-peach)] group-hover:scale-110 transition-transform" />
          <p className="text-sm font-medium mt-2 text-[var(--nicole-text)]">{title}</p>
          <p className="text-xs text-[var(--nicole-text-muted)] mt-1 leading-relaxed">{subtitle}</p>
        </button>
      ))}
    </div>
  );
}