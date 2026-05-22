import { Fragment, useEffect, useMemo, useState } from "react";

import type {
    BackendAdminAccount,
    BackendAdminPermission,
    BackendAdminRole,
} from "@/shared/api/backend-types";
import {
    type AdminAccountForm,
    type AdminRoleForm,
    useAdminAccessStore,
} from "@/shared/lib/store/use-admin-access-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { AdminPageHeader, Badge, Button, Icon, Input, Select, SurfaceCard, cn } from "@/shared/ui";

type AccessTab = "roles" | "admins";
type PermissionDrafts = Record<number, string[]>;
type PermissionGroups = Record<string, BackendAdminPermission[]>;
type SelectedPermissionGroup = {
    roleId: number;
    group: string;
} | null;

const emptyRoleForm: AdminRoleForm = {
    name: "",
    description: "",
    permissions: [],
};

const emptyAdminForm: AdminAccountForm = {
    fullName: "",
    email: "",
    phone: "",
    adminRoleId: "",
    isActive: true,
    password: "",
};

const groupLabels: Record<string, string> = {
    Catalog: "Danh mục & sản phẩm",
    Community: "Cộng đồng",
    Dashboard: "Tổng quan",
    Orders: "Đơn hàng",
    Settings: "Cài đặt",
    Shipping: "Vận chuyển",
    "Supplier Portal": "Cổng nhà cung cấp",
    Users: "Người dùng",
    "Warehouse Portal": "Cổng kho",
};

const permissionLabels: Record<string, string> = {
    "admin.categories.create": "Tạo danh mục",
    "admin.categories.delete": "Xóa danh mục",
    "admin.categories.update": "Cập nhật danh mục",
    "admin.community.comments.moderate": "Kiểm duyệt bình luận",
    "admin.community.invitation.create": "Tạo lời mời nhà cung cấp",
    "admin.community.posts.create": "Tạo bài viết",
    "admin.community.posts.delete": "Xóa bài viết",
    "admin.community.posts.update": "Cập nhật bài viết",
    "admin.community.posts.view": "Xem bài viết",
    "admin.community.view": "Xem cộng đồng",
    "admin.dashboard.view": "Xem dashboard",
    "admin.orders.bulk.update": "Cập nhật hàng loạt đơn hàng",
    "admin.orders.payment.update": "Cập nhật thanh toán",
    "admin.orders.status.update": "Cập nhật trạng thái đơn hàng",
    "admin.orders.view": "Xem đơn hàng",
    "admin.products.create": "Tạo sản phẩm",
    "admin.products.delete": "Xóa sản phẩm",
    "admin.products.update": "Cập nhật sản phẩm",
    "admin.products.view": "Xem sản phẩm",
    "admin.settings.update": "Cập nhật cài đặt",
    "admin.settings.view": "Xem cài đặt",
    "admin.shipping_carriers.create": "Tạo đơn vị vận chuyển",
    "admin.shipping_carriers.delete": "Xóa đơn vị vận chuyển",
    "admin.shipping_carriers.update": "Cập nhật đơn vị vận chuyển",
    "admin.shipping_carriers.view": "Xem đơn vị vận chuyển",
    "admin.supplier.help.view": "Xem hỗ trợ nhà cung cấp",
    "admin.supplier.inventory.view": "Xem tồn kho nhà cung cấp",
    "admin.supplier.orders.view": "Xem đơn hàng nhà cung cấp",
    "admin.supplier.processing.view": "Xem xử lý đơn nhà cung cấp",
    "admin.supplier.requisitions.view": "Xem phiếu yêu cầu nhà cung cấp",
    "admin.suppliers.create": "Tạo nhà cung cấp",
    "admin.suppliers.delete": "Xóa nhà cung cấp",
    "admin.suppliers.update": "Cập nhật nhà cung cấp",
    "admin.users.create": "Tạo người dùng",
    "admin.users.delete": "Khóa người dùng",
    "admin.users.update": "Cập nhật người dùng",
    "admin.users.view": "Xem người dùng",
    "admin.warehouse.fulfillment.view": "Xem fulfillment kho",
    "admin.warehouse.help.view": "Xem hỗ trợ kho",
    "admin.warehouse.inventory.view": "Xem tồn kho",
    "admin.warehouse.requisitions.view": "Xem phiếu tái nhập",
    "admin.warehouse.supplier_orders.view": "Xem đơn nhà cung cấp tại kho",
};

const sensitivePermissionFragments = [
    ".delete",
    ".bulk.update",
    ".payment.update",
    ".settings.update",
];

function groupLabel(group: string) {
    return groupLabels[group] ?? group;
}

function permissionLabel(permission: BackendAdminPermission) {
    return permissionLabels[permission.key] ?? permission.name;
}

function isSensitivePermission(permissionKey: string) {
    return sensitivePermissionFragments.some((fragment) => permissionKey.includes(fragment));
}

function uniqueKeys(keys: string[]) {
    return Array.from(new Set(keys));
}

function samePermissionKeys(first: string[], second: string[]) {
    if (first.length !== second.length) return false;

    const secondSet = new Set(second);
    return first.every((key) => secondSet.has(key));
}

function roleKeys(role: BackendAdminRole, drafts: PermissionDrafts) {
    return drafts[role.id] ?? role.permission_keys;
}

function adminStatusLabel(admin: BackendAdminAccount) {
    return admin.is_active && !admin.is_deleted ? "Đang hoạt động" : "Đã khóa";
}

function adminStatusTone(admin: BackendAdminAccount) {
    return admin.is_active && !admin.is_deleted ? "success" : "warning";
}

function roleInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function coverageForGroup(
    selectedKeys: string[],
    groupPermissions: BackendAdminPermission[],
) {
    const keySet = new Set(selectedKeys);
    const granted = groupPermissions.filter((permission) => keySet.has(permission.key)).length;
    const total = groupPermissions.length;
    const ratio = total === 0 ? 0 : granted / total;

    return { granted, total, ratio };
}

function heatmapClasses(ratio: number, dirty: boolean) {
    if (ratio === 0) {
        return dirty
            ? "bg-tertiary/5 text-tertiary ring-2 ring-tertiary/25"
            : "bg-surface-container-low text-on-surface-variant";
    }

    if (ratio < 0.4) {
        return dirty
            ? "bg-tertiary/15 text-tertiary ring-2 ring-tertiary/25"
            : "bg-tertiary/10 text-tertiary";
    }

    if (ratio < 1) {
        return dirty
            ? "bg-secondary-container text-on-secondary-fixed-variant ring-2 ring-secondary/30"
            : "bg-secondary-container/70 text-on-secondary-fixed-variant";
    }

    return dirty
        ? "bg-primary/20 text-primary ring-2 ring-primary/30"
        : "bg-primary/12 text-primary";
}

function safeRoleDescription(role: BackendAdminRole) {
    return role.description?.trim() || "Chưa có mô tả cho role này.";
}

function RoleBadges({ role }: { role: BackendAdminRole }) {
    return (
        <div className="flex flex-wrap gap-2">
            {role.is_super ? <Badge tone="primary">Super</Badge> : null}
            {role.is_system ? <Badge>System</Badge> : null}
            {role.users_count > 0 ? <Badge tone="secondary">{role.users_count} admin</Badge> : null}
        </div>
    );
}

export function AdminAccessPage() {
    const user = useAuthStore((state) => state.session?.user ?? null);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const permissions = useAdminAccessStore((state) => state.permissions);
    const roles = useAdminAccessStore((state) => state.roles);
    const admins = useAdminAccessStore((state) => state.admins);
    const isLoading = useAdminAccessStore((state) => state.isLoading);
    const isSaving = useAdminAccessStore((state) => state.isSaving);
    const error = useAdminAccessStore((state) => state.error);
    const loadAll = useAdminAccessStore((state) => state.loadAll);
    const saveRole = useAdminAccessStore((state) => state.saveRole);
    const deleteRole = useAdminAccessStore((state) => state.deleteRole);
    const saveAdmin = useAdminAccessStore((state) => state.saveAdmin);
    const updateAdminStatus = useAdminAccessStore((state) => state.updateAdminStatus);
    const updateAdminPassword = useAdminAccessStore((state) => state.updateAdminPassword);
    const [activeTab, setActiveTab] = useState<AccessTab>("roles");
    const [roleForm, setRoleForm] = useState<AdminRoleForm>(emptyRoleForm);
    const [adminForm, setAdminForm] = useState<AdminAccountForm>(emptyAdminForm);
    const [permissionDrafts, setPermissionDrafts] = useState<PermissionDrafts>({});
    const [selectedPermissionGroup, setSelectedPermissionGroup] =
        useState<SelectedPermissionGroup>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [roleQuery, setRoleQuery] = useState("");
    const [adminQuery, setAdminQuery] = useState("");
    const [adminRoleFilter, setAdminRoleFilter] = useState("all");
    const [adminStatusFilter, setAdminStatusFilter] = useState("all");

    useEffect(() => {
        if (user?.adminRole?.isSuper) {
            void loadAll();
        }
    }, [loadAll, user?.adminRole?.isSuper]);

    const permissionsByGroup = useMemo<PermissionGroups>(() => {
        return permissions.reduce<PermissionGroups>((groups, permission) => {
            groups[permission.group] = [...(groups[permission.group] ?? []), permission];
            return groups;
        }, {});
    }, [permissions]);

    const groupEntries = useMemo(
        () => Object.entries(permissionsByGroup),
        [permissionsByGroup],
    );

    const filteredRoles = useMemo(() => {
        const keyword = roleQuery.trim().toLowerCase();
        if (!keyword) return roles;

        return roles.filter((role) =>
            [
                role.name,
                role.slug,
                role.description,
                ...role.permission_keys,
                ...role.permissions.map((permission) => permission.group),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword),
        );
    }, [roleQuery, roles]);

    const assignableRoles = useMemo(
        () => roles.filter((role) => !role.is_super),
        [roles],
    );

    const selectedRole = useMemo(
        () => roles.find((role) => role.id === selectedRoleId) ?? null,
        [roles, selectedRoleId],
    );

    const selectedGroupRole = selectedPermissionGroup
        ? roles.find((role) => role.id === selectedPermissionGroup.roleId) ?? null
        : null;

    const dirtyRoles = useMemo(
        () =>
            roles.filter((role) => {
                const draft = permissionDrafts[role.id];
                return draft ? !samePermissionKeys(draft, role.permission_keys) : false;
            }),
        [permissionDrafts, roles],
    );

    const filteredAdmins = useMemo(() => {
        const keyword = adminQuery.trim().toLowerCase();

        return admins.filter((admin) => {
            const matchesRole =
                adminRoleFilter === "all" ||
                (adminRoleFilter === "unassigned" && !admin.admin_role) ||
                String(admin.admin_role?.id ?? "") === adminRoleFilter;
            const matchesStatus =
                adminStatusFilter === "all" ||
                (adminStatusFilter === "active" && admin.is_active && !admin.is_deleted) ||
                (adminStatusFilter === "locked" && (!admin.is_active || admin.is_deleted));
            const matchesQuery =
                !keyword ||
                [
                    admin.full_name,
                    admin.email,
                    admin.phone,
                    admin.admin_role?.name,
                    admin.created_by_admin?.full_name,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(keyword);

            return matchesRole && matchesStatus && matchesQuery;
        });
    }, [adminQuery, adminRoleFilter, adminStatusFilter, admins]);

    const adminsByRole = useMemo(() => {
        const roleGroups = roles.map((role) => ({
            role,
            admins: filteredAdmins.filter((admin) => admin.admin_role?.id === role.id),
        }));
        const unassigned = filteredAdmins.filter((admin) => !admin.admin_role);

        return { roleGroups, unassigned };
    }, [filteredAdmins, roles]);

    if (!user?.adminRole?.isSuper) {
        return (
            <SurfaceCard className="text-on-surface-variant">
                Chỉ super admin mới có quyền quản lý role và tài khoản admin con.
            </SurfaceCard>
        );
    }

    function isRoleDirty(role: BackendAdminRole) {
        const draft = permissionDrafts[role.id];
        return draft ? !samePermissionKeys(draft, role.permission_keys) : false;
    }

    function selectRole(role: BackendAdminRole) {
        setSelectedRoleId(role.id);
        setRoleForm({
            id: role.id,
            name: role.name,
            description: role.description ?? "",
            permissions: roleKeys(role, permissionDrafts),
        });
    }

    function createRole() {
        setSelectedRoleId(null);
        setSelectedPermissionGroup(null);
        setRoleForm(emptyRoleForm);
    }

    function togglePermissionGroupDetail(role: BackendAdminRole, group: string) {
        selectRole(role);
        setSelectedPermissionGroup((current) =>
            current?.roleId === role.id && current.group === group
                ? null
                : { roleId: role.id, group },
        );
    }

    function setRoleDraft(role: BackendAdminRole, nextKeys: string[]) {
        if (role.is_super) return;

        setPermissionDrafts((current) => ({
            ...current,
            [role.id]: uniqueKeys(nextKeys),
        }));
    }

    function togglePermissionForRole(role: BackendAdminRole, permissionKey: string) {
        const keys = roleKeys(role, permissionDrafts);
        const nextKeys = keys.includes(permissionKey)
            ? keys.filter((key) => key !== permissionKey)
            : [...keys, permissionKey];

        setRoleDraft(role, nextKeys);
    }

    function selectGroupForRole(role: BackendAdminRole, groupPermissions: BackendAdminPermission[]) {
        const keys = roleKeys(role, permissionDrafts);
        const groupKeys = groupPermissions.map((permission) => permission.key);
        setRoleDraft(role, [...keys, ...groupKeys]);
    }

    function clearGroupForRole(role: BackendAdminRole, groupPermissions: BackendAdminPermission[]) {
        const groupKeys = new Set(groupPermissions.map((permission) => permission.key));
        setRoleDraft(
            role,
            roleKeys(role, permissionDrafts).filter((key) => !groupKeys.has(key)),
        );
    }

    function discardRoleDraft(role: BackendAdminRole) {
        setPermissionDrafts((current) => {
            const next = { ...current };
            delete next[role.id];
            return next;
        });
    }

    async function handleSaveRoleDraft(role: BackendAdminRole) {
        const result = await saveRole({
            id: role.id,
            name: role.name,
            description: role.description ?? "",
            permissions: roleKeys(role, permissionDrafts),
        });

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? `Đã lưu quyền cho ${role.name}.`
                : (result.error ?? "Không thể lưu quyền cho role."),
        });

        if (result.success) {
            discardRoleDraft(role);
        }
    }

    async function handleSaveRoleForm() {
        const matchingRole = roleForm.id
            ? roles.find((role) => role.id === roleForm.id)
            : null;
        const result = await saveRole({
            ...roleForm,
            permissions: matchingRole ? roleKeys(matchingRole, permissionDrafts) : roleForm.permissions,
        });

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? "Đã lưu thông tin role."
                : (result.error ?? "Không thể lưu role."),
        });

        if (result.success) {
            if (matchingRole) {
                discardRoleDraft(matchingRole);
            }
            setRoleForm(emptyRoleForm);
            setSelectedRoleId(null);
        }
    }

    async function handleDeleteRole(role: BackendAdminRole) {
        const result = await deleteRole(role.id);

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? "Đã xóa role admin."
                : (result.error ?? "Không thể xóa role."),
        });
    }

    function editAdmin(admin: BackendAdminAccount) {
        if (admin.admin_role?.is_super) return;

        setAdminForm({
            id: admin.id,
            fullName: admin.full_name,
            email: admin.email,
            phone: admin.phone,
            adminRoleId: admin.admin_role?.id ?? "",
            isActive: admin.is_active,
            password: "",
        });
        setActiveTab("admins");
    }

    async function handleSaveAdmin() {
        const profilePayload = adminForm.id ? { ...adminForm, password: "" } : adminForm;
        const result = await saveAdmin(profilePayload);

        if (result.success && adminForm.id && adminForm.password.trim()) {
            const passwordResult = await updateAdminPassword(adminForm.id, adminForm.password);
            if (!passwordResult.success) {
                pushToast({
                    tone: "warning",
                    message: passwordResult.error ?? "Không thể đổi mật khẩu admin.",
                });
                return;
            }
        }

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? "Đã lưu tài khoản admin."
                : (result.error ?? "Không thể lưu tài khoản admin."),
        });

        if (result.success) {
            setAdminForm(emptyAdminForm);
        }
    }

    async function handleInlineAdminRole(admin: BackendAdminAccount, nextRoleId: string) {
        const nextId = Number(nextRoleId);
        if (!nextId || admin.admin_role?.id === nextId || admin.admin_role?.is_super) return;

        const result = await saveAdmin({
            id: admin.id,
            fullName: admin.full_name,
            email: admin.email,
            phone: admin.phone,
            adminRoleId: nextId,
            isActive: admin.is_active,
            password: "",
        });

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? `Đã đổi role cho ${admin.full_name}.`
                : (result.error ?? "Không thể đổi role admin."),
        });
    }

    async function handleInlineAdminStatus(admin: BackendAdminAccount) {
        if (admin.admin_role?.is_super) return;

        const nextActive = adminStatusLabel(admin) !== "Đang hoạt động";
        const result = await updateAdminStatus(admin.id, nextActive);

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? nextActive
                    ? `Đã mở khóa ${admin.full_name}.`
                    : `Đã khóa ${admin.full_name}.`
                : (result.error ?? "Không thể cập nhật trạng thái admin."),
        });
    }

    function renderCoverageCell(
        role: BackendAdminRole,
        group: string,
        groupPermissions: BackendAdminPermission[],
        showGroupName = false,
    ) {
        const keys = roleKeys(role, permissionDrafts);
        const coverage = coverageForGroup(keys, groupPermissions);
        const dirty = isRoleDirty(role);
        const isFullyGranted = coverage.ratio === 1;
        const isExpanded =
            selectedPermissionGroup?.roleId === role.id &&
            selectedPermissionGroup.group === group;
        const statusLabel =
            coverage.ratio === 1
                ? "Đủ quyền"
                : coverage.ratio === 0
                  ? "Chưa cấp"
                  : "Một phần";

        function handleGroupCheckboxChange(checked: boolean) {
            selectRole(role);

            if (checked) {
                selectGroupForRole(role, groupPermissions);
                return;
            }

            clearGroupForRole(role, groupPermissions);
        }

        return (
            <div
                key={`${role.id}-${group}`}
                className={cn(
                    "flex min-h-24 w-full flex-col justify-between rounded-2xl p-3 text-left text-sm transition hover:-translate-y-0.5 hover:shadow-sm",
                    heatmapClasses(coverage.ratio, dirty),
                )}
            >
                <label
                    className={cn(
                        "flex cursor-pointer items-start gap-3",
                        role.is_super && "cursor-not-allowed",
                    )}
                >
                    <input
                        className="mt-1 h-4 w-4 accent-primary"
                        type="checkbox"
                        checked={isFullyGranted}
                        disabled={role.is_super}
                        aria-label={`Cấp toàn bộ ${groupLabel(group)} cho ${role.name}`}
                        onChange={(event) => handleGroupCheckboxChange(event.target.checked)}
                    />
                    <span className="min-w-0 flex-1">
                        {showGroupName ? (
                            <span className="block truncate text-xs font-medium opacity-80">
                                {groupLabel(group)}
                            </span>
                        ) : null}
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="font-semibold">
                                {coverage.granted}/{coverage.total}
                            </span>
                            {role.is_super ? <Icon name="lock" className="text-base" /> : null}
                        </span>
                        <span className="mt-1 block text-xs opacity-80">{statusLabel}</span>
                    </span>
                </label>

                <button
                    type="button"
                    className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/65 px-3 py-1 text-xs font-semibold text-on-surface-variant transition hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                    aria-label={`${isExpanded ? "Thu gọn" : "Chi tiết"} ${role.name} - ${groupLabel(group)}: ${coverage.granted}/${coverage.total} quyền`}
                    onClick={() => togglePermissionGroupDetail(role, group)}
                >
                    {isExpanded ? "Thu gọn" : "Chi tiết"}
                    <Icon
                        name={isExpanded ? "expand_less" : "chevron_right"}
                        className="text-sm"
                    />
                </button>
            </div>
        );
    }

    function renderPermissionInlineDetail(
        role: BackendAdminRole,
        group: string,
        groupPermissions: BackendAdminPermission[],
    ) {
        return (
            <div className="rounded-[1.5rem] border border-primary/10 bg-white/85 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-headline text-lg font-bold">Chi tiết quyền</h3>
                            {isRoleDirty(role) ? <Badge tone="warning">Chưa lưu</Badge> : null}
                            {role.is_super ? <Badge tone="primary">Đã khóa</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            {role.name} / {groupLabel(group)}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={role.is_super}
                            onClick={() => selectGroupForRole(role, groupPermissions)}
                        >
                            Chọn cả nhóm
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={role.is_super}
                            onClick={() => clearGroupForRole(role, groupPermissions)}
                        >
                            Bỏ cả nhóm
                        </Button>
                        <Button
                            size="sm"
                            disabled={role.is_super || !isRoleDirty(role) || isSaving}
                            onClick={() => void handleSaveRoleDraft(role)}
                        >
                            Lưu {role.name}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={role.is_super || !isRoleDirty(role)}
                            onClick={() => discardRoleDraft(role)}
                        >
                            Hủy thay đổi
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {groupPermissions.map((permission) => {
                        const checked = roleKeys(role, permissionDrafts).includes(permission.key);

                        return (
                            <label
                                key={permission.key}
                                className={cn(
                                    "flex items-start gap-3 rounded-2xl bg-surface-container-low p-4 text-sm",
                                    role.is_super && "cursor-not-allowed opacity-70",
                                )}
                            >
                                <input
                                    className="mt-1 h-4 w-4 accent-primary"
                                    type="checkbox"
                                    checked={checked}
                                    disabled={role.is_super}
                                    onChange={() => togglePermissionForRole(role, permission.key)}
                                />
                                <span className="min-w-0">
                                    <span className="flex flex-wrap items-center gap-2 font-medium">
                                        {permissionLabel(permission)}
                                        {isSensitivePermission(permission.key) ? (
                                            <Badge tone="warning">Nhạy cảm</Badge>
                                        ) : null}
                                    </span>
                                    <span className="mt-1 block break-all text-xs text-on-surface-variant">
                                        {permission.key}
                                    </span>
                                    {permission.description ? (
                                        <span className="mt-1 block text-xs text-on-surface-variant">
                                            {permission.description}
                                        </span>
                                    ) : null}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    }

    const selectedRoleKeys = selectedRole ? roleKeys(selectedRole, permissionDrafts) : [];
    const selectedRoleSensitivePermissions = selectedRole
        ? permissions.filter(
              (permission) =>
                  selectedRoleKeys.includes(permission.key) &&
                  isSensitivePermission(permission.key),
          )
        : [];

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Phân quyền admin"
                description="Cấp quyền bằng nháp và kiểm tra các tài khoản admin con."
                actions={
                    <div className="flex flex-wrap gap-2 rounded-[1.25rem] bg-surface-container-highest/50 p-1.5">
                    <button
                        type="button"
                        className={cn(
                            "rounded-xl px-5 py-2 text-sm font-semibold transition",
                            activeTab === "roles"
                                ? "bg-surface-container-lowest text-primary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface",
                        )}
                        onClick={() => setActiveTab("roles")}
                    >
                        Role & quyền
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "rounded-xl px-5 py-2 text-sm font-semibold transition",
                            activeTab === "admins"
                                ? "bg-surface-container-lowest text-primary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface",
                        )}
                        onClick={() => setActiveTab("admins")}
                    >
                        Admin con
                    </button>
                    </div>
                }
            />

            {isLoading ? (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Đang tải dữ liệu phân quyền...
                </SurfaceCard>
            ) : null}
            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            {activeTab === "roles" ? (
                <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.55fr)]">
                    <div className="space-y-6">
                        <section className="grid gap-4 md:grid-cols-3">
                            <SurfaceCard className="space-y-2" tone="low">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                                    Role
                                </p>
                                <p className="font-headline text-3xl font-bold">{roles.length}</p>
                                <p className="text-sm text-on-surface-variant">
                                    {dirtyRoles.length} role có thay đổi chưa lưu
                                </p>
                            </SurfaceCard>
                            <SurfaceCard className="space-y-2" tone="low">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                                    Nhóm quyền
                                </p>
                                <p className="font-headline text-3xl font-bold">{groupEntries.length}</p>
                                <p className="text-sm text-on-surface-variant">
                                    Hiển thị theo module nghiệp vụ
                                </p>
                            </SurfaceCard>
                            <SurfaceCard className="space-y-2" tone="low">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                                    Quyền
                                </p>
                                <p className="font-headline text-3xl font-bold">{permissions.length}</p>
                                <p className="text-sm text-on-surface-variant">
                                    Có cảnh báo với quyền nhạy cảm
                                </p>
                            </SurfaceCard>
                        </section>

                        <SurfaceCard className="space-y-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="font-headline text-2xl font-bold">
                                        Ma trận role - nhóm quyền
                                    </h2>
                                    <p className="mt-1 text-sm text-on-surface-variant">
                                        Tick ngay trong ô để cấp cả nhóm, hoặc bấm Chi tiết để mở quyền con ngay trong bảng.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <input
                                        className="min-w-64 rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                        placeholder="Tìm role hoặc permission..."
                                        value={roleQuery}
                                        onChange={(event) => setRoleQuery(event.target.value)}
                                    />
                                    <Button variant="secondary" onClick={createRole}>
                                        Tạo role
                                    </Button>
                                </div>
                            </div>

                            {dirtyRoles.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-tertiary/10 p-4 text-sm text-tertiary">
                                    <Icon name="edit_note" className="text-xl" />
                                    <span className="font-medium">Có thay đổi chưa lưu:</span>
                                    {dirtyRoles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1"
                                        >
                                            <span>{role.name}</span>
                                            <button
                                                type="button"
                                                className="font-semibold text-primary"
                                                onClick={() => void handleSaveRoleDraft(role)}
                                            >
                                                Lưu {role.name}
                                            </button>
                                            <button
                                                type="button"
                                                className="font-semibold text-on-surface-variant"
                                                onClick={() => discardRoleDraft(role)}
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[980px] border-separate border-spacing-3">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-10 w-56 rounded-2xl bg-surface px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                                Nhóm quyền
                                            </th>
                                            {filteredRoles.map((role) => (
                                                <th
                                                    key={role.id}
                                                    className="min-w-44 rounded-2xl bg-surface-container-low px-4 py-3 text-left align-top"
                                                >
                                                    <button
                                                        type="button"
                                                        className="w-full text-left"
                                                        onClick={() => selectRole(role)}
                                                    >
                                                        <span className="flex items-start justify-between gap-3">
                                                            <span>
                                                                <span className="block font-semibold">
                                                                    {role.name}
                                                                </span>
                                                                <span className="mt-1 block text-xs font-normal text-on-surface-variant">
                                                                    {role.users_count} admin / {role.permission_keys.length} quyền
                                                                </span>
                                                            </span>
                                                            {isRoleDirty(role) ? (
                                                                <Badge tone="warning">Chưa lưu</Badge>
                                                            ) : null}
                                                        </span>
                                                    </button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupEntries.map(([group, groupPermissions]) => {
                                            const expandedRole =
                                                selectedPermissionGroup?.group === group
                                                    ? selectedGroupRole
                                                    : null;
                                            const canShowExpandedRole = expandedRole
                                                ? filteredRoles.some((role) => role.id === expandedRole.id)
                                                : false;

                                            return (
                                                <Fragment key={group}>
                                                    <tr>
                                                        <th className="sticky left-0 z-10 rounded-2xl bg-surface px-4 py-4 text-left align-top shadow-sm">
                                                            <span className="block font-semibold">
                                                                {groupLabel(group)}
                                                            </span>
                                                            <span className="mt-1 block text-xs font-normal text-on-surface-variant">
                                                                {groupPermissions.length} quyền
                                                            </span>
                                                        </th>
                                                        {filteredRoles.map((role) => (
                                                            <td key={`${role.id}-${group}`} className="align-top">
                                                                {renderCoverageCell(role, group, groupPermissions)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                    {expandedRole && canShowExpandedRole ? (
                                                        <tr>
                                                            <td colSpan={filteredRoles.length + 1} className="p-0">
                                                                {renderPermissionInlineDetail(
                                                                    expandedRole,
                                                                    group,
                                                                    groupPermissions,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ) : null}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-4 md:hidden">
                                {filteredRoles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="rounded-[1.5rem] bg-surface-container-low p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <button
                                                type="button"
                                                className="text-left"
                                                onClick={() => selectRole(role)}
                                            >
                                                <p className="font-semibold">{role.name}</p>
                                                <p className="mt-1 text-xs text-on-surface-variant">
                                                    {role.users_count} admin / {role.permission_keys.length} quyền
                                                </p>
                                            </button>
                                            <RoleBadges role={role} />
                                        </div>
                                        <div className="mt-4 grid gap-2">
                                            {groupEntries.map(([group, groupPermissions]) => {
                                                const isExpanded =
                                                    selectedPermissionGroup?.roleId === role.id &&
                                                    selectedPermissionGroup.group === group;

                                                return (
                                                    <Fragment key={`${role.id}-${group}`}>
                                                        {renderCoverageCell(role, group, groupPermissions, true)}
                                                        {isExpanded
                                                            ? renderPermissionInlineDetail(
                                                                  role,
                                                                  group,
                                                                  groupPermissions,
                                                              )
                                                            : null}
                                                    </Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SurfaceCard>
                    </div>

                    <aside className="space-y-6">
                        <SurfaceCard className="space-y-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-headline text-xl font-bold">
                                        {roleForm.id ? "Thông tin role" : "Tạo role mới"}
                                    </h2>
                                    <p className="mt-1 text-sm text-on-surface-variant">
                                        Tên và mô tả role. Quyền được chỉnh trong ma trận.
                                    </p>
                                </div>
                                {roleForm.id ? (
                                    <Button variant="outline" size="sm" onClick={createRole}>
                                        Tạo mới
                                    </Button>
                                ) : null}
                            </div>

                            {selectedRole ? (
                                <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-sm font-bold text-on-primary-fixed">
                                        {roleInitials(selectedRole.name) || "R"}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold">{selectedRole.name}</p>
                                            <RoleBadges role={selectedRole} />
                                        </div>
                                        <p className="mt-1 text-xs text-on-surface-variant">
                                            {safeRoleDescription(selectedRole)}
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            <label className="space-y-2 text-sm">
                                <span className="font-medium">Tên role</span>
                                <Input
                                    value={roleForm.name}
                                    disabled={Boolean(selectedRole?.is_super)}
                                    onChange={(event) =>
                                        setRoleForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    placeholder="Quản lý đơn hàng"
                                />
                            </label>
                            <label className="space-y-2 text-sm">
                                <span className="font-medium">Mô tả</span>
                                <textarea
                                    className="min-h-28 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                                    value={roleForm.description}
                                    disabled={Boolean(selectedRole?.is_super)}
                                    onChange={(event) =>
                                        setRoleForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    placeholder="Role phụ trách xử lý đơn hàng và vận hành fulfillment."
                                />
                            </label>

                            {selectedRole ? (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                        Mức phủ module
                                    </p>
                                    <div className="grid gap-2">
                                        {groupEntries.map(([group, groupPermissions]) => {
                                            const coverage = coverageForGroup(
                                                selectedRoleKeys,
                                                groupPermissions,
                                            );
                                            return (
                                                <div
                                                    key={group}
                                                    className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm"
                                                >
                                                    <span>{groupLabel(group)}</span>
                                                    <span className="font-semibold text-primary">
                                                        {coverage.granted}/{coverage.total}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                                    Role mới sẽ được tạo trước. Sau đó chọn role trong ma trận để cấp quyền chi tiết.
                                </p>
                            )}

                            {selectedRoleSensitivePermissions.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                        Quyền nhạy cảm
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRoleSensitivePermissions.map((permission) => (
                                            <Badge key={permission.key} tone="warning">
                                                {permissionLabel(permission)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    disabled={
                                        isSaving ||
                                        !roleForm.name.trim() ||
                                        Boolean(selectedRole?.is_super)
                                    }
                                    onClick={() => void handleSaveRoleForm()}
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu role"}
                                </Button>
                                {selectedRole ? (
                                    <Button
                                        variant="outline"
                                        disabled={
                                            selectedRole.is_super ||
                                            selectedRole.is_system ||
                                            selectedRole.users_count > 0 ||
                                            isSaving
                                        }
                                        onClick={() => void handleDeleteRole(selectedRole)}
                                    >
                                        Xóa role
                                    </Button>
                                ) : null}
                            </div>
                        </SurfaceCard>

                    </aside>
                </div>
            ) : (
                <div className="grid gap-6 2xl:grid-cols-[minmax(20rem,0.55fr)_minmax(0,1.45fr)]">
                    <SurfaceCard className="space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="font-headline text-xl font-bold">
                                    {adminForm.id ? "Sửa hồ sơ admin" : "Tạo admin con"}
                                </h2>
                                <p className="mt-1 text-sm text-on-surface-variant">
                                    Danh sách bên phải cho đổi role và khóa/mở khóa nhanh.
                                </p>
                            </div>
                            {adminForm.id ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAdminForm(emptyAdminForm)}
                                >
                                    Tạo mới
                                </Button>
                            ) : null}
                        </div>

                        <label className="space-y-2 text-sm">
                            <span className="font-medium">Họ tên</span>
                            <Input
                                value={adminForm.fullName}
                                onChange={(event) =>
                                    setAdminForm((current) => ({
                                        ...current,
                                        fullName: event.target.value,
                                    }))
                                }
                            />
                        </label>
                        <label className="space-y-2 text-sm">
                            <span className="font-medium">Email</span>
                            <Input
                                value={adminForm.email}
                                onChange={(event) =>
                                    setAdminForm((current) => ({
                                        ...current,
                                        email: event.target.value,
                                    }))
                                }
                            />
                        </label>
                        <label className="space-y-2 text-sm">
                            <span className="font-medium">Số điện thoại</span>
                            <Input
                                value={adminForm.phone}
                                onChange={(event) =>
                                    setAdminForm((current) => ({
                                        ...current,
                                        phone: event.target.value,
                                    }))
                                }
                            />
                        </label>
                        <label className="space-y-2 text-sm">
                            <span className="font-medium">Role</span>
                            <Select
                                value={adminForm.adminRoleId}
                                onChange={(event) =>
                                    setAdminForm((current) => ({
                                        ...current,
                                        adminRoleId: Number(event.target.value) || "",
                                    }))
                                }
                            >
                                <option value="">Chọn role</option>
                                {assignableRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <label className="space-y-2 text-sm">
                            <span className="font-medium">
                                {adminForm.id ? "Mật khẩu mới nếu cần" : "Mật khẩu"}
                            </span>
                            <Input
                                type="password"
                                value={adminForm.password}
                                onChange={(event) =>
                                    setAdminForm((current) => ({
                                        ...current,
                                        password: event.target.value,
                                    }))
                                }
                            />
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                            <input
                                className="h-4 w-4"
                                type="checkbox"
                                checked={adminForm.isActive}
                                onChange={(event) =>
                                    setAdminForm((current) => ({
                                        ...current,
                                        isActive: event.target.checked,
                                    }))
                                }
                            />
                            <span>Đang kích hoạt</span>
                        </label>

                        <Button
                            disabled={
                                isSaving ||
                                !adminForm.fullName.trim() ||
                                !adminForm.email.trim() ||
                                !adminForm.phone.trim() ||
                                !adminForm.adminRoleId ||
                                (!adminForm.id && adminForm.password.length < 8)
                            }
                            onClick={() => void handleSaveAdmin()}
                        >
                            {isSaving ? "Đang lưu..." : "Lưu admin"}
                        </Button>
                    </SurfaceCard>

                    <SurfaceCard className="space-y-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="font-headline text-2xl font-bold">
                                    Admin theo role
                                </h2>
                                <p className="mt-1 text-sm text-on-surface-variant">
                                    Mỗi nhóm cho biết role đang được gán cho ai. Có thể đổi role hoặc khóa nhanh.
                                </p>
                            </div>
                            <Button variant="secondary" onClick={() => setAdminForm(emptyAdminForm)}>
                                Tạo admin
                            </Button>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_12rem]">
                            <input
                                className="min-w-0 rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Tìm admin, email, phone..."
                                value={adminQuery}
                                onChange={(event) => setAdminQuery(event.target.value)}
                            />
                            <Select
                                aria-label="Lọc theo role"
                                value={adminRoleFilter}
                                onChange={(event) => setAdminRoleFilter(event.target.value)}
                            >
                                <option value="all">Tất cả role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                                <option value="unassigned">Chưa gán role</option>
                            </Select>
                            <Select
                                aria-label="Lọc theo trạng thái"
                                value={adminStatusFilter}
                                onChange={(event) => setAdminStatusFilter(event.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="locked">Đã khóa</option>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            {adminsByRole.roleGroups.map(({ role, admins: roleAdmins }) => (
                                <section
                                    key={role.id}
                                    className="rounded-[1.5rem] bg-surface-container-low p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/15 pb-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-headline text-lg font-bold">
                                                    {role.name}
                                                </h3>
                                                <RoleBadges role={role} />
                                            </div>
                                            <p className="mt-1 text-sm text-on-surface-variant">
                                                {roleAdmins.length} admin hiển thị / {role.users_count} admin gán role
                                            </p>
                                        </div>
                                        <Badge tone={role.is_super ? "primary" : "neutral"}>
                                            {role.permission_keys.length} quyền
                                        </Badge>
                                    </div>

                                    {roleAdmins.length === 0 ? (
                                        <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-on-surface-variant">
                                            Chưa có admin trong role này theo bộ lọc hiện tại.
                                        </p>
                                    ) : (
                                        <div className="mt-4 grid gap-3">
                                            {roleAdmins.map((admin) => (
                                                <div
                                                    key={admin.id}
                                                    className="rounded-2xl bg-white/80 p-4 shadow-sm"
                                                >
                                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem_9rem_8rem] xl:items-center">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="font-semibold">
                                                                    {admin.full_name}
                                                                </p>
                                                                {admin.admin_role?.is_super ? (
                                                                    <Badge tone="primary">Super</Badge>
                                                                ) : null}
                                                                <Badge tone={adminStatusTone(admin)}>
                                                                    {adminStatusLabel(admin)}
                                                                </Badge>
                                                            </div>
                                                            <p className="mt-1 break-all text-sm text-on-surface-variant">
                                                                {admin.email} / {admin.phone}
                                                            </p>
                                                            {admin.created_by_admin ? (
                                                                <p className="mt-1 text-xs text-on-surface-variant">
                                                                    Tạo bởi {admin.created_by_admin.full_name}
                                                                </p>
                                                            ) : null}
                                                        </div>

                                                        {admin.admin_role?.is_super ? (
                                                            <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                                                                Super Admin bị khóa role
                                                            </div>
                                                        ) : (
                                                            <Select
                                                                aria-label={`Đổi role cho ${admin.full_name}`}
                                                                value={admin.admin_role?.id ?? ""}
                                                                disabled={isSaving}
                                                                onChange={(event) =>
                                                                    void handleInlineAdminRole(
                                                                        admin,
                                                                        event.target.value,
                                                                    )
                                                                }
                                                            >
                                                                <option value="">Chưa gán role</option>
                                                                {assignableRoles.map((assignableRole) => (
                                                                    <option
                                                                        key={assignableRole.id}
                                                                        value={assignableRole.id}
                                                                    >
                                                                        {assignableRole.name}
                                                                    </option>
                                                                ))}
                                                            </Select>
                                                        )}

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={admin.admin_role?.is_super || isSaving}
                                                            onClick={() => void handleInlineAdminStatus(admin)}
                                                        >
                                                            {adminStatusLabel(admin) === "Đang hoạt động"
                                                                ? "Khóa"
                                                                : "Mở khóa"}
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            disabled={admin.admin_role?.is_super}
                                                            onClick={() => editAdmin(admin)}
                                                        >
                                                            Sửa hồ sơ
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ))}

                            {adminsByRole.unassigned.length > 0 ? (
                                <section className="rounded-[1.5rem] bg-surface-container-low p-4">
                                    <h3 className="font-headline text-lg font-bold">Chưa gán role</h3>
                                    <div className="mt-4 grid gap-3">
                                        {adminsByRole.unassigned.map((admin) => (
                                            <div
                                                key={admin.id}
                                                className="rounded-2xl bg-white/80 p-4 shadow-sm"
                                            >
                                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem_9rem] xl:items-center">
                                                    <div>
                                                        <p className="font-semibold">{admin.full_name}</p>
                                                        <p className="mt-1 break-all text-sm text-on-surface-variant">
                                                            {admin.email} / {admin.phone}
                                                        </p>
                                                    </div>
                                                    <Select
                                                        aria-label={`Đổi role cho ${admin.full_name}`}
                                                        value=""
                                                        disabled={isSaving}
                                                        onChange={(event) =>
                                                            void handleInlineAdminRole(
                                                                admin,
                                                                event.target.value,
                                                            )
                                                        }
                                                    >
                                                        <option value="">Chọn role</option>
                                                        {assignableRoles.map((assignableRole) => (
                                                            <option
                                                                key={assignableRole.id}
                                                                value={assignableRole.id}
                                                            >
                                                                {assignableRole.name}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => editAdmin(admin)}
                                                    >
                                                        Sửa hồ sơ
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                        </div>
                    </SurfaceCard>
                </div>
            )}
        </div>
    );
}
