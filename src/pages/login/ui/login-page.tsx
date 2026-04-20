import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { canAccessRoute } from "@/shared/lib/auth";
import { routes } from "@/shared/config/routes";
import { redirectForRole, useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
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
    const pushToast = useFeedbackStore((state) => state.pushToast);
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
            setError(result.error ?? "Đăng nhập thất bại.");
            return;
        }

        const syncResult = await syncGuestCart();

        if (!syncResult.success) {
            setError(syncResult.error ?? "Không thể đồng bộ giỏ hàng sau đăng nhập.");
            return;
        }

        pushToast({
            tone: "success",
            message: "Đăng nhập khách hàng thành công và đã đồng bộ giỏ hàng.",
        });
        void navigate(resolveRedirect("customer"), { replace: true });
    }

    return (
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-6xl items-center px-6 py-24">
            <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.95fr]">
                <SurfaceCard className="space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-primary">
                            Đăng nhập hệ thống
                        </p>
                        <h1 className="mt-3 font-headline text-4xl font-bold">
                            Customer dùng backend, portal còn lại giữ demo
                        </h1>
                        <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                            Form bên phải dùng API Laravel thật cho khách hàng. Các workspace quản trị,
                            nhà cung cấp và kho vẫn có nút vào nhanh để giữ luồng demo hiện tại.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {credentials.map((credential) => (
                            <button
                                key={credential.id}
                                className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                                onClick={() => {
                                    const result = loginAsRole(credential.role);

                                    if (!result.success) {
                                        setError(result.error ?? "Không thể đăng nhập nhanh.");
                                        return;
                                    }

                                    pushToast({
                                        tone: "success",
                                        message: `Đã vào workspace ${credential.displayName.toLowerCase()}.`,
                                    });
                                    void navigate(resolveRedirect(credential.role), {
                                        replace: true,
                                    });
                                }}
                            >
                                <p className="text-xs uppercase tracking-widest text-primary">
                                    {credential.role}
                                </p>
                                <p className="mt-2 font-headline text-xl font-semibold">
                                    {credential.displayName}
                                </p>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {credential.email}
                                </p>
                            </button>
                        ))}
                    </div>
                </SurfaceCard>

                <SurfaceCard tone="low" className="space-y-6">
                    <div>
                        <h2 className="font-headline text-2xl font-bold">Đăng nhập khách hàng</h2>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            Dùng email và mật khẩu thật từ backend Laravel. Sau khi đăng nhập, giỏ hàng
                            guest trên frontend sẽ được đồng bộ sang server.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-on-surface">Email</span>
                            <input
                                className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="customer1@shop.local"
                            />
                        </label>
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-on-surface">Mật khẩu</span>
                            <input
                                className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••••"
                            />
                        </label>
                        {error ? <p className="text-sm text-error">{error}</p> : null}
                        <Button className="w-full" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập khách hàng"}
                        </Button>
                    </div>

                    <div className="rounded-3xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                        Nếu bạn được chuyển từ route bảo vệ như <strong>/checkout</strong> hoặc{" "}
                        <strong>/account/orders</strong>, hệ thống sẽ quay lại đúng màn hình sau khi
                        đăng nhập hợp lệ.
                    </div>
                </SurfaceCard>
            </div>
        </div>
    );
}
