import type { UserRole } from "@/entities/user/model/types";
import { roleProtectedPrefixes, routes } from "@/shared/config/routes";

export function canAccessRoute(role: UserRole, pathname: string) {
    const matched = roleProtectedPrefixes.find((item) => pathname.startsWith(item.prefix));

    if (!matched) return true;
    return matched.roles.includes(role);
}

export function loginRedirectForPathname(pathname: string) {
    if (pathname.startsWith("/admin")) return routes.adminDashboard;
    if (pathname.startsWith("/supplier")) return routes.supplierOrders;
    if (pathname.startsWith("/warehouse")) return routes.warehouseInventory;
    if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
        return routes.accountProfile;
    }

    return routes.home;
}
