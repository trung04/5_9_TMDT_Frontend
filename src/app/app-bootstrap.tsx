import { useEffect } from "react";

import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useCartStore } from "@/shared/lib/store/use-cart-store";

export function AppBootstrap() {
    const hydrateSession = useAuthStore((state) => state.hydrateSession);
    const authSource = useAuthStore((state) => state.authSource);
    const session = useAuthStore((state) => state.session);
    const loadCart = useCartStore((state) => state.loadCart);

    useEffect(() => {
        void hydrateSession();
    }, [hydrateSession]);

    useEffect(() => {
        if (authSource !== "backend" || session?.user.role !== "customer") {
            return;
        }

        void loadCart();
    }, [authSource, loadCart, session?.user.id, session?.user.role]);

    return null;
}
