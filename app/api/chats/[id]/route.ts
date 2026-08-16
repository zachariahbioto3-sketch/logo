import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const chat = await prisma.chat.findFirst({
    where: { id, ownerId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, agent: true },
  });

  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(chat);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, string | null> = {};

  if (body.title !== undefined) {
    if (!body.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
    data.title = body.title.trim();
  }
  if (body.projectId !== undefined) {
    data.projectId = body.projectId || null;
  }

  const chat = await prisma.chat.update({
    where: { id, ownerId: session.user.id },
    data,
  });
  return NextResponse.json(chat);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const messages = await prisma.message.findMany({
    where: { chatId: id, chat: { ownerId: session.user.id }, attachmentUrl: { not: null } },
    select: { attachmentUrl: true },
  });

  await prisma.chat.delete({ where: { id, ownerId: session.user.id } });

  for (const msg of messages) {
    if (!msg.attachmentUrl) continue;
    try {
      const { unlink } = await import("fs/promises");
      const { urlToFilePath } = await import("@/lib/uploads");
      await unlink(urlToFilePath(msg.attachmentUrl));
    } catch {
      // file already gone, no problem
    }
  }

  return NextResponse.json({ success: true });
}
