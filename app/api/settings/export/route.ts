import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      chats: { include: { messages: true } },
      projects: true,
      tasks: true,
      agents: true,
      decks: { include: { cards: true } },
      settings: true,
    },
  });

  if (!user) return new Response("Not found", { status: 404 });

  const { passwordHash, ...safeUser } = user;
  void passwordHash;

  const json = JSON.stringify(safeUser, null, 2);

  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=\"nicole-export.json\"",
    },
  });
}