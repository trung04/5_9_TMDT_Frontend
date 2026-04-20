import { useMemo, useState } from "react";

import { adminRepository } from "@/shared/api/mock-repositories";
import { downloadTextFile } from "@/shared/lib/download";
import { customerStatusLabels, supplierStatusLabels } from "@/shared/lib/labels";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { Button, SurfaceCard } from "@/shared/ui";

type CommunityTab = "suppliers" | "customers";

const initialInviteForm = {
    supplierName: "",
    contactName: "",
    email: "",
    categories: "",
    note: "",
};

export function AdminCommunityPage() {
    const [tab, setTab] = useState<CommunityTab>("suppliers");
    const [query, setQuery] = useState("");
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState(initialInviteForm);
    const inviteSupplier = useOperationsStore((state) => state.inviteSupplier);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const suppliers = adminRepository
        .listSuppliers()
        .filter((supplier) => supplier.name.toLowerCase().includes(query.toLowerCase()));
    const customers = adminRepository
        .listCustomers()
        .filter((customer) => customer.name.toLowerCase().includes(query.toLowerCase()));
    const invitations = adminRepository.listInvitations();

    const exportPayload = useMemo(
        () => ({
            suppliers,
            customers,
            invitations,
            exportedAt: new Date().toISOString(),
        }),
        [customers, invitations, suppliers],
    );

    function updateInviteField<K extends keyof typeof initialInviteForm>(
        key: K,
        value: (typeof initialInviteForm)[K],
    ) {
        setInviteForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function handleSubmitInvite() {
        if (
            inviteForm.supplierName.trim().length === 0 ||
            inviteForm.contactName.trim().length === 0 ||
            inviteForm.email.trim().length === 0
        ) {
            pushToast({
                tone: "warning",
                message: "Vui lòng nhập đầy đủ tên đơn vị, người liên hệ và email.",
            });
            return;
        }

        const invitation = inviteSupplier({
            supplierName: inviteForm.supplierName,
            contactName: inviteForm.contactName,
            email: inviteForm.email,
            categories: inviteForm.categories
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            note: inviteForm.note,
        });

        setInviteForm(initialInviteForm);
        setInviteOpen(false);
        pushToast({
            tone: "success",
            message: `Đã tạo lời mời ${invitation.id} cho ${invitation.supplierName}.`,
        });
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-1">
                    <h2 className="font-headline text-3xl font-bold tracking-tight">
                        Cộng đồng và đối tác
                    </h2>
                    <p className="text-on-surface-variant">
                        Theo dõi tăng trưởng khách hàng, nhà cung cấp và danh sách lời mời đang chờ
                        phản hồi.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            downloadTextFile(
                                "community-data.json",
                                JSON.stringify(exportPayload, null, 2),
                                "application/json",
                            );
                            pushToast({
                                tone: "success",
                                message: "Đã xuất dữ liệu cộng đồng và đối tác.",
                            });
                        }}
                    >
                        Xuất dữ liệu
                    </Button>
                    <Button onClick={() => setInviteOpen((current) => !current)}>
                        Mời nhà cung cấp
                    </Button>
                </div>
            </section>

            {inviteOpen ? (
                <SurfaceCard className="space-y-4">
                    <div>
                        <h3 className="font-headline text-2xl font-bold">Tạo lời mời đối tác</h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            Thông tin sẽ được lưu vào runtime state để theo dõi trong portal quản
                            trị.
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Tên đơn vị"
                            value={inviteForm.supplierName}
                            onChange={(event) =>
                                updateInviteField("supplierName", event.target.value)
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Người liên hệ"
                            value={inviteForm.contactName}
                            onChange={(event) =>
                                updateInviteField("contactName", event.target.value)
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Email"
                            value={inviteForm.email}
                            onChange={(event) => updateInviteField("email", event.target.value)}
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Danh mục, phân tách bằng dấu phẩy"
                            value={inviteForm.categories}
                            onChange={(event) =>
                                updateInviteField("categories", event.target.value)
                            }
                        />
                    </div>
                    <textarea
                        className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Ghi chú lời mời"
                        value={inviteForm.note}
                        onChange={(event) => updateInviteField("note", event.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>
                            Huỷ
                        </Button>
                        <Button onClick={handleSubmitInvite}>Gửi lời mời</Button>
                    </div>
                </SurfaceCard>
            ) : null}

            {invitations.length > 0 ? (
                <SurfaceCard className="space-y-3">
                    <h3 className="font-headline text-xl font-semibold">Lời mời gần đây</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {invitations.slice(0, 4).map((invitation) => (
                            <div
                                key={invitation.id}
                                className="rounded-2xl bg-surface-container-low p-4 text-sm"
                            >
                                <p className="font-semibold">{invitation.supplierName}</p>
                                <p className="mt-1 text-on-surface-variant">
                                    {invitation.contactName} · {invitation.email}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-widest text-primary">
                                    {invitation.status}
                                </p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>
            ) : null}

            <div className="flex gap-3">
                <button
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                        tab === "suppliers"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant"
                    }`}
                    onClick={() => setTab("suppliers")}
                >
                    Nhà cung cấp
                </button>
                <button
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                        tab === "customers"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant"
                    }`}
                    onClick={() => setTab("customers")}
                >
                    Khách hàng
                </button>
            </div>

            <input
                className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Lọc theo tên đối tác hoặc khách hàng..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />

            {tab === "suppliers" ? (
                <div className="grid gap-6 xl:grid-cols-3">
                    {suppliers.map((supplier) => (
                        <SurfaceCard key={supplier.id} className="space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tertiary-fixed text-tertiary">
                                    {supplier.name.slice(0, 1)}
                                </div>
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
                                    {supplier.partnerTier}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-headline text-xl font-semibold">
                                    {supplier.name}
                                </h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {supplier.location}
                                </p>
                            </div>
                            <div className="space-y-2 text-sm text-on-surface-variant">
                                <p>Liên hệ chính: {supplier.contactName}</p>
                                <p>Thời gian phản hồi: {supplier.responseTime}</p>
                                <p>Trạng thái: {supplierStatusLabels[supplier.status]}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {supplier.categories.map((category) => (
                                    <span
                                        key={category}
                                        className="rounded-full bg-surface-container-low px-3 py-1 text-xs text-on-surface-variant"
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </SurfaceCard>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                    {customers.map((customer) => (
                        <SurfaceCard key={customer.id} className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-headline text-xl font-semibold">
                                        {customer.name}
                                    </h3>
                                    <p className="text-sm text-on-surface-variant">
                                        {customer.location}
                                    </p>
                                </div>
                                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs uppercase tracking-widest text-primary">
                                    {customerStatusLabels[customer.status]}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-on-surface-variant">Đơn hàng</p>
                                    <p className="mt-2 font-headline text-2xl font-bold">
                                        {customer.orders}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-on-surface-variant">Tổng chi tiêu</p>
                                    <p className="mt-2 font-headline text-2xl font-bold">
                                        {Math.round(customer.totalSpend / 1000)}K
                                    </p>
                                </div>
                            </div>
                        </SurfaceCard>
                    ))}
                </div>
            )}
        </div>
    );
}
