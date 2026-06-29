import type { ReactNode } from "react";

export function Card({ title, meta, children, className = "" }: { title?: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`cf-card ${className}`}>
      {(title || meta) && (
        <header className="cf-card-head">
          {title && <h2>{title}</h2>}
          {meta}
        </header>
      )}
      {children}
    </section>
  );
}
