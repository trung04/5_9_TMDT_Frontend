import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

import { buttonStyles, type ButtonSize, type ButtonVariant } from "@/shared/ui/button.styles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
}

interface ButtonLinkProps extends LinkProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
}

export function Button({
    children,
    className,
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <button type={type} className={buttonStyles(variant, size, className)} {...props}>
            {iconLeft}
            <span>{children}</span>
            {iconRight}
        </button>
    );
}

export function ButtonLink({
    children,
    className,
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    ...props
}: ButtonLinkProps) {
    return (
        <Link className={buttonStyles(variant, size, className)} {...props}>
            {iconLeft}
            <span>{children}</span>
            {iconRight}
        </Link>
    );
}
