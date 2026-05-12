import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { UserRole } from "@/entities/user/model/types";
import { canAccessRoute } from "@/shared/lib/auth";
import { routes } from "@/shared/config/routes";
import { redirectForRole, useAuthStore } from "@/shared/lib/store/use-auth-store";

interface RouteGuardProps {
    allowedRoles: UserRole[];
    children: ReactNode;
}

export function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
    const location = useLocation();
    const session = useAuthStore((state) => state.session);
    const isHydrating = useAuthStore((state) => state.isHydrating);

    if (isHydrating) {
        return (
            <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-6 text-sm text-on-surface-variant">
                Dang khoi tao phien dang nhap...
            </div>
        );
    }

    if (!session) {
        const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
        return <Navigate replace to={`${routes.login}?redirect=${redirect}`} />;
    }

    if (
        !allowedRoles.includes(session.user.role) ||
        !canAccessRoute(session.user.role, location.pathname)
    ) {
        const fallbackRoute = redirectForRole(session.user.role);

        return (
            <Navigate
                replace
                to={fallbackRoute === location.pathname ? routes.unauthorized : fallbackRoute}
            />
        );
    }

    return <>{children}</>;
}
