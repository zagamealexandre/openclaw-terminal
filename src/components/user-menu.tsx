"use client";

import { signOut } from "next-auth/react";

export function UserMenu({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
      className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-left text-sm text-black/70 transition hover:border-black/40"
    >
      <span className="block text-xs uppercase tracking-[0.4em] text-black/40">Signed in</span>
      <span className="block font-medium text-black/80">{name || "Account"}</span>
      <span className="text-xs text-black/50">{email}</span>
    </button>
  );
}
