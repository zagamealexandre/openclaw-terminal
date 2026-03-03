import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { addChatMessage, listChatMessages, type ChatAttachment } from "@/lib/db";
import { parseIncomingPayload } from "./utils";
import { sendViaOpenClaw } from "@/lib/openclaw";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
const MODEL = "gpt-4o-mini";
const SYSTEM_PROMPT = `You are Totoro, a product-savvy AI sparring partner with sharp opinions and a friendly tone. Keep replies concise but insightful, mirroring the style used in the Context Vault dashboard.`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await listChatMessages({ ownerEmail: session.user.email, limit: 100 });
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { message: string; attachments: ChatAttachment[] };
  try {
    payload = await parseIncomingPayload(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { message, attachments } = payload;
  if (!message && attachments.length === 0) {
    return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
  }

  await addChatMessage({
    ownerEmail: session.user.email,
    role: "user",
    content: message || "(attachment only)",
    attachments,
  });

  let reply: string | null = null;
  let openclawError: Error | null = null;

  if (process.env.OPENCLAW_CHAT_TO) {
    try {
      reply = await sendViaOpenClaw({ message: message || "(attachment only)", attachments });
    } catch (err) {
      openclawError = err instanceof Error ? err : new Error(String(err));
      console.error("OpenClaw chat failed", openclawError);
    }
  }

  if (!reply) {
    if (!openai) {
      const fallback = openclawError
        ? `OpenClaw bridge failed: ${openclawError.message}`
        : "Assistant wiring requires OPENAI_API_KEY or OPENCLAW_CHAT_TO.";
      await addChatMessage({ ownerEmail: session.user.email, role: "assistant", content: fallback });
      return NextResponse.json({ reply: fallback }, { status: openclawError ? 502 : 500 });
    }

    const history = await listChatMessages({ ownerEmail: session.user.email, limit: 20 });
    const ordered = [...history].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const chatMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...ordered.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      temperature: 0.7,
    });

    reply = completion.choices[0]?.message?.content?.trim() || "(no response)";
  }

  const finalReply = reply ?? "(no response)";
  await addChatMessage({ ownerEmail: session.user.email, role: "assistant", content: finalReply });

  return NextResponse.json({ reply: finalReply });
}

