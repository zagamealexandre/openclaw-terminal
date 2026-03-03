import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const instructionGroups = [
  {
    title: "Mission & Role",
    body: [
      "Support Alex (PM at Rebtel) with PM workstreams — note-taking, ideation, drafts, research, and prototypes.",
      "Default to the Totoro persona: a candid, detail-obsessed sparring partner with strong product/design instincts.",
      "Favor Next.js for prototypes unless told otherwise; treat it as the baseline stack for new builds.",
    ],
  },
  {
    title: "Prototype Delivery Workflow",
    body: [
      "When starting any prototype, create a folder under `~/Documents/new Project` using `YYYYMMDD-feature-name` (e.g., `20260303-topup-flow`).",
      "Mirror that folder at the repo root with the same name and include a README that bundles the PRD + Jira ticket.",
      "After code lands on GitHub, email the PRD + Jira ticket and CC `alexandre.zagame@rebtel.com` so stakeholders get notified.",
    ],
  },
  {
    title: "Documentation Templates",
    body: [
      "PRD template: `rebtel-design-patterns/templates/rebtel-prd.md`. Covers Understand → Define → Explore → Validate/Scope → Rollout → Appendix.",
      "Jira ticket template: `rebtel-design-patterns/templates/rebtel-jira-ticket.md`. Output exactly the mandated sections below, even if content is TBD:",
    ],
  },
  {
    title: "Design System & Patterns Repo",
    body: [
      "Main repository: https://github.com/zagamealexandre/rebtel-design-patterns (cloned locally at `~/…/rebtel-design-patterns`).",
      "Use the Rebtel 3.0 design system documented in `design_sytems.md`: mobile-only (390px), brand-first styling, strict spacing tokens, and component hierarchy (atoms → molecules → organisms).",
      "Components, tokens, and reference flows (onboarding, out-of-credit, etc.) live under `rebtel-design-patterns/components`, `styles`, and `templates`.",
    ],
  },
  {
    title: "Operational Notes",
    body: [
      "Learning logs live at `~/.openclaw/workspace/.learnings` and sync into Context Vault → /learnings for transparency.",
      "Self-improvement hook (`openclaw hooks enable self-improvement`) reminds us to capture learnings during bootstrap.",
      "Context Vault is Google-auth protected; keep instructions up to date here so Alex can review without digging through repos.",
    ],
  },
];

const jiraSections = [
  "Background",
  "What → Summary",
  "What → Business Logic",
  "What → 3rd Party Dependencies",
  "What → Design & Copy",
  "What → Naming of new tracking events",
  "Expected outcome → KPI to measure",
  "Expected outcome → Expected impact",
  "Expected outcome → Feature flags and experimentation",
  "When → Go-live date",
  "When → Platform sync",
];

export default async function ReadmePage() {
  noStore();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="readme-screen">
      <div className="readme-container">
        <header className="readme-hero">
          <div>
            <p className="readme-eyebrow">Context Vault</p>
            <h1>Working Agreement & References</h1>
            <p className="readme-subcopy">
              Living instructions from Alex. Follow these whenever we spin up product work, prototypes, or documentation. Update this page when new rules drop.
            </p>
          </div>
          <Link href="/" className="retro-back-button">
            ← Back home
          </Link>
        </header>

        <div className="readme-grid">
          {instructionGroups.map((section) => (
            <article key={section.title} className="readme-card">
              <h2>{section.title}</h2>
              <ul>
                {section.body.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <article className="readme-card readme-wide">
          <h2>Jira Ticket Format (copy/paste order)</h2>
          <p>Every ticket produced via the template must include the sections below, even if the content is `TBD`:</p>
          <ol>
            {jiraSections.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="readme-footnote">
            Template location: <code>rebtel-design-patterns/templates/rebtel-jira-ticket.md</code>. Output must be Markdown-only with no commentary before or after the sections.
          </p>
        </article>
      </div>
    </div>
  );
}
