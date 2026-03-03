'use client';
import { signOut } from 'next-auth/react';
export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type='button'
      className={className ?? 'terminal-button'}
      onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
    >
      sign out
    </button>
  );
}
