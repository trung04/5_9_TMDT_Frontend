import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import {
    customerOrderStatusLabels,
    customerPaymentMethodLabels,
    customerPaymentStatusLabels,
    fallbackBackendLabel,
} from "@/shared/lib/customer-order-labels";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useCustomerOrdersStore } from "@/shared/lib/store/use-customer-orders-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Icon } from "@/shared/ui";

export function AccountOrdersPage() {
    const navigate = useNavigate();
    const addItem = useCartStore((state) => state.addItem);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const profile = useAccountStore((state) => state.profile);
    const rewards = useAccountStore((state) => state.rewardSnapshot);
    const orders = useCustomerOrdersStore((state) => state.orders);
    const orderDetails = useCustomerOrdersStore((state) => state.orderDetails);
    const pagination = useCustomerOrdersStore((state) => state.pagination);
    const isLoading = useCustomerOrdersStore((state) => state.isLoading);
    const error = useCustomerOrdersStore((state) => state.error);
    const loadOrders = useCustomerOrdersStore((state) => state.loadOrders);
    const loadOrder = useCustomerOrdersStore((state) => state.loadOrder);
    const [activeOrderId, setActiveOrderId] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilterBar, setShowFilterBar] = useState(true);
    const [reorderMessage, setReorderMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        void loadOrders(currentPage);
    }, [currentPage, loadOrders]);

    const availableStatuses = useMemo(
        () => Array.from(new Set(orders.map((order) => order.status))),
        [orders],
    );

    const filteredOrders = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return orders.filter((order) => {
            const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
            const matchesQuery =
                normalizedQuery.length === 0
                    ? true
                    : [order.orderNo, order.id, order.status]
                          .join(" ")
                          .toLowerCase()
                          .includes(normalizedQuery);

            return matchesStatus && matchesQuery;
        });
    }, [orders, searchQuery, statusFilter]);

    const activeOrderSummary =
        filteredOrders.find((order) => order.id === activeOrderId) ?? filteredOrders[0];
    const activeOrder = activeOrderSummary ? orderDetails[activeOrderSummary.id] : undefined;

    useEffect(() => {
        if (!filteredOrders.some((order) => order.id === activeOrderId)) {
            setActiveOrderId(filteredOrders[0]?.id ?? "");
        }
    }, [activeOrderId, filteredOrders]);

    useEffect(() => {
        if (!activeOrderSummary) return;
        if (activeOrder) return;

        void loadOrder(activeOrderSummary.id);
    }, [activeOrder, activeOrderSummary, loadOrder]);

    useEffect(() => {
        setReorderMessage("");
    }, [activeOrderId]);

    async function handleReorder(goToCheckout: boolean) {
        if (!activeOrder) return;

        for (const item of activeOrder.items) {
            const result = await addItem(item.productId, item.quantity);

            if (!result.success) {
                pushToast({
                    tone: "warning",
                    message: result.error ?? "Không thể thêm lại toàn bộ sản phẩm vào giỏ.",
                });
                return;
            }
        }

        const notice = `Đã thêm lại ${activeOrder.items.length} mặt hàng từ đơn ${activeOrder.orderNo} vào giỏ.`;
        setReorderMessage(notice);
        pushToast({
            tone: "success",
            message: notice,
        });

        if (goToCheckout) {
            void navigate(routes.checkout);
        }
    }

    if (!isLoading && orders.length === 0 && error) {
        return (
            <div className="mx-auto max-w-7xl px-6 pb-16 pt-24">
                <div className="rounded-xl bg-surface-container-low p-10 text-center">
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Khong the tai don hang backend
                    </h1>
                    <p className="mt-3 text-on-surface-variant">{error}</p>
                    <button
                        className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary"
                        onClick={() => void loadOrders(currentPage)}
                    >
                        Thu tai lai
                    </button>
                </div>
            </div>
        );
    }

    if (!isLoading && orders.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-6 pb-16 pt-24">
                <div className="rounded-xl bg-surface-container-low p-10 text-center">
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Chưa có đơn hàng backend
                    </h1>
                    <p className="mt-3 text-on-surface-variant">
                        Sau khi checkout thành công, đơn sẽ xuất hiện ở đây và được lấy trực tiếp từ API
                        `/orders`.
                    </p>
                    <button
                        className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary"
                        onClick={() => void navigate(routes.products)}
                    >
                        Mở cửa hàng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-6 pb-16 pt-24 md:flex-row">
            <aside className="flex w-full flex-col gap-6 md:w-80">
                <div className="rounded-xl bg-surface-container-lowest p-8">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="h-24 w-24 overflow-hidden rounded-full bg-surface-container">
                            <img
                                src={profile.avatar}
                                alt={profile.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="font-headline text-xl font-bold text-on-surface">
                                {profile.name}
                            </h2>
                            <p className="text-sm text-on-surface-variant">
                                Thành viên từ {formatDate(profile.memberSince)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 space-y-2">
                        <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-semibold text-green-800 shadow-sm">
                            <Icon name="shopping_bag" />
                            <span className="text-sm">Đơn hàng backend</span>
                        </div>
                        <button
                            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-zinc-600 transition-transform hover:translate-x-1 hover:bg-zinc-100"
                            onClick={() => void navigate(routes.accountProfile)}
                        >
                            <Icon name="person" />
                            <span className="text-sm">Thông tin cá nhân</span>
                        </button>
                        <button
                            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-zinc-600 transition-transform hover:translate-x-1 hover:bg-zinc-100"
                            onClick={() => void navigate(routes.accountDisputes)}
                        >
                            <Icon name="gavel" />
                            <span className="text-sm">Khiếu nại & hỗ trợ</span>
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl bg-tertiary-container p-6 text-on-tertiary-container">
                    <div className="relative z-10">
                        <h3 className="mb-2 text-lg font-bold">Điểm thưởng hội viên</h3>
                        <p className="mb-4 text-xs opacity-90">
                            Khu rewards hiện vẫn dùng local store. Bạn đang có {rewards.points} điểm.
                        </p>
                        <button
                            className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-tertiary-container"
                            onClick={() => void navigate(routes.accountRewards)}
                        >
                            Mở khu rewards
                        </button>
                    </div>
                    <div className="absolute -bottom-4 -right-4 rotate-12 opacity-20">
                        <Icon name="stars" className="text-8xl" fill />
                    </div>
                </div>
            </aside>

            <section className="flex-1 space-y-8">
                <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="font-headline text-3xl font-bold tracking-tight">
                            Lịch sử đơn hàng
                        </h1>
                        <p className="mt-1 text-on-surface-variant">
                            Theo dõi đơn hàng customer lấy trực tiếp từ backend Laravel.
                        </p>
                    </div>
                    <button
                        className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-all hover:opacity-90"
                        onClick={() => setShowFilterBar((value) => !value)}
                    >
                        <Icon name="filter_list" className="text-sm" />
                        {showFilterBar ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                    </button>
                </header>

                <div className="overflow-hidden rounded-xl bg-surface-container-lowest">
                    {showFilterBar ? (
                        <div className="border-b border-outline-variant/15 p-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <input
                                    className="w-full max-w-xl rounded-full bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                    placeholder="Tìm theo mã đơn hoặc trạng thái..."
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                />
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className={`rounded-full px-4 py-2 text-xs font-medium ${
                                            statusFilter === "all"
                                                ? "bg-surface-container-low text-on-surface"
                                                : "text-on-surface-variant hover:bg-surface-container-low"
                                        }`}
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        Tất cả
                                    </button>
                                    {availableStatuses.map((status) => (
                                        <button
                                            key={status}
                                            className={`rounded-full px-4 py-2 text-xs font-medium ${
                                                statusFilter === status
                                                    ? "bg-surface-container-low text-on-surface"
                                                    : "text-on-surface-variant hover:bg-surface-container-low"
                                            }`}
                                            onClick={() => setStatusFilter(status)}
                                        >
                                            {customerOrderStatusLabels[status] ?? fallbackBackendLabel(status)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="border-b border-outline-variant/15 bg-surface-container-low">
                                <tr>
                                    {["Mã đơn", "Ngày", "Tổng tiền", "Trạng thái", "Thao tác"].map(
                                        (title) => (
                                            <th
                                                key={title}
                                                className={`px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant ${
                                                    title === "Thao tác" ? "text-right" : ""
                                                }`}
                                            >
                                                {title}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={`group cursor-pointer transition-colors hover:bg-surface-container-low ${
                                            order.id === activeOrderSummary?.id
                                                ? "bg-surface-container-low"
                                                : ""
                                        }`}
                                        onClick={() => setActiveOrderId(order.id)}
                                    >
                                        <td className="px-6 py-5 text-sm font-bold">{order.orderNo}</td>
                                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                                            {customerOrderStatusLabels[order.status] ??
                                                fallbackBackendLabel(order.status)}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                className="text-sm font-medium text-primary hover:underline"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setActiveOrderId(order.id);
                                                }}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {pagination && pagination.lastPage > 1 ? (
                    <div className="flex items-center justify-end gap-3">
                        <button
                            className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface-variant disabled:opacity-40"
                            disabled={pagination.currentPage <= 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        >
                            Trang trước
                        </button>
                        <span className="text-sm text-on-surface-variant">
                            Trang {pagination.currentPage} / {pagination.lastPage}
                        </span>
                        <button
                            className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface-variant disabled:opacity-40"
                            disabled={pagination.currentPage >= pagination.lastPage}
                            onClick={() =>
                                setCurrentPage((page) => Math.min(pagination.lastPage, page + 1))
                            }
                        >
                            Trang sau
                        </button>
                    </div>
                ) : null}

                {activeOrderSummary ? (
                    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                        <div className="space-y-6 rounded-xl bg-surface-container-low p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Theo dõi {activeOrderSummary.orderNo}
                                    </p>
                                    <h2 className="mt-2 font-headline text-2xl font-bold">
                                        {customerOrderStatusLabels[activeOrderSummary.status] ??
                                            fallbackBackendLabel(activeOrderSummary.status)}
                                    </h2>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        className="rounded-full border border-outline-variant/25 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
                                        onClick={() => void handleReorder(false)}
                                    >
                                        Thêm lại vào giỏ
                                    </button>
                                    <button
                                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                                        onClick={() => void handleReorder(true)}
                                    >
                                        Thanh toán lại
                                    </button>
                                </div>
                            </div>

                            {reorderMessage ? (
                                <div className="rounded-xl bg-on-primary-container p-4 text-sm text-primary">
                                    {reorderMessage}
                                </div>
                            ) : null}

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-xl bg-surface-container-lowest p-5">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Ngày đặt
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        {formatDate(activeOrderSummary.createdAt)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-surface-container-lowest p-5">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Tổng đơn
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        {formatCurrency(activeOrderSummary.totalAmount)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-surface-container-lowest p-5">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Thanh toán
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        {customerPaymentMethodLabels[activeOrderSummary.paymentMethod] ??
                                            fallbackBackendLabel(activeOrderSummary.paymentMethod)}
                                    </p>
                                </div>
                            </div>

                            {activeOrder ? (
                                <>
                                    <div className="space-y-3 rounded-xl bg-surface-container-lowest p-5">
                                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            Các mặt hàng trong đơn
                                        </p>
                                        {activeOrder.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start justify-between gap-4 border-b border-outline-variant/15 pb-3 last:border-0 last:pb-0"
                                            >
                                                <div>
                                                    <p className="font-semibold">
                                                        {item.productNameSnapshot}
                                                    </p>
                                                    <p className="mt-1 text-sm text-on-surface-variant">
                                                        {item.quantity} x {formatCurrency(item.unitPrice)}
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
                                                    {formatCurrency(item.lineTotal)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4 rounded-xl bg-surface-container-lowest p-5">
                                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            Trạng thái & thanh toán
                                        </p>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm text-on-surface-variant">Trạng thái đơn</p>
                                                <p className="mt-1 font-semibold">
                                                    {customerOrderStatusLabels[activeOrder.status] ??
                                                        fallbackBackendLabel(activeOrder.status)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-on-surface-variant">Trạng thái thanh toán</p>
                                                <p className="mt-1 font-semibold">
                                                    {activeOrder.payment
                                                        ? customerPaymentStatusLabels[
                                                              activeOrder.payment.paymentStatus
                                                          ] ??
                                                          fallbackBackendLabel(
                                                              activeOrder.payment.paymentStatus,
                                                          )
                                                        : "Chưa có dữ liệu"}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-on-surface-variant">Địa chỉ nhận</p>
                                            <p className="mt-1 font-semibold">{activeOrder.shippingAddress}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-on-surface-variant">Ghi chú</p>
                                            <p className="mt-1 font-semibold">
                                                {activeOrder.note || "Không có ghi chú."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {activeOrder.statusHistory.length > 0 ? (
                                            activeOrder.statusHistory.map((event) => (
                                                <div key={event.id} className="flex gap-4">
                                                    <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
                                                    <div>
                                                        <p className="font-semibold">
                                                            {customerOrderStatusLabels[event.toStatus] ??
                                                                fallbackBackendLabel(event.toStatus)}
                                                        </p>
                                                        <p className="text-sm text-on-surface-variant">
                                                            {formatDate(event.changedAt)}
                                                        </p>
                                                        {event.note ? (
                                                            <p className="text-sm text-on-surface-variant">
                                                                {event.note}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                                                Backend chưa trả về lịch sử trạng thái cho đơn này.
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                                    Đang tải chi tiết đơn hàng...
                                </div>
                            )}
                        </div>

                        <div className="space-y-5 rounded-xl bg-surface-container-lowest p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-headline text-2xl font-bold">
                                        Khiếu nại & hỗ trợ
                                    </h2>
                                    <p className="mt-2 text-sm text-on-surface-variant">
                                        Frontend đã cô lập form complaint vì backend hiện chưa có customer
                                        complaint API tương thích cho flow thật.
                                    </p>
                                </div>
                                <span className="rounded-full bg-tertiary/10 px-3 py-1 text-xs uppercase tracking-widest text-tertiary">
                                    Read-only
                                </span>
                            </div>

                            <div className="rounded-xl bg-surface-container-low p-5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-on-surface-variant">Mã đơn</span>
                                    <span className="font-semibold">{activeOrderSummary.orderNo}</span>
                                </div>
                                <div className="mt-2 flex justify-between">
                                    <span className="text-on-surface-variant">Tổng đơn</span>
                                    <span className="font-semibold">
                                        {formatCurrency(activeOrderSummary.totalAmount)}
                                    </span>
                                </div>
                                <div className="mt-2 flex justify-between">
                                    <span className="text-on-surface-variant">Thanh toán</span>
                                    <span className="font-semibold">
                                        {activeOrderSummary.payment
                                            ? customerPaymentStatusLabels[
                                                  activeOrderSummary.payment.paymentStatus
                                              ] ??
                                              fallbackBackendLabel(
                                                  activeOrderSummary.payment.paymentStatus,
                                              )
                                            : "Chưa có dữ liệu"}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-dashed border-outline-variant/30 p-5 text-sm leading-7 text-on-surface-variant">
                                Khi backend bổ sung API khiếu nại customer, khối này sẽ được mở lại để gửi
                                complaint thật gắn với đơn hàng đang chọn.
                            </div>
                        </div>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
