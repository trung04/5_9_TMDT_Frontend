import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { canAccessRoute } from "@/shared/lib/auth";
import { redirectForRole, useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const session = useAuthStore((state) => state.session);
    const credentials = useAuthStore((state) => state.credentials);
    const login = useAuthStore((state) => state.login);
    const loginAsRole = useAuthStore((state) => state.loginAsRole);
    const isSubmitting = useAuthStore((state) => state.isSubmitting);
    const syncGuestCart = useCartStore((state) => state.syncGuestCart);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const redirectTarget = useMemo(() => searchParams.get("redirect") ?? "", [searchParams]);

    if (session) {
        const nextPath =
            redirectTarget && canAccessRoute(session.user.role, redirectTarget)
                ? redirectTarget
                : redirectForRole(session.user.role);

        return <Navigate replace to={nextPath} />;
    }

    function resolveRedirect(role: "customer" | "admin" | "supplier" | "warehouse") {
        if (redirectTarget && canAccessRoute(role, redirectTarget)) {
            return redirectTarget;
        }

        return redirectForRole(role);
    }

    async function handleSubmit() {
        setError("");

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error ?? "Dang nhap that bai.");
            return;
        }

        const nextSession = useAuthStore.getState().session;
        const role = nextSession?.user.role;

        if (!role) {
            setError("Khong xac dinh duoc vai tro sau khi dang nhap.");
            return;
        }

        if (role === "customer") {
            const syncResult = await syncGuestCart();

            if (!syncResult.success) {
                setError(syncResult.error ?? "Khong the dong bo gio hang sau dang nhap.");
                return;
            }
        }

        void navigate(resolveRedirect(role), { replace: true });
    }

    return (
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-6xl items-center px-6 py-24">
            <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.95fr]">
                <SurfaceCard className="space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-primary">Dang nhap he thong</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {credentials.map((credential) => (
                            <button
                                key={credential.id}
                                className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                                onClick={() => {
                                    const result = loginAsRole(credential.role);

                                    if (!result.success) {
                                        setError(result.error ?? "Khong the dang nhap nhanh.");
                                        return;
                                    }

                                    void navigate(resolveRedirect(credential.role), { replace: true });
                                }}
                            >
                                <p className="text-xs uppercase tracking-widest text-primary">{credential.role}</p>
                                <p className="mt-2 font-headline text-xl font-semibold">{credential.displayName}</p>
                                <p className="mt-2 text-sm text-on-surface-variant">{credential.email}</p>
                            </button>
                        ))}
                    </div>
                </SurfaceCard>

                <SurfaceCard tone="low" className="space-y-6">
                    <div className="space-y-4">
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-on-surface">Email</span>
                            <input
                                className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="admin@shop.local"
                            />
                        </label>
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-on-surface">Mat khau</span>
                            <input
                                className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="password123"
                            />
                        </label>
                        {error ? <p className="text-sm text-error">{error}</p> : null}
                        <Button className="w-full" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                            {isSubmitting ? "Dang dang nhap..." : "Dang nhap"}
                        </Button>
                    </div>
                </SurfaceCard>
            </div>
        </div>
    );
}
