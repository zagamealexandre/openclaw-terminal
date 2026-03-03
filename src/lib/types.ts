export const THREAD_TYPES = ["idea", "project", "discussion", "context"] as const;
export type ThreadType = (typeof THREAD_TYPES)[number];

export const THREAD_STATUSES = ["active", "backlog", "paused", "archived"] as const;
export type ThreadStatus = (typeof THREAD_STATUSES)[number];

export const ENTRY_ROLES = ["owner", "assistant", "note"] as const;
export type EntryRole = (typeof ENTRY_ROLES)[number];

export const ENTRY_KINDS = ["message", "context", "decision"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];
