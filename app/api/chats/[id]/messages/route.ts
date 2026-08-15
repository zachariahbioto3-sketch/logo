import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

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
    data: { chatId: id, role: "user", content },
  });

  if (chat.messages.length === 0) {
    const title = content.slice(0, 50);
    await prisma.chat.update({ where: { id }, data: { title } });
  }

  const history = [...chat.messages, { role: "user", content }];

  const basePrompt =
    chat.agent?.systemPrompt ||
    "You are Nicole, a study assistant for medical students. Be clear, accurate, and educational. Remind users this is a study aid, not medical advice for real patients when relevant.";

  const contextLines = [];
  if (user?.name) contextLines.push(`The student's name is ${user.name}.`);
  if (user?.studyField) contextLines.push(`Their field of study / year is: ${user.studyField}. Tailor explanations, terminology depth, and examples to this level and specialty when relevant.`);

  const systemPrompt = contextLines.length
    ? `${basePrompt}\n\n${contextLines.join(" ")}`
    : basePrompt;

  const geminiHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      const encoder = new TextEncoder();

      try {
        const result = await ai.models.generateContentStream({
          model: "gemini-3.6-flash",
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
      } catch (err) {
        controller.enqueue(encoder.encode("\n\n[Error generating response]"));
        console.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
