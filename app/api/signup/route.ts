import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() { return NextResponse.json({ ok: true, localMode: true }); }
export async function POST() { return NextResponse.json({ ok: true, localMode: true }); }
export async function PUT() { return NextResponse.json({ ok: true, localMode: true }); }
export async function PATCH() { return NextResponse.json({ ok: true, localMode: true }); }
export async function DELETE() { return NextResponse.json({ ok: true, localMode: true }); }
