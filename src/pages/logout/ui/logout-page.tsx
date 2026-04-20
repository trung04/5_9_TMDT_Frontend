import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";

export function LogoutPage() {
    const navigate = useNavigate();
    const session = useAuthStore((state) => state.session);
    const logout = useAuthStore((state) => state.logout);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    useEffect(() => {
        if (!session) return;

        void (async () => {
            await logout();
            pushToast({
                tone: "info",
                message: "Đã đăng xuất khỏi phiên làm việc hiện tại.",
            });
            void navigate(routes.home, { replace: true });
        })();
    }, [logout, navigate, pushToast, session]);

    if (!session) {
        return <Navigate replace to={routes.home} />;
    }

    return null;
}
