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

function getVisibleHrefs() {
    return screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href));
}

function createAdminCustomer(overrides: Record<string, unknown> = {}) {
    return {
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
        orders_count: 2,
        created_at: "2026-05-22T00:00:00.000000Z",
        updated_at: "2026-05-22T00:00:00.000000Z",
        ...overrides,
    };
}

function createAdminOrderSummary(overrides: Record<string, unknown> = {}) {
    return {
        id: 101,
        order_no: "ORD-HISTORY-101",
        payment_method: "BANK_TRANSFER",
        status: "CONFIRMED",
        subtotal: 250000,
        shipping_fee: 0,
        discount_amount: 10000,
        total_amount: 240000,
        item_count: 2,
        payment: {
            id: 1,
            transaction_code: "PAY-101",
            payment_method: "BANK_TRANSFER",
            payment_status: "SUCCESS",
            amount: 240000,
            gateway_name: "Manual Bank",
            gateway_reference: "REF-101",
            paid_at: "2026-05-22T08:00:00.000000Z",
        },
        shipping_carrier: "GHN",
        shipping_code: "GHN-101",
        stock_deducted: false,
        stock_deducted_at: null,
        shipment: null,
        created_at: "2026-05-22T08:00:00.000000Z",
        updated_at: "2026-05-22T08:30:00.000000Z",
        ...overrides,
    };
}

function createAdminOrderDetail(overrides: Record<string, unknown> = {}) {
    return {
        id: 101,
        order_no: "ORD-HISTORY-101",
        recipient_name: "Khach Lich Su",
        recipient_phone: "0909888777",
        shipping_address: "99 Pho Hue, Ha Noi",
        shipping_line1: "99 Pho Hue",
        shipping_province_id: 1,
        shipping_province_name: "Ha Noi",
        shipping_district_id: 2,
        shipping_district_name: "Hai Ba Trung",
        shipping_ward_code: "00001",
        shipping_ward_name: "Pham Dinh Ho",
        payment_method: "BANK_TRANSFER",
        status: "CONFIRMED",
        subtotal: 250000,
        shipping_fee: 0,
        discount_amount: 10000,
        total_amount: 240000,
        stock_deducted: false,
        stock_deducted_at: null,
        shipping_carrier: "GHN",
        shipping_code: "GHN-101",
        shipped_at: null,
        delivered_at: null,
        cancelled_at: null,
        note: "Khach yeu cau giao trong gio hanh chinh",
        item_count: 2,
        allowed_next_statuses: [],
        allowed_payment_statuses: [],
        customer: {
            id: 9,
            full_name: "Customer Managed",
            email: "managed@example.com",
            phone: "0909000009",
            role: "CUSTOMER",
            is_active: true,
            is_deleted: false,
        },
        items: [
            {
                id: 1,
                product_id: 201,
                product_name_snapshot: "Tra Shan Tuyet",
                quantity: 1,
                unit_price: 120000,
                line_total: 120000,
            },
            {
                id: 2,
                product_id: 202,
                product_name_snapshot: "Mat ong rung",
                quantity: 1,
                unit_price: 120000,
                line_total: 120000,
            },
        ],
        payment: {
            id: 1,
            transaction_code: "PAY-101",
            payment_method: "BANK_TRANSFER",
            payment_status: "SUCCESS",
            amount: 240000,
            gateway_name: "Manual Bank",
            gateway_reference: "REF-101",
            paid_at: "2026-05-22T08:00:00.000000Z",
            raw_payload: {
                bank_name: "MB Bank",
                account_name: "HERITAGE HARVEST",
                account_number: "0123456789",
                transfer_content: "ORD-HISTORY-101",
                customer_transfer_submitted: true,
            },
        },
        shipment: null,
        status_history: [],
        payment_status_history: [],
        created_at: "2026-05-22T08:00:00.000000Z",
        updated_at: "2026-05-22T08:30:00.000000Z",
        ...overrides,
    };
}

function adminUsersResponse(customers: ReturnType<typeof createAdminCustomer>[]) {
    return jsonResponse({
        message: "Admin users retrieved successfully.",
        data: customers,
        pagination: { total: customers.length, per_page: 200, current_page: 1, last_page: 1 },
    });
}

function adminUserResponse(customer: ReturnType<typeof createAdminCustomer>) {
    return jsonResponse({
        message: "Admin user retrieved successfully.",
        data: customer,
    });
}

function adminCustomerOrdersResponse(orders: ReturnType<typeof createAdminOrderSummary>[]) {
    return jsonResponse({
        message: "Orders retrieved successfully.",
        data: orders,
        current_page: 1,
        last_page: 1,
        per_page: 5,
        total: orders.length,
    });
}

function adminOrderResponse(order: ReturnType<typeof createAdminOrderDetail>) {
    return jsonResponse({
        message: "Order retrieved successfully.",
        data: order,
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
        setAdminSession([], true);

        const { rerender } = render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        let hrefs = getVisibleHrefs();

        expect(hrefs).toEqual(
            expect.arrayContaining([
                routes.adminUsers,
                routes.adminProducts,
                routes.adminCategories,
                routes.adminSuppliers,
                routes.adminAccess,
                routes.adminSupplierOrders,
                routes.adminWarehouseFulfillment,
            ]),
        );

        setAdminSession(["admin.dashboard.view"]);
        rerender(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        hrefs = getVisibleHrefs();
        expect(hrefs).toContain(routes.adminDashboard);
        expect(hrefs).not.toContain(routes.adminAccess);
        expect(hrefs).not.toContain(routes.adminProducts);
        expect(hrefs).not.toContain(routes.adminSupplierOrders);

        setAdminSession(["admin.supplier.orders.view"]);
        rerender(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        hrefs = getVisibleHrefs();
        expect(hrefs).toContain(routes.adminSupplierOrders);
        expect(hrefs).not.toContain(routes.adminDashboard);
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

        expect(await screen.findByText(/category storefront/i)).toBeInTheDocument();
        expect(
            fetchMock.mock.calls.some(([input]) =>
                getRequestPath(input).endsWith("/api/admin/categories"),
            ),
        ).toBe(true);
    });

    it("blocks direct admin module access without a matching permission", async () => {
        setAdminSession(["admin.dashboard.view"]);

        renderApp(routes.adminUsers);

        expect(await screen.findByText(/sai khu/i)).toBeInTheDocument();
    });

    it("opens the users module and disables CRUD buttons without write permissions", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/admin/users")) {
                return adminUsersResponse([createAdminCustomer({ orders_count: 3 })]);
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setAdminSession(["admin.users.view"]);

        renderApp(routes.adminUsers);

        expect(await screen.findByText("managed@example.com")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Tạo user/i })).toBeDisabled();

        const customerActionButtons = screen.getAllByRole("button", {
            name: /Customer Managed/i,
        });

        expect(customerActionButtons).toHaveLength(3);
        expect(customerActionButtons[0]).toBeEnabled();
        expect(customerActionButtons[1]).toBeDisabled();
        expect(customerActionButtons[2]).toBeDisabled();

        await userEvent.click(screen.getByRole("button", { name: /Xem Customer Managed/i }));
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("hides the order history button when the admin lacks order permissions", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/admin/users")) {
                return adminUsersResponse([createAdminCustomer({ orders_count: 3 })]);
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setAdminSession(["admin.users.view"]);

        renderApp(routes.adminUsers);

        expect(await screen.findByText("managed@example.com")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: /Xem Customer Managed/i }));

        expect(screen.queryByRole("button", { name: /Xem lich su don hang/i })).not.toBeInTheDocument();
    });

    it("blocks dedicated customer order routes without order permission", async () => {
        setAdminSession(["admin.users.view"]);

        const rendered = renderApp(routes.adminUserOrders("9"));
        expect(await screen.findByText(/sai khu/i)).toBeInTheDocument();

        rendered.unmount();
        cleanup();

        setAdminSession(["admin.users.view"]);
        renderApp(routes.adminUserOrderDetail("9", "101"));

        expect(await screen.findByText(/sai khu/i)).toBeInTheDocument();
    });

    it("navigates from the user drawer to dedicated customer order pages", async () => {
        const managedCustomer = createAdminCustomer();
        const historyOrders = [
            createAdminOrderSummary(),
            createAdminOrderSummary({
                id: 102,
                order_no: "ORD-HISTORY-102",
                payment_method: "COD",
                status: "DELIVERED",
                subtotal: 90000,
                shipping_fee: 15000,
                discount_amount: 0,
                total_amount: 105000,
                item_count: 1,
                payment: {
                    id: 2,
                    transaction_code: "PAY-102",
                    payment_method: "COD",
                    payment_status: "SUCCESS",
                    amount: 105000,
                    gateway_name: null,
                    gateway_reference: null,
                    paid_at: "2026-05-20T11:00:00.000000Z",
                },
                shipping_carrier: "Manual",
                shipping_code: "SHIP-102",
                created_at: "2026-05-20T08:00:00.000000Z",
                updated_at: "2026-05-20T12:00:00.000000Z",
            }),
        ];
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);
            const url =
                input instanceof URL
                    ? input
                    : typeof input === "string"
                      ? new URL(input, "http://127.0.0.1")
                      : new URL(input.url, "http://127.0.0.1");

            if (path.endsWith("/api/admin/users")) {
                return adminUsersResponse([managedCustomer]);
            }

            if (path.endsWith("/api/admin/users/9")) {
                return adminUserResponse(managedCustomer);
            }

            if (path.endsWith("/api/admin/users/9/orders")) {
                expect(url.searchParams.get("page")).toBe("1");
                expect(url.searchParams.get("per_page")).toBe("5");
                return adminCustomerOrdersResponse(historyOrders);
            }

            if (path.endsWith("/api/admin/orders/101")) {
                return adminOrderResponse(createAdminOrderDetail());
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setAdminSession(["admin.users.view", "admin.orders.view"]);

        renderApp(routes.adminUsers);

        expect(await screen.findByText("managed@example.com")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: /Xem Customer Managed/i }));
        await userEvent.click(screen.getByRole("button", { name: /Xem lich su don hang/i }));

        expect(await screen.findByText("ORD-HISTORY-101")).toBeInTheDocument();
        expect(screen.getByText("ORD-HISTORY-102")).toBeInTheDocument();

        await userEvent.click(screen.getAllByRole("link", { name: /Xem chi tiet/i })[0]);

        expect(await screen.findByRole("link", { name: /Quay lai lich su don hang/i })).toBeInTheDocument();
        expect(screen.getByText("Khach Lich Su")).toBeInTheDocument();
        expect(screen.getByText(/Khach yeu cau giao trong gio hanh chinh/i)).toBeInTheDocument();
        expect(screen.getByText("Tra Shan Tuyet")).toBeInTheDocument();
    });

    it("opens the empty order history page when the customer has no orders", async () => {
        const zeroOrderCustomer = createAdminCustomer({
            id: 10,
            full_name: "Zero Order Customer",
            email: "zero@example.com",
            phone: "0909000010",
            address: null,
            city: "Da Nang",
            favorite_region: null,
            newsletter: false,
            reward_points: 0,
            reward_tier: "Bronze",
            next_tier_points: 500,
            orders_count: 0,
        });
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/admin/users")) {
                return adminUsersResponse([zeroOrderCustomer]);
            }

            if (path.endsWith("/api/admin/users/10")) {
                return adminUserResponse(zeroOrderCustomer);
            }

            if (path.endsWith("/api/admin/users/10/orders")) {
                return adminCustomerOrdersResponse([]);
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setAdminSession(["admin.users.view", "admin.orders.view"]);

        renderApp(routes.adminUsers);

        expect(await screen.findByText("zero@example.com")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: /Xem Zero Order Customer/i }));
        await userEvent.click(screen.getByRole("button", { name: /Xem lich su don hang/i }));

        expect(await screen.findByText(/Customer nay chua co don hang nao/i)).toBeInTheDocument();
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

        expect(await screen.findByText(/product repository/i)).toBeInTheDocument();
        expect(
            fetchMock.mock.calls.some(([input]) =>
                getRequestPath(input).endsWith("/api/admin/products"),
            ),
        ).toBe(true);
    });

    it("allows admin child accounts to open assigned supplier and warehouse modules", async () => {
        setAdminSession(["admin.supplier.orders.view"]);

        const rendered = renderApp(routes.adminSupplierOrders);

        expect(await screen.findByText(/Danh sach don mua vao/i)).toBeInTheDocument();
        expect(screen.queryByText("Fulfillment")).not.toBeInTheDocument();

        rendered.unmount();
        cleanup();

        setAdminSession(["admin.warehouse.fulfillment.view"]);
        renderApp(routes.adminWarehouseFulfillment);

        expect(await screen.findByText("Fulfillment")).toBeInTheDocument();
        expect(screen.queryByText(/Danh sach don mua vao/i)).not.toBeInTheDocument();
    });

    it("redirects the supplier root and opens warehouse inventory in the admin shell", async () => {
        setAdminSession(["admin.supplier.orders.view"]);

        const rendered = renderApp("/supplier");

        expect(await screen.findByText(/Danh sach don mua vao/i)).toBeInTheDocument();

        rendered.unmount();
        cleanup();

        setAdminSession(["admin.warehouse.inventory.view"]);
        renderApp(routes.adminWarehouseInventory);

        expect(await screen.findByText(/^SKU$/i)).toBeInTheDocument();
    });
});
