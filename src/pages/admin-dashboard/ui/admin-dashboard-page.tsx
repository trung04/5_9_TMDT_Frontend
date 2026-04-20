import { useMemo, useState } from "react";

import { adminRepository } from "@/shared/api/mock-repositories";
import { downloadTextFile } from "@/shared/lib/download";
import { formatCurrency } from "@/shared/lib/format";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, StatCard, SurfaceCard } from "@/shared/ui";
import { OrderTable } from "@/widgets/order-table";

type PeriodFilter = "all" | "last30";

export function AdminDashboardPage() {
    const [period, setPeriod] = useState<PeriodFilter>("last30");
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const allOrders = adminRepository.listOrders();
    const suppliers = adminRepository.listSuppliers();
    const products = adminRepository.listProducts().slice(0, 3);

    const filteredOrders = useMemo(() => {
        if (period === "all") return allOrders;

        const latestTimestamp = Math.max(
            ...allOrders.map((order) => new Date(order.date).getTime()),
        );
        const threshold = latestTimestamp - 30 * 24 * 60 * 60 * 1000;

        return allOrders.filter((order) => new Date(order.date).getTime() >= threshold);
    }, [allOrders, period]);

    const metrics = useMemo(() => {
        const revenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const delivered = filteredOrders.filter(
            (order) => order.deliveryStatus === "delivered",
        ).length;
        const processing = filteredOrders.filter(
            (order) => order.deliveryStatus === "processing",
        ).length;
        const average = filteredOrders.length > 0 ? Math.round(revenue / filteredOrders.length) : 0;

        return [
            {
                id: "metric-sales",
                label: "Doanh thu hiển thị",
                value: formatCurrency(revenue),
                delta: `${delivered} đơn đã giao`,
                tone: "primary" as const,
                icon: "payments",
                helperText: "được tính theo bộ lọc hiện tại",
            },
            {
                id: "metric-orders",
                label: "Đơn trong phạm vi",
                value: `${filteredOrders.length}`,
                delta: `${processing} đơn đang xử lý`,
                tone: "secondary" as const,
                icon: "shopping_bag",
                helperText: "bao gồm đơn seed và đơn phát sinh runtime",
            },
            {
                id: "metric-suppliers",
                label: "Đối tác hoạt động",
                value: `${suppliers.length}`,
                delta: `${products.length} sản phẩm nổi bật`,
                tone: "tertiary" as const,
                icon: "handshake",
                helperText: "đối tác đang hiển thị trên hệ sinh thái",
            },
            {
                id: "metric-aov",
                label: "Giá trị đơn trung bình",
                value: formatCurrency(average),
                delta: `${adminRepository.listComplaints().length} khiếu nại đã ghi nhận`,
                tone: "success" as const,
                icon: "sell",
                helperText: "cập nhật theo dữ liệu runtime hiện tại",
            },
        ];
    }, [filteredOrders, products.length, suppliers.length]);

    const recentOrders = filteredOrders.slice(0, 3);

    function handleExportReport() {
        const payload = {
            period,
            generatedAt: new Date().toISOString(),
            totals: {
                orders: filteredOrders.length,
                revenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
            },
            orders: filteredOrders,
            suppliers: suppliers.slice(0, 5),
        };

        downloadTextFile(
            "admin-dashboard-report.json",
            JSON.stringify(payload, null, 2),
            "application/json",
        );
        pushToast({
            tone: "success",
            message: "Đã xuất báo cáo dashboard theo bộ lọc hiện tại.",
        });
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-1">
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
                        Toàn cảnh hệ sinh thái
                    </h2>
                    <p className="text-on-surface-variant">
                        Theo dõi doanh thu, đơn hàng và đối tác trên cùng một bảng điều phối quản
                        trị.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() =>
                            setPeriod((current) => (current === "last30" ? "all" : "last30"))
                        }
                    >
                        {period === "last30"
                            ? "Đang xem 30 ngày gần nhất"
                            : "Đang xem toàn bộ dữ liệu"}
                    </Button>
                    <Button onClick={handleExportReport}>Xuất báo cáo</Button>
                </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <StatCard key={metric.id} metric={metric} />
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <SurfaceCard className="overflow-hidden p-0">
                    <div className="border-b border-outline-variant/15 px-6 py-5">
                        <h3 className="font-headline text-2xl font-bold">Đơn hàng gần đây</h3>
                    </div>
                    <div className="p-6">
                        <OrderTable
                            orders={recentOrders}
                            activeOrderId={recentOrders[0]?.id}
                            mode="admin"
                        />
                    </div>
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <div>
                        <h3 className="font-headline text-2xl font-bold">Đối tác nổi bật</h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            Nhóm nhà cung cấp có nhịp phản hồi tốt và đang đóng góp ổn định cho danh
                            mục.
                        </p>
                    </div>
                    {suppliers.map((supplier) => (
                        <div key={supplier.id} className="rounded-2xl bg-surface-container-low p-5">
                            <p className="font-headline text-lg font-semibold">{supplier.name}</p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                {supplier.location} · {supplier.partnerTier}
                            </p>
                        </div>
                    ))}
                </SurfaceCard>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                {products.map((product) => (
                    <SurfaceCard key={product.id} className="overflow-hidden p-0">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="aspect-[4/3] w-full object-cover"
                        />
                        <div className="p-6">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Kho sản phẩm
                            </p>
                            <h3 className="mt-2 font-headline text-xl font-semibold">
                                {product.name}
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                                {product.shortDescription}
                            </p>
                        </div>
                    </SurfaceCard>
                ))}
            </section>
        </div>
    );
}
