import { useState } from "react";

import { catalogRepository } from "@/shared/api/mock-repositories";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function AccountNotificationsPage() {
    const profile = useAccountStore((state) => state.profile);
    const updateProfile = useAccountStore((state) => state.updateProfile);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [message, setMessage] = useState("");

    function toggleField(field: "newsletter" | "smsAlerts" | "orderEmail" | "securityAlerts") {
        updateProfile({
            [field]: !profile[field],
        });
    }

    return (
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-24">
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold">Thông báo & liên lạc</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Tùy chỉnh cách Heritage Harvest liên hệ với bạn trong storefront và sau bán
                        hàng.
                    </p>
                </div>

                <SurfaceCard className="space-y-4">
                    {[
                        {
                            field: "newsletter",
                            title: "Bản tin mùa vụ",
                            description: "Nhận email về bộ sưu tập mới và nội dung vùng miền.",
                        },
                        {
                            field: "smsAlerts",
                            title: "SMS giao vận",
                            description: "Thông báo đơn cần giao gấp hoặc thay đổi ca giao.",
                        },
                        {
                            field: "orderEmail",
                            title: "Email trạng thái đơn",
                            description: "Xác nhận đơn, hoàn tiền và cập nhật bàn giao vận chuyển.",
                        },
                        {
                            field: "securityAlerts",
                            title: "Cảnh báo bảo mật",
                            description:
                                "Thông báo khi đổi mật khẩu hoặc đăng nhập bằng vai trò khác.",
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
                                checked={Boolean(profile[item.field as keyof typeof profile])}
                                onChange={() =>
                                    toggleField(
                                        item.field as
                                            | "newsletter"
                                            | "smsAlerts"
                                            | "orderEmail"
                                            | "securityAlerts",
                                    )
                                }
                            />
                        </label>
                    ))}
                    <div className="flex items-center justify-between rounded-3xl bg-surface-container-low p-5">
                        <div>
                            <p className="font-semibold">Bản ghi đăng ký newsletter</p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                Hiện có {catalogRepository.listNewsletterSubscriptions().length}{" "}
                                lượt đăng ký được lưu trong app demo.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setMessage("Đã lưu cấu hình thông báo.");
                                pushToast({
                                    tone: "success",
                                    message: "Tùy chọn thông báo đã được cập nhật.",
                                });
                            }}
                        >
                            Lưu thay đổi
                        </Button>
                    </div>
                    {message ? <p className="text-sm text-primary">{message}</p> : null}
                </SurfaceCard>
            </div>
        </div>
    );
}
