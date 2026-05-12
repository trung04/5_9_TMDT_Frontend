import { useEffect } from "react";

import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { SurfaceCard } from "@/shared/ui";

export function AccountDisputesPage() {
    const complaints = useAccountStore((state) => state.complaints);
    const loadComplaints = useAccountStore((state) => state.loadComplaints);
    const isComplaintsLoading = useAccountStore((state) => state.isComplaintsLoading);

    useEffect(() => {
        void loadComplaints();
    }, [loadComplaints]);

    return (
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24">
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-2xl font-bold">Khieu nai va ho tro don hang</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Theo doi cac phan hoi da gui va tinh trang xu ly hien tai.
                    </p>
                </div>

                {isComplaintsLoading ? (
                    <SurfaceCard className="text-sm text-on-surface-variant">
                        Dang tai danh sach khieu nai...
                    </SurfaceCard>
                ) : complaints.length === 0 ? (
                    <SurfaceCard className="text-sm text-on-surface-variant">
                        Chua co khieu nai nao duoc gui.
                    </SurfaceCard>
                ) : (
                    <div className="space-y-4">
                        {complaints.map((complaint) => (
                            <SurfaceCard key={complaint.id} className="space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-primary">
                                            {complaint.id}
                                        </p>
                                        <h2 className="mt-2 font-headline text-2xl font-bold">
                                            {complaint.reason}
                                        </h2>
                                    </div>
                                    <span className="rounded-full bg-tertiary/10 px-3 py-1 text-xs uppercase tracking-widest text-tertiary">
                                        {complaint.status}
                                    </span>
                                </div>
                                <p className="text-sm leading-7 text-on-surface-variant">
                                    {complaint.content}
                                </p>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-3xl bg-surface-container-low p-4 text-sm">
                                        <p className="text-on-surface-variant">Ma don</p>
                                        <p className="mt-2 font-semibold">{complaint.orderNo || complaint.orderId}</p>
                                    </div>
                                    <div className="rounded-3xl bg-surface-container-low p-4 text-sm">
                                        <p className="text-on-surface-variant">San pham</p>
                                        <p className="mt-2 font-semibold">{complaint.productName || "Khong ro"}</p>
                                    </div>
                                    <div className="rounded-3xl bg-surface-container-low p-4 text-sm">
                                        <p className="text-on-surface-variant">Tong don</p>
                                        <p className="mt-2 font-semibold">
                                            {complaint.orderTotalAmount.toLocaleString("vi-VN")} d
                                        </p>
                                    </div>
                                </div>
                                {complaint.resolutionNote ? (
                                    <div className="rounded-3xl bg-on-primary-container p-4 text-sm text-primary">
                                        Ghi chu xu ly: {complaint.resolutionNote}
                                    </div>
                                ) : null}
                            </SurfaceCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
