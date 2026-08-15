import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const DAILY_LIMIT = 1500;
const RPM_LIMIT = 15;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const [totalToday, myToday, lastMinute] = await Promise.all([
    prisma.usageLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.usageLog.count({ where: { createdAt: { gte: startOfDay }, userId: session.user.id } }),
    prisma.usageLog.count({ where: { createdAt: { gte: oneMinuteAgo } } }),
  ]);

  return NextResponse.json({
    totalToday,
    myToday,
    lastMinute,
    dailyLimit: DAILY_LIMIT,
    rpmLimit: RPM_LIMIT,
    dailyPercent: Math.min(100, Math.round((totalToday / DAILY_LIMIT) * 100)),
    rpmPercent: Math.min(100, Math.round((lastMinute / RPM_LIMIT) * 100)),
    nearDailyLimit: totalToday / DAILY_LIMIT >= 0.8,
    nearRpmLimit: lastMinute / RPM_LIMIT >= 0.8,
  });
}
