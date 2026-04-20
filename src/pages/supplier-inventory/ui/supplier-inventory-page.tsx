import { catalogRepository, operationsRepository } from "@/shared/api/mock-repositories";
import { downloadTextFile } from "@/shared/lib/download";
import { inventoryHealthLabels } from "@/shared/lib/labels";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function SupplierInventoryPage() {
    const inventory = operationsRepository.listInventory();
    const pushToast = useFeedbackStore((state) => state.pushToast);

    return (
        <div className="space-y-8">
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight">
                        Tồn kho theo nhà cung cấp
                    </h2>
                    <p className="mt-1 text-on-surface-variant">
                        Theo dõi SKU, ngưỡng tái nhập và sức khỏe tồn kho của các mặt hàng đang cung
                        ứng.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => {
                        const csv = [
                            ["sku", "product", "status", "onHand", "reserved"].join(","),
                            ...inventory.map((item) =>
                                [
                                    item.sku,
                                    catalogRepository.getProductById(item.productId)?.name ??
                                        item.productId,
                                    inventoryHealthLabels[item.status],
                                    item.onHand,
                                    item.reserved,
                                ].join(","),
                            ),
                        ].join("\n");

                        downloadTextFile("supplier-inventory.csv", csv, "text/csv");
                        pushToast({
                            tone: "success",
                            message: "Đã xuất danh sách tồn kho nhà cung cấp.",
                        });
                    }}
                >
                    Xuất CSV
                </Button>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
                {inventory.map((item) => (
                    <SurfaceCard key={item.sku} className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    {item.sku}
                                </p>
                                <h3 className="mt-2 font-headline text-2xl font-semibold">
                                    {catalogRepository.getProductById(item.productId)?.name ??
                                        item.productId}
                                </h3>
                            </div>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
                                {inventoryHealthLabels[item.status]}
                            </span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3 text-sm">
                            <div className="rounded-3xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">Tồn thực</p>
                                <p className="mt-2 font-semibold">{item.onHand}</p>
                            </div>
                            <div className="rounded-3xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">Đã giữ chỗ</p>
                                <p className="mt-2 font-semibold">{item.reserved}</p>
                            </div>
                            <div className="rounded-3xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">Ngưỡng tái nhập</p>
                                <p className="mt-2 font-semibold">{item.reorderPoint}</p>
                            </div>
                        </div>
                    </SurfaceCard>
                ))}
            </div>
        </div>
    );
}
