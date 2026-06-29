import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "default" | "primary";
  square?: boolean;
};

export function Button({ icon, children, variant = "default", square, className = "", ...props }: Props) {
  return (
    <button className={`cf-btn ${variant === "primary" ? "primary" : ""} ${square ? "cf-icon-btn" : ""} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
}
