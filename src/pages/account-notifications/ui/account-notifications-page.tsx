import { useEffect, useState } from "react";

import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function AccountNotificationsPage() {
    const profile = useAccountStore((state) => state.profile);
    const notifications = useAccountStore((state) => state.notifications);
    const loadProfile = useAccountStore((state) => state.loadProfile);
    const loadNotifications = useAccountStore((state) => state.loadNotifications);
    const saveProfile = useAccountStore((state) => state.saveProfile);
    const markNotificationRead = useAccountStore((state) => state.markNotificationRead);
    const isSaving = useAccountStore((state) => state.isSaving);
    const isNotificationsLoading = useAccountStore((state) => state.isNotificationsLoading);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [message, setMessage] = useState("");
    const [preferences, setPreferences] = useState({
        newsletter: profile.newsletter,
        smsAlerts: profile.smsAlerts,
        orderEmail: profile.orderEmail,
        securityAlerts: profile.securityAlerts,
    });

    useEffect(() => {
        void loadProfile();
        void loadNotifications();
    }, [loadNotifications, loadProfile]);

    useEffect(() => {
        setPreferences({
            newsletter: profile.newsletter,
            smsAlerts: profile.smsAlerts,
            orderEmail: profile.orderEmail,
            securityAlerts: profile.securityAlerts,
        });
    }, [profile]);

    async function handleSavePreferences() {
        const result = await saveProfile(preferences);

        if (!result.success) {
            setMessage(result.error ?? "Khong the luu tuy chon thong bao.");
            return;
        }

        setMessage("Da luu cau hinh thong bao.");
        pushToast({
            tone: "success",
            message: "Tuy chon thong bao da duoc cap nhat.",
        });
    }

    return (
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-24">
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-2xl font-bold">Thong bao va lien lac</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Tuy chinh cach he thong lien he voi ban trong qua trinh mua hang.
                    </p>
                </div>

                <SurfaceCard className="space-y-4">
                    {[
                        {
                            field: "newsletter",
                            title: "Ban tin mua vu",
                            description: "Nhan email ve bo suu tap moi va noi dung vung mien.",
                        },
                        {
                            field: "smsAlerts",
                            title: "SMS giao van",
                            description: "Thong bao don can giao gap hoac thay doi ca giao.",
                        },
                        {
                            field: "orderEmail",
                            title: "Email trang thai don",
                            description: "Xac nhan don, hoan tien va cap nhat ban giao van chuyen.",
                        },
                        {
                            field: "securityAlerts",
                            title: "Canh bao bao mat",
                            description: "Thong bao khi doi mat khau hoac co dang nhap bat thuong.",
                        },
                    ].map((item) => (
                        <label
                            key={item.field}
                            className="flex items-center justify-between gap-4 rounded-3xl bg-surface-container-low p-5"
                        >
                            <span>
                                <span className="block font-semibold">{item.title}</span>
                                <span className="mt-1 block text-sm text-on-surface-variant">
                                    {item.description}
                                </span>
                            </span>
                            <input
                                className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
                                type="checkbox"
                                checked={Boolean(preferences[item.field as keyof typeof preferences])}
                                onChange={(event) =>
                                    setPreferences((current) => ({
                                        ...current,
                                        [item.field]: event.target.checked,
                                    }))
                                }
                            />
                        </label>
                    ))}

                    <div className="flex items-center justify-between rounded-3xl bg-surface-container-low p-5">
                        <div>
                            <p className="font-semibold">Cap nhat tuy chon thong bao</p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                Cac tuy chon nay se duoc luu tren tai khoan backend cua ban.
                            </p>
                        </div>
                        <Button variant="secondary" disabled={isSaving} onClick={() => void handleSavePreferences()}>
                            {isSaving ? "Dang luu..." : "Luu thay doi"}
                        </Button>
                    </div>
                    {message ? <p className="text-sm text-primary">{message}</p> : null}
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold">Danh sach thong bao</h2>
                    {isNotificationsLoading ? (
                        <p className="text-sm text-on-surface-variant">Dang tai thong bao...</p>
                    ) : notifications.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">Chua co thong bao nao.</p>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="rounded-3xl bg-surface-container-low p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold">{notification.title}</p>
                                            <p className="mt-1 text-sm text-on-surface-variant">
                                                {notification.message}
                                            </p>
                                            <p className="mt-2 text-xs text-on-surface-variant">
                                                {notification.createdAt
                                                    ? new Date(notification.createdAt).toLocaleString("vi-VN")
                                                    : notification.channel}
                                            </p>
                                        </div>
                                        {!notification.readAt ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    const result = await markNotificationRead(notification.id);

                                                    pushToast({
                                                        tone: result.success ? "success" : "warning",
                                                        message: result.success
                                                            ? "Da danh dau thong bao da doc."
                                                            : (result.error ?? "Khong the cap nhat thong bao."),
                                                    });
                                                }}
                                            >
                                                Danh dau da doc
                                            </Button>
                                        ) : (
                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                                Da doc
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SurfaceCard>
            </div>
        </div>
    );
}
