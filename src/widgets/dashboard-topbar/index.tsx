import type { ReactNode } from "react";

import { SearchField, TopAppBar } from "@/shared/ui";

export interface DashboardTopbarProps {
    title: string;
    subtitle: string;
    searchPlaceholder?: string;
    actions?: ReactNode;
}

export function DashboardTopbar({
    title,
    subtitle,
    searchPlaceholder,
    actions,
}: DashboardTopbarProps) {
    return (
        <TopAppBar
            title={title}
            subtitle={subtitle}
            search={
                searchPlaceholder ? (
                    <div className="min-w-[280px]">
                        <SearchField placeholder={searchPlaceholder} />
                    </div>
                ) : undefined
            }
            actions={actions}
        />
    );
}
