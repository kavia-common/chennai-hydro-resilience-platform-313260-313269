import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * PUBLIC_INTERFACE
 */
export function GlassCard({ title, subtitle, children }: Props) {
  /** Glassmorphism card wrapper with optional header text. */
  return (
    <section className="glassCard">
      {(title || subtitle) && (
        <div className="cardHeader">
          {title && <div className="cardTitle">{title}</div>}
          {subtitle && <div className="cardSubtitle">{subtitle}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}
