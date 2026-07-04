import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggleButton } from "@/components/ui/ThemeToggleButton";
import { useThemeMode } from "@/hooks/useThemeMode";

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
  const { theme } = useThemeMode();

  return (
    <main className={`cf-auth-page${compact ? " compact" : ""}`}>
      <div className="cf-auth-controls">
        <ThemeToggleButton />
      </div>
      <Link href="/" className={`cf-auth-logo${compact ? " compact" : ""} ${logoClassName}`.trim()}>
        <img
          src={theme === "dark" ? "/logo/dincon_logo_dark_mode.png" : "/logo/dincon_logo_light_transparente_final.png"}
          alt="DinCon"
          className={theme === "dark" ? "cf-auth-logo-img-dark" : "cf-auth-logo-img-light"}
        />
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
