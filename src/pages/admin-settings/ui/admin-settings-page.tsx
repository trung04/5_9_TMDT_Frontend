import { useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { downloadTextFile } from "@/shared/lib/download";
import { resetDemoState } from "@/shared/lib/store/reset-demo";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useCatalogStore } from "@/shared/lib/store/use-catalog-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { useOrderStore } from "@/shared/lib/store/use-order-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function AdminSettingsPage() {
    const navigate = useNavigate();
    const pushToast = useFeedbackStore((state) => state.pushToast);

    function handleExport() {
        const payload = {
            profile: useAccountStore.getState().profile,
            catalog: useCatalogStore.getState(),
            operations: useOperationsStore.getState(),
            orders: useOrderStore.getState(),
        };

        downloadTextFile(
            "heritage-demo-backup.json",
            JSON.stringify(payload, null, 2),
            "application/json",
        );
        pushToast({
            tone: "success",
            message: "Đã xuất snapshot runtime của hệ thống demo.",
        });
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Cài đặt quản trị
                </h2>
                <p className="mt-1 text-on-surface-variant">
                    Sao lưu dữ liệu demo, khôi phục trạng thái seed và điều hướng nhanh về đăng
                    nhập.
                </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
                <SurfaceCard className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold">Xuất dữ liệu</h3>
                    <p className="text-sm text-on-surface-variant">
                        Tải toàn bộ snapshot runtime hiện tại dưới dạng JSON.
                    </p>
                    <Button onClick={handleExport}>Xuất snapshot</Button>
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold">Reset về dữ liệu seed</h3>
                    <p className="text-sm text-on-surface-variant">
                        Xóa toàn bộ thay đổi đã phát sinh trong localStorage và quay về trạng thái
                        demo ban đầu.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            resetDemoState();
                            pushToast({
                                tone: "warning",
                                message: "Đã reset toàn bộ dữ liệu runtime về seed ban đầu.",
                            });
                            void navigate(routes.login, { replace: true });
                        }}
                    >
                        Reset demo
                    </Button>
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold">Phiên làm việc</h3>
                    <p className="text-sm text-on-surface-variant">
                        Đăng xuất để đổi nhanh giữa các vai trò quản trị, nhà cung cấp và kho vận.
                    </p>
                    <Button variant="outline" onClick={() => void navigate(routes.logout)}>
                        Đăng xuất
                    </Button>
                </SurfaceCard>
            </div>
        </div>
    );
}
