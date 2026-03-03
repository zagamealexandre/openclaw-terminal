
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';

const routes = [
  { href: '/terminal', label: 'totoro shell' },
  { href: '/projects', label: 'projects' },
  { href: '/readme', label: 'readme' },
  { href: '/learnings', label: 'learnings' },
  { href: '/config', label: 'configuration' },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="crt-frame home-frame">
      <div className="crt-shell home-shell">
        <div className="crt-glass">
          <div className="crt-content home-content">
            <header className="home-header">
              <div>
                <p>CONTEXT VAULT // root console</p>
                <h1>choose destination</h1>
              </div>
            </header>
            <ul className="home-menu">
              {routes.map((route) => (
                <li key={route.href}>
                  <Link href={route.href} className="home-link" style={{ color: 'var(--theme)' }}>
                    <span>{route.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="home-footer">
              <SignOutButton className="terminal-button" />
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
