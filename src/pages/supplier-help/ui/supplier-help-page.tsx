import { useState } from "react";

import { operationsRepository } from "@/shared/api/mock-repositories";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { Button, SurfaceCard } from "@/shared/ui";

export function SupplierHelpPage() {
    const createSupportTicket = useOperationsStore((state) => state.createSupportTicket);
    const tickets = operationsRepository
        .listSupportTickets()
        .filter((ticket) => ticket.channel === "supplier");
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [subject, setSubject] = useState("Cần xác nhận ETA với kho");
    const [message, setMessage] = useState(
        "Nhờ đội điều phối kiểm tra lại lịch nhận hàng cho lô trà tuần này.",
    );

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Trung tâm hỗ trợ nhà cung cấp
                </h2>
                <p className="mt-1 text-on-surface-variant">
                    Gửi ticket nội bộ khi cần điều phối ETA, xác nhận đối soát hoặc hỗ trợ vận hành.
                </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <SurfaceCard className="space-y-4">
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Chủ đề</span>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                        />
                    </label>
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Nội dung</span>
                        <textarea
                            className="min-h-36 w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                        />
                    </label>
                    <Button
                        onClick={() => {
                            createSupportTicket({
                                subject,
                                message,
                                channel: "supplier",
                            });
                            pushToast({
                                tone: "success",
                                message: "Đã tạo ticket hỗ trợ cho nhà cung cấp.",
                            });
                        }}
                    >
                        Gửi ticket
                    </Button>
                </SurfaceCard>

                <SurfaceCard tone="low" className="space-y-4">
                    <h3 className="font-headline text-2xl font-bold">Ticket gần đây</h3>
                    {tickets.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                            Chưa có ticket nào được tạo.
                        </p>
                    ) : (
                        tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="rounded-3xl bg-surface-container-lowest p-4"
                            >
                                <p className="text-xs uppercase tracking-widest text-primary">
                                    {ticket.id}
                                </p>
                                <p className="mt-2 font-semibold">{ticket.subject}</p>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {ticket.message}
                                </p>
                            </div>
                        ))
                    )}
                </SurfaceCard>
            </div>
        </div>
    );
}
