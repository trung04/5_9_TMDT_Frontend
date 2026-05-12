import { useState } from "react";

import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function AccountSecurityPage() {
    const changePassword = useAccountStore((state) => state.changePassword);
    const isSaving = useAccountStore((state) => state.isSaving);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [currentPassword, setCurrentPassword] = useState("");
    const [nextPassword, setNextPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit() {
        if (nextPassword !== confirmPassword) {
            setMessage("Mat khau xac nhan chua khop.");
            return;
        }

        const result = await changePassword(currentPassword, nextPassword, confirmPassword);

        if (!result.success) {
            setMessage(result.error ?? "Khong the doi mat khau.");
            return;
        }

        setMessage("Mat khau da duoc cap nhat.");
        setCurrentPassword("");
        setNextPassword("");
        setConfirmPassword("");
        pushToast({
            tone: "success",
            message: "Da luu thay doi bao mat.",
        });
    }

    return (
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-24">
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-2xl font-bold">Bao mat tai khoan</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Quan ly mat khau va cac nguyen tac bao ve phien dang nhap.
                    </p>
                </div>

                <SurfaceCard className="space-y-5">
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Mat khau hien tai</span>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                        />
                    </label>
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Mat khau moi</span>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            type="password"
                            value={nextPassword}
                            onChange={(event) => setNextPassword(event.target.value)}
                        />
                    </label>
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Xac nhan mat khau moi</span>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </label>
                    {message ? <p className="text-sm text-primary">{message}</p> : null}
                    <Button onClick={() => void handleSubmit()} disabled={isSaving}>
                        {isSaving ? "Dang luu..." : "Luu mat khau moi"}
                    </Button>
                </SurfaceCard>
            </div>
        </div>
    );
}
