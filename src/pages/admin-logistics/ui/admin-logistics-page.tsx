import { useEffect, useMemo, useState } from "react";

import {
    customerOrderStatusLabels,
    customerPaymentMethodLabels,
    customerPaymentStatusLabels,
    fallbackBackendLabel,
} from "@/shared/lib/customer-order-labels";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { useAdminOrdersStore } from "@/shared/lib/store/use-admin-orders-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

const ORDER_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
] as const;
const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;

export function AdminLogisticsPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeOrderId, setActiveOrderId] = useState("");
    const [nextStatus, setNextStatus] = useState("PENDING");
    const [nextPaymentStatus, setNextPaymentStatus] = useState("PENDING");
    const [note, setNote] = useState("");
    const [paymentNote, setPaymentNote] = useState("");
    const orders = useAdminOrdersStore((state) => state.orders);
    const orderDetails = useAdminOrdersStore((state) => state.orderDetails);
    const isLoading = useAdminOrdersStore((state) => state.isLoading);
    const isSaving = useAdminOrdersStore((state) => state.isSaving);
    const error = useAdminOrdersStore((state) => state.error);
    const loadOrders = useAdminOrdersStore((state) => state.loadOrders);
    const loadOrder = useAdminOrdersStore((state) => state.loadOrder);
    const updateStatus = useAdminOrdersStore((state) => state.updateStatus);
    const updatePaymentStatus = useAdminOrdersStore((state) => state.updatePaymentStatus);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const filteredOrders = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return orders.filter((order) => {
            const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
            const matchesKeyword =
                keyword.length === 0
                    ? true
                    : [order.order_no, order.customer?.full_name, order.customer?.email, order.status]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase()
                          .includes(keyword);

            return matchesStatus && matchesKeyword;
        });
    }, [orders, query, statusFilter]);

    const activeOrderSummary =
        filteredOrders.find((order) => String(order.id) === activeOrderId) ?? filteredOrders[0];
    const activeOrder = activeOrderSummary ? orderDetails[String(activeOrderSummary.id)] : undefined;

    useEffect(() => {
        if (!filteredOrders.some((order) => String(order.id) === activeOrderId)) {
            setActiveOrderId(filteredOrders[0] ? String(filteredOrders[0].id) : "");
        }
    }, [activeOrderId, filteredOrders]);

    useEffect(() => {
        if (!activeOrderSummary || activeOrder) {
            return;
        }

        void loadOrder(String(activeOrderSummary.id));
    }, [activeOrder, activeOrderSummary, loadOrder]);

    useEffect(() => {
        if (!activeOrderSummary) {
            return;
        }

        setNextStatus(activeOrderSummary.status);
        setNextPaymentStatus(activeOrderSummary.payment?.payment_status ?? "PENDING");
        setNote("");
        setPaymentNote("");
    }, [activeOrderSummary]);

    async function handleUpdateStatus() {
        if (!activeOrderSummary) {
            return;
        }

        const result = await updateStatus(String(activeOrderSummary.id), nextStatus, note);

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat trang thai don hang." });
            return;
        }

        pushToast({
            tone: "success",
            message: `Da cap nhat ${result.data.order_no} sang ${customerOrderStatusLabels[result.data.status] ?? fallbackBackendLabel(result.data.status)}.`,
        });
        setNote("");
    }

    async function handleUpdatePaymentStatus() {
        if (!activeOrderSummary) {
            return;
        }

        const result = await updatePaymentStatus(
            String(activeOrderSummary.id),
            nextPaymentStatus,
            paymentNote,
        );

        if (!result.success || !result.data) {
            pushToast({
                tone: "warning",
                message: result.error ?? "Khong the cap nhat trang thai thanh toan.",
            });
            return;
        }

        pushToast({
            tone: "success",
            message: `Da cap nhat thanh toan ${result.data.order_no} sang ${customerPaymentStatusLabels[result.data.payment?.payment_status ?? nextPaymentStatus] ?? fallbackBackendLabel(result.data.payment?.payment_status ?? nextPaymentStatus)}.`,
        });
        setPaymentNote("");
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <input
                    className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                    placeholder="Loc theo ma don, ten khach hang hoac email..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
                <select
                    className="rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tat ca trang thai</option>
                    {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {customerOrderStatusLabels[status] ?? fallbackBackendLabel(status)}
                        </option>
                    ))}
                </select>
            </div>

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SurfaceCard className="space-y-4">
                    {isLoading && orders.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">Dang tai danh sach don hang...</p>
                    ) : null}
                    {!isLoading && filteredOrders.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                            Chua co don hang nao phu hop bo loc hien tai.
                        </p>
                    ) : null}
                    {filteredOrders.map((order) => (
                        <button
                            key={order.id}
                            className={`w-full rounded-3xl p-4 text-left transition ${
                                order.id === activeOrderSummary?.id
                                    ? "bg-primary/5"
                                    : "bg-surface-container-low hover:bg-surface-container"
                            }`}
                            onClick={() => setActiveOrderId(String(order.id))}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold text-on-surface">{order.order_no}</p>
                                <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs text-on-surface-variant">
                                    {customerOrderStatusLabels[order.status] ?? fallbackBackendLabel(order.status)}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {order.customer?.full_name ?? "Khach hang khong ro"}
                            </p>
                            <p className="mt-1 text-sm text-on-surface-variant">{formatDate(order.created_at)}</p>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-primary">
                                    {formatCurrency(Number(order.total_amount))}
                                </p>
                                <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs text-on-surface-variant">
                                    {customerPaymentStatusLabels[order.payment?.payment_status ?? "PENDING"] ??
                                        fallbackBackendLabel(order.payment?.payment_status ?? "PENDING")}
                                </span>
                            </div>
                        </button>
                    ))}
                </SurfaceCard>

                <SurfaceCard className="space-y-5">
                    {!activeOrderSummary ? (
                        <p className="text-sm text-on-surface-variant">Chon mot don hang de xem chi tiet.</p>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Don dang chon
                                </p>
                                <h3 className="mt-2 font-headline text-xl font-bold">
                                    {activeOrderSummary.order_no}
                                </h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {activeOrderSummary.customer?.full_name ?? "Khach hang khong ro"} -{" "}
                                    {activeOrderSummary.customer?.email ?? "Khong co email"}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Trang thai don
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        {customerOrderStatusLabels[activeOrderSummary.status] ??
                                            fallbackBackendLabel(activeOrderSummary.status)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Thanh toan
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        {activeOrderSummary.payment
                                            ? customerPaymentStatusLabels[activeOrderSummary.payment.payment_status] ??
                                              fallbackBackendLabel(activeOrderSummary.payment.payment_status)
                                            : "Chua co du lieu"}
                                    </p>
                                </div>
                            </div>

                            {activeOrder ? (
                                <>
                                    <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                                        <p>
                                            <span className="font-medium">Nguoi nhan:</span>{" "}
                                            {activeOrder.recipient_name}
                                        </p>
                                        <p>
                                            <span className="font-medium">Dien thoai:</span>{" "}
                                            {activeOrder.recipient_phone}
                                        </p>
                                        <p>
                                            <span className="font-medium">Dia chi:</span>{" "}
                                            {activeOrder.shipping_address}
                                        </p>
                                        <p>
                                            <span className="font-medium">Phuong thuc:</span>{" "}
                                            {customerPaymentMethodLabels[activeOrder.payment_method] ??
                                                fallbackBackendLabel(activeOrder.payment_method)}
                                        </p>
                                        <p>
                                            <span className="font-medium">Cong thanh toan:</span>{" "}
                                            {activeOrder.payment?.gateway_name ?? "Khong co"}
                                        </p>
                                        <p>
                                            <span className="font-medium">Ma giao dich:</span>{" "}
                                            {activeOrder.payment?.transaction_code ?? "Khong co"}
                                        </p>
                                        <p>
                                            <span className="font-medium">Ghi chu:</span>{" "}
                                            {activeOrder.note || "Khong co"}
                                        </p>
                                    </div>

                                    <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
                                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            San pham trong don
                                        </p>
                                        {activeOrder.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start justify-between gap-4 border-b border-outline-variant/15 pb-3 last:border-0 last:pb-0"
                                            >
                                                <div>
                                                    <p className="font-medium">{item.product_name_snapshot}</p>
                                                    <p className="text-sm text-on-surface-variant">
                                                        {item.quantity} x {formatCurrency(Number(item.unit_price))}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-primary">
                                                    {formatCurrency(Number(item.line_total))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4 rounded-2xl bg-surface-container-low p-4">
                                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            Cap nhat trang thai don
                                        </p>
                                        <select
                                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                                            value={nextStatus}
                                            onChange={(event) => setNextStatus(event.target.value)}
                                        >
                                            {ORDER_STATUSES.map((status) => (
                                                <option key={status} value={status}>
                                                    {customerOrderStatusLabels[status] ??
                                                        fallbackBackendLabel(status)}
                                                </option>
                                            ))}
                                        </select>
                                        <textarea
                                            className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                            placeholder="Ghi chu cho lich su trang thai don"
                                            value={note}
                                            onChange={(event) => setNote(event.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <Button onClick={() => void handleUpdateStatus()} disabled={isSaving}>
                                                {isSaving ? "Dang cap nhat..." : "Luu trang thai don"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 rounded-2xl bg-surface-container-low p-4">
                                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            Cap nhat thanh toan
                                        </p>
                                        <select
                                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                                            value={nextPaymentStatus}
                                            onChange={(event) => setNextPaymentStatus(event.target.value)}
                                        >
                                            {PAYMENT_STATUSES.map((status) => (
                                                <option key={status} value={status}>
                                                    {customerPaymentStatusLabels[status] ??
                                                        fallbackBackendLabel(status)}
                                                </option>
                                            ))}
                                        </select>
                                        <textarea
                                            className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                            placeholder="Ghi chu cho lich su thanh toan"
                                            value={paymentNote}
                                            onChange={(event) => setPaymentNote(event.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() => void handleUpdatePaymentStatus()}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? "Dang cap nhat..." : "Luu trang thai thanh toan"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            Lich su trang thai
                                        </p>
                                        {activeOrder.status_history.length === 0 ? (
                                            <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                                                Chua co lich su trang thai
                                            </div>
                                        ) : null}
                                        {activeOrder.status_history.map((history) => (
                                            <div key={history.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                                <p className="font-medium">
                                                    {customerOrderStatusLabels[history.to_status] ??
                                                        fallbackBackendLabel(history.to_status)}
                                                </p>
                                                <p className="mt-1 text-on-surface-variant">
                                                    {formatDate(history.changed_at)}
                                                </p>
                                                {history.note ? (
                                                    <p className="mt-2 text-on-surface-variant">{history.note}</p>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-on-surface-variant">Dang tai chi tiet don hang...</p>
                            )}
                        </>
                    )}
                </SurfaceCard>
            </div>
        </div>
    );
}
