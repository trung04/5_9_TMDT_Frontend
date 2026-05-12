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
        if (!orderId || order) {
            return;
        }

        void loadOrder(orderId);
    }, [loadOrder, order, orderId]);

    if (!orderId) {
        return <Navigate replace to={routes.checkout} />;
    }

    if (!order && isLoading) {
        return (
            <div className="mx-auto max-w-5xl px-6 pb-16 pt-24">
                <div className="rounded-3xl bg-surface-container-low p-8 text-center text-on-surface-variant">
                    Dang tai chi tiet don hang...
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
                <Badge tone="success">Dat hang thanh cong</Badge>
                <div>
                    <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                        Don {order.orderNo} da duoc ghi nhan.
                    </h1>
                </div>
                <div className="flex flex-wrap gap-3">
                    <ButtonLink to={routes.accountOrderDetail(order.id)}>Xem don hang</ButtonLink>
                    <ButtonLink to={routes.products} variant="secondary">
                        Tiep tuc mua sam
                    </ButtonLink>
                </div>
            </section>

            <section className="mt-10 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                <SurfaceCard className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                        Tom tat don moi
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Ngay dat
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {formatDate(order.createdAt)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Tong cong
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {formatCurrency(order.totalAmount)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Phuong thuc thanh toan
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {customerPaymentMethodLabels[order.paymentMethod] ??
                                    fallbackBackendLabel(order.paymentMethod)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-low p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Trang thai don
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {customerOrderStatusLabels[order.status] ??
                                    fallbackBackendLabel(order.status)}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-3xl bg-surface-container-low p-5">
                        <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                            Dia chi nhan
                        </p>
                        <p className="mt-2 text-sm leading-6 text-on-surface">
                            {order.shippingAddress}
                        </p>
                    </div>
                </SurfaceCard>

                <SurfaceCard tone="low" className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                        Theo doi thanh toan
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl bg-surface-container-lowest p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Trang thai thanh toan
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {order.payment
                                    ? customerPaymentStatusLabels[order.payment.paymentStatus] ??
                                      fallbackBackendLabel(order.payment.paymentStatus)
                                    : "Chua co du lieu thanh toan"}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-lowest p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Cong thanh toan
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {order.payment?.gatewayName ?? "Thanh toan khi nhan hang"}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-lowest p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Ma giao dich
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {order.payment?.transactionCode ?? "Se xuat hien sau khi tao don"}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-surface-container-lowest p-5">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Thoi diem cap nhat
                            </p>
                            <p className="mt-2 font-semibold text-on-surface">
                                {order.payment?.paidAt ? formatDate(order.payment.paidAt) : "Dang cho xu ly"}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-3xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                        {order.paymentMethod === "COD"
                            ? "Ban thanh toan tien mat khi nhan hang."
                            : "Don hang da ghi nhan phuong thuc thanh toan cua ban va dang cho admin xac nhan."}
                    </div>
                    <div className="space-y-3">
                        {order.items.map((item) => (
                            <div key={item.id} className="rounded-3xl bg-surface-container-lowest p-4">
                                <p className="font-semibold text-on-surface">
                                    {item.productNameSnapshot}
                                </p>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {item.quantity} x {formatCurrency(item.unitPrice)}
                                </p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>
            </section>
        </div>
    );
}
