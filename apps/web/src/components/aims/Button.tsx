import type { ButtonHTMLAttributes, ReactNode } from "react";

type AimsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
};

export function AimsButton({
  variant = "secondary",
  icon,
  children,
  className = "",
  type = "button",
  ...rest
}: AimsButtonProps) {
  const variantClass =
    variant === "primary"
      ? "aims-btn aims-btn--primary"
      : variant === "ghost"
        ? "aims-btn aims-btn--ghost"
        : "aims-btn aims-btn--secondary";
  return (
    <button type={type} className={`${variantClass} ${className}`.trim()} {...rest}>
      {icon && <span className="aims-btn__icon">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}
