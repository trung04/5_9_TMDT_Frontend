import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import {
    canAccessAdminModule,
    getAdminModule,
    type AdminModuleId,
} from "@/shared/config/admin-modules";
import { routes } from "@/shared/config/routes";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";

interface AdminModuleGuardProps {
    moduleId: AdminModuleId;
    children: ReactNode;
}

export function AdminModuleGuard({ moduleId, children }: AdminModuleGuardProps) {
    const user = useAuthStore((state) => state.session?.user ?? null);
    const module = getAdminModule(moduleId);

    if (!module || !canAccessAdminModule(user, module)) {
        return <Navigate replace to={routes.unauthorized} />;
    }

    return <>{children}</>;
}
