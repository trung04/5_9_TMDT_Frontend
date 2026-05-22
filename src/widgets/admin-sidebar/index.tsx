import { Link } from "react-router-dom";

import {
    adminModules,
    canAccessAdminModule,
    type AdminModule,
} from "@/shared/config/admin-modules";
import { routes } from "@/shared/config/routes";
import { hasAnyAdminPermission } from "@/shared/lib/auth";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { SidebarNav } from "@/shared/ui";
import type { ShellNavItem } from "@/shared/types/ui";

const adminSections: Array<{
    id: AdminModule["section"];
    label: string;
}> = [
    { id: "overview", label: "Khu dieu khien" },
    { id: "commerce", label: "Thuong mai" },
    { id: "supplier", label: "Cong nha cung cap" },
    { id: "warehouse", label: "Cong kho van" },
    { id: "system", label: "He thong" },
];

function toShellNavItem(item: AdminModule): ShellNavItem {
    return {
        label: item.label,
        to: item.to,
        icon: item.icon,
    };
}

export function AdminSidebar() {
    const user = useAuthStore((state) => state.session?.user ?? null);
    const visibleItems = adminModules
        .filter((item) => canAccessAdminModule(user, item))
        .reduce<Record<AdminModule["section"], ShellNavItem[]>>(
            (groups, item) => {
                groups[item.section] = [...(groups[item.section] ?? []), toShellNavItem(item)];
                return groups;
            },
            {
                overview: [],
                commerce: [],
                supplier: [],
                warehouse: [],
                system: [],
            },
        );

    return (
        <aside className="flex h-full flex-col overflow-hidden bg-[#f3f3f3] px-4 py-6">
            <div className="mb-8 shrink-0 px-4">
                <h2 className="font-headline text-xl font-bold tracking-tight text-primary">
                    Heritage Admin
                </h2>
            </div>

            <div className="scrollbar-none min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
                {adminSections.map((section) =>
                    visibleItems[section.id].length > 0 ? (
                        <div key={section.id} className="space-y-2">
                            <p className="px-4 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/60">
                                {section.label}
                            </p>
                            <SidebarNav items={visibleItems[section.id]} />
                        </div>
                    ) : null,
                )}
            </div>

            <div className="mt-6 shrink-0 space-y-1 border-t border-outline-variant/10 pt-6">
                {hasAnyAdminPermission(user, ["admin.settings.view", "admin.settings.update"]) ? (
                    <Link
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-white/40 hover:text-primary"
                        to={routes.adminSettings}
                    >
                        <span className="material-symbols-outlined text-xl">settings</span>
                        <span>Cai dat he thong</span>
                    </Link>
                ) : null}
                <Link
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-error/80 transition hover:bg-white/40"
                    to={routes.logout}
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    <span>Dang xuat</span>
                </Link>
            </div>
        </aside>
    );
}
