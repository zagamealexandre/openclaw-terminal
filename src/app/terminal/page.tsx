
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";

import TerminalShell from "./terminal-shell";
import { authOptions } from "@/lib/auth";

export default async function TerminalPage() {
  noStore();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/sign-in");
  }

  return <TerminalShell userId={session.user.email} />;
}
