import { useMemo, useState } from "react";

import { adminRepository } from "@/shared/api/mock-repositories";
import { deliveryStatusLabels, paymentStatusLabels } from "@/shared/lib/labels";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import {
    handoffOrderToWarehouse,
    markOrderDelivered,
    resolveOrderComplaint,
} from "@/shared/lib/workflows";
import { Button, SurfaceCard } from "@/shared/ui";
import { OrderTable } from "@/widgets/order-table";

type LogisticsTab = "orders" | "disputes";

export function AdminLogisticsPage() {
    const [tab, setTab] = useState<LogisticsTab>("orders");
    const [query, setQuery] = useState("");
    const [activeOrderId, setActiveOrderId] = useState("");
    const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const orders = useMemo(
        () =>
            adminRepository
                .listOrders()
                .filter(
                    (order) =>
                        order.id.toLowerCase().includes(query.toLowerCase()) ||
                        order.customerName.toLowerCase().includes(query.toLowerCase()),
                ),
        [query],
    );
    const complaints = useMemo(
        () =>
            adminRepository
                .listComplaints()
                .filter(
                    (complaint) =>
                        complaint.orderId.toLowerCase().includes(query.toLowerCase()) ||
                        complaint.reason.toLowerCase().includes(query.toLowerCase()),
                ),
        [query],
    );
    const activeOrder = orders.find((order) => order.id === activeOrderId) ?? orders[0];

    return (
        <div className="space-y-8">
            <section className="space-y-1">
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Điều phối logistics
                </h2>
                <p className="text-on-surface-variant">
                    Theo dõi luồng đơn, trạng thái giao vận và xử lý khiếu nại trên cùng một mặt
                    quản trị.
                </p>
            </section>

            <div className="flex gap-3">
                <button
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                        tab === "orders"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant"
                    }`}
                    onClick={() => setTab("orders")}
                >
                    Đơn hàng
                </button>
                <button
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                        tab === "disputes"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant"
                    }`}
                    onClick={() => setTab("disputes")}
                >
                    Khiếu nại
                </button>
            </div>

            <input
                className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Lọc theo mã đơn, khách hàng hoặc lý do khiếu nại..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />

            {tab === "orders" ? (
                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                    <SurfaceCard className="overflow-hidden p-0">
                        <div className="p-6">
                            <OrderTable
                                orders={orders}
                                activeOrderId={activeOrder?.id}
                                onSelectOrder={setActiveOrderId}
                                mode="admin"
                            />
                        </div>
                    </SurfaceCard>

                    {activeOrder ? (
                        <SurfaceCard className="space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Đơn đang chọn
                                </p>
                                <h3 className="mt-2 font-headline text-2xl font-bold">
                                    #{activeOrder.id}
                                </h3>
                            </div>
                            <div className="space-y-3 text-sm text-on-surface-variant">
                                <p>Khách hàng: {activeOrder.customerName}</p>
                                <p>Nhà cung cấp: {activeOrder.supplierName}</p>
                                <p>
                                    Vận chuyển: {deliveryStatusLabels[activeOrder.deliveryStatus]}
                                </p>
                                <p>Thanh toán: {paymentStatusLabels[activeOrder.paymentStatus]}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={() => {
                                        const task = handoffOrderToWarehouse(activeOrder.id);

                                        pushToast({
                                            tone: task ? "success" : "warning",
                                            message: task
                                                ? `Đơn ${activeOrder.id} đã được chuyển sang hàng đợi kho vận.`
                                                : `Không thể chuyển đơn ${activeOrder.id}.`,
                                        });
                                    }}
                                >
                                    Chuyển sang kho vận
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        markOrderDelivered(activeOrder.id);
                                        pushToast({
                                            tone: "success",
                                            message: `Đơn ${activeOrder.id} đã được đánh dấu giao thành công.`,
                                        });
                                    }}
                                >
                                    Đánh dấu đã giao
                                </Button>
                            </div>
                        </SurfaceCard>
                    ) : null}
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                    {complaints.length === 0 ? (
                        <SurfaceCard className="text-sm text-on-surface-variant">
                            Chưa có khiếu nại nào phù hợp với bộ lọc hiện tại.
                        </SurfaceCard>
                    ) : null}
                    {complaints.map((complaint) => {
                        const order = adminRepository
                            .listOrders()
                            .find((item) => item.id === complaint.orderId);

                        return (
                            <SurfaceCard key={complaint.id} className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            {complaint.id}
                                        </p>
                                        <h3 className="mt-2 font-headline text-xl font-semibold">
                                            {complaint.reason}
                                        </h3>
                                    </div>
                                    <span className="rounded-full bg-error-container px-3 py-1 text-xs uppercase tracking-widest text-error">
                                        {complaint.status === "open" ? "Đang mở" : "Đã xử lý"}
                                    </span>
                                </div>
                                <div className="text-sm text-on-surface-variant">
                                    <p>Đơn hàng: {complaint.orderId}</p>
                                    <p>Khách hàng: {order?.customerName ?? "Không xác định"}</p>
                                    <p className="mt-2">{complaint.message}</p>
                                </div>
                                <textarea
                                    className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                    placeholder="Ghi chú xử lý"
                                    value={
                                        resolutionNotes[complaint.id] ??
                                        complaint.resolutionNote ??
                                        ""
                                    }
                                    onChange={(event) =>
                                        setResolutionNotes((current) => ({
                                            ...current,
                                            [complaint.id]: event.target.value,
                                        }))
                                    }
                                />
                                <div className="flex justify-end">
                                    <Button
                                        disabled={complaint.status === "resolved"}
                                        onClick={() => {
                                            const note =
                                                resolutionNotes[complaint.id]?.trim() ||
                                                "Đã liên hệ khách hàng và đồng bộ trạng thái logistics.";

                                            resolveOrderComplaint(complaint.id, note);
                                            pushToast({
                                                tone: "success",
                                                message: `Khiếu nại ${complaint.id} đã được đóng.`,
                                            });
                                        }}
                                    >
                                        Xử lý và đóng
                                    </Button>
                                </div>
                            </SurfaceCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
