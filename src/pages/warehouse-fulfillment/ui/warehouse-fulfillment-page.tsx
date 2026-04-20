import { useMemo, useState } from "react";

import { adminRepository, operationsRepository } from "@/shared/api/mock-repositories";
import { advanceFulfillmentTask } from "@/shared/lib/workflows";
import { fulfillmentStatusLabels, shippingTierLabels } from "@/shared/lib/labels";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, StatCard, SurfaceCard } from "@/shared/ui";
import { FulfillmentQueue } from "@/widgets/fulfillment-queue";

const nextStatusLabel = {
    picking: "Chuyển sang đóng gói",
    packing: "Chuyển sang chờ lấy hàng",
    awaiting_pickup: "Xác nhận đã bàn giao vận chuyển",
    shipped: "Đã hoàn tất luồng kho",
} as const;

export function WarehouseFulfillmentPage() {
    const tasks = operationsRepository.listFulfillmentTasks();
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "");
    const activeTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
    const relatedOrder = activeTask
        ? adminRepository.listOrders().find((order) => order.id === activeTask.orderId)
        : undefined;

    const stats = useMemo(
        () => [
            {
                id: "fulfillment-pending",
                label: "Đơn đang xử lý",
                value: `${tasks.filter((task) => task.status !== "shipped").length}`,
                tone: "primary" as const,
                icon: "local_shipping",
                delta: `${tasks.filter((task) => task.priority === "rush").length} đơn gấp`,
                helperText: "vẫn đang nằm trong hàng đợi kho",
            },
            {
                id: "fulfillment-utilization",
                label: "Khu đóng gói hoạt động",
                value: `${new Set(tasks.map((task) => task.assignedZone)).size}`,
                tone: "secondary" as const,
                icon: "warehouse",
                helperText: "số khu đang có nhiệm vụ mở",
            },
            {
                id: "fulfillment-batch",
                label: "Đơn đã bàn giao",
                value: `${tasks.filter((task) => task.status === "shipped").length}`,
                tone: "tertiary" as const,
                icon: "deployed_code",
                helperText: "đã chuyển sang trạng thái in_transit",
            },
        ],
        [tasks],
    );

    return (
        <div className="space-y-8">
            <section className="space-y-1">
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Điều phối fulfillment
                </h2>
                <p className="text-on-surface-variant">
                    Theo dõi pick, pack và bàn giao vận chuyển cho toàn bộ đội kho trong một bảng
                    điều phối.
                </p>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

            <FulfillmentQueue
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
            />

            {activeTask ? (
                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <SurfaceCard className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Nhiệm vụ đang chọn
                            </p>
                            <h2 className="mt-2 font-headline text-2xl font-bold">
                                {activeTask.orderId}
                            </h2>
                        </div>
                        <div className="space-y-3 text-sm text-on-surface-variant">
                            <p>Khách hàng: {activeTask.customerName}</p>
                            <p>Khu xử lý: {activeTask.assignedZone}</p>
                            <p>Gói giao hàng: {shippingTierLabels[activeTask.shippingTier]}</p>
                            <p>Trạng thái: {fulfillmentStatusLabels[activeTask.status]}</p>
                            {relatedOrder ? <p>Địa chỉ nhận: {relatedOrder.address}</p> : null}
                        </div>
                        <Button
                            disabled={activeTask.status === "shipped"}
                            onClick={() => {
                                const nextTask = advanceFulfillmentTask(
                                    activeTask.id,
                                    "Cập nhật từ màn hình fulfillment.",
                                );

                                if (!nextTask) return;

                                pushToast({
                                    tone: "success",
                                    message:
                                        nextTask.status === "shipped"
                                            ? `Đơn ${nextTask.orderId} đã được bàn giao cho đơn vị vận chuyển.`
                                            : `Đơn ${nextTask.orderId} đã chuyển sang ${fulfillmentStatusLabels[nextTask.status]}.`,
                                });
                            }}
                        >
                            {nextStatusLabel[activeTask.status]}
                        </Button>
                    </SurfaceCard>

                    <SurfaceCard className="space-y-6">
                        <div>
                            <h2 className="font-headline text-2xl font-bold">Nhịp bàn giao kho</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-on-surface-variant">
                                Gom đơn tiêu chuẩn và đơn gấp theo từng cửa sổ xuất hàng, đồng thời
                                đồng bộ trạng thái về logistics khi nhân viên kho xác nhận bước tiếp
                                theo.
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-3xl bg-surface-container-low p-5">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Chuyến xe kế tiếp
                                </p>
                                <p className="mt-2 font-headline text-2xl font-bold">10:30</p>
                            </div>
                            <div className="rounded-3xl bg-surface-container-low p-5">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Nhãn vận đơn
                                </p>
                                <p className="mt-2 font-headline text-2xl font-bold">
                                    {tasks.filter((task) => task.status !== "picking").length}
                                </p>
                            </div>
                            <div className="rounded-3xl bg-surface-container-low p-5">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Cảnh báo ưu tiên
                                </p>
                                <p className="mt-2 font-headline text-2xl font-bold">
                                    {tasks.filter((task) => task.priority === "rush").length}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Lịch sử trạng thái
                            </p>
                            {(activeTask.statusHistory ?? []).map((event) => (
                                <div
                                    key={event.id}
                                    className="rounded-2xl bg-surface-container-highest p-4 text-sm"
                                >
                                    <p className="font-semibold text-on-surface">{event.label}</p>
                                    <p className="mt-1 text-on-surface-variant">
                                        {event.actor} ·{" "}
                                        {new Date(event.createdAt).toLocaleString("vi-VN")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>
                </section>
            ) : null}
        </div>
    );
}
