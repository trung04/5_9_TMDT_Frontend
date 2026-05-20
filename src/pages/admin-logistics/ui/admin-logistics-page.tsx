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
    "DELIVERY_FAILED",
    "CANCELLED",
] as const;

function labelForStatus(status: string) {
    return customerOrderStatusLabels[status] ?? fallbackBackendLabel(status);
}

function labelForPaymentStatus(status: string) {
    return customerPaymentStatusLabels[status] ?? fallbackBackendLabel(status);
}

function paymentInstructionValue(payload: Record<string, unknown> | null | undefined, key: string) {
    const value = payload?.[key];
    return typeof value === "string" ? value : "";
}

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
                    : [
                          order.order_no,
                          order.customer?.full_name,
                          order.customer?.email,
                          order.shipping_code,
                          order.shipping_carrier,
                          order.payment?.transaction_code,
                      ]
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

        const detail = activeOrder ?? null;
        const allowedNextStatuses = detail?.allowed_next_statuses ?? [];
        const allowedPaymentStatuses = detail?.allowed_payment_statuses ?? [];

        setNextStatus(allowedNextStatuses[0] ?? activeOrderSummary.status);
        setNextPaymentStatus(
            allowedPaymentStatuses[0] ?? activeOrderSummary.payment?.payment_status ?? "PENDING",
        );
        setNote("");
        setPaymentNote("");
    }, [activeOrder, activeOrderSummary]);

    async function handleUpdateStatus() {
        if (!activeOrderSummary || !activeOrder) {
            return;
        }

        if (!activeOrder.allowed_next_statuses.includes(nextStatus)) {
            pushToast({
                tone: "warning",
                message: "Trạng thái đơn hàng không hợp lệ cho bước chuyển tiếp theo.",
            });
            return;
        }

        const result = await updateStatus(String(activeOrderSummary.id), nextStatus, note);

        if (!result.success || !result.data) {
            pushToast({
                tone: "warning",
                message: result.error ?? "Không thể cập nhật trạng thái đơn hàng.",
            });
            return;
        }

        pushToast({
            tone: "success",
            message: `Đã cập nhật ${result.data.order_no} sang ${labelForStatus(result.data.status)}.`,
        });
        setNote("");
    }

    async function handleUpdatePaymentStatus() {
        if (!activeOrderSummary || !activeOrder) {
            return;
        }

        if (!activeOrder.allowed_payment_statuses?.includes(nextPaymentStatus)) {
            pushToast({
                tone: "warning",
                message: "Trạng thái thanh toán không hợp lệ cho bước chuyển tiếp theo.",
            });
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
                message: result.error ?? "Không thể cập nhật trạng thái thanh toán.",
            });
            return;
        }

        pushToast({
            tone: "success",
            message: `Đã cập nhật thanh toán ${result.data.order_no} sang ${labelForPaymentStatus(result.data.payment?.payment_status ?? nextPaymentStatus)}.`,
        });
        setPaymentNote("");
    }

    async function handleDeliveryFailedAction(action: "reshop" | "restock" | "dispose") {
        if (!activeOrderSummary || !activeOrder) {
            return;
        }

        if (action === "dispose" && !note.trim()) {
            pushToast({
                tone: "warning",
                message: "Vui lòng nhập lý do khi hủy nhưng không nhập lại kho.",
            });
            return;
        }

        const result =
            action === "reshop"
                ? await updateStatus(String(activeOrderSummary.id), "SHIPPED", note)
                : await updateStatus(
                      String(activeOrderSummary.id),
                      "CANCELLED",
                      note,
                      { restockInventory: action === "restock" },
                  );

        if (!result.success || !result.data) {
            pushToast({
                tone: "warning",
                message: result.error ?? "Không thể cập nhật xử lý giao hàng thất bại.",
            });
            return;
        }

        pushToast({
            tone: "success",
            message:
                action === "reshop"
                    ? `Đã chuyển ${result.data.order_no} sang trạng thái ${labelForStatus(result.data.status)}.`
                    : `Đã hủy ${result.data.order_no} thành công.`,
        });
        setNote("");
    }

    const paymentPayload = activeOrder?.payment?.raw_payload ?? null;
    const transferSubmitted = Boolean(paymentPayload?.customer_transfer_submitted);

    return (
        <div className="space-y-8">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <input
                    className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                    placeholder="Lọc theo mã đơn, khách hàng, email, mã vận đơn..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
                <select
                    className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {labelForStatus(status)}
                        </option>
                    ))}
                </select>
            </div>

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <SurfaceCard className="space-y-4">
                    {isLoading && orders.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">Đang tải danh sách đơn hàng...</p>
                    ) : null}
                    {!isLoading && filteredOrders.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                            Chưa có đơn hàng nào phù hợp với bộ lọc hiện tại.
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
                                    {labelForStatus(order.status)}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {order.customer?.full_name ?? "Khách hàng không rõ"}
                            </p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                {formatDate(order.created_at)}
                            </p>
                            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                                <p className="font-semibold text-primary">
                                    {formatCurrency(Number(order.total_amount))}
                                </p>
                                <p className="text-on-surface-variant">
                                    Thanh toán:{" "}
                                    {labelForPaymentStatus(order.payment?.payment_status ?? "PENDING")}
                                </p>
                                <p className="text-on-surface-variant">
                                    Mã vận đơn: {order.shipping_code ?? "Chưa tạo"}
                                </p>
                                <p className="text-on-surface-variant">
                                    Trừ kho: {order.stock_deducted ? "Đã trừ" : "Chưa trừ"}
                                </p>
                            </div>
                        </button>
                    ))}
                </SurfaceCard>

                <SurfaceCard className="space-y-5">
                    {!activeOrderSummary ? (
                        <p className="text-sm text-on-surface-variant">Chọn một đơn hàng để xem chi tiết.</p>
                    ) : !activeOrder ? (
                        <p className="text-sm text-on-surface-variant">Đang tải chi tiết đơn hàng...</p>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Đơn đang chọn
                                </p>
                                <h3 className="mt-2 font-headline text-xl font-bold">{activeOrder.order_no}</h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {activeOrder.customer?.full_name ?? "Khách hàng không rõ"} -{" "}
                                    {activeOrder.customer?.email ?? "Không có email"}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Trạng thái đơn
                                    </p>
                                    <p className="mt-2 font-semibold">{labelForStatus(activeOrder.status)}</p>
                                </div>
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Trạng thái thanh toán
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        {labelForPaymentStatus(activeOrder.payment?.payment_status ?? "PENDING")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                                    <p>
                                        <span className="font-medium">Khách hàng:</span>{" "}
                                        {activeOrder.customer?.full_name ?? "Không rõ"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Người nhận:</span> {activeOrder.recipient_name}
                                    </p>
                                    <p>
                                        <span className="font-medium">Điện thoại:</span> {activeOrder.recipient_phone}
                                    </p>
                                    <p>
                                        <span className="font-medium">Địa chỉ giao hàng:</span>{" "}
                                        {activeOrder.shipping_address}
                                    </p>
                                    <p>
                                        <span className="font-medium">Ghi chú:</span> {activeOrder.note || "Không có"}
                                    </p>
                                </div>
                                <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                                    <p>
                                        <span className="font-medium">Tạm tính:</span>{" "}
                                        {formatCurrency(Number(activeOrder.subtotal))}
                                    </p>
                                    <p>
                                        <span className="font-medium">Phí vận chuyển:</span>{" "}
                                        {formatCurrency(Number(activeOrder.shipping_fee))}
                                    </p>
                                    <p>
                                        <span className="font-medium">Tổng tiền:</span>{" "}
                                        {formatCurrency(Number(activeOrder.total_amount))}
                                    </p>
                                    <p>
                                        <span className="font-medium">Phương thức thanh toán:</span>{" "}
                                        {customerPaymentMethodLabels[activeOrder.payment_method] ??
                                            fallbackBackendLabel(activeOrder.payment_method)}
                                    </p>
                                    <p>
                                        <span className="font-medium">Trừ kho:</span>{" "}
                                        {activeOrder.stock_deducted ? "Đã trừ" : "Chưa trừ"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                                    <p>
                                        <span className="font-medium">Đơn vị vận chuyển:</span>{" "}
                                        {activeOrder.shipping_carrier ?? "Chưa cập nhật"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Mã vận đơn:</span>{" "}
                                        {activeOrder.shipping_code ?? "Chưa tạo"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Thời điểm giao:</span>{" "}
                                        {activeOrder.shipped_at ? formatDate(activeOrder.shipped_at) : "Chưa giao"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Thời điểm hoàn tất:</span>{" "}
                                        {activeOrder.delivered_at
                                            ? formatDate(activeOrder.delivered_at)
                                            : "Chưa giao xong"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Thời điểm hủy:</span>{" "}
                                        {activeOrder.cancelled_at
                                            ? formatDate(activeOrder.cancelled_at)
                                            : "Chưa hủy"}
                                    </p>
                                </div>
                                <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                                    <p>
                                        <span className="font-medium">Cổng thanh toán:</span>{" "}
                                        {activeOrder.payment?.gateway_name ?? "Không có"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Mã giao dịch:</span>{" "}
                                        {activeOrder.payment?.transaction_code ?? "Không có"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Thanh toán lúc:</span>{" "}
                                        {activeOrder.payment?.paid_at
                                            ? formatDate(activeOrder.payment.paid_at)
                                            : "Chưa thanh toán"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Mã tham chiếu:</span>{" "}
                                        {activeOrder.payment?.gateway_reference ?? "Không có"}
                                    </p>
                                    <p>
                                        <span className="font-medium">Số mặt hàng:</span> {activeOrder.item_count}
                                    </p>
                                </div>
                            </div>

                            {activeOrder.payment_method === "BANK_TRANSFER" ? (
                                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                                    <p className="font-medium">Thông tin chuyển khoản</p>
                                    <div className="mt-3 space-y-2 text-on-surface-variant">
                                        <p>
                                            Ngân hàng:{" "}
                                            {paymentInstructionValue(paymentPayload, "bank_name") || "MB Bank"}
                                        </p>
                                        <p>
                                            Chủ tài khoản:{" "}
                                            {paymentInstructionValue(paymentPayload, "account_name") ||
                                                "HERITAGE HARVEST"}
                                        </p>
                                        <p>
                                            Số tài khoản:{" "}
                                            {paymentInstructionValue(paymentPayload, "account_number") ||
                                                "0123456789"}
                                        </p>
                                        <p>
                                            Nội dung chuyển khoản:{" "}
                                            {paymentInstructionValue(paymentPayload, "transfer_content") ||
                                                activeOrder.order_no}
                                        </p>
                                        <p>
                                            Khách đã báo chuyển khoản:{" "}
                                            {transferSubmitted ? "Đã gửi" : "Chưa gửi"}
                                        </p>
                                        <p>
                                            Thời điểm khách báo:{" "}
                                            {paymentInstructionValue(
                                                paymentPayload,
                                                "customer_transfer_submitted_at",
                                            ) || "Chưa có"}
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Sản phẩm trong đơn
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
                                    Cập nhật trạng thái đơn
                                </p>
                                {activeOrder.status === "DELIVERY_FAILED" ? (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            Đơn giao thất bại. Cần kiểm tra chất lượng hàng hoàn trước khi nhập lại kho.
                                        </div>
                                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap">
                                            <Button
                                                className="lg:flex-1"
                                                onClick={() => void handleDeliveryFailedAction("reshop")}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? "Đang cập nhật..." : "Giao lại"}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                className="lg:flex-1"
                                                onClick={() => void handleDeliveryFailedAction("restock")}
                                                disabled={isSaving}
                                            >
                                                Hủy và nhập lại kho
                                            </Button>
                                            <button
                                                className="rounded-full border border-error/25 px-5 py-3 text-sm font-semibold text-error disabled:opacity-50 lg:flex-1"
                                                disabled={isSaving}
                                                onClick={() => void handleDeliveryFailedAction("dispose")}
                                            >
                                                Hủy nhưng không nhập lại kho
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <select
                                            className="min-w-0 flex-1 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                                            value={nextStatus}
                                            onChange={(event) => setNextStatus(event.target.value)}
                                        >
                                            {activeOrder.allowed_next_statuses.length === 0 ? (
                                                <option value={activeOrder.status}>
                                                    {labelForStatus(activeOrder.status)}
                                                </option>
                                            ) : (
                                                activeOrder.allowed_next_statuses.map((status) => (
                                                    <option key={status} value={status}>
                                                        {labelForStatus(status)}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <Button
                                            onClick={() => void handleUpdateStatus()}
                                            disabled={isSaving || activeOrder.allowed_next_statuses.length === 0}
                                        >
                                            {isSaving ? "Đang cập nhật..." : "Lưu trạng thái đơn"}
                                        </Button>
                                    </div>
                                )}
                                <textarea
                                    className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                    placeholder={
                                        activeOrder.status === "DELIVERY_FAILED"
                                            ? "Nhập ghi chú xử lý giao thất bại hoặc lý do không nhập lại kho"
                                            : "Ghi chú cho lịch sử trạng thái đơn"
                                    }
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                />
                            </div>

                            <div className="space-y-4 rounded-2xl bg-surface-container-low p-4">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Cập nhật thanh toán
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <select
                                        className="min-w-0 flex-1 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                                        value={nextPaymentStatus}
                                        onChange={(event) => setNextPaymentStatus(event.target.value)}
                                    >
                                        {activeOrder.allowed_payment_statuses?.length ? (
                                            activeOrder.allowed_payment_statuses.map((status) => (
                                                <option key={status} value={status}>
                                                    {labelForPaymentStatus(status)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value={activeOrder.payment?.payment_status ?? "PENDING"}>
                                                {labelForPaymentStatus(
                                                    activeOrder.payment?.payment_status ?? "PENDING",
                                                )}
                                            </option>
                                        )}
                                    </select>
                                    <Button
                                        onClick={() => void handleUpdatePaymentStatus()}
                                        disabled={isSaving || !activeOrder.allowed_payment_statuses?.length}
                                    >
                                        {isSaving ? "Đang cập nhật..." : "Lưu trạng thái thanh toán"}
                                    </Button>
                                </div>
                                <textarea
                                    className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                    placeholder="Ghi chú cho lịch sử thanh toán"
                                    value={paymentNote}
                                    onChange={(event) => setPaymentNote(event.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Lịch sử trạng thái đơn
                                </p>
                                {activeOrder.status_history.map((history) => (
                                    <div key={history.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                        <p className="font-medium">
                                            {(history.from_status
                                                ? `${labelForStatus(history.from_status)} -> `
                                                : "") + labelForStatus(history.to_status)}
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

                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Lịch sử thanh toán
                                </p>
                                {activeOrder.payment_status_history.map((history) => (
                                    <div key={history.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                        <p className="font-medium">
                                            {(history.from_status
                                                ? `${labelForPaymentStatus(history.from_status)} -> `
                                                : "") + labelForPaymentStatus(history.to_status)}
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
                    )}
                </SurfaceCard>
            </div>
        </div>
    );
}
