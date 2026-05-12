import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { downloadTextFile } from "@/shared/lib/download";
import {
    useAdminSettingsStore,
    type AdminSettingsForm,
} from "@/shared/lib/store/use-admin-settings-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function AdminSettingsPage() {
    const navigate = useNavigate();
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const settings = useAdminSettingsStore((state) => state.settings);
    const isLoading = useAdminSettingsStore((state) => state.isLoading);
    const isSaving = useAdminSettingsStore((state) => state.isSaving);
    const error = useAdminSettingsStore((state) => state.error);
    const loadSettings = useAdminSettingsStore((state) => state.loadSettings);
    const saveSettings = useAdminSettingsStore((state) => state.saveSettings);
    const [form, setForm] = useState<AdminSettingsForm>(settings);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        setForm(settings);
    }, [settings]);

    function handleExport() {
        downloadTextFile("admin-settings.json", JSON.stringify(form, null, 2), "application/json");
        pushToast({
            tone: "success",
            message: "Da xuat cau hinh admin hien tai.",
        });
    }

    async function handleSave() {
        const result = await saveSettings(form);

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? "Da luu cau hinh quan tri."
                : (result.error ?? "Khong the luu cau hinh quan tri."),
        });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-bold">Cau hinh quan tri</h1>
                <p className="mt-2 text-on-surface-variant">
                    Quan ly cac thong so van hanh co ban cho tai khoan admin hien tai.
                </p>
            </div>

            {isLoading ? (
                <SurfaceCard className="text-on-surface-variant">Dang tai cau hinh...</SurfaceCard>
            ) : null}
            {error ? <SurfaceCard className="text-on-surface-variant">{error}</SurfaceCard> : null}

            <SurfaceCard className="grid gap-6 lg:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-semibold">Ten cua hang</span>
                    <input
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                        value={form.storeName}
                        onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
                    />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-semibold">Email ho tro</span>
                    <input
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                        value={form.supportEmail}
                        onChange={(event) => setForm((current) => ({ ...current, supportEmail: event.target.value }))}
                    />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-semibold">So dien thoai ho tro</span>
                    <input
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                        value={form.supportPhone}
                        onChange={(event) => setForm((current) => ({ ...current, supportPhone: event.target.value }))}
                    />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-semibold">Nguong canh bao ton kho</span>
                    <input
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                        min={1}
                        type="number"
                        value={form.lowStockThreshold}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                lowStockThreshold: Number(event.target.value) || 1,
                            }))
                        }
                    />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-semibold">Chu ky lam moi dashboard (giay)</span>
                    <input
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                        min={15}
                        type="number"
                        value={form.dashboardRefreshSeconds}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                dashboardRefreshSeconds: Number(event.target.value) || 15,
                            }))
                        }
                    />
                </label>
                <label className="space-y-2 lg:col-span-2">
                    <span className="text-sm font-semibold">Ghi chu van hanh</span>
                    <textarea
                        className="min-h-32 w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                        value={form.notes}
                        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    />
                </label>
                {[
                    {
                        key: "orderAutoConfirm",
                        title: "Tu dong xac nhan don",
                        description: "Luu tuy chon xu ly nhanh don moi cho tai khoan admin nay.",
                    },
                    {
                        key: "sendDailySummary",
                        title: "Nhan tong hop hang ngay",
                        description: "Dung cho nhac viec va tong hop dashboard theo ngay.",
                    },
                    {
                        key: "maintenanceMode",
                        title: "Che do bao tri",
                        description: "Danh dau trang thai quan tri dang bao tri noi bo.",
                    },
                ].map((item) => (
                    <label
                        key={item.key}
                        className="flex items-center justify-between gap-4 rounded-3xl bg-surface-container-low p-5 lg:col-span-2"
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
                            checked={Boolean(form[item.key as keyof typeof form])}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    [item.key]: event.target.checked,
                                }))
                            }
                        />
                    </label>
                ))}
                <div className="flex flex-wrap gap-3 lg:col-span-2">
                    <Button disabled={isSaving} onClick={() => void handleSave()}>
                        {isSaving ? "Dang luu..." : "Luu cau hinh"}
                    </Button>
                    <Button variant="secondary" onClick={handleExport}>
                        Xuat JSON
                    </Button>
                    <Button variant="outline" onClick={() => void navigate(routes.logout)}>
                        Dang xuat
                    </Button>
                </div>
                {form.updatedAt ? (
                    <p className="text-sm text-on-surface-variant lg:col-span-2">
                        Cap nhat lan cuoi: {new Date(form.updatedAt).toLocaleString("vi-VN")}
                    </p>
                ) : null}
            </SurfaceCard>

            <div className="grid gap-6 xl:grid-cols-3">
                <SurfaceCard className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold">Xuat du lieu</h3>
                    <p className="text-sm text-on-surface-variant">
                        Tai nhanh cau hinh admin dang hien hanh de doi chieu hoac luu tru.
                    </p>
                    <Button onClick={handleExport}>Xuat cau hinh</Button>
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold">Cau hinh van hanh</h3>
                    <p className="text-sm text-on-surface-variant">
                        Trang nay da duoc noi voi backend, du lieu luu theo tai khoan admin dang dang nhap.
                    </p>
                    <Button variant="secondary" disabled>
                        Dang dung API that
                    </Button>
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold">Phien lam viec</h3>
                    <p className="text-sm text-on-surface-variant">
                        Dang xuat de chuyen tai khoan hoac kiem tra phan quyen admin khac.
                    </p>
                    <Button variant="outline" onClick={() => void navigate(routes.logout)}>
                        Dang xuat
                    </Button>
                </SurfaceCard>
            </div>
        </div>
    );
}
