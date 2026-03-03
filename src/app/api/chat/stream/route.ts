
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";

import { authOptions } from "@/lib/auth";
import { addChatMessage } from "@/lib/db";
import { parseIncomingPayload } from "../utils";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
const MODEL = "gpt-4o-mini";
const SYSTEM_PROMPT = `You are Rabbies, a product-savvy AI sparring partner with sharp opinions and a friendly tone. Keep replies concise but insightful, mirroring the style used in the Context Vault dashboard.`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
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

  if (!openai) {
    return NextResponse.json({ error: "Streaming requires OPENAI_API_KEY" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (line: string) => controller.enqueue(encoder.encode(`data: ${line}

`));
      try {
        send("CONTACTING RABBIES…");

        let assistantReply = "";
        const history = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "user" as const, content: message },
        ];

        const completion = await openai.chat.completions.create({
          model: MODEL,
          messages: history,
          stream: true,
          temperature: 0.7,
        });

        for await (const chunk of completion) {
          const content = chunk.choices?.[0]?.delta?.content || "";
          if (content) {
            assistantReply += content;
            send(content);
          }
        }

        await addChatMessage({ ownerEmail: session.user.email, role: "assistant", content: assistantReply || "(no response)" });
        send("[DONE]");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(`error: ${message}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
