import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/shared/api/backend-client";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import type { MetricCardData } from "@/shared/types/ui";
import { Button, StatCard, SurfaceCard } from "@/shared/ui";

interface AdminDashboardResponse {
    message: string;
    data: {
        metrics: {
            revenue: number;
            delivered_orders: number;
            processing_orders: number;
            supplier_count: number;
            product_count: number;
            average_order_value: number;
            complaint_count: number;
        };
        recent_orders: Array<{
            id: number;
            order_no: string;
            status: string;
            payment_method: string;
            total_amount: number | string;
            created_at: string;
            customer: {
                id: number;
                full_name: string;
                email: string;
            } | null;
        }>;
        featured_suppliers: Array<{
            id: number;
            name: string;
            contact_name: string | null;
            email: string | null;
            phone: string | null;
            address: string | null;
        }>;
        featured_products: Array<{
            id: number;
            name: string;
            sku: string;
            description: string | null;
            sale_price: number | string;
            stock_quantity: number;
        }>;
    };
}

function numberValue(value: number | string) {
    return Number(value ?? 0);
}

export function AdminDashboardPage() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [dashboard, setDashboard] = useState<AdminDashboardResponse["data"] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken) {
            setIsLoading(false);
            setError("Ban can dang nhap admin de xem dashboard.");
            return;
        }

        let cancelled = false;

        async function loadDashboard() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await apiRequest<AdminDashboardResponse>("/admin/dashboard", {
                    token: accessToken,
                });

                if (cancelled) {
                    return;
                }

                setDashboard(response.data);
                setIsLoading(false);
            } catch (nextError) {
                if (cancelled) {
                    return;
                }

                setError(nextError instanceof Error ? nextError.message : "Khong the tai dashboard.");
                setIsLoading(false);
            }
        }

        void loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const metrics = useMemo<MetricCardData[]>(() => {
        if (!dashboard) {
            return [];
        }

        return [
            {
                id: "metric-sales",
                label: "Doanh thu",
                value: formatCurrency(dashboard.metrics.revenue),
                delta: `${dashboard.metrics.delivered_orders} don da giao`,
                tone: "primary",
                icon: "payments",
                
            },
            {
                id: "metric-orders",
                label: "Don dang xu ly",
                value: `${dashboard.metrics.processing_orders}`,
                delta: `${dashboard.recent_orders.length} don gan nhat`,
                tone: "secondary",
                icon: "shopping_bag",
                
            },
            {
                id: "metric-suppliers",
                label: "Nha cung cap",
                value: `${dashboard.metrics.supplier_count}`,
                delta: `${dashboard.metrics.product_count} san pham dang hoat dong`,
                tone: "tertiary",
                icon: "handshake",
                
            },
            {
                id: "metric-aov",
                label: "Gia tri don TB",
                value: formatCurrency(dashboard.metrics.average_order_value),
                delta: `${dashboard.metrics.complaint_count} khieu nai`,
                tone: "success",
                icon: "sell",
               
            },
        ];
    }, [dashboard]);

    function handleExportReport() {
        if (!dashboard) {
            return;
        }

        const payload = JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                ...dashboard,
            },
            null,
            2,
        );

        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "admin-dashboard-report.json";
        link.click();
        URL.revokeObjectURL(url);

        pushToast({
            tone: "success",
            message: "Da xuat bao cao dashboard tu du lieu backend.",
        });
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-1">
                    
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => window.location.reload()}>
                        Tai lai du lieu
                    </Button>
                    <Button onClick={handleExportReport} disabled={!dashboard}>
                        Xuat bao cao
                    </Button>
                </div>
            </section>

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            {isLoading ? (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Dang tai du lieu dashboard...
                </SurfaceCard>
            ) : null}

            {dashboard ? (
                <>
                    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {metrics.map((metric) => (
                            <StatCard key={metric.id} metric={metric} />
                        ))}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                        <SurfaceCard className="space-y-4">
                            <div className="border-b border-outline-variant/15 pb-4">
                                <h3 className="font-headline text-2xl font-bold">Don hang gan day</h3>
                            </div>
                            <div className="space-y-3">
                                {dashboard.recent_orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="rounded-2xl bg-surface-container-low p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-on-surface">
                                                    {order.order_no}
                                                </p>
                                                <p className="mt-1 text-sm text-on-surface-variant">
                                                    {order.customer?.full_name ?? "Khach hang khong ro"} ·{" "}
                                                    {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-primary">
                                                    {formatCurrency(numberValue(order.total_amount))}
                                                </p>
                                                <p className="mt-1 text-sm text-on-surface-variant">
                                                    {order.status} · {order.payment_method}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SurfaceCard>

                        <SurfaceCard className="space-y-4">
                            <div>
                                <h3 className="font-headline text-2xl font-bold">Nha cung cap noi bat</h3>
                            </div>
                            {dashboard.featured_suppliers.map((supplier) => (
                                <div
                                    key={supplier.id}
                                    className="rounded-2xl bg-surface-container-low p-5"
                                >
                                    <p className="font-headline text-lg font-semibold">{supplier.name}</p>
                                    <p className="mt-1 text-sm text-on-surface-variant">
                                        {supplier.address ?? supplier.email ?? supplier.phone ?? "Khong co thong tin"}
                                    </p>
                                    {supplier.contact_name ? (
                                        <p className="mt-2 text-sm text-on-surface-variant">
                                            Lien he: {supplier.contact_name}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </SurfaceCard>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-3">
                        {dashboard.featured_products.map((product) => (
                            <SurfaceCard key={product.id} className="space-y-3">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Kho san pham
                                </p>
                                <h3 className="font-headline text-xl font-semibold">{product.name}</h3>
                                <p className="text-sm text-on-surface-variant">{product.sku}</p>
                                <p className="text-sm leading-6 text-on-surface-variant">
                                    {product.description ?? "Chua co mo ta."}
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-primary">
                                        {formatCurrency(numberValue(product.sale_price))}
                                    </span>
                                    <span className="text-on-surface-variant">
                                        Ton kho: {product.stock_quantity}
                                    </span>
                                </div>
                            </SurfaceCard>
                        ))}
                    </section>
                </>
            ) : null}
        </div>
    );
}
