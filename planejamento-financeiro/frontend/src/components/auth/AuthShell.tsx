import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  compact?: boolean;
  logoClassName?: string;
  cardClassName?: string;
};

export function AuthShell({ title, subtitle, children, footer, compact = false, logoClassName = "", cardClassName = "" }: AuthShellProps) {
  return (
    <main className={`cf-auth-page${compact ? " compact" : ""}`}>
      <Link href="/" className={`cf-auth-logo${compact ? " compact" : ""} ${logoClassName}`.trim()}>
        <img src="/logo/dincon_logo_dark_mode.png" alt="DinCon" />
      </Link>
      <section className={`cf-auth-card${compact ? " compact" : ""} ${cardClassName}`.trim()}>
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
