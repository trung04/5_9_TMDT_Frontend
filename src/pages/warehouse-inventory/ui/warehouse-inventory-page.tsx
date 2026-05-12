import { useMemo, useState } from "react";

import type { InventoryItem } from "@/entities/inventory/model/types";
import { catalogRepository, operationsRepository } from "@/shared/api/mock-repositories";
import { formatCurrency } from "@/shared/lib/format";
import { inventoryHealthLabels, requisitionStatusLabels } from "@/shared/lib/labels";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { useUiStore } from "@/shared/lib/store/use-ui-store";
import { Button, DataTable, StatCard, SurfaceCard } from "@/shared/ui";
import type { TableColumn } from "@/shared/types/ui";
import { RequisitionDrawer } from "@/widgets/requisition-drawer";

export function WarehouseInventoryPage() {
    const [query, setQuery] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const selectedWarehouseSku = useUiStore((state) => state.selectedWarehouseSku);
    const setSelectedWarehouseSku = useUiStore((state) => state.setSelectedWarehouseSku);
    const createRequisition = useOperationsStore((state) => state.createRequisition);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const inventory = operationsRepository.listInventory();
    const requisitions = operationsRepository.listRequisitions();

    const supplierRecords = useMemo(
        () => [
            ...new Map(
                inventory
                    .map((item) => operationsRepository.getSupplierById(item.supplierId))
                    .filter((supplier): supplier is NonNullable<typeof supplier> =>
                        Boolean(supplier),
                    )
                    .map((supplier) => [supplier.id, supplier]),
            ).values(),
        ],
        [inventory],
    );

    const filteredInventory = inventory.filter((item) =>
        [
            item.sku,
            catalogRepository.getProductById(item.productId)?.name ?? "",
            operationsRepository.getSupplierById(item.supplierId)?.name ?? "",
        ].some((value) => value.toLowerCase().includes(query.toLowerCase())),
    );

    const activeItem =
        filteredInventory.find((item) => item.sku === selectedWarehouseSku) ?? filteredInventory[0];

    const totalInventoryValue = inventory.reduce(
        (sum, item) => sum + item.onHand * item.purchasePrice,
        0,
    );

    const columns: TableColumn<InventoryItem>[] = [
        {
            key: "sku",
            title: "SKU",
            render: (item) => <span className="font-semibold">{item.sku}</span>,
        },
        {
            key: "stock",
            title: "Tồn kho",
            render: (item) => (
                <span className="text-on-surface-variant">
                    {item.onHand} / giữ chỗ {item.reserved}
                </span>
            ),
        },
        {
            key: "product",
            title: "Sản phẩm",
            render: (item) => (
                <span className="text-on-surface-variant">
                    {catalogRepository.getProductById(item.productId)?.name ?? item.productId}
                </span>
            ),
        },
        {
            key: "purchase",
            title: "Giá nhập",
            render: (item) => formatCurrency(item.purchasePrice),
        },
        {
            key: "status",
            title: "Trạng thái",
            render: (item) => (
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs uppercase tracking-widest text-primary">
                    {inventoryHealthLabels[item.status]}
                </span>
            ),
        },
        {
            key: "action",
            title: "Thao tác",
            align: "right",
            render: (item) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedWarehouseSku(item.sku)}>
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    const stats = [
        {
            id: "warehouse-skus",
            label: "Tổng SKU đang theo dõi",
            value: `${inventory.length}`,
            tone: "primary" as const,
            icon: "inventory",
            delta: `${requisitions.length} phiếu nhập`,
            helperText: "quy mô tồn kho runtime hiện tại",
        },
        {
            id: "warehouse-alerts",
            label: "Cảnh báo tồn kho",
            value: `${inventory.filter((item) => item.status !== "healthy").length}`,
            tone: "danger" as const,
            icon: "warning",
            delta: "Cần xử lý",
            helperText: "SKU dưới ngưỡng hoặc mức nguy cấp",
        },
        {
            id: "warehouse-value",
            label: "Giá trị tồn kho",
            value: formatCurrency(totalInventoryValue),
            tone: "tertiary" as const,
            icon: "payments",
            helperText: "ước tính theo giá nhập hiện có",
        },
    ];

    return (
        <div className="space-y-8">
            <section className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    
                </div>
                <input
                    className="w-full max-w-md rounded-full bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                    placeholder="Tìm theo SKU, tên sản phẩm hoặc nhà cung cấp..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </section>

            <section className="grid gap-6 md:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

            {confirmation ? (
                <SurfaceCard className="text-sm text-primary">{confirmation}</SurfaceCard>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <SurfaceCard className="overflow-hidden p-0">
                    <div className="border-b border-outline-variant/15 px-6 py-5">
                        <h3 className="font-headline text-xl font-semibold">Danh mục tồn kho</h3>
                    </div>
                    <div className="p-6">
                        <DataTable
                            rows={filteredInventory}
                            columns={columns}
                            getRowKey={(item) => item.sku}
                            rowClassName={(item) =>
                                item.sku === activeItem?.sku
                                    ? "border-l-4 border-primary bg-primary/5"
                                    : undefined
                            }
                        />
                    </div>
                </SurfaceCard>

                {activeItem ? (
                    <SurfaceCard className="space-y-5">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                Sản phẩm đang chọn
                            </p>
                            <h2 className="mt-2 font-headline text-2xl font-bold">
                                {catalogRepository.getProductById(activeItem.productId)?.name ??
                                    activeItem.sku}
                            </h2>
                            <p className="mt-2 text-sm text-on-surface-variant">{activeItem.sku}</p>
                        </div>
                        <div className="space-y-3 text-sm text-on-surface-variant">
                            <p>Vị trí kệ: {activeItem.aisle}</p>
                            <p>Ngưỡng nhập lại: {activeItem.reorderPoint}</p>
                            <p>Giá nhập hiện tại: {formatCurrency(activeItem.purchasePrice)}</p>
                            <p>
                                Nhà cung cấp:{" "}
                                {operationsRepository.getSupplierById(activeItem.supplierId)
                                    ?.name ?? activeItem.supplierId}
                            </p>
                        </div>
                        <Button onClick={() => setDrawerOpen(true)}>Tạo phiếu nhập hàng</Button>
                        <div>
                            <h3 className="font-headline text-lg font-semibold">Phiếu liên quan</h3>
                            <div className="mt-3 space-y-3">
                                {requisitions
                                    .filter(
                                        (requisition) =>
                                            requisition.inventorySku === activeItem.sku,
                                    )
                                    .map((requisition) => (
                                        <div
                                            key={requisition.id}
                                            className="rounded-2xl bg-surface-container-low p-4 text-sm"
                                        >
                                            <p className="font-semibold text-on-surface">
                                                {requisition.id}
                                            </p>
                                            <p className="text-on-surface-variant">
                                                {requisition.inventorySku} · SL{" "}
                                                {requisition.requestedQty} ·{" "}
                                                {requisitionStatusLabels[requisition.status]}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </SurfaceCard>
                ) : null}
            </section>

            <RequisitionDrawer
                open={drawerOpen}
                inventoryItem={activeItem}
                suppliers={supplierRecords}
                onClose={() => setDrawerOpen(false)}
                onSubmit={(draft) => {
                    if (!activeItem) return;

                    const requisition = createRequisition({
                        inventorySku: activeItem.sku,
                        supplierId: draft.supplierId,
                        requestedQty: draft.requestedQty,
                        etaDays: draft.etaDays,
                        note: draft.note,
                    });

                    setConfirmation(
                        `Đã gửi phiếu ${requisition.id} cho ${draft.requestedQty} đơn vị, ETA ${draft.etaDays} ngày.`,
                    );
                    pushToast({
                        tone: "success",
                        message: `Phiếu nhập ${requisition.id} đã được ghi vào trạng thái runtime.`,
                    });
                }}
            />
        </div>
    );
}
