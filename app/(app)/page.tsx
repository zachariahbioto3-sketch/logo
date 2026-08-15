import QuickStart from "@/components/QuickStart";
import ChatInput from "@/components/ChatInput";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col items-center justify-center gap-8 h-full bg-gradient-to-br from-[var(--nicole-peach-light)] via-white to-white -m-8 p-8">
      <h1 className="text-4xl font-medium text-center">
        {greeting}, {firstName}
      </h1>
      <ChatInput />
      <div>
        <p className="text-xs font-medium text-[var(--nicole-text-muted)] mb-3 tracking-wide">
          QUICK START
        </p>
        <QuickStart />
      </div>
    </div>
  );
}
