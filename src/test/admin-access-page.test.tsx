import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAccessPage } from "@/pages/admin-access/ui/admin-access-page";
import type {
    BackendAdminAccount,
    BackendAdminPermission,
    BackendAdminRole,
} from "@/shared/api/backend-types";
import type {
    AdminAccountForm,
    AdminRoleForm,
} from "@/shared/lib/store/use-admin-access-store";
import { useAdminAccessStore } from "@/shared/lib/store/use-admin-access-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";

const permissions: BackendAdminPermission[] = [
    {
        id: 1,
        key: "admin.dashboard.view",
        name: "View dashboard",
        group: "Dashboard",
        description: "View admin dashboard metrics.",
    },
    {
        id: 2,
        key: "admin.orders.view",
        name: "View orders",
        group: "Orders",
        description: "View order lists.",
    },
    {
        id: 3,
        key: "admin.orders.status.update",
        name: "Update order status",
        group: "Orders",
        description: "Update fulfillment status.",
    },
    {
        id: 4,
        key: "admin.orders.bulk.update",
        name: "Bulk update orders",
        group: "Orders",
        description: "Run bulk order status actions.",
    },
    {
        id: 5,
        key: "admin.products.view",
        name: "View products",
        group: "Catalog",
        description: "View products.",
    },
    {
        id: 6,
        key: "admin.products.delete",
        name: "Delete products",
        group: "Catalog",
        description: "Delete products.",
    },
];

const allPermissionKeys = permissions.map((permission) => permission.key);

const roles: BackendAdminRole[] = [
    {
        id: 1,
        name: "Super Admin",
        slug: "super_admin",
        description: "Full access.",
        is_super: true,
        is_system: true,
        users_count: 1,
        permissions,
        permission_keys: allPermissionKeys,
    },
    {
        id: 2,
        name: "Order Manager",
        slug: "order_manager",
        description: "Handles orders.",
        is_super: false,
        is_system: false,
        users_count: 1,
        permissions: permissions.filter((permission) =>
            ["admin.orders.view", "admin.orders.status.update"].includes(permission.key),
        ),
        permission_keys: ["admin.orders.view", "admin.orders.status.update"],
    },
    {
        id: 3,
        name: "Catalog Viewer",
        slug: "catalog_viewer",
        description: "Reads catalog.",
        is_super: false,
        is_system: false,
        users_count: 1,
        permissions: permissions.filter((permission) => permission.key === "admin.products.view"),
        permission_keys: ["admin.products.view"],
    },
];

const admins: BackendAdminAccount[] = [
    {
        id: 1,
        full_name: "Root",
        email: "root@example.com",
        phone: "0900000001",
        role: "ADMIN",
        is_active: true,
        is_deleted: false,
        admin_role: {
            id: 1,
            name: "Super Admin",
            slug: "super_admin",
            is_super: true,
        },
        created_by_admin: null,
    },
    {
        id: 2,
        full_name: "Linh Điều phối",
        email: "linh@example.com",
        phone: "0900000002",
        role: "ADMIN",
        is_active: true,
        is_deleted: false,
        admin_role: {
            id: 2,
            name: "Order Manager",
            slug: "order_manager",
            is_super: false,
        },
        created_by_admin: {
            id: 1,
            full_name: "Root",
            email: "root@example.com",
        },
    },
    {
        id: 3,
        full_name: "Nam Catalog",
        email: "nam@example.com",
        phone: "0900000003",
        role: "ADMIN",
        is_active: false,
        is_deleted: false,
        admin_role: {
            id: 3,
            name: "Catalog Viewer",
            slug: "catalog_viewer",
            is_super: false,
        },
        created_by_admin: {
            id: 1,
            full_name: "Root",
            email: "root@example.com",
        },
    },
];

function setSuperAdminSession() {
    useAuthStore.setState({
        session: {
            user: {
                id: "1",
                name: "Root",
                email: "root@example.com",
                role: "admin",
                adminRole: {
                    id: "1",
                    name: "Super Admin",
                    slug: "super_admin",
                    isSuper: true,
                },
                permissions: [],
            },
            loggedInAt: "2026-05-22T00:00:00.000Z",
        },
        accessToken: "admin-token",
        authSource: "backend",
        isHydrating: false,
    });
}

function renderAccessPage() {
    const loadAll = vi.fn(() => Promise.resolve({ success: true }));
    const saveRole = vi.fn((payload: AdminRoleForm) => {
        const matchedRole = roles.find((role) => role.id === payload.id) ?? roles[1];

        return Promise.resolve({
            success: true,
            data: {
                ...matchedRole,
                name: payload.name,
                description: payload.description,
                permission_keys: payload.permissions,
                permissions: permissions.filter((permission) =>
                    payload.permissions.includes(permission.key),
                ),
            } as BackendAdminRole,
        });
    });
    const saveAdmin = vi.fn((payload: AdminAccountForm) => Promise.resolve({
        success: true,
        data: {
            ...(admins.find((admin) => admin.id === payload.id) ?? admins[1]),
            admin_role:
                roles.find((role) => role.id === payload.adminRoleId) ?? roles[1],
        } as BackendAdminAccount,
    }));
    const updateAdminStatus = vi.fn((adminId: number, isActive: boolean) => Promise.resolve({
        success: true,
        data: {
            ...admins.find((admin) => admin.id === adminId)!,
            is_active: isActive,
        } as BackendAdminAccount,
    }));

    useAdminAccessStore.setState({
        permissions,
        roles,
        admins,
        isLoading: false,
        isSaving: false,
        error: null,
        loadAll,
        saveRole,
        deleteRole: vi.fn(() => Promise.resolve({ success: true })),
        saveAdmin,
        updateAdminStatus,
        updateAdminPassword: vi.fn(() => Promise.resolve({ success: true })),
    });

    render(<AdminAccessPage />);

    return { loadAll, saveRole, saveAdmin, updateAdminStatus };
}

describe("AdminAccessPage", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        useFeedbackStore.getState().clear();
        useAuthStore.getState().clearSession();
        setSuperAdminSession();
    });

    it("renders a role heatmap and opens permission detail by group", async () => {
        renderAccessPage();

        expect(await screen.findByRole("heading", { name: "Phân quyền admin" })).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Chi tiết Order Manager - Đơn hàng: 2/3 quyền" })[0]).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Chi tiết Super Admin - Đơn hàng: 3/3 quyền" })[0]).toBeInTheDocument();

        await userEvent.click(
            screen.getAllByRole("button", { name: "Chi tiết Order Manager - Đơn hàng: 2/3 quyền" })[0],
        );

        const matrixTable = screen.getByRole("table");
        expect(screen.getAllByRole("button", { name: "Thu gọn Order Manager - Đơn hàng: 2/3 quyền" })[0]).toBeInTheDocument();
        const detail = within(matrixTable).getByRole("heading", { name: "Chi tiết quyền" }).closest("div");
        expect(detail).toBeTruthy();
        expect(within(matrixTable).getByText("Cập nhật trạng thái đơn hàng")).toBeInTheDocument();
        expect(within(matrixTable).getByRole("checkbox", { name: /Cập nhật trạng thái đơn hàng/i })).toBeChecked();
        expect(within(matrixTable).getByRole("checkbox", { name: /Cập nhật hàng loạt đơn hàng/i })).not.toBeChecked();

        await userEvent.click(
            screen.getAllByRole("button", { name: "Thu gọn Order Manager - Đơn hàng: 2/3 quyền" })[0],
        );

        expect(within(matrixTable).queryByRole("heading", { name: "Chi tiết quyền" })).not.toBeInTheDocument();
    });

    it("stages permission ticks until the role save button is clicked", async () => {
        const { saveRole } = renderAccessPage();

        await userEvent.click(
            screen.getAllByRole("button", { name: "Chi tiết Order Manager - Đơn hàng: 2/3 quyền" })[0],
        );
        const matrixTable = screen.getByRole("table");
        await userEvent.click(
            within(matrixTable).getByRole("checkbox", { name: /Cập nhật hàng loạt đơn hàng/i }),
        );

        expect(saveRole).not.toHaveBeenCalled();
        expect(screen.getAllByText("Chưa lưu").length).toBeGreaterThan(0);

        await userEvent.click(screen.getAllByRole("button", { name: "Lưu Order Manager" })[0]);

        await waitFor(() => expect(saveRole).toHaveBeenCalledTimes(1));
        const savedRolePayload = saveRole.mock.calls[0]?.[0];
        expect(savedRolePayload).toMatchObject({ id: 2 });
        expect(savedRolePayload?.permissions).toEqual(
            expect.arrayContaining([
                "admin.orders.view",
                "admin.orders.status.update",
                "admin.orders.bulk.update",
            ]),
        );
    });

    it("lets admins tick a permission group directly in the matrix before saving", async () => {
        const { saveRole } = renderAccessPage();
        const matrixCheckbox = screen.getAllByLabelText("Cấp toàn bộ Đơn hàng cho Order Manager")[0];

        expect(matrixCheckbox).not.toBeChecked();

        await userEvent.click(matrixCheckbox);

        expect(saveRole).not.toHaveBeenCalled();
        expect(screen.getAllByText("Chưa lưu").length).toBeGreaterThan(0);

        await userEvent.click(screen.getAllByRole("button", { name: "Lưu Order Manager" })[0]);

        await waitFor(() => expect(saveRole).toHaveBeenCalledTimes(1));
        const savedRolePayload = saveRole.mock.calls[0]?.[0];
        expect(savedRolePayload?.permissions).toEqual(
            expect.arrayContaining([
                "admin.orders.view",
                "admin.orders.status.update",
                "admin.orders.bulk.update",
            ]),
        );
    });

    it("groups admins by role and supports inline role and status updates", async () => {
        const { saveAdmin, updateAdminStatus } = renderAccessPage();

        await userEvent.click(screen.getByRole("button", { name: "Admin con" }));

        const orderGroup = screen.getByRole("heading", { name: "Order Manager" }).closest("section");
        expect(orderGroup).toBeTruthy();
        expect(within(orderGroup!).getByText("Linh Điều phối")).toBeInTheDocument();

        await userEvent.selectOptions(
            screen.getByLabelText("Đổi role cho Linh Điều phối"),
            "3",
        );

        await waitFor(() => expect(saveAdmin).toHaveBeenCalledTimes(1));
        const savedAdminPayload = saveAdmin.mock.calls[0]?.[0];
        expect(savedAdminPayload).toMatchObject({
            id: 2,
            adminRoleId: 3,
            password: "",
        });

        await userEvent.click(within(orderGroup!).getByRole("button", { name: "Khóa" }));

        await waitFor(() => expect(updateAdminStatus).toHaveBeenCalledWith(2, false));
    });
});
