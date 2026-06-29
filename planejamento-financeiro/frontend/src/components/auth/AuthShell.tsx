import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="cf-auth-page">
      <Link href="/" className="cf-auth-logo">
        <img src="/logo/dincon_logo_dark_mode.png" alt="DinCon" />
      </Link>
      <section className="cf-auth-card">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
        <div className="cf-auth-footer">{footer}</div>
      </section>
    </main>
  );
}
