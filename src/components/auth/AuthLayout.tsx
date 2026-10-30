import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footerCopy?: string;
  eyebrow?: string;
}

/** Shared, responsive shell for staff and patient authentication routes. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footerCopy = 'Secure access to your care information.',
  eyebrow = 'CAREvia HEALTH',
}: AuthLayoutProps) {
  return (
    <div className="auth-shell relative isolate flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,104,55,0.12),_transparent_48%),radial-gradient(ellipse_at_bottom_right,_rgba(20,83,45,0.08),_transparent_42%)]"
      />

      <header className="border-b border-emerald-950/10 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <span className="auth-brand-mark flex h-10 w-10 items-center justify-center shadow-sm">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-sm font-extrabold tracking-[0.14em] text-slate-800">
            CAREVIA HEALTH
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <section aria-labelledby="auth-page-title" className="w-full max-w-md">
          <div className="auth-card p-6 sm:p-8">
            <div className="auth-brand-wash mb-6 inline-flex items-center gap-3 rounded-2xl px-4 py-3">
              <span className="auth-brand-mark flex h-9 w-9 items-center justify-center">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="auth-eyebrow text-xs font-extrabold uppercase tracking-[0.16em]">
                {eyebrow}
              </span>
            </div>

            <h1 id="auth-page-title" className="auth-title">
              {title}
            </h1>
            {subtitle && <p className="auth-subtitle mt-2">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </main>

      <footer className="auth-footer border-t px-4 py-4 text-center text-xs">
        <p>{footerCopy}</p>
      </footer>
    </div>
  );
}
