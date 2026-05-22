import { useEffect, useMemo, useState } from "react";

import type { BackendAdminCustomer } from "@/shared/api/backend-types";
import { downloadTextFile } from "@/shared/lib/download";
import { hasAdminPermission } from "@/shared/lib/auth";
import {
    type AdminCustomerPayload,
    useAdminUserStore,
} from "@/shared/lib/store/use-admin-user-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Badge, Button, StatCard, SurfaceCard } from "@/shared/ui";
import type { StatusTone } from "@/shared/types/ui";

const emptyCustomerForm = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    city: "",
    favoriteRegion: "",
    avatarUrl: "",
    rewardPoints: "0",
    rewardTier: "Bronze",
    nextTierPoints: "500",
    status: "ACTIVE",
    isActive: true,
    newsletter: false,
    smsAlerts: false,
    orderEmail: true,
    securityAlerts: true,
};

const notificationFields = [
    { key: "newsletter" as const, label: "Newsletter" },
    { key: "smsAlerts" as const, label: "SMS alerts" },
    { key: "orderEmail" as const, label: "Order email" },
    { key: "securityAlerts" as const, label: "Security alerts" },
];

function statusTone(customer: BackendAdminCustomer): StatusTone {
    if (!customer.is_active || customer.status === "BLOCKED") return "danger";
    if (customer.status === "INACTIVE") return "warning";
    return "success";
}

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export function AdminUsersPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeCustomerId, setActiveCustomerId] = useState("");
    const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
    const user = useAuthStore((state) => state.session?.user ?? null);
    const customers = useAdminUserStore((state) => state.customers);
    const isLoading = useAdminUserStore((state) => state.isLoading);
    const isSaving = useAdminUserStore((state) => state.isSaving);
    const error = useAdminUserStore((state) => state.error);
    const loadCustomers = useAdminUserStore((state) => state.loadCustomers);
    const createCustomer = useAdminUserStore((state) => state.createCustomer);
    const updateCustomer = useAdminUserStore((state) => state.updateCustomer);
    const blockCustomer = useAdminUserStore((state) => state.blockCustomer);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    const canViewUsers = hasAdminPermission(user, "admin.users.view");
    const canCreateUser = hasAdminPermission(user, "admin.users.create");
    const canUpdateUser = hasAdminPermission(user, "admin.users.update");
    const canDeleteUser = hasAdminPermission(user, "admin.users.delete");

    useEffect(() => {
        if (!canViewUsers) return;
        void loadCustomers();
    }, [canViewUsers, loadCustomers]);

    const filteredCustomers = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return customers.filter((customer) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && customer.status === "ACTIVE" && customer.is_active) ||
                (statusFilter === "blocked" &&
                    (customer.status === "BLOCKED" || !customer.is_active)) ||
                (statusFilter === "inactive" && customer.status === "INACTIVE");

            if (!matchesStatus) return false;
            if (keyword.length === 0) return true;

            return [
                customer.full_name,
                customer.email,
                customer.phone,
                customer.city,
                customer.favorite_region,
                customer.reward_tier,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword);
        });
    }, [customers, query, statusFilter]);

    const activeCustomer =
        activeCustomerId === "new"
            ? undefined
            : (filteredCustomers.find((customer) => String(customer.id) === activeCustomerId) ??
              filteredCustomers[0]);

    useEffect(() => {
        if (!activeCustomer) return;

        setActiveCustomerId(String(activeCustomer.id));
        setCustomerForm({
            fullName: activeCustomer.full_name,
            email: activeCustomer.email,
            phone: activeCustomer.phone,
            password: "",
            address: activeCustomer.address ?? "",
            city: activeCustomer.city ?? "",
            favoriteRegion: activeCustomer.favorite_region ?? "",
            avatarUrl: activeCustomer.avatar_url ?? "",
            rewardPoints: String(activeCustomer.reward_points),
            rewardTier: activeCustomer.reward_tier,
            nextTierPoints: String(activeCustomer.next_tier_points),
            status: activeCustomer.status,
            isActive: activeCustomer.is_active,
            newsletter: activeCustomer.newsletter,
            smsAlerts: activeCustomer.sms_alerts,
            orderEmail: activeCustomer.order_email,
            securityAlerts: activeCustomer.security_alerts,
        });
    }, [activeCustomer]);

    const stats = [
        {
            id: "admin-users-total",
            label: "Customer Directory",
            value: canViewUsers ? `${customers.length}` : "-",
            tone: "primary" as const,
            icon: "group",
            delta: "Tong tai khoan customer",
        },
        {
            id: "admin-users-active",
            label: "Dang hoat dong",
            value: canViewUsers
                ? `${customers.filter((customer) => customer.status === "ACTIVE" && customer.is_active).length}`
                : "-",
            tone: "success" as const,
            icon: "verified_user",
            delta: "Co the dang nhap va mua hang",
        },
        {
            id: "admin-users-orders",
            label: "Tong don gan user",
            value: canViewUsers
                ? `${customers.reduce((sum, customer) => sum + customer.orders_count, 0)}`
                : "-",
            tone: "secondary" as const,
            icon: "shopping_bag",
            delta: "Khong mat khi khoa mem user",
        },
    ];

    function resetCustomerForm() {
        setActiveCustomerId("new");
        setCustomerForm(emptyCustomerForm);
    }

    function buildPayload(includePassword: boolean): AdminCustomerPayload {
        const rewardPoints = Number(customerForm.rewardPoints);
        const nextTierPoints = Number(customerForm.nextTierPoints);

        return {
            full_name: customerForm.fullName.trim(),
            email: customerForm.email.trim(),
            phone: customerForm.phone.trim(),
            ...(includePassword ? { password: customerForm.password } : {}),
            address: customerForm.address.trim() || null,
            city: customerForm.city.trim() || null,
            favorite_region: customerForm.favoriteRegion.trim() || null,
            avatar_url: customerForm.avatarUrl.trim() || null,
            newsletter: customerForm.newsletter,
            sms_alerts: customerForm.smsAlerts,
            order_email: customerForm.orderEmail,
            security_alerts: customerForm.securityAlerts,
            reward_points: Number.isFinite(rewardPoints) ? rewardPoints : 0,
            reward_tier: customerForm.rewardTier.trim() || "Bronze",
            next_tier_points: Number.isFinite(nextTierPoints) ? nextTierPoints : 500,
            status: customerForm.status,
            is_active: customerForm.isActive,
        };
    }

    async function handleCreateCustomer() {
        if (
            !customerForm.fullName.trim() ||
            !customerForm.email.trim() ||
            !customerForm.phone.trim() ||
            customerForm.password.length < 8
        ) {
            pushToast({
                tone: "warning",
                message: "Can nhap ten, email, so dien thoai va mat khau toi thieu 8 ky tu.",
            });
            return;
        }

        const result = await createCustomer(buildPayload(true));

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the tao user." });
            return;
        }

        setActiveCustomerId(String(result.data.id));
        pushToast({ tone: "success", message: `Da tao user ${result.data.full_name}.` });
    }

    async function handleUpdateCustomer() {
        if (!activeCustomer) return;

        const result = await updateCustomer(activeCustomer.id, buildPayload(false));

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat user." });
            return;
        }

        pushToast({ tone: "success", message: `Da cap nhat user ${result.data.full_name}.` });
    }

    async function handleBlockCustomer() {
        if (!activeCustomer) return;

        const result = await blockCustomer(activeCustomer.id);

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the khoa user." });
            return;
        }

        pushToast({ tone: "success", message: `Da khoa user ${result.data.full_name}.` });
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                        Directory / Management
                    </p>
                    <h1 className="mt-3 font-headline text-3xl font-bold text-on-surface">
                        Users
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                        Quan ly customer account, trang thai dang nhap va thong tin ho so trong admin shell.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="secondary"
                        disabled={!canViewUsers}
                        onClick={() => {
                            downloadTextFile(
                                "admin-users.json",
                                JSON.stringify(customers, null, 2),
                                "application/json",
                            );
                            pushToast({ tone: "success", message: "Da xuat danh sach users." });
                        }}
                    >
                        Export
                    </Button>
                    <Button disabled={!canCreateUser} onClick={resetCustomerForm}>
                        Tao user
                    </Button>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <SurfaceCard className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <input
                            className="min-w-0 flex-1 rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Search users, region, email or phone..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        <select
                            className="rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="all">Tat ca trang thai</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>

                    {error ? <p className="text-sm text-error">{error}</p> : null}
                    {!canViewUsers ? (
                        <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                            Ban chua co quyen xem danh sach users.
                        </p>
                    ) : null}
                    {isLoading && canViewUsers ? (
                        <p className="text-sm text-on-surface-variant">Dang tai users...</p>
                    ) : null}
                    {!isLoading && canViewUsers && filteredCustomers.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                            Khong co user phu hop bo loc hien tai.
                        </p>
                    ) : null}

                    {canViewUsers ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-outline-variant/10 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                                        <th className="px-3 py-3">User Identity</th>
                                        <th className="px-3 py-3">Region</th>
                                        <th className="px-3 py-3 text-right">Orders</th>
                                        <th className="px-3 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                    {filteredCustomers.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className={`cursor-pointer transition hover:bg-surface-container-low ${
                                                activeCustomer?.id === customer.id
                                                    ? "bg-primary/5"
                                                    : ""
                                            }`}
                                            onClick={() => setActiveCustomerId(String(customer.id))}
                                        >
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed">
                                                        {initials(customer.full_name) || "U"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium">
                                                            {customer.full_name}
                                                        </p>
                                                        <p className="truncate text-xs text-on-surface-variant">
                                                            {customer.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-on-surface-variant">
                                                <p>{customer.city ?? "Chua cap nhat"}</p>
                                                <p className="text-xs">
                                                    {customer.favorite_region ?? "Chua co vung yeu thich"}
                                                </p>
                                            </td>
                                            <td className="px-3 py-4 text-right text-sm font-semibold">
                                                {customer.orders_count}
                                            </td>
                                            <td className="px-3 py-4">
                                                <Badge tone={statusTone(customer)}>
                                                    {customer.is_active ? customer.status : "BLOCKED"}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </SurfaceCard>

                <SurfaceCard className="space-y-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-headline text-2xl font-bold">
                                {activeCustomerId === "new" ? "Tao customer" : "Ho so customer"}
                            </h2>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                Xoa user se khoa mem tai khoan va giu nguyen don hang.
                            </p>
                        </div>
                        {activeCustomer ? (
                            <Badge tone={statusTone(activeCustomer)}>
                                {activeCustomer.is_active ? activeCustomer.status : "BLOCKED"}
                            </Badge>
                        ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Ho ten"
                            value={customerForm.fullName}
                            onChange={(event) =>
                                setCustomerForm((current) => ({
                                    ...current,
                                    fullName: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="So dien thoai"
                            value={customerForm.phone}
                            onChange={(event) =>
                                setCustomerForm((current) => ({ ...current, phone: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                            placeholder="Email"
                            type="email"
                            value={customerForm.email}
                            onChange={(event) =>
                                setCustomerForm((current) => ({ ...current, email: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                            placeholder="Mat khau moi khi tao user"
                            type="password"
                            value={customerForm.password}
                            onChange={(event) =>
                                setCustomerForm((current) => ({
                                    ...current,
                                    password: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Thanh pho"
                            value={customerForm.city}
                            onChange={(event) =>
                                setCustomerForm((current) => ({ ...current, city: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Vung yeu thich"
                            value={customerForm.favoriteRegion}
                            onChange={(event) =>
                                setCustomerForm((current) => ({
                                    ...current,
                                    favoriteRegion: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                            placeholder="Dia chi"
                            value={customerForm.address}
                            onChange={(event) =>
                                setCustomerForm((current) => ({ ...current, address: event.target.value }))
                            }
                        />
                        <select
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            value={customerForm.status}
                            onChange={(event) =>
                                setCustomerForm((current) => ({ ...current, status: event.target.value }))
                            }
                        >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="BLOCKED">BLOCKED</option>
                        </select>
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Hang thuong"
                            value={customerForm.rewardTier}
                            onChange={(event) =>
                                setCustomerForm((current) => ({
                                    ...current,
                                    rewardTier: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            min={0}
                            placeholder="Diem"
                            type="number"
                            value={customerForm.rewardPoints}
                            onChange={(event) =>
                                setCustomerForm((current) => ({
                                    ...current,
                                    rewardPoints: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            min={0}
                            placeholder="Diem len hang tiep"
                            type="number"
                            value={customerForm.nextTierPoints}
                            onChange={(event) =>
                                setCustomerForm((current) => ({
                                    ...current,
                                    nextTierPoints: event.target.value,
                                }))
                            }
                        />
                        <label className="flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface-variant md:col-span-2">
                            <input
                                type="checkbox"
                                checked={customerForm.isActive}
                                onChange={(event) =>
                                    setCustomerForm((current) => ({
                                        ...current,
                                        isActive: event.target.checked,
                                    }))
                                }
                            />
                            User duoc phep dang nhap
                        </label>
                    </div>

                    <div className="grid gap-3 text-sm text-on-surface-variant sm:grid-cols-2">
                        {notificationFields.map((field) => (
                            <label
                                key={field.key}
                                className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3"
                            >
                                <input
                                    type="checkbox"
                                    checked={customerForm[field.key]}
                                    onChange={(event) =>
                                        setCustomerForm((current) => ({
                                            ...current,
                                            [field.key]: event.target.checked,
                                        }))
                                    }
                                />
                                {field.label}
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            variant="secondary"
                            disabled={isSaving || !canCreateUser}
                            onClick={() => void handleCreateCustomer()}
                        >
                            Tao user
                        </Button>
                        <Button
                            variant="outline"
                            disabled={!activeCustomer || isSaving || !canUpdateUser}
                            onClick={() => void handleUpdateCustomer()}
                        >
                            Luu chinh sua
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={!activeCustomer || isSaving || !canDeleteUser}
                            onClick={() => void handleBlockCustomer()}
                        >
                            Khoa user
                        </Button>
                    </div>
                </SurfaceCard>
            </section>
        </div>
    );
}
