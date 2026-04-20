import { Link } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { SidebarNav } from "@/shared/ui";
import type { ShellNavItem } from "@/shared/types/ui";

const adminItems: ShellNavItem[] = [
    { label: "Tổng quan", to: routes.adminDashboard, icon: "dashboard" },
    { label: "Cộng đồng", to: routes.adminCommunity, icon: "group" },
    { label: "Kho sản phẩm", to: routes.adminRepository, icon: "inventory_2" },
    { label: "Điều phối đơn", to: routes.adminLogistics, icon: "shopping_cart" },
    { label: "Cài đặt", to: routes.adminSettings, icon: "settings" },
];

export function AdminSidebar() {
    return (
        <aside className="flex h-full flex-col bg-[#f3f3f3] px-4 py-6">
            <div className="mb-8 px-4">
                <h2 className="font-headline text-xl font-bold tracking-tight text-primary">
                    Heritage Admin
                </h2>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                    Điều phối hệ sinh thái
                </p>
            </div>

            <SidebarNav items={adminItems} />

            <div className="mt-auto space-y-1 border-t border-outline-variant/10 pt-6">
                <Link
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-white/40 hover:text-primary"
                    to={routes.adminSettings}
                >
                    <span className="material-symbols-outlined text-xl">settings</span>
                    <span>Cài đặt hệ thống</span>
                </Link>
                <Link
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-error/80 transition hover:bg-white/40"
                    to={routes.logout}
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    <span>Đăng xuất</span>
                </Link>
            </div>
        </aside>
    );
}
