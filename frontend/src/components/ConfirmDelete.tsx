"use client";

import { useState, useRef, useEffect } from "react";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function ConfirmDelete({ onConfirm, className = "" }: { onConfirm: () => void; className?: string }) {
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!armed) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setArmed(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [armed]);

  if (armed) {
    return (
      <div ref={ref} className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onConfirm(); setArmed(false); }}
          className="text-red-500 hover:text-red-600"
          title="Confirm delete"
        >
          <CheckIcon className="w-4 h-4" />
        </button>
        <span className="text-xs text-red-500">Sure?</span>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setArmed(true); }}
      className={`text-[var(--nicole-text-muted)] hover:text-red-500 ${className}`}
      title="Delete"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );
}
