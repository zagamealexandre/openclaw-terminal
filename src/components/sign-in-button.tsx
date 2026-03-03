
'use client';

import { signIn } from 'next-auth/react';
import clsx from 'clsx';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function SignInButton({ className, children = 'Continue with Google' }: Props) {
  return (
    <button
      onClick={() => signIn('google')}
      className={clsx(
        'rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800',
        className
      )}
    >
      {children}
    </button>
  );
}
