import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import {
    customerOrderStatusLabels,
    customerPaymentMethodLabels,
    customerPaymentStatusLabels,
    fallbackBackendLabel,
} from "@/shared/lib/customer-order-labels";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { useCustomerOrdersStore } from "@/shared/lib/store/use-customer-orders-store";
import { Badge, ButtonLink, SurfaceCard } from "@/shared/ui";

export function OrderSuccessPage() {
    const { orderId } = useParams();
    const order = useCustomerOrdersStore((state) =>
        orderId ? state.orderDetails[orderId] : undefined,
    );
    const loadOrder = useCustomerOrdersStore((state) => state.loadOrder);
    const isLoading = useCustomerOrdersStore((state) => state.isLoading);

    useEffect(() => {
        if (!orderId) return;
        if (order) return;

        void loadOrder(orderId);
    }, [loadOrder, order, orderId]);

    if (!orderId) {
        return <Navigate replace to={routes.checkout} />;
    }

    if (!order && isLoading) {
        return (
            <div className="mx-auto max-w-5xl px-6 pb-16 pt-24">
                <div className="rounded-3xl bg-surface-container-low p-8 text-center text-on-surface-variant">
                    Đang tải chi tiết đơn hàng từ backend...
                </div>
            </div>
        );
    }

    if (!order) {
        return <Navigate replace to={routes.checkout} />;
    }

    return (
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24">
            <section className="space-y-6">
                <Badge tone="success">Đặt hàng thành công</Badge>
                <div>
                    <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
                        Cảm ơn bạn, đơn {order.orderNo} đã được ghi nhận.
                    </h1>
                    <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">
                        Frontend đã gọi checkout backend thành công, lưu đơn vào lịch sử customer và
                        đồng bộ lại trạng thái giỏ hàng hiện tại từ server.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <ButtonLink to={routes.accountOrders}>Xem đơn hàng</ButtonLink>
                    <ButtonLink to={routes.products} variant="secondary">
                        Tiếp tục mua sắm
                    </ButtonLink>
                </div>
            </section>

            <section className="mt-10 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                <SurfaceCard className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                        Tóm tắt đơn mới
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Ngày đặt
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {formatDate(order.createdAt)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Tổng cộng
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {formatCurrency(order.totalAmount)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Thanh toán
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {customerPaymentMethodLabels[order.paymentMethod] ??
                                    fallbackBackendLabel(order.paymentMethod)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Trạng thái đơn
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {customerOrderStatusLabels[order.status] ??
                                    fallbackBackendLabel(order.status)}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-3xl bg-surface-container-low p-5">
                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                            Địa chỉ nhận
                        </p>
                        <p className="mt-2 text-sm leading-6 text-on-surface">
                            {order.shippingAddress}
                        </p>
                    </div>
                </SurfaceCard>

                <SurfaceCard tone="low" className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                        Các mặt hàng vừa đặt
                    </h2>
                    <div className="space-y-3">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-3xl bg-surface-container-lowest p-4"
                            >
                                <p className="font-semibold text-on-surface">
                                    {item.productNameSnapshot}
                                </p>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {item.quantity} x {formatCurrency(item.unitPrice)}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-3xl bg-surface-container-lowest p-5">
                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                            Thanh toán hiện tại
                        </p>
                        <p className="mt-2 font-semibold text-on-surface">
                            {order.payment
                                ? customerPaymentStatusLabels[order.payment.paymentStatus] ??
                                  fallbackBackendLabel(order.payment.paymentStatus)
                                : "Chưa có dữ liệu thanh toán"}
                        </p>
                    </div>
                </SurfaceCard>
            </section>
        </div>
    );
}
