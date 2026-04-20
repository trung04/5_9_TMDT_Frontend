import { accountRepository } from "@/shared/api/mock-repositories";
import { deliveryStatusLabels } from "@/shared/lib/labels";
import { SurfaceCard } from "@/shared/ui";

export function AccountDisputesPage() {
    const complaints = accountRepository.listComplaints();

    return (
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24">
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-4xl font-bold">
                        Khiếu nại & hỗ trợ đơn hàng
                    </h1>
                    <p className="mt-2 text-on-surface-variant">
                        Theo dõi các phản hồi đã gửi từ trang lịch sử đơn hàng và tình trạng xử lý
                        hiện tại.
                    </p>
                </div>

                {complaints.length === 0 ? (
                    <SurfaceCard className="text-sm text-on-surface-variant">
                        Chưa có khiếu nại nào được gửi. Bạn có thể tạo khiếu nại trực tiếp từ trang
                        đơn hàng.
                    </SurfaceCard>
                ) : (
                    <div className="space-y-4">
                        {complaints.map((complaint) => {
                            const order = accountRepository.getOrderById(complaint.orderId);

                            return (
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
                                            {complaint.status === "open" ? "Đang mở" : "Đã xử lý"}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-7 text-on-surface-variant">
                                        {complaint.message}
                                    </p>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="rounded-3xl bg-surface-container-low p-4 text-sm">
                                            <p className="text-on-surface-variant">Mã đơn</p>
                                            <p className="mt-2 font-semibold">
                                                #{complaint.orderId}
                                            </p>
                                        </div>
                                        <div className="rounded-3xl bg-surface-container-low p-4 text-sm">
                                            <p className="text-on-surface-variant">
                                                Trạng thái gốc
                                            </p>
                                            <p className="mt-2 font-semibold">
                                                {
                                                    deliveryStatusLabels[
                                                        complaint.previousDeliveryStatus
                                                    ]
                                                }
                                            </p>
                                        </div>
                                        <div className="rounded-3xl bg-surface-container-low p-4 text-sm">
                                            <p className="text-on-surface-variant">Tổng đơn</p>
                                            <p className="mt-2 font-semibold">
                                                {complaint.orderSnapshotTotal.toLocaleString(
                                                    "vi-VN",
                                                )}{" "}
                                                đ
                                            </p>
                                        </div>
                                    </div>
                                    {order ? (
                                        <p className="text-xs text-on-surface-variant">
                                            Đơn hiện tại đang ở trạng thái{" "}
                                            {deliveryStatusLabels[order.deliveryStatus]}.
                                        </p>
                                    ) : null}
                                    {complaint.resolutionNote ? (
                                        <div className="rounded-3xl bg-on-primary-container p-4 text-sm text-primary">
                                            Ghi chú xử lý: {complaint.resolutionNote}
                                        </div>
                                    ) : null}
                                </SurfaceCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
