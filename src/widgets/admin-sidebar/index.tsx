import { Link } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import type { AuthUser } from "@/entities/user/model/types";
import { hasAnyAdminPermission } from "@/shared/lib/auth";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { SidebarNav } from "@/shared/ui";
import type { ShellNavItem } from "@/shared/types/ui";

type AdminNavItem = ShellNavItem & {
    permissions: string[];
    superOnly?: boolean;
};

const adminItems: AdminNavItem[] = [
    {
        label: "Tong quan",
        to: routes.adminDashboard,
        icon: "dashboard",
        permissions: ["admin.dashboard.view"],
    },
    {
        label: "Cong dong",
        to: routes.adminCommunity,
        icon: "group",
        permissions: ["admin.community.view", "admin.community.invitation.create"],
    },
    {
        label: "Kho san pham",
        to: routes.adminRepository,
        icon: "inventory_2",
        permissions: [
            "admin.products.view",
            "admin.products.create",
            "admin.products.update",
            "admin.products.delete",
            "admin.categories.create",
            "admin.categories.update",
            "admin.categories.delete",
            "admin.suppliers.create",
            "admin.suppliers.update",
            "admin.suppliers.delete",
        ],
    },
    {
        label: "Dieu phoi don",
        to: routes.adminLogistics,
        icon: "shopping_cart",
        permissions: [
            "admin.orders.view",
            "admin.orders.status.update",
            "admin.orders.payment.update",
            "admin.orders.bulk.update",
        ],
    },
    {
        label: "Cai dat",
        to: routes.adminSettings,
        icon: "settings",
        permissions: ["admin.settings.view", "admin.settings.update"],
    },
    {
        label: "Phan quyen",
        to: routes.adminAccess,
        icon: "admin_panel_settings",
        permissions: [],
        superOnly: true,
    },
];

function canViewAdminItem(user: AuthUser | null, item: AdminNavItem) {
    if (item.superOnly) {
        return user?.role === "admin" && user.adminRole?.isSuper === true;
    }

    return hasAnyAdminPermission(user, item.permissions);
}

function toShellNavItem(item: AdminNavItem): ShellNavItem {
    return {
        label: item.label,
        to: item.to,
        icon: item.icon,
        disabled: item.disabled,
    };
}

export function AdminSidebar() {
    const user = useAuthStore((state) => state.session?.user ?? null);
    const visibleItems = adminItems
        .filter((item) => canViewAdminItem(user, item))
        .map(toShellNavItem);

    return (
        <aside className="flex h-full flex-col bg-[#f3f3f3] px-4 py-6">
            <div className="mb-8 px-4">
                <h2 className="font-headline text-xl font-bold tracking-tight text-primary">
                    Heritage Admin
                </h2>
            </div>

            <SidebarNav items={visibleItems} />

            <div className="mt-auto space-y-1 border-t border-outline-variant/10 pt-6">
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
