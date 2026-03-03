
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';

import type { ChatAttachment } from '@/lib/db';

const MAX_UPLOAD_BYTES = Number(process.env.CHAT_IMAGE_MAX_BYTES ?? 10 * 1024 * 1024);
const MAX_ATTACHMENTS = Number(process.env.CHAT_IMAGE_MAX_COUNT ?? 3);
const ALLOWED_ATTACHMENT_PREFIXES = (process.env.CHAT_ALLOWED_ATTACHMENT_PREFIXES ?? 'image/')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

export async function parseIncomingPayload(request: Request): Promise<{ message: string; attachments: ChatAttachment[] }> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('multipart/form-data')) {
    return parseMultipartPayload(request);
  }
  return parseJsonPayload(request);
}

async function parseJsonPayload(request: Request): Promise<{ message: string; attachments: ChatAttachment[] }> {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  return { message, attachments: [] };
}

async function parseMultipartPayload(request: Request): Promise<{ message: string; attachments: ChatAttachment[] }> {
  const formData = await request.formData();
  const messageValue = formData.get('message');
  const message = typeof messageValue === 'string' ? messageValue.trim() : '';

  const files: File[] = [];
  const collect = (value: FormDataEntryValue | null) => {
    if (value instanceof File && value.size > 0) {
      files.push(value);
    }
  };

  collect(formData.get('image'));
  formData.getAll('images').forEach((value) => collect(value));
  formData.getAll('attachments').forEach((value) => collect(value));

  if (files.length > MAX_ATTACHMENTS) {
    throw new Error(`Too many attachments (max ${MAX_ATTACHMENTS})`);
  }

  const attachments: ChatAttachment[] = [];
  for (const file of files) {
    attachments.push(await fileToAttachment(file));
  }

  return { message, attachments };
}

function isMimeAllowed(mime: string) {
  if (ALLOWED_ATTACHMENT_PREFIXES.length === 0) return true;
  return ALLOWED_ATTACHMENT_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

async function fileToAttachment(file: File): Promise<ChatAttachment> {
  const type = file.type || 'application/octet-stream';
  if (!isMimeAllowed(type)) {
    throw new Error(`Unsupported file type: ${type}`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large. Limit is ${Math.round(MAX_UPLOAD_BYTES / 1024)} KB`);
  }
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return {
    id: randomUUID(),
    name: file.name || 'upload',
    type,
    size: file.size,
    dataUrl: `data:${type};base64,${base64}`,
  };
}
