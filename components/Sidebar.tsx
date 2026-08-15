"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  CheckCircleIcon,
  CpuChipIcon,
  UserGroupIcon,
  PowerIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import SearchModal from "./SearchModal";
import { useToast } from "./Toast";

const navItems = [
  { label: "Chats", href: "/", Icon: ChatBubbleLeftRightIcon },
  { label: "Projects", href: "/projects", Icon: FolderIcon },
  { label: "Tasks", href: "/tasks", Icon: CheckCircleIcon },
  { label: "Agents", href: "/agents", Icon: CpuChipIcon },
  { label: "Study Groups", href: "/study-groups", Icon: UserGroupIcon },
];

type Chat = { id: string; title: string };

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [recents, setRecents] = useState<Chat[]>([]);
  const [recentsLoading, setRecentsLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadRecents = async () => {
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error();
      setRecents(await res.json());
    } catch {
      showToast("Couldn't load recent chats");
    } finally {
      setRecentsLoading(false);
    }
  };

  useEffect(() => { loadRecents(); }, [pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const startNewChat = async () => {
    try {
      const res = await fetch("/api/chats", { method: "POST" });
      if (!res.ok) throw new Error();
      const chat = await res.json();
      router.push(`/chat/${chat.id}`);
    } catch {
      showToast("Couldn't start a new chat");
    }
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-white border border-[var(--nicole-border)] rounded-lg p-2 shadow-sm"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`w-64 shrink-0 border-r border-[var(--nicole-border)] bg-[var(--nicole-sidebar)] flex flex-col h-full fixed md:static z-50 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between md:hidden mb-2">
            <span className="text-sm font-medium">Nicole</span>
            <button onClick={() => setMobileOpen(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            <PlusIcon className="w-4 h-4" /> New chat
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--nicole-text-muted)] hover:bg-white transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" /> Search
          </button>
          <Link
            href="/customize"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/customize" ? "bg-white font-medium" : "text-[var(--nicole-text-muted)] hover:bg-white"
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" /> Customize
          </Link>
        </div>

        <nav className="px-4 space-y-1 pb-4 border-b border-[var(--nicole-border)]">
          {navItems.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === href ? "bg-white font-medium" : "hover:bg-white"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 pt-4 flex-1 overflow-y-auto">
          <p className="text-xs font-medium text-[var(--nicole-text-muted)] px-3 mb-2 tracking-wide">
            RECENTS
          </p>
          <div className="space-y-1">
            {recentsLoading && (
              <>
                <div className="h-8 mx-3 bg-[var(--nicole-border)] rounded animate-pulse mb-2" />
                <div className="h-8 mx-3 bg-[var(--nicole-border)] rounded animate-pulse" />
              </>
            )}
            {!recentsLoading && recents.length === 0 && (
              <p className="text-xs text-[var(--nicole-text-muted)] px-3">No chats yet. Start one above.</p>
            )}
            {recents.map((r) => (
              <Link
                key={r.id}
                href={`/chat/${r.id}`}
                className={`block text-left px-3 py-2 rounded-lg hover:bg-white transition-colors ${
                  pathname === `/chat/${r.id}` ? "bg-white" : ""
                }`}
              >
                <p className="text-sm font-medium truncate">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--nicole-border)] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--nicole-peach)] flex items-center justify-center text-sm font-medium shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
              <p className="text-xs text-[var(--nicole-text-muted)] truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[var(--nicole-text-muted)] hover:text-[var(--nicole-text)] shrink-0"
          >
            <PowerIcon className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
