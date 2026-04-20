import { useState } from "react";

import { operationsRepository } from "@/shared/api/mock-repositories";
import { deliveryStatusLabels } from "@/shared/lib/labels";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { handoffOrderToWarehouse } from "@/shared/lib/workflows";
import { useOrderStore } from "@/shared/lib/store/use-order-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function SupplierProcessingPage() {
    const orders = operationsRepository.listSupplierOrders();
    const [activeOrderId, setActiveOrderId] = useState(orders[0]?.id ?? "");
    const activeOrder = orders.find((order) => order.id === activeOrderId) ?? orders[0];
    const updateDeliveryStatus = useOrderStore((state) => state.updateDeliveryStatus);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Xử lý đơn phía nhà cung cấp
                </h2>
                <p className="mt-1 text-on-surface-variant">
                    Đẩy đơn từ giai đoạn đang xử lý sang sẵn sàng giao và khóa các cập nhật quan
                    trọng trước khi bàn giao kho.
                </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <SurfaceCard className="space-y-3">
                    {orders.map((order) => (
                        <button
                            key={order.id}
                            className={`w-full rounded-3xl p-4 text-left transition ${
                                order.id === activeOrder?.id
                                    ? "bg-primary/5"
                                    : "bg-surface-container-low hover:bg-surface-container"
                            }`}
                            onClick={() => setActiveOrderId(order.id)}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        #{order.id}
                                    </p>
                                    <p className="mt-2 font-semibold">{order.customerName}</p>
                                </div>
                                <span className="text-sm text-on-surface-variant">
                                    {deliveryStatusLabels[order.deliveryStatus]}
                                </span>
                            </div>
                        </button>
                    ))}
                </SurfaceCard>

                {activeOrder ? (
                    <SurfaceCard className="space-y-5">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-primary">
                                Đơn đang chọn
                            </p>
                            <h3 className="mt-2 font-headline text-2xl font-bold">
                                #{activeOrder.id}
                            </h3>
                        </div>
                        <div className="space-y-2 text-sm text-on-surface-variant">
                            <p>Khách hàng: {activeOrder.customerName}</p>
                            <p>Nhà cung cấp: {activeOrder.supplierName}</p>
                            <p>
                                Trạng thái hiện tại:{" "}
                                {deliveryStatusLabels[activeOrder.deliveryStatus]}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => {
                                    handoffOrderToWarehouse(activeOrder.id);
                                    pushToast({
                                        tone: "success",
                                        message: `Đã chuyển đơn ${activeOrder.id} sang trạng thái sẵn sàng giao.`,
                                    });
                                }}
                            >
                                Chuyển sang sẵn sàng giao
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    updateDeliveryStatus(activeOrder.id, "delivered", "supplier");
                                    pushToast({
                                        tone: "success",
                                        message: `Đã xác nhận hoàn tất đơn ${activeOrder.id}.`,
                                    });
                                }}
                            >
                                Xác nhận đã giao
                            </Button>
                        </div>
                    </SurfaceCard>
                ) : null}
            </div>
        </div>
    );
}
