import { useEffect, useMemo, useState } from "react";

import type { BackendAdminCustomer } from "@/shared/api/backend-types";
import { hasAdminPermission } from "@/shared/lib/auth";
import { downloadTextFile } from "@/shared/lib/download";
import {
    type AdminCustomerPayload,
    useAdminUserStore,
} from "@/shared/lib/store/use-admin-user-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { AdminDrawer, Badge, Button, DataTable, Icon, StatCard, SurfaceCard, cn } from "@/shared/ui";
import type { StatusTone, TableColumn } from "@/shared/types/ui";

type DrawerMode = "view" | "create" | "edit";

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
    if (customer.is_active && !customer.is_deleted) return "success";
    return customer.is_deleted ? "danger" : "warning";
}

function statusLabel(customer: BackendAdminCustomer) {
    return customer.is_active && !customer.is_deleted ? "ACTIVE" : "INACTIVE";
}

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function FieldValue({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
        <div className="rounded-2xl bg-surface-container-low p-4 text-sm">
            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">
                {label}
            </p>
            <p className="mt-2 font-medium text-on-surface">{value || "Chua cap nhat"}</p>
        </div>
    );
}

function ActionButton({
    label,
    icon,
    disabled,
    onClick,
    tone = "neutral",
}: {
    label: string;
    icon: string;
    disabled?: boolean;
    onClick: () => void;
    tone?: "neutral" | "danger" | "primary";
}) {
    return (
        <button
            type="button"
            className={cn(
                "rounded-xl p-2 transition disabled:cursor-not-allowed disabled:opacity-40",
                tone === "danger"
                    ? "text-error hover:bg-error-container/40"
                    : tone === "primary"
                      ? "text-primary hover:bg-primary/10"
                      : "text-on-surface-variant hover:bg-surface-container-low",
            )}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
        >
            <Icon name={icon} className="text-xl" />
        </button>
    );
}

export function AdminUsersPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeCustomerId, setActiveCustomerId] = useState("");
    const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
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
                (statusFilter === "active" && statusLabel(customer) === "ACTIVE") ||
                (statusFilter === "inactive" && statusLabel(customer) === "INACTIVE");

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
        activeCustomerId && activeCustomerId !== "new"
            ? customers.find((customer) => String(customer.id) === activeCustomerId)
            : undefined;

    useEffect(() => {
        if (!activeCustomer || drawerMode === "create") return;

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
            isActive: activeCustomer.is_active,
            newsletter: activeCustomer.newsletter,
            smsAlerts: activeCustomer.sms_alerts,
            orderEmail: activeCustomer.order_email,
            securityAlerts: activeCustomer.security_alerts,
        });
    }, [activeCustomer, drawerMode]);

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
                ? `${customers.filter((customer) => statusLabel(customer) === "ACTIVE").length}`
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

    function openCreateDrawer() {
        setActiveCustomerId("new");
        setCustomerForm(emptyCustomerForm);
        setDrawerMode("create");
    }

    function openCustomerDrawer(customer: BackendAdminCustomer, mode: DrawerMode) {
        setActiveCustomerId(String(customer.id));
        setDrawerMode(mode);
    }

    function closeDrawer() {
        setDrawerMode(null);
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
            is_active: customerForm.isActive,
            is_deleted: false,
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
        setDrawerMode("view");
        pushToast({ tone: "success", message: `Da tao user ${result.data.full_name}.` });
    }

    async function handleUpdateCustomer() {
        if (!activeCustomer) return;

        const result = await updateCustomer(activeCustomer.id, buildPayload(false));

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat user." });
            return;
        }

        setDrawerMode("view");
        pushToast({ tone: "success", message: `Da cap nhat user ${result.data.full_name}.` });
    }

    async function handleBlockCustomer(customer = activeCustomer) {
        if (!customer) return;

        const result = await blockCustomer(customer.id);

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the khoa user." });
            return;
        }

        setActiveCustomerId(String(result.data.id));
        setDrawerMode("view");
        pushToast({ tone: "success", message: `Da khoa user ${result.data.full_name}.` });
    }

    const columns: TableColumn<BackendAdminCustomer>[] = [
        {
            key: "identity",
            title: "User Identity",
            width: "24%",
            render: (customer) => (
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed">
                        {initials(customer.full_name) || "U"}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-on-surface">{customer.full_name}</p>
                        <p className="truncate text-xs text-on-surface-variant">{customer.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "region",
            title: "Region",
            width: "22%",
            render: (customer) => (
                <div>
                    <p>{customer.city ?? "Chua cap nhat"}</p>
                    <p className="text-xs text-on-surface-variant">
                        {customer.favorite_region ?? "Chua co vung yeu thich"}
                    </p>
                </div>
            ),
        },
        {
            key: "orders",
            title: "Orders",
            align: "right",
            width: "9%",
            nowrap: true,
            render: (customer) => <span className="font-semibold">{customer.orders_count}</span>,
        },
        {
            key: "reward",
            title: "Reward",
            width: "15%",
            render: (customer) => (
                <div>
                    <p className="font-medium">{customer.reward_tier}</p>
                    <p className="text-xs text-on-surface-variant">{customer.reward_points} diem</p>
                </div>
            ),
        },
        {
            key: "status",
            title: "Status",
            width: "14%",
            nowrap: true,
            render: (customer) => (
                <Badge tone={statusTone(customer)}>{statusLabel(customer)}</Badge>
            ),
        },
        {
            key: "actions",
            title: "Actions",
            align: "right",
            width: "16%",
            nowrap: true,
            render: (customer) => (
                <div className="flex justify-end gap-1">
                    <ActionButton
                        label={`Xem ${customer.full_name}`}
                        icon="visibility"
                        onClick={() => openCustomerDrawer(customer, "view")}
                    />
                    <ActionButton
                        label={`Sua ${customer.full_name}`}
                        icon="edit"
                        tone="primary"
                        disabled={!canUpdateUser}
                        onClick={() => openCustomerDrawer(customer, "edit")}
                    />
                    <ActionButton
                        label={`Khoa ${customer.full_name}`}
                        icon="block"
                        tone="danger"
                        disabled={!canDeleteUser || !customer.is_active}
                        onClick={() => void handleBlockCustomer(customer)}
                    />
                </div>
            ),
        },
    ];

    const drawerTitle =
        drawerMode === "create"
            ? "Tao customer"
            : drawerMode === "edit"
              ? "Chinh sua customer"
              : "Ho so customer";

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
                    <Button disabled={!canCreateUser} onClick={openCreateDrawer}>
                        Tao user
                    </Button>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

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
                    </select>
                </div>

                {error ? <p className="text-sm text-error">{error}</p> : null}
                {!canViewUsers ? (
                    <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                        Ban chua co quyen xem danh sach users.
                    </p>
                ) : null}

                {canViewUsers ? (
                    <DataTable
                        rows={filteredCustomers}
                        columns={columns}
                        getRowKey={(customer) => String(customer.id)}
                        isLoading={isLoading}
                        emptyMessage="Khong co user phu hop bo loc hien tai."
                        minWidth="920px"
                        pagination={{ pageSize: 5, itemLabel: "users" }}
                        rowClassName={(customer) =>
                            activeCustomerId === String(customer.id) ? "border-l-4 border-primary bg-primary/5" : undefined
                        }
                        onRowClick={(customer) => openCustomerDrawer(customer, "view")}
                    />
                ) : null}
            </SurfaceCard>

            <AdminDrawer
                open={drawerMode !== null}
                mode={drawerMode ?? "view"}
                title={drawerTitle}
                subtitle={
                    drawerMode === "create"
                        ? "Nhap thong tin de tao tai khoan customer moi."
                        : activeCustomer
                          ? `${activeCustomer.email} / ${activeCustomer.phone}`
                          : undefined
                }
                onClose={closeDrawer}
                footer={
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button variant="outline" onClick={closeDrawer}>
                            Dong
                        </Button>
                        {drawerMode === "create" ? (
                            <Button disabled={isSaving || !canCreateUser} onClick={() => void handleCreateCustomer()}>
                                Tao user
                            </Button>
                        ) : null}
                        {drawerMode === "view" && activeCustomer ? (
                            <>
                                <Button
                                    variant="secondary"
                                    disabled={!canUpdateUser}
                                    onClick={() => setDrawerMode("edit")}
                                >
                                    Sua
                                </Button>
                                <Button
                                    variant="ghost"
                                    disabled={isSaving || !canDeleteUser || !activeCustomer.is_active}
                                    onClick={() => void handleBlockCustomer()}
                                >
                                    Khoa user
                                </Button>
                            </>
                        ) : null}
                        {drawerMode === "edit" ? (
                            <Button disabled={!activeCustomer || isSaving || !canUpdateUser} onClick={() => void handleUpdateCustomer()}>
                                Luu chinh sua
                            </Button>
                        ) : null}
                    </div>
                }
            >
                {drawerMode === "view" && activeCustomer ? (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-sm font-bold text-on-primary-fixed">
                                    {initials(activeCustomer.full_name) || "U"}
                                </div>
                                <div>
                                    <h3 className="font-headline text-xl font-bold">{activeCustomer.full_name}</h3>
                                    <p className="text-sm text-on-surface-variant">{activeCustomer.email}</p>
                                </div>
                            </div>
                            <Badge tone={statusTone(activeCustomer)}>{statusLabel(activeCustomer)}</Badge>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FieldValue label="Phone" value={activeCustomer.phone} />
                            <FieldValue label="City" value={activeCustomer.city} />
                            <FieldValue label="Favorite region" value={activeCustomer.favorite_region} />
                            <FieldValue label="Address" value={activeCustomer.address} />
                            <FieldValue label="Orders" value={activeCustomer.orders_count} />
                            <FieldValue label="Reward" value={`${activeCustomer.reward_tier} / ${activeCustomer.reward_points} diem`} />
                        </div>
                    </div>
                ) : null}

                {(drawerMode === "create" || drawerMode === "edit") ? (
                    <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Ho ten"
                                value={customerForm.fullName}
                                onChange={(event) =>
                                    setCustomerForm((current) => ({ ...current, fullName: event.target.value }))
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
                            {drawerMode === "create" ? (
                                <input
                                    className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                                    placeholder="Mat khau moi khi tao user"
                                    type="password"
                                    value={customerForm.password}
                                    onChange={(event) =>
                                        setCustomerForm((current) => ({ ...current, password: event.target.value }))
                                    }
                                />
                            ) : null}
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
                                    setCustomerForm((current) => ({ ...current, favoriteRegion: event.target.value }))
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
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Hang thuong"
                                value={customerForm.rewardTier}
                                onChange={(event) =>
                                    setCustomerForm((current) => ({ ...current, rewardTier: event.target.value }))
                                }
                            />
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                min={0}
                                placeholder="Diem"
                                type="number"
                                value={customerForm.rewardPoints}
                                onChange={(event) =>
                                    setCustomerForm((current) => ({ ...current, rewardPoints: event.target.value }))
                                }
                            />
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                min={0}
                                placeholder="Diem len hang tiep"
                                type="number"
                                value={customerForm.nextTierPoints}
                                onChange={(event) =>
                                    setCustomerForm((current) => ({ ...current, nextTierPoints: event.target.value }))
                                }
                            />
                            <label className="flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface-variant md:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={customerForm.isActive}
                                    onChange={(event) =>
                                        setCustomerForm((current) => ({ ...current, isActive: event.target.checked }))
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
                    </div>
                ) : null}
            </AdminDrawer>
        </div>
    );
}
