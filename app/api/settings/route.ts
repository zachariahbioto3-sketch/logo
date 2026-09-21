import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: session.user.id },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, studyField: true, defaultModel: true },
  });

  return NextResponse.json({ ...settings, ...user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const userFields: Record<string, unknown> = {};
  const settingsFields: Record<string, unknown> = {};

  const userKeys = ["name", "studyField", "defaultModel"];
  const settingsKeys = [
    "theme", "fontSize", "compactView", "streamResponses",
    "autoTitle", "contextLimit", "usageWarningThreshold",
    "language", "customSystemPrompt", "defaultDeckId",
    "defaultAgentId", "temperature", "maxTokens",
    "accentColor", "dailyStudyGoal",
  ];

  for (const key of userKeys) {
    if (body[key] !== undefined) userFields[key] = body[key];
  }
  for (const key of settingsKeys) {
    if (body[key] !== undefined) settingsFields[key] = body[key];
  }

  const [user, settings] = await Promise.all([
    Object.keys(userFields).length
      ? prisma.user.update({ where: { id: session.user.id }, data: userFields })
      : prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, studyField: true, defaultModel: true } }),
    Object.keys(settingsFields).length
      ? prisma.userSettings.upsert({
          where: { userId: session.user.id },
          update: settingsFields,
          create: { userId: session.user.id, ...settingsFields },
        })
      : prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ ...settings, ...user });
}