import type { ChatAttachment } from "@/lib/db";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type OpenClawOptions = {
  message: string;
  attachments?: ChatAttachment[];
};

const DEFAULT_BINARY = "openclaw";
const ATTACHMENT_INLINE_LIMIT = Number(process.env.OPENCLAW_ATTACHMENT_INLINE_LIMIT ?? 200000);

function buildMessageWithAttachments(message: string, attachments?: ChatAttachment[]) {
  if (!attachments || attachments.length === 0) {
    return message.trim() ? message : "(attachment uploaded)";
  }

  const header = message.trim() ? message : "(attachment uploaded)";
  const details = attachments
    .map((att, idx) => {
      const descriptor = `${idx + 1}. ${att.name} (${att.type || "unknown"}, ${Math.round(att.size / 102.4) / 10} KB)`;
      const data = att.dataUrl || "";
      if (!data) return descriptor;
      if (data.length <= ATTACHMENT_INLINE_LIMIT) {
        return `${descriptor}\n${data}`;
      }
      const slice = data.slice(0, ATTACHMENT_INLINE_LIMIT);
      return `${descriptor}\n${slice}… [truncated ${data.length - ATTACHMENT_INLINE_LIMIT} chars]`;
    })
    .join("\n\n");

  return `${header}\n\n[Attachments]\n${details}`;
}

function pickJsonString(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {}

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).reverse();
  for (const line of lines) {
    try {
      return JSON.parse(line);
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const slice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  return null;
}

function extractReply(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.reply === "string") return record.reply;
  if (typeof record.response === "string") return record.response;

  const messages = Array.isArray(record.messages) ? record.messages : null;
  if (messages) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const candidate = extractTextFromMessage(messages[i]);
      if (candidate) return candidate;
    }
  }

  if (typeof record.message === "string") return record.message;
  return null;
}

function extractTextFromMessage(entry: unknown): string | null {
  if (!entry || typeof entry !== "object") return null;
  const obj = entry as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message.trim()) {
    return obj.message.trim();
  }
  if (typeof obj.content === "string" && obj.content.trim()) {
    return obj.content.trim();
  }
  return null;
}

export async function sendViaOpenClaw({ message, attachments }: OpenClawOptions) {
  const binary = process.env.OPENCLAW_BINARY || DEFAULT_BINARY;
  const to = process.env.OPENCLAW_CHAT_TO;
  if (!to) {
    throw new Error("OPENCLAW_CHAT_TO is not set; cannot deliver chat message");
  }

  const decoratedMessage = buildMessageWithAttachments(message, attachments);
  const args = ["agent", "--to", to, "--message", decoratedMessage];

  const channel = process.env.OPENCLAW_CHAT_CHANNEL;
  if (channel) {
    args.push("--channel", channel);
  }

  const replyTo = process.env.OPENCLAW_CHAT_REPLY_TO;
  if (replyTo) {
    args.push("--reply-to", replyTo);
  }

  const replyAccount = process.env.OPENCLAW_CHAT_REPLY_ACCOUNT;
  if (replyAccount) {
    args.push("--reply-account", replyAccount);
  }

  const deliverFlag = process.env.OPENCLAW_CHAT_DELIVER;
  if (deliverFlag !== "false") {
    args.push("--deliver");
  }

  const jsonFlag = process.env.OPENCLAW_CHAT_JSON;
  if (jsonFlag !== "false") {
    args.push("--json");
  }

  const thinking = process.env.OPENCLAW_CHAT_THINKING;
  if (thinking) {
    args.push("--thinking", thinking);
  }

  const timeoutValue = process.env.OPENCLAW_CHAT_TIMEOUT;
  if (timeoutValue) {
    args.push("--timeout", timeoutValue);
  }

  const { stdout } = await execFileAsync(binary, args, {
    env: process.env,
    maxBuffer: 2 * 1024 * 1024,
  });

  const parsed = pickJsonString(stdout);
  if (!parsed) {
    throw new Error("OpenClaw agent call succeeded but returned no JSON payload");
  }

  const reply = extractReply(parsed);
  if (!reply) {
    throw new Error("OpenClaw agent call returned JSON but no reply field");
  }

  return reply;
}
