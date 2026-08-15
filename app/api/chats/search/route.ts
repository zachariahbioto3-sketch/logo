import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) return NextResponse.json([]);

  const chats = await prisma.chat.findMany({
    where: {
      ownerId: session.user.id,
      OR: [
        { title: { contains: q } },
        { messages: { some: { content: { contains: q } } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });

  return NextResponse.json(chats);
}
