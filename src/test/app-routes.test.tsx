import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppBootstrap } from "@/app/app-bootstrap";
import { AppRoutes } from "@/app/router";
import { buildStorefrontSlug } from "@/shared/api/storefront-adapters";
import { routes } from "@/shared/config/routes";
import { resetDemoState } from "@/shared/lib/store/reset-demo";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { FeedbackToaster } from "@/widgets/feedback-toaster";
import {
    createBackendProduct,
    createBackendUser,
    createCartResponse,
    createOrderDetail,
    createOrdersResponse,
    getJsonBody,
    getRequestPath,
    jsonResponse,
} from "@/test/backend-test-utils";

function renderApp(route: string) {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <AppBootstrap />
            <AppRoutes />
            <FeedbackToaster />
        </MemoryRouter>,
    );
}

function setBackendCustomerSession() {
    useAuthStore.setState({
        session: {
            user: {
                id: "1",
                name: "Nguyen Van A",
                email: "customer@example.com",
                role: "customer",
            },
            loggedInAt: "2026-04-20T08:00:00.000Z",
        },
        accessToken: "token-1",
        authSource: "backend",
    });
}

describe("customer commerce routes", () => {
    beforeEach(() => {
        localStorage.clear();
        resetDemoState();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("redirects anonymous checkout users to login and returns after backend login", async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/login")) {
                return jsonResponse({
                    message: "Logged in successfully.",
                    access_token: "token-1",
                    token_type: "Bearer",
                    user: createBackendUser(),
                });
            }

            if (path.endsWith("/api/cart/items") && init?.method === "POST") {
                return jsonResponse(createCartResponse(2));
            }

            if (path.endsWith("/api/cart") && (!init?.method || init.method === "GET")) {
                return jsonResponse(createCartResponse(2));
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        useCartStore.setState({
            guestItems: [{ productId: "101", quantity: 2 }],
            items: [{ productId: "101", quantity: 2 }],
        });

        const user = userEvent.setup();
        renderApp(routes.checkout);

        expect(
            await screen.findByRole("heading", { name: /Đăng nhập khách hàng/i }),
        ).toBeInTheDocument();

        await user.type(screen.getByLabelText(/Email/i), "customer@example.com");
        await user.type(screen.getByLabelText(/Mật khẩu/i), "secret123");
        await user.click(screen.getByRole("button", { name: /Đăng nhập khách hàng/i }));

        expect(await screen.findByText(/Tóm tắt đơn hàng/i)).toBeInTheDocument();

        const syncCall = fetchMock.mock.calls.find(([input, init]) => {
            return (
                getRequestPath(input).endsWith("/api/cart/items") &&
                init?.method === "POST" &&
                getJsonBody(init)?.quantity === 2
            );
        });

        expect(syncCall).toBeTruthy();
    });

    it("shows a loading state on the home page while the catalog is pending", async () => {
        const pending = new Promise<Response>(() => undefined);
        const fetchMock = vi.fn(() => pending);

        vi.stubGlobal("fetch", fetchMock);

        renderApp(routes.home);

        expect(await screen.findByText(/Đang tải danh mục từ backend/i)).toBeInTheDocument();
    });

    it("shows a backend error on the catalog page when the API is unavailable", async () => {
        const fetchMock = vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        });

        vi.stubGlobal("fetch", fetchMock);

        renderApp(routes.products);

        expect(await screen.findByText(/Khong the ket noi backend/i)).toBeInTheDocument();
    });

    it("shows a backend error on the product detail page when the API is unavailable", async () => {
        const slug = buildStorefrontSlug(101, "Tra huu co");
        const fetchMock = vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        });

        vi.stubGlobal("fetch", fetchMock);

        renderApp(routes.productDetail(slug));

        expect(await screen.findByText(/Khong the ket noi backend/i)).toBeInTheDocument();
    });

    it("loads backend orders and reorders items back into the cart", async () => {
        const product = createBackendProduct();
        const orderDetail = createOrderDetail({
            items: [
                {
                    id: 1,
                    product_id: product.id,
                    product_name_snapshot: product.name,
                    quantity: 3,
                    unit_price: product.sale_price,
                    line_total: 360000,
                },
            ],
        });
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/cart") && (!init?.method || init.method === "GET")) {
                return jsonResponse(createCartResponse(0));
            }

            if (path.endsWith("/api/orders") && (!init?.method || init.method === "GET")) {
                return jsonResponse(createOrdersResponse(orderDetail));
            }

            if (path.endsWith("/api/orders/9001") && (!init?.method || init.method === "GET")) {
                return jsonResponse({
                    message: "Order retrieved successfully.",
                    data: orderDetail,
                });
            }

            if (path.endsWith("/api/cart/items") && init?.method === "POST") {
                return jsonResponse(createCartResponse(3));
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setBackendCustomerSession();

        const user = userEvent.setup();
        renderApp(routes.accountOrders);

        expect(await screen.findByText(/Tra huu co/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Thêm lại vào giỏ/i }));

        await waitFor(() => {
            const reorderCall = fetchMock.mock.calls.find(([input, init]) => {
                return (
                    getRequestPath(input).endsWith("/api/cart/items") &&
                    init?.method === "POST" &&
                    getJsonBody(init)?.quantity === 3
                );
            });

            expect(reorderCall).toBeTruthy();
        });
    });
});
