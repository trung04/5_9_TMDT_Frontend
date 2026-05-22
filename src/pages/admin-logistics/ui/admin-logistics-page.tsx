import { useEffect, useMemo, useState } from "react";

import type {
    BackendAdminOrderDetail,
    BackendAdminOrderSummary,
    BackendBulkOrderStatusResult,
} from "@/shared/api/backend-types";
import { hasAdminPermission } from "@/shared/lib/auth";
import {
    customerOrderStatusLabels,
    customerPaymentMethodLabels,
    customerPaymentStatusLabels,
    fallbackBackendLabel,
} from "@/shared/lib/customer-order-labels";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { useAdminOrdersStore } from "@/shared/lib/store/use-admin-orders-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import type { StatusTone, TableColumn } from "@/shared/types/ui";
import { AdminDrawer, Badge, Button, DataTable, Icon, SurfaceCard, cn } from "@/shared/ui";

const ORDER_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "DELIVERY_FAILED",
    "CANCELLED",
] as const;

type BulkAction = "CONFIRM" | "PACK" | "SHIP" | "DELIVER" | "MARK_DELIVERY_FAILED" | "CANCEL" | "RESHIP";

const BULK_ACTION_LABELS: Record<BulkAction, string> = {
    CONFIRM: "Xac nhan don",
    PACK: "Dong goi",
    SHIP: "Ban giao van chuyen",
    DELIVER: "Danh dau giao thanh cong",
    MARK_DELIVERY_FAILED: "Danh dau giao that bai",
    CANCEL: "Huy don",
    RESHIP: "Giao lai",
};

function labelForStatus(status: string) {
    return customerOrderStatusLabels[status] ?? fallbackBackendLabel(status);
}

function labelForPaymentStatus(status: string) {
    return customerPaymentStatusLabels[status] ?? fallbackBackendLabel(status);
}

function orderStatusTone(status: string): StatusTone {
    if (status === "DELIVERED") return "success";
    if (status === "DELIVERY_FAILED" || status === "CANCELLED") return "danger";
    if (status === "SHIPPED" || status === "PACKED") return "primary";
    if (status === "CONFIRMED") return "secondary";
    return "warning";
}

function paymentStatusTone(status: string | undefined): StatusTone {
    if (status === "SUCCESS") return "success";
    if (status === "FAILED" || status === "CANCELLED" || status === "REFUNDED") return "danger";
    if (status === "PENDING") return "warning";
    return "neutral";
}

function paymentInstructionValue(payload: Record<string, unknown> | null | undefined, key: string) {
    const value = payload?.[key];
    return typeof value === "string" ? value : "";
}

function bulkActionsForFilter(statusFilter: string): BulkAction[] {
    switch (statusFilter) {
        case "PENDING":
            return ["CONFIRM", "CANCEL"];
        case "CONFIRMED":
            return ["PACK", "CANCEL"];
        case "PACKED":
            return ["SHIP", "CANCEL"];
        case "SHIPPED":
            return ["DELIVER", "MARK_DELIVERY_FAILED"];
        case "DELIVERY_FAILED":
            return ["RESHIP", "CANCEL"];
        case "DELIVERED":
        case "CANCELLED":
            return [];
        default:
            return ["CONFIRM", "PACK", "SHIP", "DELIVER", "MARK_DELIVERY_FAILED", "CANCEL", "RESHIP"];
    }
}

function FieldValue({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
        <div className="rounded-2xl bg-surface-container-low p-4 text-sm">
            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
            <p className="mt-2 font-medium text-on-surface">{value || "Chua cap nhat"}</p>
        </div>
    );
}

function ActionButton({
    label,
    icon,
    disabled,
    onClick,
    tone = "neutral",
}: {
    label: string;
    icon: string;
    disabled?: boolean;
    onClick: () => void;
    tone?: "neutral" | "primary" | "danger";
}) {
    return (
        <button
            type="button"
            className={cn(
                "rounded-xl p-2 transition disabled:cursor-not-allowed disabled:opacity-40",
                tone === "danger"
                    ? "text-error hover:bg-error-container/40"
                    : tone === "primary"
                      ? "text-primary hover:bg-primary/10"
                      : "text-on-surface-variant hover:bg-surface-container-low",
            )}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
        >
            <Icon name={icon} className="text-xl" />
        </button>
    );
}

function OrderSummaryGrid({ order }: { order: BackendAdminOrderDetail }) {
    const paymentPayload = order.payment?.raw_payload ?? null;
    const transferSubmitted = Boolean(paymentPayload?.customer_transfer_submitted);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <FieldValue label="Khach hang" value={order.customer?.full_name ?? "Khach vang lai"} />
                <FieldValue label="Email" value={order.customer?.email} />
                <FieldValue label="Nguoi nhan" value={order.recipient_name} />
                <FieldValue label="Dien thoai" value={order.recipient_phone} />
                <FieldValue label="Dia chi giao" value={order.shipping_address} />
                <FieldValue label="Ghi chu" value={order.note} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <FieldValue label="Tam tinh" value={formatCurrency(Number(order.subtotal))} />
                <FieldValue label="Phi giao" value={formatCurrency(Number(order.shipping_fee))} />
                <FieldValue label="Tong tien" value={formatCurrency(Number(order.total_amount))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                    <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
                        Van chuyen
                    </p>
                    <p>Don vi: {order.shipping_carrier ?? "Chua cap nhat"}</p>
                    <p>Ma van don: {order.shipping_code ?? "Chua tao"}</p>
                    <p>Thoi diem giao: {order.shipped_at ? formatDate(order.shipped_at) : "Chua giao"}</p>
                    <p>Hoan tat: {order.delivered_at ? formatDate(order.delivered_at) : "Chua giao xong"}</p>
                    <p>Huy don: {order.cancelled_at ? formatDate(order.cancelled_at) : "Chua huy"}</p>
                </div>
                <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                    <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
                        Thanh toan
                    </p>
                    <p>
                        Phuong thuc:{" "}
                        {customerPaymentMethodLabels[order.payment_method] ?? fallbackBackendLabel(order.payment_method)}
                    </p>
                    <p>Cong: {order.payment?.gateway_name ?? "Khong co"}</p>
                    <p>Ma giao dich: {order.payment?.transaction_code ?? "Khong co"}</p>
                    <p>Ma tham chieu: {order.payment?.gateway_reference ?? "Khong co"}</p>
                    <p>Thanh toan luc: {order.payment?.paid_at ? formatDate(order.payment.paid_at) : "Chua thanh toan"}</p>
                </div>
            </div>

            {order.payment_method === "BANK_TRANSFER" ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                    <p className="font-medium">Thong tin chuyen khoan</p>
                    <div className="mt-3 space-y-2 text-on-surface-variant">
                        <p>Ngan hang: {paymentInstructionValue(paymentPayload, "bank_name") || "MB Bank"}</p>
                        <p>Chu tai khoan: {paymentInstructionValue(paymentPayload, "account_name") || "HERITAGE HARVEST"}</p>
                        <p>So tai khoan: {paymentInstructionValue(paymentPayload, "account_number") || "0123456789"}</p>
                        <p>Noi dung: {paymentInstructionValue(paymentPayload, "transfer_content") || order.order_no}</p>
                        <p>Khach da bao chuyen khoan: {transferSubmitted ? "Da gui" : "Chua gui"}</p>
                        <p>
                            Thoi diem khach bao:{" "}
                            {paymentInstructionValue(paymentPayload, "customer_transfer_submitted_at") || "Chua co"}
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function AdminLogisticsPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeOrderId, setActiveOrderId] = useState("");
    const [detailOpen, setDetailOpen] = useState(false);
    const [nextStatus, setNextStatus] = useState("PENDING");
    const [nextPaymentStatus, setNextPaymentStatus] = useState("PENDING");
    const [note, setNote] = useState("");
    const [paymentNote, setPaymentNote] = useState("");
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<BulkAction | "">("");
    const [bulkResult, setBulkResult] = useState<BackendBulkOrderStatusResult | null>(null);
    const orders = useAdminOrdersStore((state) => state.orders);
    const orderDetails = useAdminOrdersStore((state) => state.orderDetails);
    const isLoading = useAdminOrdersStore((state) => state.isLoading);
    const isSaving = useAdminOrdersStore((state) => state.isSaving);
    const error = useAdminOrdersStore((state) => state.error);
    const loadOrders = useAdminOrdersStore((state) => state.loadOrders);
    const loadOrder = useAdminOrdersStore((state) => state.loadOrder);
    const updateStatus = useAdminOrdersStore((state) => state.updateStatus);
    const updatePaymentStatus = useAdminOrdersStore((state) => state.updatePaymentStatus);
    const bulkUpdateStatus = useAdminOrdersStore((state) => state.bulkUpdateStatus);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const user = useAuthStore((state) => state.session?.user ?? null);
    const canUpdateOrderStatus = hasAdminPermission(user, "admin.orders.status.update");
    const canUpdatePaymentStatus = hasAdminPermission(user, "admin.orders.payment.update");
    const canBulkUpdateOrders = hasAdminPermission(user, "admin.orders.bulk.update");

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

    const activeOrderSummary = activeOrderId
        ? orders.find((order) => String(order.id) === activeOrderId)
        : undefined;
    const activeOrder = activeOrderId ? orderDetails[activeOrderId] : undefined;
    const availableBulkActions = useMemo(() => bulkActionsForFilter(statusFilter), [statusFilter]);
    const isAllFilteredSelected =
        filteredOrders.length > 0 && filteredOrders.every((order) => selectedOrderIds.includes(String(order.id)));

    useEffect(() => {
        if (!detailOpen || !activeOrderSummary || activeOrder) {
            return;
        }

        void loadOrder(String(activeOrderSummary.id));
    }, [activeOrder, activeOrderSummary, detailOpen, loadOrder]);

    useEffect(() => {
        if (!activeOrderSummary) {
            return;
        }

        const detail = activeOrder ?? null;
        const allowedNextStatuses = detail?.allowed_next_statuses ?? [];
        const allowedPaymentStatuses = detail?.allowed_payment_statuses ?? [];

        setNextStatus(allowedNextStatuses[0] ?? activeOrderSummary.status);
        setNextPaymentStatus(allowedPaymentStatuses[0] ?? activeOrderSummary.payment?.payment_status ?? "PENDING");
        setNote("");
        setPaymentNote("");
    }, [activeOrder, activeOrderSummary]);

    useEffect(() => {
        setSelectedOrderIds((current) =>
            current.filter((id) => orders.some((order) => String(order.id) === id)),
        );
    }, [orders]);

    useEffect(() => {
        setBulkAction((current) => {
            if (!availableBulkActions.length) {
                return "";
            }

            return current && availableBulkActions.includes(current) ? current : availableBulkActions[0];
        });
    }, [availableBulkActions]);

    function openOrder(orderId: string) {
        setActiveOrderId(orderId);
        setDetailOpen(true);
    }

    async function handleUpdateStatus() {
        if (!canUpdateOrderStatus) {
            pushToast({ tone: "warning", message: "Ban chua co quyen cap nhat trang thai don hang." });
            return;
        }

        if (!activeOrderSummary || !activeOrder) {
            return;
        }

        if (!activeOrder.allowed_next_statuses.includes(nextStatus)) {
            pushToast({ tone: "warning", message: "Trang thai don hang khong hop le cho buoc tiep theo." });
            return;
        }

        const result = await updateStatus(String(activeOrderSummary.id), nextStatus, note);

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat trang thai don hang." });
            return;
        }

        pushToast({
            tone: "success",
            message: `Da cap nhat ${result.data.order_no} sang ${labelForStatus(result.data.status)}.`,
        });
        setNote("");
    }

    async function handleUpdatePaymentStatus() {
        if (!canUpdatePaymentStatus) {
            pushToast({ tone: "warning", message: "Ban chua co quyen cap nhat thanh toan." });
            return;
        }

        if (!activeOrderSummary || !activeOrder) {
            return;
        }

        if (!activeOrder.allowed_payment_statuses?.includes(nextPaymentStatus)) {
            pushToast({ tone: "warning", message: "Trang thai thanh toan khong hop le cho buoc tiep theo." });
            return;
        }

        const result = await updatePaymentStatus(String(activeOrderSummary.id), nextPaymentStatus, paymentNote);

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat trang thai thanh toan." });
            return;
        }

        pushToast({
            tone: "success",
            message: `Da cap nhat thanh toan ${result.data.order_no} sang ${labelForPaymentStatus(
                result.data.payment?.payment_status ?? nextPaymentStatus,
            )}.`,
        });
        setPaymentNote("");
    }

    async function handleDeliveryFailedAction(action: "reshop" | "restock" | "dispose") {
        if (!canUpdateOrderStatus) {
            pushToast({ tone: "warning", message: "Ban chua co quyen cap nhat trang thai don hang." });
            return;
        }

        if (!activeOrderSummary || !activeOrder) {
            return;
        }

        if (action === "dispose" && !note.trim()) {
            pushToast({ tone: "warning", message: "Vui long nhap ly do khi huy nhung khong nhap lai kho." });
            return;
        }

        const result =
            action === "reshop"
                ? await updateStatus(String(activeOrderSummary.id), "SHIPPED", note)
                : await updateStatus(String(activeOrderSummary.id), "CANCELLED", note, {
                      restockInventory: action === "restock",
                  });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat xu ly giao hang that bai." });
            return;
        }

        pushToast({
            tone: "success",
            message:
                action === "reshop"
                    ? `Da chuyen ${result.data.order_no} sang trang thai ${labelForStatus(result.data.status)}.`
                    : `Da huy ${result.data.order_no} thanh cong.`,
        });
        setNote("");
    }

    function toggleOrderSelection(orderId: string, checked: boolean) {
        setSelectedOrderIds((current) =>
            checked ? Array.from(new Set([...current, orderId])) : current.filter((id) => id !== orderId),
        );
    }

    function handleToggleSelectAll(checked: boolean) {
        setSelectedOrderIds((current) => {
            const filteredIds = filteredOrders.map((order) => String(order.id));

            if (checked) {
                return Array.from(new Set([...current, ...filteredIds]));
            }

            return current.filter((id) => !filteredIds.includes(id));
        });
    }

    async function handleApplyBulkAction() {
        if (!canBulkUpdateOrders) {
            pushToast({ tone: "warning", message: "Ban chua co quyen xu ly hang loat don hang." });
            return;
        }

        if (!selectedOrderIds.length || !bulkAction) {
            return;
        }

        const result = await bulkUpdateStatus({
            orderIds: selectedOrderIds.map((id) => Number(id)),
            action: bulkAction,
            note: note || undefined,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the xu ly hang loat don hang." });
            return;
        }

        setBulkResult(result.data);
        pushToast({
            tone: result.data.failed > 0 ? "warning" : "success",
            message: `Da xu ly ${result.data.total} don: ${result.data.success} thanh cong, ${result.data.failed} that bai.`,
        });

        const successIds = result.data.results.filter((item) => item.success).map((item) => String(item.orderId));
        setSelectedOrderIds((current) => current.filter((id) => !successIds.includes(id)));

        const refreshResult = await loadOrders();

        if (activeOrderId && refreshResult.success) {
            await loadOrder(activeOrderId);
        }
    }

    const columns: TableColumn<BackendAdminOrderSummary>[] = [
        ...(canBulkUpdateOrders
            ? [
                  {
                      key: "select",
                      title: (
                          <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-outline-variant/30"
                              checked={isAllFilteredSelected}
                              onChange={(event) => handleToggleSelectAll(event.target.checked)}
                              onClick={(event) => event.stopPropagation()}
                              aria-label="Chon tat ca don hang"
                          />
                      ),
                      className: "w-14",
                      align: "center" as const,
                      render: (order: BackendAdminOrderSummary) => {
                          const orderId = String(order.id);

                          return (
                              <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-outline-variant/30"
                                  checked={selectedOrderIds.includes(orderId)}
                                  onChange={(event) => toggleOrderSelection(orderId, event.target.checked)}
                                  onClick={(event) => event.stopPropagation()}
                                  aria-label={`Chon don ${order.order_no}`}
                              />
                          );
                      },
                  },
              ]
            : []),
        {
            key: "order",
            title: "Don hang",
            render: (order) => (
                <div>
                    <p className="font-semibold text-on-surface">{order.order_no}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{formatDate(order.created_at)}</p>
                </div>
            ),
        },
        {
            key: "customer",
            title: "Khach hang",
            render: (order) => (
                <div>
                    <p className="font-medium">{order.customer?.full_name ?? "Khach vang lai"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{order.customer?.email ?? "Chua co email"}</p>
                </div>
            ),
        },
        {
            key: "total",
            title: "Tong tien",
            align: "right",
            render: (order) => <span className="font-semibold">{formatCurrency(Number(order.total_amount))}</span>,
        },
        {
            key: "status",
            title: "Trang thai",
            render: (order) => <Badge tone={orderStatusTone(order.status)}>{labelForStatus(order.status)}</Badge>,
        },
        {
            key: "payment",
            title: "Thanh toan",
            render: (order) => {
                const status = order.payment?.payment_status;

                return <Badge tone={paymentStatusTone(status)}>{labelForPaymentStatus(status ?? "PENDING")}</Badge>;
            },
        },
        {
            key: "shipping",
            title: "Van don",
            render: (order) => (
                <div>
                    <p className="font-medium">{order.shipping_code ?? "Chua tao"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{order.shipping_carrier ?? "Chua co DVVC"}</p>
                </div>
            ),
        },
        {
            key: "actions",
            title: "Actions",
            align: "right",
            render: (order) => (
                <div className="flex justify-end gap-1">
                    <ActionButton
                        label={`Xem ${order.order_no}`}
                        icon="visibility"
                        tone="primary"
                        onClick={() => openOrder(String(order.id))}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <input
                    className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                    placeholder="Loc theo ma don, khach hang, email, ma van don..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
                <select
                    className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tat ca trang thai</option>
                    {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {labelForStatus(status)}
                        </option>
                    ))}
                </select>
            </div>

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            <SurfaceCard className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="font-headline text-xl font-semibold text-on-surface">Danh sach don hang</h3>
                        <p className="mt-1 text-sm text-on-surface-variant">{filteredOrders.length} don dang hien thi</p>
                    </div>
                </div>

                {canBulkUpdateOrders && selectedOrderIds.length > 0 ? (
                    <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                        <div className="text-sm font-semibold text-on-surface">Da chon {selectedOrderIds.length} don</div>
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <select
                                className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                                value={bulkAction}
                                onChange={(event) => setBulkAction(event.target.value as BulkAction | "")}
                            >
                                {availableBulkActions.length === 0 ? (
                                    <option value="">Khong co thao tac phu hop</option>
                                ) : (
                                    availableBulkActions.map((action) => (
                                        <option key={action} value={action}>
                                            {BULK_ACTION_LABELS[action]}
                                        </option>
                                    ))
                                )}
                            </select>
                            <Button
                                onClick={() => void handleApplyBulkAction()}
                                disabled={isSaving || !bulkAction || availableBulkActions.length === 0}
                            >
                                {isSaving ? "Dang xu ly..." : "Ap dung"}
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedOrderIds([])} disabled={isSaving}>
                                Bo chon
                            </Button>
                        </div>
                    </div>
                ) : null}

                <DataTable
                    rows={filteredOrders}
                    columns={columns}
                    getRowKey={(order) => String(order.id)}
                    isLoading={isLoading && orders.length === 0}
                    loadingMessage="Dang tai danh sach don hang..."
                    emptyMessage="Chua co don hang nao phu hop voi bo loc hien tai."
                    minWidth="980px"
                    pagination={{ pageSize: 8, itemLabel: "don hang" }}
                    rowClassName={(order) =>
                        selectedOrderIds.includes(String(order.id)) ? "bg-primary/5 hover:bg-primary/10" : undefined
                    }
                    onRowClick={(order) => openOrder(String(order.id))}
                />
            </SurfaceCard>

            <AdminDrawer
                open={detailOpen}
                mode="view"
                title={activeOrderSummary?.order_no ?? "Chi tiet don hang"}
                subtitle={
                    activeOrderSummary ? (
                        <div className="flex flex-wrap gap-2">
                            <Badge tone={orderStatusTone(activeOrderSummary.status)}>
                                {labelForStatus(activeOrderSummary.status)}
                            </Badge>
                            <Badge tone={paymentStatusTone(activeOrderSummary.payment?.payment_status)}>
                                {labelForPaymentStatus(activeOrderSummary.payment?.payment_status ?? "PENDING")}
                            </Badge>
                        </div>
                    ) : null
                }
                onClose={() => setDetailOpen(false)}
                footer={
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>
                            Dong
                        </Button>
                    </div>
                }
            >
                {!activeOrderSummary ? (
                    <p className="text-sm text-on-surface-variant">Chua chon don hang.</p>
                ) : !activeOrder ? (
                    <p className="text-sm text-on-surface-variant">Dang tai chi tiet don hang...</p>
                ) : (
                    <div className="space-y-6">
                        <OrderSummaryGrid order={activeOrder} />

                        <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
                            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
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
                            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
                                Cap nhat trang thai don
                            </p>
                            {activeOrder.status === "DELIVERY_FAILED" ? (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        Don giao that bai. Can kiem tra chat luong hang hoan truoc khi nhap lai kho.
                                    </div>
                                    <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap">
                                        <Button
                                            className="lg:flex-1"
                                            onClick={() => void handleDeliveryFailedAction("reshop")}
                                            disabled={isSaving || !canUpdateOrderStatus}
                                        >
                                            {isSaving ? "Dang cap nhat..." : "Giao lai"}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="lg:flex-1"
                                            onClick={() => void handleDeliveryFailedAction("restock")}
                                            disabled={isSaving || !canUpdateOrderStatus}
                                        >
                                            Huy va nhap lai kho
                                        </Button>
                                        <button
                                            type="button"
                                            className="rounded-full border border-error/25 px-5 py-3 text-sm font-semibold text-error disabled:opacity-50 lg:flex-1"
                                            disabled={isSaving || !canUpdateOrderStatus}
                                            onClick={() => void handleDeliveryFailedAction("dispose")}
                                        >
                                            Huy khong nhap kho
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <select
                                        className="min-w-0 flex-1 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                                        value={nextStatus}
                                        disabled={!canUpdateOrderStatus}
                                        onChange={(event) => setNextStatus(event.target.value)}
                                    >
                                        {activeOrder.allowed_next_statuses.length === 0 ? (
                                            <option value={activeOrder.status}>{labelForStatus(activeOrder.status)}</option>
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
                                        disabled={
                                            isSaving ||
                                            activeOrder.allowed_next_statuses.length === 0 ||
                                            !canUpdateOrderStatus
                                        }
                                    >
                                        {isSaving ? "Dang cap nhat..." : "Luu trang thai don"}
                                    </Button>
                                </div>
                            )}
                            <textarea
                                className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                disabled={!canUpdateOrderStatus}
                                placeholder={
                                    activeOrder.status === "DELIVERY_FAILED"
                                        ? "Ghi chu xu ly giao that bai hoac ly do khong nhap lai kho"
                                        : "Ghi chu cho lich su trang thai don"
                                }
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                            />
                        </div>

                        <div className="space-y-4 rounded-2xl bg-surface-container-low p-4">
                            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
                                Cap nhat thanh toan
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <select
                                    className="min-w-0 flex-1 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                                    value={nextPaymentStatus}
                                    disabled={!canUpdatePaymentStatus}
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
                                            {labelForPaymentStatus(activeOrder.payment?.payment_status ?? "PENDING")}
                                        </option>
                                    )}
                                </select>
                                <Button
                                    onClick={() => void handleUpdatePaymentStatus()}
                                    disabled={
                                        isSaving ||
                                        !activeOrder.allowed_payment_statuses?.length ||
                                        !canUpdatePaymentStatus
                                    }
                                >
                                    {isSaving ? "Dang cap nhat..." : "Luu thanh toan"}
                                </Button>
                            </div>
                            <textarea
                                className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                disabled={!canUpdatePaymentStatus}
                                placeholder="Ghi chu cho lich su thanh toan"
                                value={paymentNote}
                                onChange={(event) => setPaymentNote(event.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
                                Lich su trang thai don
                            </p>
                            {activeOrder.status_history.map((history) => (
                                <div key={history.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                    <p className="font-medium">
                                        {(history.from_status ? `${labelForStatus(history.from_status)} -> ` : "") +
                                            labelForStatus(history.to_status)}
                                    </p>
                                    <p className="mt-1 text-on-surface-variant">{formatDate(history.changed_at)}</p>
                                    {history.note ? <p className="mt-2 text-on-surface-variant">{history.note}</p> : null}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
                                Lich su thanh toan
                            </p>
                            {activeOrder.payment_status_history.map((history) => (
                                <div key={history.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                    <p className="font-medium">
                                        {(history.from_status
                                            ? `${labelForPaymentStatus(history.from_status)} -> `
                                            : "") + labelForPaymentStatus(history.to_status)}
                                    </p>
                                    <p className="mt-1 text-on-surface-variant">{formatDate(history.changed_at)}</p>
                                    {history.note ? <p className="mt-2 text-on-surface-variant">{history.note}</p> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </AdminDrawer>

            {bulkResult ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
                    <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-semibold text-on-surface">Ket qua xu ly</h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    Da xu ly {bulkResult.total} don: {bulkResult.success} thanh cong,{" "}
                                    {bulkResult.failed} that bai.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full bg-surface-container px-4 py-2 text-sm font-medium"
                                onClick={() => setBulkResult(null)}
                            >
                                Dong
                            </button>
                        </div>

                        <div className="mt-6 space-y-3">
                            {bulkResult.results.map((item) => (
                                <div
                                    key={`${item.orderId}-${item.orderNo}`}
                                    className={cn(
                                        "rounded-2xl border px-4 py-4 text-sm",
                                        item.success
                                            ? "border-green-200 bg-green-50 text-green-900"
                                            : "border-red-200 bg-red-50 text-red-900",
                                    )}
                                >
                                    <p className="font-semibold">
                                        {item.orderNo ?? `Don #${item.orderId}`}:{" "}
                                        {item.success ? "Thanh cong" : "That bai"}
                                    </p>
                                    <p className="mt-1">{item.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
