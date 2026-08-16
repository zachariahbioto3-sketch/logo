import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const group = await prisma.company.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      agents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...group, myRole: membership.role });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const group = await prisma.company.findFirst({ where: { id, ownerId: session.user.id } });
  if (!group) return NextResponse.json({ error: "Not found or not owner" }, { status: 403 });

  const updated = await prisma.company.update({ where: { id }, data: { name: name.trim() } });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const group = await prisma.company.findFirst({ where: { id } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (group.ownerId === session.user.id) {
    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true, action: "deleted" });
  }

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  await prisma.studyGroupMember.delete({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  });
  return NextResponse.json({ success: true, action: "left" });
}