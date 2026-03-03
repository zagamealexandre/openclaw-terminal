import fs from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { PROJECTS } from "@/data/projects";
import { ProjectsDesktop } from "@/components/projects-desktop";

async function loadProjectReadme(slug: string) {
  const readmePath = path.join(process.cwd(), "projects", slug, "README.md");
  try {
    const content = await fs.readFile(readmePath, "utf-8");
    return content;
  } catch {
    return "README not found.";
  }
}

export default async function ProjectsPage() {
  noStore();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/sign-in");
  }

  const docs = await Promise.all(
    PROJECTS.map(async (project) => ({
      ...project,
      content: await loadProjectReadme(project.slug),
    }))
  );

  return (
    <ProjectsDesktop projects={docs} />
  );
}
