import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";

import { authOptions } from "@/lib/auth";
import { ConfigCommandGrid } from "@/components/config-command-grid";

const commandGroups = [
  {
    title: "Daily drivers",
    items: [
      {
        name: "openclaw dashboard",
        description: "Open the Control UI in your browser (good for status, sessions, and quick actions).",
      },
      {
        name: "openclaw tui",
        description: "Terminal UI connected to the Gateway — fast way to inspect and interact.",
      },
      {
        name: "openclaw status",
        description: "Quick overview of channel health + recent session recipients.",
      },
    ],
  },
  {
    title: "Gateway",
    items: [
      {
        name: "openclaw gateway status",
        description: "Check gateway daemon status.",
      },
      {
        name: "openclaw gateway restart",
        description: "Restart the gateway service (use when channels behave weirdly).",
      },
      {
        name: "openclaw logs --follow",
        description: "Tail gateway logs via RPC.",
      },
      {
        name: "openclaw doctor",
        description: "Run health checks + common fixes for gateway/channels.",
      },
    ],
  },
  {
    title: "Messaging & agent turns",
    items: [
      {
        name: "openclaw agent --to <target> --channel <whatsapp|telegram> --message \"...\" --deliver",
        description: "Run one agent turn and deliver it through a specific channel (required when multiple channels exist).",
      },
      {
        name: "openclaw message send --channel <whatsapp|telegram> --target <id> --message \"...\"",
        description: "Send a plain message via a channel (no agent reasoning).",
      },
      {
        name: "openclaw directory --help",
        description: "Look up contact/group IDs for channels that support it.",
      },
    ],
  },
  {
    title: "Models",
    items: [
      {
        name: "openclaw models status",
        description: "Show current default model, fallbacks, aliases, and configured models.",
      },
      {
        name: "openclaw models set <model>",
        description: "Set the primary (default) model used for new turns/sessions.",
      },
      {
        name: "openclaw models aliases list",
        description: "List model aliases.",
      },
      {
        name: "openclaw models aliases add <alias> <model>",
        description: "Add/update an alias (you may need to remove first if it already exists).",
      },
      {
        name: "openclaw models aliases remove <alias>",
        description: "Remove an alias so you can redefine it.",
      },
    ],
  },
];

export default async function ConfigHelpPage() {
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
            <h1>Configuration Cheatsheet</h1>
            <p className="readme-subcopy">
              Handy OpenClaw terminal commands. Keep this page short + practical — add only commands you actually reach for.
            </p>
          </div>
          <Link href="/" className="retro-back-button">
            ← Back home
          </Link>
        </header>

        <ConfigCommandGrid groups={commandGroups} />
      </div>
    </div>
  );
}
