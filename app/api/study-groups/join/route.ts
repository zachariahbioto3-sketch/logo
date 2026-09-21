import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) return NextResponse.json({ error: "Invite code required" }, { status: 400 });

  const group = await prisma.company.findUnique({ where: { joinCode: inviteCode.trim() } });
  if (!group) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });

  const existing = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
  });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 400 });

  await prisma.groupMembership.create({
    data: { groupId: group.id, userId: session.user.id, role: "member" },
  });

  return NextResponse.json({ success: true, groupId: group.id, groupName: group.name });
}