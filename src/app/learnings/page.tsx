import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { formatFullDate, timeAgo } from "@/lib/date";

const learningFiles = [
  {
    filename: "LEARNINGS.md",
    title: "Learnings",
    description: "Corrections, knowledge gaps, and best practices we want to track.",
  },
  {
    filename: "ERRORS.md",
    title: "Errors",
    description: "Command failures, stack traces, and exception details for debugging.",
  },
  {
    filename: "FEATURE_REQUESTS.md",
    title: "Feature Requests",
    description: "User-requested capabilities or improvements worth considering.",
  },
];

async function getLogFile(filepath: string) {
  const absolutePath = path.join(process.cwd(), "learnings", filepath);
  try {
    const [content, stats] = await Promise.all([
      fs.readFile(absolutePath, "utf-8"),
      fs.stat(absolutePath),
    ]);
    return {
      content,
      lastUpdated: stats.mtime,
    };
  } catch (error) {
    return {
      content: "",
      lastUpdated: null,
    };
  }
}

export default async function LearningsPage() {
  noStore();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/sign-in");
  }

  const logs = await Promise.all(
    learningFiles.map(async (file) => {
      const data = await getLogFile(file.filename);
      return {
        ...file,
        ...data,
      };
    })
  );

  return (
    <div className="learnings-screen">
      <div className="learnings-container">
        <div className="learnings-header">
          <div>
            <p className="learnings-eyebrow">Context Vault</p>
            <h1>Learning Logs</h1>
            <p className="learnings-subcopy">
              Live mirror of the assistant's `.learnings` notes. This is read-only for now—dip in anytime to review corrections, incidents, or feature ideas.
            </p>
          </div>
          <Link href="/" className="retro-back-button">
            ← Back home
          </Link>
        </div>

        <div className="learnings-grid">
          {logs.map((log) => (
            <article key={log.filename} className="learning-card">
              <header>
                <p className="learning-card__filename">{log.filename}</p>
                <h2>{log.title}</h2>
                <p className="learning-card__description">{log.description}</p>
                <p className="learning-card__timestamp">
                  {log.lastUpdated ? (
                    <>
                      Updated {formatFullDate(log.lastUpdated)}
                      <span> · </span>
                      {timeAgo(log.lastUpdated)}
                    </>
                  ) : (
                    "No updates yet"
                  )}
                </p>
              </header>

              <details className="learning-card__details" open>
                <summary>View contents</summary>
                <pre>{log.content?.trim() || "Nothing recorded yet."}</pre>
              </details>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
