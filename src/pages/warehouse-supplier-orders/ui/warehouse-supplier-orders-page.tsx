import { useState } from "react";

import { operationsRepository } from "@/shared/api/mock-repositories";
import { deliveryStatusLabels } from "@/shared/lib/labels";
import { Button, SurfaceCard } from "@/shared/ui";

export function WarehouseSupplierOrdersPage() {
    const orders = operationsRepository.listSupplierOrders();
    const [activeOrderId, setActiveOrderId] = useState(orders[0]?.id ?? "");
    const activeOrder = orders.find((order) => order.id === activeOrderId) ?? orders[0];

    return (
        <div className="space-y-8">
            <section>
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
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                #{order.id}
                            </p>
                            <p className="mt-2 font-semibold">{order.supplierName}</p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                {order.customerName}
                            </p>
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
                            <p>Nhà cung cấp: {activeOrder.supplierName}</p>
                            <p>Khách hàng: {activeOrder.customerName}</p>
                            <p>Trạng thái: {deliveryStatusLabels[activeOrder.deliveryStatus]}</p>
                            <p>Địa chỉ: {activeOrder.address}</p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => setActiveOrderId(orders[0]?.id ?? "")}
                        >
                            Đưa về đầu danh sách
                        </Button>
                    </SurfaceCard>
                ) : null}
            </div>
        </div>
    );
}
