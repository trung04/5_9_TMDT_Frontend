import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/shared/api/backend-client";
import { downloadTextFile } from "@/shared/lib/download";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

type CommunityTab = "suppliers" | "customers";

interface CommunitySupplier {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    product_count: number;
    status: string;
}

interface CommunityCustomer {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    order_count: number;
    total_spend: number;
    status: string;
}

interface CommunityInvitation {
    id: number;
    supplier_name: string;
    contact_name: string;
    email: string;
    categories: string[];
    note: string | null;
    status: string;
    created_at: string;
}

interface CommunityResponse {
    message: string;
    data: {
        suppliers: CommunitySupplier[];
        customers: CommunityCustomer[];
        invitations: CommunityInvitation[];
    };
}

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
    const [suppliers, setSuppliers] = useState<CommunitySupplier[]>([]);
    const [customers, setCustomers] = useState<CommunityCustomer[]>([]);
    const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const accessToken = useAuthStore((state) => state.accessToken);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    useEffect(() => {
        if (!accessToken) {
            setIsLoading(false);
            setError("Bạn cần đăng nhập admin để xem dữ liệu cộng đồng.");
            return;
        }

        let cancelled = false;

        async function loadCommunity() {
            setIsLoading(true);
            setError("");

            try {
                const response = await apiRequest<CommunityResponse>("/admin/community", {
                    token: accessToken,
                });

                if (cancelled) {
                    return;
                }

                setSuppliers(response.data.suppliers);
                setCustomers(response.data.customers);
                setInvitations(response.data.invitations);
                setIsLoading(false);
            } catch (nextError) {
                if (cancelled) {
                    return;
                }

                setError(
                    nextError instanceof Error ? nextError.message : "Không thể tải dữ liệu cộng đồng.",
                );
                setIsLoading(false);
            }
        }

        void loadCommunity();

        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const filteredSuppliers = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return suppliers.filter((supplier) =>
            [supplier.name, supplier.contact_name, supplier.email, supplier.address]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword),
        );
    }, [query, suppliers]);

    const filteredCustomers = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return customers.filter((customer) =>
            [customer.full_name, customer.email, customer.phone]
                .join(" ")
                .toLowerCase()
                .includes(keyword),
        );
    }, [customers, query]);

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

    async function handleSubmitInvite() {
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

        if (!accessToken) {
            pushToast({
                tone: "warning",
                message: "Bạn cần đăng nhập admin để gửi lời mời.",
            });
            return;
        }

        setIsSaving(true);

        try {
            const response = await apiRequest<{
                message: string;
                data: CommunityInvitation;
            }>("/admin/community/invitations", {
                method: "POST",
                token: accessToken,
                body: {
                    supplier_name: inviteForm.supplierName.trim(),
                    contact_name: inviteForm.contactName.trim(),
                    email: inviteForm.email.trim(),
                    categories: inviteForm.categories
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    note: inviteForm.note.trim() || null,
                },
            });

            setInvitations((current) => [response.data, ...current]);
            setInviteForm(initialInviteForm);
            setInviteOpen(false);
            setIsSaving(false);
            pushToast({
                tone: "success",
                message: `Đã tạo lời mời ${response.data.id} cho ${response.data.supplier_name}.`,
            });
        } catch (nextError) {
            setIsSaving(false);
            pushToast({
                tone: "warning",
                message: nextError instanceof Error ? nextError.message : "Không thể gửi lời mời.",
            });
        }
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-1" />
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

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}
            {isLoading ? (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Đang tải dữ liệu cộng đồng...
                </SurfaceCard>
            ) : null}

            {inviteOpen ? (
                <SurfaceCard className="space-y-4">
                    <div>
                        <h3 className="font-headline text-2xl font-bold">Tạo lời mời đối tác</h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            Thông tin sẽ được gửi vào backend và hiện trong danh sách lời mời.
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Tên đơn vị"
                            value={inviteForm.supplierName}
                            onChange={(event) => updateInviteField("supplierName", event.target.value)}
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Người liên hệ"
                            value={inviteForm.contactName}
                            onChange={(event) => updateInviteField("contactName", event.target.value)}
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
                            onChange={(event) => updateInviteField("categories", event.target.value)}
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
                            Hủy
                        </Button>
                        <Button disabled={isSaving} onClick={() => void handleSubmitInvite()}>
                            {isSaving ? "Đang gửi..." : "Gửi lời mời"}
                        </Button>
                    </div>
                </SurfaceCard>
            ) : null}

            {invitations.length > 0 ? (
                <SurfaceCard className="space-y-3">
                    <h3 className="font-headline text-xl font-semibold">Lời mời gần đây</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {invitations.slice(0, 4).map((invitation) => (
                            <div key={invitation.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                <p className="font-semibold">{invitation.supplier_name}</p>
                                <p className="mt-1 text-on-surface-variant">
                                    {invitation.contact_name} · {invitation.email}
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
                    {filteredSuppliers.map((supplier) => (
                        <SurfaceCard key={supplier.id} className="space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tertiary-fixed text-tertiary">
                                    {supplier.name.slice(0, 1)}
                                </div>
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
                                    {supplier.status}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-headline text-xl font-semibold">{supplier.name}</h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {supplier.address ?? "Không có địa chỉ"}
                                </p>
                            </div>
                            <div className="space-y-2 text-sm text-on-surface-variant">
                                <p>Liên hệ chính: {supplier.contact_name ?? "Chưa cập nhật"}</p>
                                <p>Email: {supplier.email ?? "Chưa cập nhật"}</p>
                                <p>Số sản phẩm: {supplier.product_count}</p>
                            </div>
                        </SurfaceCard>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                    {filteredCustomers.map((customer) => (
                        <SurfaceCard key={customer.id} className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-headline text-xl font-semibold">
                                        {customer.full_name}
                                    </h3>
                                    <p className="text-sm text-on-surface-variant">{customer.email}</p>
                                </div>
                                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs uppercase tracking-widest text-primary">
                                    {customer.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-on-surface-variant">Đơn hàng</p>
                                    <p className="mt-2 font-headline text-2xl font-bold">
                                        {customer.order_count}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-on-surface-variant">Tổng chi tiêu</p>
                                    <p className="mt-2 font-headline text-2xl font-bold">
                                        {Math.round(Number(customer.total_spend) / 1000)}K
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
