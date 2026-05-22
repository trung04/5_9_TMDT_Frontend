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
    title: ReactNode;
    align?: "left" | "center" | "right";
    width?: string;
    nowrap?: boolean;
    className?: string;
    headerClassName?: string;
    cellClassName?: string;
    render: (row: T) => ReactNode;
}
