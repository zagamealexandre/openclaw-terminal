import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";

import { addEntryAction, updateThreadAction } from "@/app/actions";
import { authOptions } from "@/lib/auth";
import { formatFullDate } from "@/lib/date";
import { getThreadById } from "@/lib/db";
import { THREAD_STATUSES, THREAD_TYPES } from "@/lib/types";

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/sign-in");
  }

  const thread = await getThreadById({ id: params.id, ownerEmail: session.user.email });
  if (!thread) {
    notFound();
  }

  return (
    <div className="bg-canvas min-h-screen">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-12">
        <Link href="/" className="text-sm text-black/50 underline decoration-dotted">
          ← Back to archive
        </Link>
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">{thread.type}</p>
          <h1 className="font-serif-alt text-4xl leading-tight text-ink">{thread.title}</h1>
          <p className="text-sm text-black/55">{thread.summary || "No summary yet."}</p>
          <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.4em] text-black/40">
            <span>{thread.entries.length} entries</span>
            <span>Opened {formatFullDate(thread.createdAt)}</span>
            <span>Updated {formatFullDate(thread.updatedAt)}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8">
            <EntryComposer threadId={thread.id} />
            <div className="space-y-4 rounded-[32px] border border-black/5 bg-white/80 p-6">
              {thread.entries.length === 0 ? (
                <p className="text-sm text-black/50">No entries yet.</p>
              ) : (
                thread.entries.map((entry) => (
                  <div key={entry.id} className="rounded-3xl border border-black/5 bg-white/90 p-5">
                    <div className="flex flex-wrap items-center justify-between text-[11px] uppercase tracking-[0.4em] text-black/40">
                      <span>{entry.role}</span>
                      <span>{entry.kind}</span>
                      <span>{formatFullDate(entry.createdAt)}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-black/75">{entry.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <aside className="space-y-6">
            <div className="rounded-[32px] border border-black/5 bg-white/80 p-6">
              <h2 className="text-sm uppercase tracking-[0.4em] text-black/45">Thread metadata</h2>
              <ThreadMetaForm thread={thread} />
            </div>
            {thread.tags.length > 0 && (
              <div className="rounded-[32px] border border-black/5 bg-white/80 p-6">
                <p className="text-sm uppercase tracking-[0.4em] text-black/45">Tags</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-black/55"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ThreadMetaForm({
  thread,
}: {
  thread: Awaited<ReturnType<typeof getThreadById>>;
}) {
  if (!thread) return null;
  return (
    <form action={updateThreadAction} className="mt-4 space-y-4">
      <input type="hidden" name="threadId" defaultValue={thread.id} />
      <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Title
        <input name="title" defaultValue={thread.title} className="mt-2 w-full" />
      </label>
      <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Summary
        <textarea name="summary" defaultValue={thread.summary ?? ""} className="mt-2 w-full" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Type
          <select name="type" defaultValue={thread.type} className="mt-2 w-full">
            {THREAD_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Status
          <select name="status" defaultValue={thread.status} className="mt-2 w-full">
            {THREAD_STATUSES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Tags
        <input
          name="tags"
          defaultValue={thread.tags.join(", ")}
          placeholder="comma separated"
          className="mt-2 w-full"
        />
      </label>
      <button type="submit" className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
        Save changes
      </button>
    </form>
  );
}

function EntryComposer({ threadId }: { threadId: string }) {
  return (
    <form action={addEntryAction} className="rounded-[32px] border border-black/5 bg-white/85 p-6">
      <input type="hidden" name="threadId" defaultValue={threadId} />
      <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Add entry
        <textarea
          name="content"
          placeholder="Field notes, reflections, or decisions"
          className="mt-2 w-full"
          required
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Role
          <select name="role" defaultValue="owner" className="mt-2">
            <option value="owner">Owner</option>
            <option value="assistant">Assistant</option>
            <option value="note">Note</option>
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.4em] text-black/40">Kind
          <select name="kind" defaultValue="message" className="mt-2">
            <option value="message">Message</option>
            <option value="context">Context</option>
            <option value="decision">Decision</option>
          </select>
        </label>
        <button
          type="submit"
          className="ml-auto rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          Save entry
        </button>
      </div>
    </form>
  );
}

