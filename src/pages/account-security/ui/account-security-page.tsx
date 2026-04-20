import { useState } from "react";

import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function AccountSecurityPage() {
    const changePassword = useAuthStore((state) => state.changePassword);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [currentPassword, setCurrentPassword] = useState("123456");
    const [nextPassword, setNextPassword] = useState("123456");
    const [confirmPassword, setConfirmPassword] = useState("123456");
    const [message, setMessage] = useState("");

    function handleSubmit() {
        if (nextPassword !== confirmPassword) {
            setMessage("Mật khẩu xác nhận chưa khớp.");
            return;
        }

        const result = changePassword(currentPassword, nextPassword);

        if (!result.success) {
            setMessage(result.error ?? "Không thể đổi mật khẩu.");
            return;
        }

        setMessage("Mật khẩu demo đã được cập nhật.");
        pushToast({
            tone: "success",
            message: "Đã lưu thay đổi bảo mật.",
        });
    }

    return (
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-24">
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold">Bảo mật tài khoản</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Quản lý mật khẩu demo và các nguyên tắc bảo vệ phiên đăng nhập.
                    </p>
                </div>

                <SurfaceCard className="space-y-5">
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Mật khẩu hiện tại</span>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                        />
                    </label>
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Mật khẩu mới</span>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            type="password"
                            value={nextPassword}
                            onChange={(event) => setNextPassword(event.target.value)}
                        />
                    </label>
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Xác nhận mật khẩu mới</span>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </label>
                    {message ? <p className="text-sm text-primary">{message}</p> : null}
                    <Button onClick={handleSubmit}>Lưu mật khẩu mới</Button>
                </SurfaceCard>
            </div>
        </div>
    );
}
