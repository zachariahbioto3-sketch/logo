import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { urlToFilePath } from "@/lib/uploads";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: {
      chat: { ownerId: session.user.id },
      attachmentUrl: { not: null },
    },
    select: {
      id: true,
      attachmentUrl: true,
      attachmentType: true,
      attachmentName: true,
      createdAt: true,
      chat: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(messages);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await req.json();

  const message = await prisma.message.findFirst({
    where: { id: messageId, chat: { ownerId: session.user.id } },
    select: { attachmentUrl: true },
  });

  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (message.attachmentUrl) {
    try {
      await unlink(urlToFilePath(message.attachmentUrl));
    } catch {
      // already gone
    }
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { attachmentUrl: null, attachmentType: null, attachmentName: null },
  });

  return NextResponse.json({ success: true });
}