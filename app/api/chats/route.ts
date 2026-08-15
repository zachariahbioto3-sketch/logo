import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chats = await prisma.chat.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return NextResponse.json(chats);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, projectId } = await req.json().catch(() => ({}));

  const chat = await prisma.chat.create({
    data: {
      ownerId: session.user.id,
      agentId: agentId || null,
      projectId: projectId || null,
    },
  });
  return NextResponse.json(chat);
}
