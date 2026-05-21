import { useEffect, useMemo, useState } from "react";

import type { BackendAdminAccount, BackendAdminRole } from "@/shared/api/backend-types";
import {
    type AdminAccountForm,
    type AdminRoleForm,
    useAdminAccessStore,
} from "@/shared/lib/store/use-admin-access-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Badge, Button, Input, Select, SurfaceCard } from "@/shared/ui";

type AccessTab = "roles" | "admins";

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
    status: "ACTIVE",
    isActive: true,
    password: "",
};

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

    useEffect(() => {
        if (user?.adminRole?.isSuper) {
            void loadAll();
        }
    }, [loadAll, user?.adminRole?.isSuper]);

    const permissionsByGroup = useMemo(() => {
        return permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
            groups[permission.group] = [...(groups[permission.group] ?? []), permission];
            return groups;
        }, {});
    }, [permissions]);

    const assignableRoles = useMemo(
        () => roles.filter((role) => !role.is_super),
        [roles],
    );

    if (!user?.adminRole?.isSuper) {
        return (
            <SurfaceCard className="text-on-surface-variant">
                Chi super admin moi co quyen quan ly role va tai khoan admin con.
            </SurfaceCard>
        );
    }

    function editRole(role: BackendAdminRole) {
        setRoleForm({
            id: role.id,
            name: role.name,
            description: role.description ?? "",
            permissions: role.permission_keys,
        });
        setActiveTab("roles");
    }

    function editAdmin(admin: BackendAdminAccount) {
        if (admin.admin_role?.is_super) return;

        setAdminForm({
            id: admin.id,
            fullName: admin.full_name,
            email: admin.email,
            phone: admin.phone,
            adminRoleId: admin.admin_role?.id ?? "",
            status: admin.status,
            isActive: admin.is_active,
            password: "",
        });
        setActiveTab("admins");
    }

    async function handleSaveRole() {
        const result = await saveRole(roleForm);

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success ? "Da luu role admin." : (result.error ?? "Khong the luu role."),
        });

        if (result.success) {
            setRoleForm(emptyRoleForm);
        }
    }

    async function handleDeleteRole(role: BackendAdminRole) {
        const result = await deleteRole(role.id);

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success ? "Da xoa role admin." : (result.error ?? "Khong the xoa role."),
        });
    }

    async function handleSaveAdmin() {
        const result = await saveAdmin(adminForm);

        if (result.success && adminForm.id && adminForm.password.trim()) {
            await updateAdminPassword(adminForm.id, adminForm.password);
        }

        pushToast({
            tone: result.success ? "success" : "warning",
            message: result.success
                ? "Da luu tai khoan admin."
                : (result.error ?? "Khong the luu tai khoan admin."),
        });

        if (result.success) {
            setAdminForm(emptyAdminForm);
        }
    }

    function togglePermission(permissionKey: string) {
        setRoleForm((current) => ({
            ...current,
            permissions: current.permissions.includes(permissionKey)
                ? current.permissions.filter((key) => key !== permissionKey)
                : [...current.permissions, permissionKey],
        }));
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Phan quyen admin</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Tao role, gan quyen va tao tai khoan admin con.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === "roles" ? "primary" : "secondary"}
                        onClick={() => setActiveTab("roles")}
                    >
                        Role
                    </Button>
                    <Button
                        variant={activeTab === "admins" ? "primary" : "secondary"}
                        onClick={() => setActiveTab("admins")}
                    >
                        Admin con
                    </Button>
                </div>
            </div>

            {isLoading ? <SurfaceCard>Dang tai du lieu phan quyen...</SurfaceCard> : null}
            {error ? <SurfaceCard className="text-error">{error}</SurfaceCard> : null}

            {activeTab === "roles" ? (
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <SurfaceCard className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-headline text-xl font-semibold">
                                {roleForm.id ? "Sua role" : "Tao role"}
                            </h2>
                            {roleForm.id ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRoleForm(emptyRoleForm)}
                                >
                                    Tao moi
                                </Button>
                            ) : null}
                        </div>

                        <label className="space-y-2 text-sm">
                            <span className="font-medium">Ten role</span>
                            <Input
                                value={roleForm.name}
                                onChange={(event) =>
                                    setRoleForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder="Quan ly don hang"
                            />
                        </label>
                        <label className="space-y-2 text-sm">
                            <span className="font-medium">Mo ta</span>
                            <textarea
                                className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none"
                                value={roleForm.description}
                                onChange={(event) =>
                                    setRoleForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <div className="space-y-4">
                            {Object.entries(permissionsByGroup).map(([group, groupPermissions]) => (
                                <div key={group} className="space-y-2">
                                    <h3 className="text-sm font-semibold">{group}</h3>
                                    <div className="grid gap-2">
                                        {groupPermissions.map((permission) => (
                                            <label
                                                key={permission.key}
                                                className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-3 text-sm"
                                            >
                                                <input
                                                    className="mt-1 h-4 w-4"
                                                    type="checkbox"
                                                    checked={roleForm.permissions.includes(permission.key)}
                                                    onChange={() => togglePermission(permission.key)}
                                                />
                                                <span>
                                                    <span className="block font-medium">
                                                        {permission.name}
                                                    </span>
                                                    <span className="block text-xs text-on-surface-variant">
                                                        {permission.key}
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            disabled={isSaving || !roleForm.name.trim()}
                            onClick={() => void handleSaveRole()}
                        >
                            {isSaving ? "Dang luu..." : "Luu role"}
                        </Button>
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <h2 className="font-headline text-xl font-semibold">Danh sach role</h2>
                        <div className="space-y-3">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold">{role.name}</h3>
                                                {role.is_super ? <Badge tone="primary">super</Badge> : null}
                                                {role.is_system ? <Badge>system</Badge> : null}
                                            </div>
                                            <p className="mt-1 text-sm text-on-surface-variant">
                                                {role.description || "Khong co mo ta"}
                                            </p>
                                            <p className="mt-2 text-xs text-on-surface-variant">
                                                {role.users_count} admin, {role.permission_keys.length} quyen
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={role.is_super}
                                                onClick={() => editRole(role)}
                                            >
                                                Sua
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={role.is_super || role.is_system || role.users_count > 0}
                                                onClick={() => void handleDeleteRole(role)}
                                            >
                                                Xoa
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {role.permission_keys.map((key) => (
                                            <Badge key={key} className="normal-case tracking-normal">
                                                {key}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <SurfaceCard className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-headline text-xl font-semibold">
                                {adminForm.id ? "Sua admin" : "Tao admin con"}
                            </h2>
                            {adminForm.id ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAdminForm(emptyAdminForm)}
                                >
                                    Tao moi
                                </Button>
                            ) : null}
                        </div>

                        <label className="space-y-2 text-sm">
                            <span className="font-medium">Ho ten</span>
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
                            <span className="font-medium">So dien thoai</span>
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
                                <option value="">Chon role</option>
                                {assignableRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <label className="space-y-2 text-sm">
                            <span className="font-medium">
                                {adminForm.id ? "Mat khau moi neu can" : "Mat khau"}
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
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-2 text-sm">
                                <span className="font-medium">Trang thai</span>
                                <Select
                                    value={adminForm.status}
                                    onChange={(event) =>
                                        setAdminForm((current) => ({
                                            ...current,
                                            status: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                    <option value="BLOCKED">BLOCKED</option>
                                </Select>
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
                                <span>Dang kich hoat</span>
                            </label>
                        </div>

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
                            {isSaving ? "Dang luu..." : "Luu admin"}
                        </Button>
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <h2 className="font-headline text-xl font-semibold">Tai khoan admin</h2>
                        <div className="space-y-3">
                            {admins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold">{admin.full_name}</h3>
                                                {admin.admin_role?.is_super ? (
                                                    <Badge tone="primary">super</Badge>
                                                ) : null}
                                                <Badge tone={admin.status === "ACTIVE" ? "success" : "warning"}>
                                                    {admin.status}
                                                </Badge>
                                                {!admin.is_active ? <Badge tone="danger">disabled</Badge> : null}
                                            </div>
                                            <p className="mt-1 text-sm text-on-surface-variant">
                                                {admin.email} - {admin.phone}
                                            </p>
                                            <p className="mt-1 text-xs text-on-surface-variant">
                                                Role: {admin.admin_role?.name ?? "Chua gan"}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={admin.admin_role?.is_super}
                                                onClick={() => editAdmin(admin)}
                                            >
                                                Sua
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={admin.admin_role?.is_super || isSaving}
                                                onClick={() =>
                                                    void updateAdminStatus(
                                                        admin.id,
                                                        admin.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                                                        admin.status !== "ACTIVE",
                                                    )
                                                }
                                            >
                                                {admin.status === "ACTIVE" ? "Khoa" : "Mo khoa"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>
                </div>
            )}
        </div>
    );
}
