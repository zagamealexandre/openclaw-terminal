import { sql } from "@vercel/postgres";
import { cache } from "react";
import { randomUUID } from "node:crypto";

import type { EntryKind, EntryRole, ThreadStatus, ThreadType } from "@/lib/types";

if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

export interface ThreadRecord {
  id: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  summary: string | null;
  tags: string[];
  owner_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface ThreadListItem {
  id: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  summary: string | null;
  tags: string[];
  ownerEmail: string;
  createdAt: Date;
  updatedAt: Date;
  entryCount: number;
  lastEntry: {
    content: string;
    created_at: string;
    role: EntryRole;
    kind: EntryKind;
  } | null;
}

export interface EntryRecord {
  id: string;
  thread_id: string;
  role: EntryRole;
  kind: EntryKind;
  content: string;
  created_at: Date;
}

export type ChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

export interface ChatMessageRecord {
  id: string;
  ownerEmail: string;
  role: "user" | "assistant";
  content: string;
  attachments: ChatAttachment[];
  createdAt: Date;
}

const init = cache(async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS threads (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      type text NOT NULL DEFAULT 'idea',
      status text NOT NULL DEFAULT 'active',
      summary text,
      tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      owner_email text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id uuid PRIMARY KEY,
      thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'owner',
      kind text NOT NULL DEFAULT 'message',
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS entries_thread_id_idx ON entries(thread_id);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id uuid PRIMARY KEY,
      owner_email text NOT NULL,
      role text NOT NULL,
      content text NOT NULL,
      attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`
    ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS chat_messages_owner_email_idx ON chat_messages(owner_email, created_at);
  `;
});

export async function ensureDatabase() {
  await init();
}

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((item) => `${item}`);
  try {
    const parsed = JSON.parse(raw as string);
    if (Array.isArray(parsed)) return parsed.map((item) => `${item}`);
  } catch {
    return [];
  }
  return [];
}

export async function listThreads({
  ownerEmail,
  search,
  status,
  type,
}: {
  ownerEmail: string;
  search?: string;
  status?: ThreadStatus | "all";
  type?: ThreadType | "all";
}): Promise<ThreadListItem[]> {
  await ensureDatabase();

  const values: (string | number)[] = [ownerEmail];
  const conditions: string[] = ["owner_email = $1"];
  let paramIndex = 2;

  if (status && status !== "all") {
    conditions.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex += 1;
  }

  if (type && type !== "all") {
    conditions.push(`type = $${paramIndex}`);
    values.push(type);
    paramIndex += 1;
  }

  if (search?.trim()) {
    const placeholder = `$${paramIndex}`;
    const searchValue = `%${search.trim()}%`;
    conditions.push(`(
      title ILIKE ${placeholder} OR
      summary ILIKE ${placeholder} OR
      EXISTS (
        SELECT 1
        FROM entries e
        WHERE e.thread_id = threads.id AND e.content ILIKE ${placeholder}
      )
    )`);
    values.push(searchValue);
    paramIndex += 1;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      threads.*,
      (
        SELECT json_build_object(
          'content', e.content,
          'created_at', e.created_at,
          'role', e.role,
          'kind', e.kind
        )
        FROM entries e
        WHERE e.thread_id = threads.id
        ORDER BY e.created_at DESC
        LIMIT 1
      ) AS last_entry,
      (
        SELECT COUNT(*)::int FROM entries e WHERE e.thread_id = threads.id
      ) AS entry_count
    FROM threads
    ${whereClause}
    ORDER BY threads.updated_at DESC;
  `;

  const result = await sql.query(query, values);

  return result.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    type: row.type as ThreadType,
    status: row.status as ThreadStatus,
    summary: (row.summary as string) ?? null,
    tags: parseTags(row.tags),
    ownerEmail: row.owner_email as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    lastEntry: row.last_entry as
      | {
          content: string;
          created_at: string;
          role: EntryRole;
          kind: EntryKind;
        }
      | null,
    entryCount: (row.entry_count as number) ?? 0,
  }));
}

export async function getThreadById({
  id,
  ownerEmail,
}: {
  id: string;
  ownerEmail: string;
}) {
  await ensureDatabase();
  const threadResult = await sql`
    SELECT * FROM threads WHERE id = ${id} AND owner_email = ${ownerEmail} LIMIT 1;
  `;

  if (threadResult.rowCount === 0) {
    return null;
  }

  const threadRow = threadResult.rows[0];

  const entriesResult = await sql`
    SELECT * FROM entries WHERE thread_id = ${id} ORDER BY created_at ASC;
  `;

  return {
    id: threadRow.id as string,
    title: threadRow.title as string,
    type: threadRow.type as ThreadType,
    status: threadRow.status as ThreadStatus,
    summary: (threadRow.summary as string) ?? null,
    tags: parseTags(threadRow.tags),
    ownerEmail: threadRow.owner_email as string,
    createdAt: new Date(threadRow.created_at as string),
    updatedAt: new Date(threadRow.updated_at as string),
    entries: entriesResult.rows.map((entry) => ({
      id: entry.id as string,
      threadId: entry.thread_id as string,
      role: entry.role as EntryRole,
      kind: entry.kind as EntryKind,
      content: entry.content as string,
      createdAt: new Date(entry.created_at as string),
    })),
  };
}

export async function verifyThreadOwnership({
  threadId,
  ownerEmail,
}: {
  threadId: string;
  ownerEmail: string;
}) {
  await ensureDatabase();
  const result = await sql`
    SELECT 1 FROM threads WHERE id = ${threadId} AND owner_email = ${ownerEmail} LIMIT 1;
  `;
  return (result.rowCount ?? 0) > 0;
}

export async function createThread({
  ownerEmail,
  title,
  type,
  status,
  summary,
  tags,
}: {
  ownerEmail: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  summary?: string | null;
  tags?: string[];
}) {
  await ensureDatabase();
  const id = randomUUID();
  await sql`
    INSERT INTO threads (id, owner_email, title, type, status, summary, tags)
    VALUES (${id}, ${ownerEmail}, ${title}, ${type}, ${status}, ${summary ?? null},
      ${JSON.stringify(tags ?? [])}::jsonb)
  `;
  return id;
}

export async function addEntry({
  threadId,
  content,
  role,
  kind,
}: {
  threadId: string;
  content: string;
  role: EntryRole;
  kind: EntryKind;
}) {
  await ensureDatabase();
  const id = randomUUID();
  await sql`
    INSERT INTO entries (id, thread_id, role, kind, content)
    VALUES (${id}, ${threadId}, ${role}, ${kind}, ${content})
  `;
  await sql`
    UPDATE threads SET updated_at = now() WHERE id = ${threadId}
  `;
  return id;
}

export async function updateThreadMetadata({
  threadId,
  ownerEmail,
  title,
  summary,
  status,
  type,
  tags,
}: {
  threadId: string;
  ownerEmail: string;
  title: string;
  summary: string | null;
  status: ThreadStatus;
  type: ThreadType;
  tags: string[];
}) {
  await ensureDatabase();
  await sql`
    UPDATE threads
    SET
      title = ${title},
      summary = ${summary},
      status = ${status},
      type = ${type},
      tags = ${JSON.stringify(tags)}::jsonb,
      updated_at = now()
    WHERE id = ${threadId} AND owner_email = ${ownerEmail}
  `;
}

export async function addChatMessage({
  ownerEmail,
  role,
  content,
  attachments = [],
}: {
  ownerEmail: string;
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
}) {
  await ensureDatabase();
  const id = randomUUID();
  await sql`
    INSERT INTO chat_messages (id, owner_email, role, content, attachments)
    VALUES (${id}, ${ownerEmail}, ${role}, ${content}, ${JSON.stringify(attachments)}::jsonb)
  `;
  return id;
}

export async function listChatMessages({
  ownerEmail,
  limit = 50,
}: {
  ownerEmail: string;
  limit?: number;
}): Promise<ChatMessageRecord[]> {
  await ensureDatabase();
  const result = await sql`
    SELECT *
    FROM chat_messages
    WHERE owner_email = ${ownerEmail}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((row) => ({
    id: row.id as string,
    ownerEmail: row.owner_email as string,
    role: row.role as "user" | "assistant",
    content: row.content as string,
    attachments: parseAttachments(row.attachments),
    createdAt: new Date(row.created_at as string),
  }));
}

function parseAttachments(raw: unknown): ChatAttachment[] {
  if (!raw) return [];
  try {
    const parsed = Array.isArray(raw) ? raw : JSON.parse(raw as string);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((att) => ({
        id: `${att.id ?? randomUUID()}`,
        name: `${att.name ?? "attachment"}`,
        type: `${att.type ?? "application/octet-stream"}`,
        size: Number(att.size ?? 0),
        dataUrl: `${att.dataUrl ?? ""}`,
      }))
      .filter((att) => Boolean(att.dataUrl));
  } catch (err) {
    console.error("Failed to parse attachments", err);
    return [];
  }
}
