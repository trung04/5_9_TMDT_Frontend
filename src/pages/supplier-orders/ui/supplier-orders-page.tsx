import { useState } from "react";

import { catalogRepository, operationsRepository } from "@/shared/api/mock-repositories";
import { deliveryStatusLabels, shippingTierLabels } from "@/shared/lib/labels";
import { useUiStore } from "@/shared/lib/store/use-ui-store";
import { StatCard, SurfaceCard } from "@/shared/ui";
import { OrderTable } from "@/widgets/order-table";

export function SupplierOrdersPage() {
    const selectedSupplierOrderId = useUiStore((state) => state.selectedSupplierOrderId);
    const setSelectedSupplierOrderId = useUiStore((state) => state.setSelectedSupplierOrderId);
    const [filter, setFilter] = useState<"all" | "awaiting">("all");
    const orders = operationsRepository.listSupplierOrders();
    const filteredOrders = orders.filter((order) =>
        filter === "awaiting"
            ? order.deliveryStatus === "processing" || order.deliveryStatus === "ready_to_ship"
            : true,
    );
    const activeOrder =
        filteredOrders.find((order) => order.id === selectedSupplierOrderId) ?? filteredOrders[0];

    const stats = [
        {
            id: "supplier-pending",
            label: "Đơn chờ xử lý",
            value: `${orders.filter((order) => order.deliveryStatus === "processing").length}`,
            tone: "primary" as const,
            icon: "inventory_2",
            helperText: "đang chờ đóng gói hoặc xác nhận",
        },
        {
            id: "supplier-transit",
            label: "Đơn đang vận chuyển",
            value: `${orders.filter((order) => order.deliveryStatus === "in_transit").length}`,
            tone: "warning" as const,
            icon: "local_shipping",
            helperText: "đã bàn giao đơn vị vận chuyển",
        },
        {
            id: "supplier-revenue",
            label: "Doanh thu mô phỏng",
            value: "₫142M",
            tone: "secondary" as const,
            icon: "payments",
            helperText: "doanh thu hiển thị theo dashboard demo",
        },
    ];

    return (
        <div className="space-y-8">
            <section className="flex items-end justify-between gap-6">
                <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight">
                        Đơn hàng phía nhà cung cấp
                    </h2>
                    <p className="mt-1 text-on-surface-variant">
                        Theo dõi đơn mới, đơn chờ bàn giao và chi tiết từng line item trong cùng một
                        workspace.
                    </p>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <SurfaceCard className="overflow-hidden p-0">
                    <div className="flex items-center justify-between border-b border-outline-variant/15 bg-surface-bright px-6 py-5">
                        <h4 className="font-headline font-semibold text-on-surface">
                            Danh sách đơn mua vào
                        </h4>
                        <div className="flex gap-2">
                            <button
                                className={`rounded-full px-4 py-2 text-xs ${
                                    filter === "all"
                                        ? "bg-surface-container-low text-on-surface"
                                        : "text-on-surface-variant hover:bg-surface-container-low"
                                }`}
                                onClick={() => setFilter("all")}
                            >
                                Tất cả
                            </button>
                            <button
                                className={`rounded-full px-4 py-2 text-xs ${
                                    filter === "awaiting"
                                        ? "bg-surface-container-low text-on-surface"
                                        : "text-on-surface-variant hover:bg-surface-container-low"
                                }`}
                                onClick={() => setFilter("awaiting")}
                            >
                                Chờ giao kho
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <OrderTable
                            orders={filteredOrders}
                            activeOrderId={activeOrder?.id}
                            onSelectOrder={setSelectedSupplierOrderId}
                            mode="supplier"
                        />
                    </div>
                </SurfaceCard>

                {activeOrder ? (
                    <SurfaceCard className="space-y-5">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Đơn đang chọn
                            </p>
                            <h2 className="mt-2 font-headline text-2xl font-bold">
                                #{activeOrder.id}
                            </h2>
                        </div>
                        <div className="space-y-3 text-sm text-on-surface-variant">
                            <p>Người mua: {activeOrder.customerName}</p>
                            <p>Giao vận: {deliveryStatusLabels[activeOrder.deliveryStatus]}</p>
                            <p>Gói giao hàng: {shippingTierLabels[activeOrder.shippingTier]}</p>
                            <p>Địa chỉ nhận: {activeOrder.address}</p>
                        </div>
                        <div className="space-y-3">
                            {activeOrder.items.map((item) => (
                                <div
                                    key={`${activeOrder.id}-${item.productId}`}
                                    className="rounded-2xl bg-surface-container-low p-4 text-sm"
                                >
                                    <p className="font-semibold text-on-surface">
                                        {catalogRepository.getProductById(item.productId)?.name ??
                                            item.productId}
                                    </p>
                                    <p className="text-on-surface-variant">
                                        Số lượng {item.quantity} · Đơn giá{" "}
                                        {item.unitPrice.toLocaleString("vi-VN")} đ
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>
                ) : null}
            </section>
        </div>
    );
}
