import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";
import { readFile } from "fs/promises";
import { urlToFilePath } from "@/lib/uploads";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { content, model, attachmentUrl, attachmentType, attachmentName } = await req.json();

  const [chat, user] = await Promise.all([
    prisma.chat.findFirst({
      where: { id, ownerId: session.user.id },
      include: { messages: { orderBy: { createdAt: "asc" } }, agent: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, studyField: true },
    }),
  ]);
  if (!chat) return new Response("Not found", { status: 404 });

  await prisma.message.create({
    data: {
      chatId: id,
      role: "user",
      content: content || "",
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
      attachmentName: attachmentName || null,
    },
  });

  if (chat.messages.length === 0) {
    const title = (content || attachmentName || "Attachment").slice(0, 50);
    await prisma.chat.update({ where: { id }, data: { title } });
  }

  const recentHistory = [...chat.messages, { role: "user", content: content || "" }].slice(-20);

  const basePrompt =
    chat.agent?.systemPrompt ||
    "You are Nicole, a study assistant for medical students. Be clear, accurate, and educational. You can analyze images and documents such as X-rays, ECGs, lab reports, and rashes. Remind users this is a study aid, not medical advice for real patients when relevant.";

  const contextLines: string[] = [];
  if (user?.name) contextLines.push("The student's name is " + user.name + ".");
  if (user?.studyField) contextLines.push("Their field of study / year is: " + user.studyField + ". Tailor explanations to this level.");

  const systemPrompt = contextLines.length ? basePrompt + "\n\n" + contextLines.join(" ") : basePrompt;

  const activeModel = model || "gemini-3.6-flash";

  let lastUserParts: object[] = [];

  if (attachmentUrl) {
    try {
      const filePath = urlToFilePath(attachmentUrl);
      const fileBuffer = await readFile(filePath);
      const base64Data = fileBuffer.toString("base64");
      lastUserParts.push({ inlineData: { mimeType: attachmentType, data: base64Data } });
    } catch {
      // file missing, skip
    }
  }

  if (content?.trim()) {
    lastUserParts.push({ text: content });
  }

  if (lastUserParts.length === 0) lastUserParts = [{ text: "(no content)" }];

  const geminiHistory = recentHistory.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  geminiHistory.push({ role: "user", parts: lastUserParts } as any);

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      const encoder = new TextEncoder();

      try {
        const result = await ai.models.generateContentStream({
          model: activeModel,
          contents: geminiHistory,
          config: { systemInstruction: systemPrompt },
        });

        for await (const chunk of result) {
          const text = chunk.text || "";
          if (text) {
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        await prisma.message.create({
          data: { chatId: id, role: "assistant", content: fullText },
        });
        await prisma.chat.update({ where: { id }, data: { updatedAt: new Date() } });
        await prisma.usageLog.create({
          data: { userId: session.user?.id as string, model: activeModel },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const isRateLimit = message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("resource_exhausted");
        const isOverloaded = message.includes("503") || message.toLowerCase().includes("overloaded") || message.toLowerCase().includes("unavailable");

        const errorText = isRateLimit
          ? "\n\n__ERROR__:You have hit the free usage limit for today. Try again later."
          : isOverloaded
          ? "\n\n__ERROR__:Gemini servers are busy right now. Try again in a moment."
          : "\n\n__ERROR__:Something went wrong generating a response. Please try again.";

        controller.enqueue(encoder.encode(errorText));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}