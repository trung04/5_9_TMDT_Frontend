import { MemoryRouter } from "react-router-dom";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/router";
import { adaptBackendUserToSession } from "@/shared/api/storefront-adapters";
import { routes } from "@/shared/config/routes";
import { resetDemoState } from "@/shared/lib/store/reset-demo";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { createBackendUser, getRequestPath, jsonResponse } from "@/test/backend-test-utils";
import { AdminSidebar } from "@/widgets/admin-sidebar";

function renderApp(route: string) {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <AppRoutes />
        </MemoryRouter>,
    );
}

function setAdminSession(permissions: string[], isSuper = false) {
    const nextAuthState = {
        session: {
            user: {
                id: isSuper ? "1" : "2",
                name: isSuper ? "Root" : "Operator",
                email: isSuper ? "root@example.com" : "operator@example.com",
                role: "admin" as const,
                adminRole: {
                    id: isSuper ? "1" : "2",
                    name: isSuper ? "Super Admin" : "Child Admin",
                    slug: isSuper ? "super_admin" : "child_admin",
                    isSuper,
                },
                permissions,
            },
            loggedInAt: "2026-05-21T00:00:00.000Z",
        },
        accessToken: "admin-token",
        accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
        authSource: "backend" as const,
    };

    localStorage.setItem(
        "heritage-auth-store",
        JSON.stringify({
            state: nextAuthState,
            version: 0,
        }),
    );

    act(() => {
        useAuthStore.setState({
            ...nextAuthState,
            isHydrating: false,
        });
    });
}

describe("admin RBAC frontend", () => {
    beforeEach(() => {
        localStorage.clear();
        resetDemoState();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("adapts backend admin role and permissions into the auth session", () => {
        const session = adaptBackendUserToSession(
            createBackendUser({
                role: "ADMIN",
                admin_role: {
                    id: 1,
                    name: "Super Admin",
                    slug: "super_admin",
                    is_super: true,
                },
                permissions: ["admin.dashboard.view"],
            }),
        );

        expect(session?.user.role).toBe("admin");
        expect(session?.user.adminRole?.isSuper).toBe(true);
        expect(session?.user.permissions).toEqual(["admin.dashboard.view"]);
    });

    it("shows access management only for super admin sessions", () => {
        act(() => {
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
                    loggedInAt: "2026-05-21T00:00:00.000Z",
                },
            });
        });

        const { rerender } = render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText("Người dùng")).toBeInTheDocument();
        expect(screen.getByText("Sản phẩm")).toBeInTheDocument();
        expect(screen.getByText("Danh mục")).toBeInTheDocument();
        expect(screen.getByText("Nhà cung cấp")).toBeInTheDocument();
        expect(screen.getByText("Phân quyền")).toBeInTheDocument();
        expect(screen.getByText("Đơn NCC")).toBeInTheDocument();
        expect(screen.getByText("Fulfillment")).toBeInTheDocument();

        act(() => {
            useAuthStore.setState({
                session: {
                    user: {
                        id: "2",
                        name: "Operator",
                        email: "operator@example.com",
                        role: "admin",
                        adminRole: {
                            id: "2",
                            name: "Dashboard Viewer",
                            slug: "dashboard_viewer",
                            isSuper: false,
                        },
                        permissions: ["admin.dashboard.view"],
                    },
                    loggedInAt: "2026-05-21T00:00:00.000Z",
                },
            });
        });

        rerender(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText("Tổng quan")).toBeInTheDocument();
        expect(screen.queryByText("Phân quyền")).not.toBeInTheDocument();
        expect(screen.queryByText("Sản phẩm")).not.toBeInTheDocument();
        expect(screen.queryByText("Đơn NCC")).not.toBeInTheDocument();

        act(() => {
            useAuthStore.setState({
                session: {
                    user: {
                        id: "3",
                        name: "Supplier Viewer",
                        email: "supplier-viewer@example.com",
                        role: "admin",
                        adminRole: {
                            id: "3",
                            name: "Supplier Viewer",
                            slug: "supplier_viewer",
                            isSuper: false,
                        },
                        permissions: ["admin.supplier.orders.view"],
                    },
                    loggedInAt: "2026-05-21T00:00:00.000Z",
                },
            });
        });

        rerender(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText("Đơn NCC")).toBeInTheDocument();
        expect(screen.queryByText("Tổng quan")).not.toBeInTheDocument();
    });

    it("opens the first permitted admin module from /admin when dashboard is not allowed", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/admin/categories")) {
                return jsonResponse({
                    message: "Categories retrieved successfully.",
                    data: [],
                    pagination: { total: 0, per_page: 100, current_page: 1, last_page: 1 },
                });
            }

            if (path.endsWith("/api/suppliers")) {
                return jsonResponse({
                    message: "Suppliers retrieved successfully.",
                    data: [],
                    pagination: { total: 0, per_page: 100, current_page: 1, last_page: 1 },
                });
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setAdminSession(["admin.categories.create"]);

        renderApp(routes.adminDashboard);

        expect(await screen.findByText(/Quản lý category storefront/i)).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Danh mục" })).toBeInTheDocument();
    });

    it("blocks direct admin module access without a matching permission", async () => {
        setAdminSession(["admin.dashboard.view"]);

        renderApp(routes.adminUsers);

        expect(await screen.findByText(/sai khu vực/i)).toBeInTheDocument();
    });

    it("opens the users module and disables CRUD buttons without write permissions", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/admin/users")) {
                return jsonResponse({
                    message: "Admin users retrieved successfully.",
                    data: [
                        {
                            id: 9,
                            full_name: "Customer Managed",
                            email: "managed@example.com",
                            phone: "0909000009",
                            address: "12 Nguyen Trai",
                            city: "Ha Noi",
                            favorite_region: "Dong Bac",
                            avatar_url: null,
                            newsletter: true,
                            sms_alerts: false,
                            order_email: true,
                            security_alerts: true,
                            reward_points: 120,
                            reward_tier: "Silver",
                            next_tier_points: 1000,
                            role: "CUSTOMER",
                            is_active: true,
                            is_deleted: false,
                            orders_count: 3,
                            created_at: "2026-05-22T00:00:00.000000Z",
                            updated_at: "2026-05-22T00:00:00.000000Z",
                        },
                    ],
                    pagination: { total: 1, per_page: 200, current_page: 1, last_page: 1 },
                });
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setAdminSession(["admin.users.view"]);

        renderApp(routes.adminUsers);

        expect(await screen.findByRole("heading", { name: "Người dùng" })).toBeInTheDocument();
        expect(screen.getByText("managed@example.com")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /Tạo user/i }).every((button) => button.hasAttribute("disabled"))).toBe(true);
        expect(screen.getByRole("button", { name: /Sửa Customer Managed/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /Khóa Customer Managed/i })).toBeDisabled();

        await userEvent.click(screen.getByRole("button", { name: /Xem Customer Managed/i }));
        expect(screen.getByRole("dialog", { name: /Hồ sơ customer/i })).toBeInTheDocument();
    });

    it("keeps the repository legacy route pointed at products", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/admin/products")) {
                return jsonResponse({
                    message: "Products retrieved successfully.",
                    data: [],
                });
            }

            if (path.endsWith("/api/categories")) {
                return jsonResponse({
                    message: "Categories retrieved successfully.",
                    data: [],
                    pagination: { total: 0, per_page: 100, current_page: 1, last_page: 1 },
                });
            }

            if (path.endsWith("/api/suppliers")) {
                return jsonResponse({
                    message: "Suppliers retrieved successfully.",
                    data: [],
                    pagination: { total: 0, per_page: 100, current_page: 1, last_page: 1 },
                });
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setAdminSession(["admin.products.view"]);

        renderApp(routes.adminRepository);

        expect(await screen.findByRole("heading", { name: "Sản phẩm" })).toBeInTheDocument();
    });

    it("allows admin child accounts to open assigned supplier and warehouse modules", async () => {
        setAdminSession(["admin.supplier.orders.view"]);

        const rendered = renderApp(routes.adminSupplierOrders);

        expect(await screen.findByText("Đơn NCC")).toBeInTheDocument();
        expect(screen.queryByText("Fulfillment")).not.toBeInTheDocument();

        rendered.unmount();
        setAdminSession(["admin.warehouse.fulfillment.view"]);
        renderApp(routes.adminWarehouseFulfillment);

        expect(await screen.findByText("Fulfillment")).toBeInTheDocument();
        expect(screen.queryByText("Đơn NCC")).not.toBeInTheDocument();
    });

    it("redirects the supplier root and opens warehouse inventory in the admin shell", async () => {
        setAdminSession(["admin.supplier.orders.view"]);

        const rendered = renderApp("/supplier");

        expect(await screen.findByText("Đơn NCC")).toBeInTheDocument();

        rendered.unmount();
        cleanup();
        setAdminSession(["admin.warehouse.inventory.view"]);
        renderApp(routes.adminWarehouseInventory);

        expect(await screen.findByRole("heading", { name: "Tồn kho kho vận" })).toBeInTheDocument();
    });
});
