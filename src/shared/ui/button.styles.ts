import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-primary-glow text-on-primary shadow-ambient hover:brightness-105 active:scale-[0.98]",
    secondary:
        "border border-white/60 bg-surface-container-lowest/90 text-on-surface shadow-[0px_12px_24px_rgba(26,28,28,0.04)] hover:bg-surface-container-low active:scale-[0.98]",
    ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low active:scale-[0.98]",
    outline:
        "border border-outline-variant/30 bg-transparent text-on-surface hover:bg-surface-container-low active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
};

export function buttonStyles(
    variant: ButtonVariant = "primary",
    size: ButtonSize = "md",
    className?: string,
) {
    return cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-label font-semibold tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
    );
}
