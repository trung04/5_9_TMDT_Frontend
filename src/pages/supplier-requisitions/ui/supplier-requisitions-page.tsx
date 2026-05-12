import { operationsRepository } from "@/shared/api/mock-repositories";
import { requisitionStatusLabels } from "@/shared/lib/labels";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function SupplierRequisitionsPage() {
    const requisitions = operationsRepository.listRequisitions();
    const updateRequisitionStatus = useOperationsStore((state) => state.updateRequisitionStatus);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    return (
        <div className="space-y-8">

            <div className="space-y-4">
                {requisitions.map((requisition) => (
                    <SurfaceCard key={requisition.id} className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-primary">
                                    {requisition.id}
                                </p>
                                <h3 className="mt-2 font-headline text-2xl font-semibold">
                                    {requisition.inventorySku}
                                </h3>
                            </div>
                            <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs uppercase tracking-widest text-on-surface-variant">
                                {requisitionStatusLabels[requisition.status]}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3 text-sm">
                            <div className="rounded-3xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">Số lượng yêu cầu</p>
                                <p className="mt-2 font-semibold">{requisition.requestedQty}</p>
                            </div>
                            <div className="rounded-3xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">Số lượng duyệt</p>
                                <p className="mt-2 font-semibold">
                                    {requisition.approvedQty ?? "Chưa duyệt"}
                                </p>
                            </div>
                            <div className="rounded-3xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">ETA</p>
                                <p className="mt-2 font-semibold">{requisition.etaDays} ngày</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                size="sm"
                                onClick={() => {
                                    updateRequisitionStatus(
                                        requisition.id,
                                        "approved",
                                        "supplier",
                                        requisition.requestedQty,
                                    );
                                    pushToast({
                                        tone: "success",
                                        message: `Đã duyệt ${requisition.id}.`,
                                    });
                                }}
                            >
                                Duyệt phiếu
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    updateRequisitionStatus(requisition.id, "received", "supplier");
                                    pushToast({
                                        tone: "success",
                                        message: `Đã xác nhận hoàn tất ${requisition.id}.`,
                                    });
                                }}
                            >
                                Xác nhận đã giao
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    updateRequisitionStatus(
                                        requisition.id,
                                        "cancelled",
                                        "supplier",
                                    );
                                    pushToast({
                                        tone: "warning",
                                        message: `Đã hủy ${requisition.id}.`,
                                    });
                                }}
                            >
                                Hủy phiếu
                            </Button>
                        </div>
                    </SurfaceCard>
                ))}
            </div>
        </div>
    );
}
