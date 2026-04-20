import type { ReactNode } from "react";

export type StatusTone =
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "warning"
    | "danger"
    | "neutral";

export interface ShellNavItem {
    label: string;
    to?: string;
    icon: string;
    disabled?: boolean;
}

export interface MetricCardData {
    id: string;
    label: string;
    value: string;
    delta?: string;
    tone: StatusTone;
    icon: string;
    helperText?: string;
}

export interface TableColumn<T> {
    key: string;
    title: string;
    align?: "left" | "center" | "right";
    className?: string;
    render: (row: T) => ReactNode;
}
