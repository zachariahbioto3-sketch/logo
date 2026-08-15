import {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  DocumentMagnifyingGlassIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";

const cards = [
  { Icon: ClipboardDocumentListIcon, title: "Analyze a case", subtitle: "Walk through a clinical case: history, differentials, and next steps." },
  { Icon: AcademicCapIcon, title: "Quiz me", subtitle: "Practice questions for boards or an upcoming exam, with explanations." },
  { Icon: DocumentMagnifyingGlassIcon, title: "Review literature", subtitle: "Summarize a paper or help draft a literature review." },
  { Icon: PuzzlePieceIcon, title: "Explain a concept", subtitle: "Break down a tricky topic in physiology, pharm, or pathology." },
];

export default function QuickStart() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      {cards.map(({ Icon, title, subtitle }) => (
        <button
          key={title}
          className="text-left p-4 rounded-2xl border border-[var(--nicole-border)] bg-white hover:shadow-md transition-shadow"
        >
          <Icon className="w-5 h-5 text-[var(--nicole-text-muted)]" />
          <p className="text-sm font-medium mt-2">{title}</p>
          <p className="text-xs text-[var(--nicole-text-muted)] mt-1 leading-relaxed">{subtitle}</p>
        </button>
      ))}
    </div>
  );
}

