import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, userId } = await params;
  const group = await prisma.company.findFirst({ where: { id, ownerId: session.user.id } });
  if (!group) return NextResponse.json({ error: "Only the owner can remove members" }, { status: 403 });
  if (userId === session.user.id) return NextResponse.json({ error: "Owner cannot remove themselves" }, { status: 400 });

  await prisma.studyGroupMember.delete({
    where: { groupId_userId: { groupId: id, userId } },
  });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, userId } = await params;
  const { role } = await req.json();
  if (!["member", "moderator"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const group = await prisma.company.findFirst({ where: { id, ownerId: session.user.id } });
  if (!group) return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });

  const updated = await prisma.studyGroupMember.update({
    where: { groupId_userId: { groupId: id, userId } },
    data: { role },
  });
  return NextResponse.json(updated);
}