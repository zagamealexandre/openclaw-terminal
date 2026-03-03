
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { SignInButton } from '@/components/sign-in-button';
import { authOptions } from '@/lib/auth';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    redirect('/');
  }

  return (
    <div className="crt-frame auth-frame">
      <div className="crt-shell auth-shell">
        <div className="crt-glass">
          <div className="crt-content auth-content">
            <div className="auth-header">
              <p>CONTEXT VAULT</p>
              <h1>authenticate access</h1>
              <p className="auth-subcopy">restricted terminal · approved accounts only</p>
            </div>
            <div className="auth-button">
              <SignInButton className="terminal-button auth-signin">access terminal</SignInButton>
            </div>

          </div>
          <div className="crt-scanlines" aria-hidden />
          <div className="crt-vignette" aria-hidden />
          <div className="crt-noise" aria-hidden />
          <div className="crt-reflection" aria-hidden />
        </div>
      </div>
    </div>
  );
}
