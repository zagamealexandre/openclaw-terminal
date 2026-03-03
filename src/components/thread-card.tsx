import Link from "next/link";

import { timeAgo } from "@/lib/date";
import type { ThreadListItem } from "@/lib/db";
import type { ThreadStatus, ThreadType } from "@/lib/types";

const typeLabels: Record<ThreadType, string> = {
  idea: "Idea",
  project: "Project",
  discussion: "Discussion",
  context: "Context",
};

const statusLabels: Record<ThreadStatus, string> = {
  active: "Active",
  backlog: "On Hold",
  paused: "Paused",
  archived: "Archived",
};

export function ThreadCard({ thread }: { thread: ThreadListItem }) {
  return (
    <Link
      href={`/threads/${thread.id}`}
      className="group block rounded-[32px] border border-black/5 bg-white/80 p-6 backdrop-blur transition hover:border-black/20 hover:-translate-y-1"
      style={{ boxShadow: "0 20px 45px rgba(31, 28, 23, 0.08)" }}
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-black/40">
        <span>{typeLabels[thread.type]}</span>
        <span>{statusLabels[thread.status]}</span>
      </div>
      <h3 className="font-serif-alt mt-4 text-2xl leading-snug text-ink transition group-hover:translate-x-1">
        {thread.title}
      </h3>
      <p className="mt-4 text-sm text-black/60">
        {thread.summary || "No summary captured yet."}
      </p>
      {thread.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-black/50"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-6 flex items-center justify-between text-xs text-black/45">
        <span>{thread.entryCount} notes</span>
        <span>Updated {timeAgo(thread.updatedAt)}</span>
      </div>
    </Link>
  );
}
