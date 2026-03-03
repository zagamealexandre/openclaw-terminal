"use client";

import Link from "next/link";
import { useState } from "react";

import { useRetroSound } from "@/lib/useRetroSound";

type ProjectDoc = {
  slug: string;
  title: string;
  subtitle: string;
  folderHint: string;
  content: string;
};

export function ProjectsDesktop({ projects }: { projects: ProjectDoc[] }) {
  const [active, setActive] = useState<ProjectDoc | null>(null);
  const playSound = useRetroSound();

  const handleOpen = (project: ProjectDoc) => {
    setActive(project);
    playSound({ frequency: 720, duration: 0.14 });
  };

  return (
    <div className="projects-screen">
      <div className="projects-pane">
        <header className="projects-header">
          <div>
            <p className="projects-eyebrow">Project Shelf</p>
            <h1>Double-click to view a README</h1>
            <p className="projects-subcopy">Live snapshot of the major repos we are actively shaping.</p>
          </div>
          <div className="projects-actions">
            <Link href="/" className="retro-back-button">← Back home</Link>
            {active && (
              <button type="button" className="retro-back-button" onClick={() => setActive(null)}>
                Close document
              </button>
            )}
          </div>
        </header>

        <div className="projects-desktop" role="list">
          {projects.map((project) => (
            <button
              key={project.slug}
              type="button"
              role="listitem"
              className="project-folder"
              onDoubleClick={() => handleOpen(project)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleOpen(project);
                }
              }}
            >
              <span aria-hidden className="project-folder__icon">
                📁
              </span>
              <span className="project-folder__title">{project.title}</span>
              <span className="project-folder__subtitle">{project.subtitle}</span>
              <span className="project-folder__path">{project.folderHint}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="projects-viewer">
        {active ? (
          <div className="projects-document" key={active.slug}>
            <header>
              <p className="projects-eyebrow">README</p>
              <h2>{active.title}</h2>
              <p>{active.subtitle}</p>
              <p className="projects-path">{active.folderHint}</p>
            </header>
            <pre>{active.content.trim() || "README is empty."}</pre>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
