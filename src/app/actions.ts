"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  addEntry,
  createThread,
  updateThreadMetadata,
  verifyThreadOwnership,
} from "@/lib/db";
import {
  ENTRY_KINDS,
  ENTRY_ROLES,
  THREAD_STATUSES,
  THREAD_TYPES,
} from "@/lib/types";

const threadSchema = z.object({
  title: z.string().min(2).max(160),
  type: z.enum(THREAD_TYPES),
  status: z.enum(THREAD_STATUSES),
  summary: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  initialContext: z.string().optional(),
});

const entrySchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1),
  role: z.enum(ENTRY_ROLES),
  kind: z.enum(ENTRY_KINDS),
});

const threadUpdateSchema = z.object({
  threadId: z.string().uuid(),
  title: z.string().min(2).max(160),
  summary: z.string().max(4000).optional().nullable(),
  status: z.enum(THREAD_STATUSES),
  type: z.enum(THREAD_TYPES),
  tags: z.array(z.string()).optional(),
});

async function requireOwnerEmail() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return session.user.email;
}

function parseTagsInput(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function createThreadAction(formData: FormData) {
  const ownerEmail = await requireOwnerEmail();
  const parsed = threadSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    type: formData.get("type")?.toString() ?? "idea",
    status: formData.get("status")?.toString() ?? "active",
    summary: formData.get("summary")?.toString() || null,
    initialContext: formData.get("initialContext")?.toString(),
    tags: parseTagsInput(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error("Invalid thread fields");
  }

  const threadId = await createThread({
    ownerEmail,
    title: parsed.data.title,
    type: parsed.data.type,
    status: parsed.data.status,
    summary: parsed.data.summary,
    tags: parsed.data.tags ?? [],
  });

  if (parsed.data.initialContext?.trim()) {
    await addEntry({
      threadId,
      content: parsed.data.initialContext.trim(),
      role: "owner",
      kind: "context",
    });
  }

  redirect(`/threads/${threadId}`);
}

export async function addEntryAction(formData: FormData) {
  const ownerEmail = await requireOwnerEmail();
  const parsed = entrySchema.safeParse({
    threadId: formData.get("threadId")?.toString() ?? "",
    content: formData.get("content")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "owner",
    kind: formData.get("kind")?.toString() ?? "message",
  });

  if (!parsed.success) {
    throw new Error("Invalid entry fields");
  }

  const ownsThread = await verifyThreadOwnership({
    threadId: parsed.data.threadId,
    ownerEmail,
  });
  if (!ownsThread) {
    throw new Error("Thread not found");
  }

  await addEntry({
    threadId: parsed.data.threadId,
    content: parsed.data.content.trim(),
    role: parsed.data.role,
    kind: parsed.data.kind,
  });

  revalidatePath(`/threads/${parsed.data.threadId}`);
  revalidatePath(`/`);
}

export async function updateThreadAction(formData: FormData) {
  const ownerEmail = await requireOwnerEmail();
  const parsed = threadUpdateSchema.safeParse({
    threadId: formData.get("threadId")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    summary: formData.get("summary")?.toString() || null,
    status: formData.get("status")?.toString() ?? "active",
    type: formData.get("type")?.toString() ?? "idea",
    tags: parseTagsInput(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error("Invalid metadata fields");
  }

  const ownsThread = await verifyThreadOwnership({
    threadId: parsed.data.threadId,
    ownerEmail,
  });
  if (!ownsThread) {
    throw new Error("Thread not found");
  }

  await updateThreadMetadata({
    threadId: parsed.data.threadId,
    ownerEmail,
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    status: parsed.data.status,
    type: parsed.data.type,
    tags: parsed.data.tags ?? [],
  });

  revalidatePath(`/threads/${parsed.data.threadId}`);
  revalidatePath(`/`);
}
