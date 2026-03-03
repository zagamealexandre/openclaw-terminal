export type ProjectConfig = {
  slug: string;
  title: string;
  subtitle: string;
  folderHint: string;
};

export const PROJECTS: ProjectConfig[] = [
  {
    slug: "rebtel-design-patterns",
    title: "Rebtel Design Patterns",
    subtitle: "Design system + prototype playground for Rebtel 3.0",
    folderHint: "~/.../rebtel-design-patterns",
  },
  {
    slug: "retro-computer-website",
    title: "Retro Computer Website",
    subtitle: "Marketing site with CRT vibes + WebGL flourishes",
    folderHint: "~/.../retro-computer-website",
  },
  {
    slug: "retro-desktop-ui",
    title: "Retro Desktop UI",
    subtitle: "Window manager prototype with draggable panes",
    folderHint: "~/.../retro-desktop-ui",
  },
  {
    slug: "context-vault",
    title: "Context Vault",
    subtitle: "This workspace (Next.js + NextAuth + context archive)",
    folderHint: "~/.../context-vault",
  },
];
