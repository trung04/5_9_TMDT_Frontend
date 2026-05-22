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
        accessTokenExpiresAt: "2026-12-31T10:00:00.000Z",
        authSource: "backend",
    });
}

function setBackendAdminSession() {
    useAuthStore.setState({
        session: {
            user: {
                id: "1",
                name: "Root Admin",
                email: "admin@example.com",
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
        accessToken: "admin-token",
        accessTokenExpiresAt: "2026-12-31T10:00:00.000Z",
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

    it("allows guest checkout access, then redirects to login when placing the order", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/login")) {
                return jsonResponse({
                    message: "Logged in successfully.",
                    access_token: "token-1",
                    token_type: "Bearer",
                    expires_at: "2026-04-20T10:00:00.000Z",
                    user: createBackendUser(),
                });
            }

            if (path.endsWith("/api/account/profile")) {
                return jsonResponse(
                    {
                        data: {
                            id: 1,
                            name: "Nguyen Van A",
                            email: "customer@example.com",
                            phone: "0909123456",
                            address: "123 Nguyen Trai",
                            city: "Ha Noi",
                            favorite_region: "Thai Nguyen",
                            avatar: null,
                            member_since: "2026-04-20T00:00:00.000000Z",
                            newsletter: false,
                            sms_alerts: false,
                            order_email: true,
                            security_alerts: true,
                            addresses: [],
                            reward_snapshot: {
                                tier: "Member",
                                points: 0,
                                next_tier_points: 100,
                                perks: [],
                            },
                            reward_history: [],
                        },
                    },
                    { status: 200 },
                );
            }

            if (path.endsWith("/api/account/wishlist")) {
                return jsonResponse({
                    data: {
                        product_ids: [],
                        products: [],
                    },
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

        expect(await screen.findByText(/Tóm tắt đơn hàng/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Đăng nhập để đặt hàng/i })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Đăng nhập để đặt hàng/i }));
        expect(await screen.findByLabelText(/Email/i)).toBeInTheDocument();

        await user.type(screen.getByLabelText(/Email/i), "customer@example.com");
        await user.type(screen.getByLabelText(/Mật khẩu/i), "secret123");
        await user.click(screen.getByRole("button", { name: /^Đăng nhập$/i }));

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

        expect(await screen.findByText(/Đang tải danh mục/i)).toBeInTheDocument();
    });

    it("renders published posts on the story page for guests", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/posts")) {
                return jsonResponse({
                    message: "Posts retrieved successfully.",
                    data: [
                        {
                            id: 501,
                            title: "Mùa vải thiều Lục Ngạn",
                            excerpt: "Ghi chú mùa vụ mới.",
                            body: "Bài viết đầu mùa từ đội ngũ quản trị.",
                            cover_image_url: null,
                            status: "PUBLISHED",
                            published_at: "2026-05-20T00:00:00.000000Z",
                            created_at: "2026-05-20T00:00:00.000000Z",
                            updated_at: "2026-05-20T00:00:00.000000Z",
                            author: { id: 1, full_name: "Admin", email: "admin@example.com" },
                            likes_count: 3,
                            comments_count: 0,
                            comments: [],
                        },
                    ],
                });
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);

        renderApp(routes.story);

        expect(await screen.findByText(/Mùa vải thiều Lục Ngạn/i)).toBeInTheDocument();
        expect(screen.getByText(/Đăng nhập để tương tác/i)).toBeInTheDocument();
    });

    it("lets a backend customer like and comment on a story post", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/me")) {
                return jsonResponse({
                    user: createBackendUser(),
                    expires_at: "2026-12-31T10:00:00.000Z",
                });
            }

            if (path.endsWith("/api/cart") && (!init?.method || init.method === "GET")) {
                return jsonResponse(createCartResponse(0));
            }

            if (path.endsWith("/api/account/profile")) {
                return jsonResponse({
                    data: {
                        id: 1,
                        name: "Nguyen Van A",
                        email: "customer@example.com",
                        phone: "0909123456",
                        address: "123 Nguyen Trai",
                        city: "Ha Noi",
                        favorite_region: "Thai Nguyen",
                        avatar: null,
                        member_since: "2026-04-20T00:00:00.000000Z",
                        newsletter: false,
                        sms_alerts: false,
                        order_email: true,
                        security_alerts: true,
                        addresses: [],
                        reward_snapshot: {
                            tier: "Member",
                            points: 0,
                            next_tier_points: 100,
                            perks: [],
                        },
                        reward_history: [],
                    },
                });
            }

            if (path.endsWith("/api/account/wishlist")) {
                return jsonResponse({
                    data: {
                        product_ids: [],
                        products: [],
                    },
                });
            }

            if (path.endsWith("/api/posts") && (!init?.method || init.method === "GET")) {
                return jsonResponse({
                    message: "Posts retrieved successfully.",
                    data: [
                        {
                            id: 501,
                            title: "Mùa vải thiều Lục Ngạn",
                            excerpt: "Ghi chú mùa vụ mới.",
                            body: "Bài viết đầu mùa từ đội ngũ quản trị.",
                            cover_image_url: null,
                            status: "PUBLISHED",
                            published_at: "2026-05-20T00:00:00.000000Z",
                            created_at: "2026-05-20T00:00:00.000000Z",
                            updated_at: "2026-05-20T00:00:00.000000Z",
                            author: { id: 1, full_name: "Admin", email: "admin@example.com" },
                            likes_count: 0,
                            comments_count: 0,
                            comments: [],
                        },
                    ],
                });
            }

            if (path.endsWith("/api/posts/my-likes")) {
                return jsonResponse({
                    message: "Post likes retrieved successfully.",
                    data: { post_ids: [] },
                });
            }

            if (path.endsWith("/api/posts/501/likes") && init?.method === "POST") {
                return jsonResponse({
                    message: "Post liked successfully.",
                    data: { post_id: 501, liked: true, likes_count: 1 },
                });
            }

            if (path.endsWith("/api/posts/501/comments") && init?.method === "POST") {
                return jsonResponse(
                    {
                        message: "Comment created successfully.",
                        data: {
                            id: 900,
                            post_id: 501,
                            user_id: 1,
                            content: getJsonBody(init)?.content,
                            status: "VISIBLE",
                            created_at: "2026-05-21T00:00:00.000000Z",
                            updated_at: "2026-05-21T00:00:00.000000Z",
                            author: {
                                id: 1,
                                full_name: "Nguyen Van A",
                                email: "customer@example.com",
                            },
                        },
                        meta: { post_id: 501, comments_count: 1 },
                    },
                    { status: 201 },
                );
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setBackendCustomerSession();

        const user = userEvent.setup();
        renderApp(routes.story);

        expect(await screen.findByText(/Mùa vải thiều Lục Ngạn/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /0 thích/i }));
        expect(await screen.findByRole("button", { name: /1 thích/i })).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText(/Viết bình luận/i), "Bài viết rất hữu ích");
        await user.click(screen.getByRole("button", { name: /Gửi bình luận/i }));

        expect(await screen.findByText(/Bài viết rất hữu ích/i)).toBeInTheDocument();
    });

    it("lets an admin create a post from the community page", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/me")) {
                return jsonResponse({
                    user: createBackendUser({
                        role: "ADMIN",
                        email: "admin@example.com",
                        admin_role: {
                            id: 1,
                            name: "Super Admin",
                            slug: "super_admin",
                            is_super: true,
                        },
                        permissions: [
                            "admin.community.posts.view",
                            "admin.community.posts.create",
                        ],
                    }),
                    expires_at: "2026-12-31T10:00:00.000Z",
                });
            }

            if (path.endsWith("/api/admin/community")) {
                return jsonResponse({
                    message: "Community data retrieved successfully.",
                    data: {
                        suppliers: [],
                        customers: [],
                        invitations: [],
                    },
                });
            }

            if (path.endsWith("/api/admin/posts") && (!init?.method || init.method === "GET")) {
                return jsonResponse({
                    message: "Admin posts retrieved successfully.",
                    data: [],
                });
            }

            if (path.endsWith("/api/admin/posts") && init?.method === "POST") {
                const body = getJsonBody(init);

                return jsonResponse(
                    {
                        message: "Post created successfully.",
                        data: {
                            id: 777,
                            title: body?.title,
                            excerpt: body?.excerpt,
                            body: body?.body,
                            cover_image_url: body?.cover_image_url,
                            status: body?.status,
                            published_at: "2026-05-22T00:00:00.000000Z",
                            created_at: "2026-05-22T00:00:00.000000Z",
                            updated_at: "2026-05-22T00:00:00.000000Z",
                            author: { id: 1, full_name: "Root Admin", email: "admin@example.com" },
                            likes_count: 0,
                            comments_count: 0,
                            comments: [],
                        },
                    },
                    { status: 201 },
                );
            }

            throw new Error(`Unexpected request: ${path}`);
        });

        vi.stubGlobal("fetch", fetchMock);
        setBackendAdminSession();

        const user = userEvent.setup();
        renderApp(routes.adminCommunity);

        expect(await screen.findByText(/Danh sach bai viet/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Bai moi/i }));
        await user.type(screen.getByPlaceholderText(/Tieu de/i), "Bai viet admin moi");
        await user.type(screen.getByPlaceholderText(/Noi dung bai viet/i), "Noi dung tu admin.");
        await user.selectOptions(screen.getByDisplayValue("DRAFT"), "PUBLISHED");
        await user.click(screen.getByRole("button", { name: /Tao moi/i }));

        expect((await screen.findAllByText(/Bai viet admin moi/i)).length).toBeGreaterThan(0);

        const createCall = fetchMock.mock.calls.find(([input, init]) => {
            return getRequestPath(input).endsWith("/api/admin/posts") && init?.method === "POST";
        });

        expect(createCall).toBeTruthy();
    });

    it("shows a connection error on the catalog page when the API is unavailable", async () => {
        const fetchMock = vi.fn(() => {
            throw new TypeError("Failed to fetch");
        });

        vi.stubGlobal("fetch", fetchMock);

        renderApp(routes.products);

        expect(await screen.findByText(/không thể kết nối đến hệ thống/i)).toBeInTheDocument();
    });

    it("shows a connection error on the product detail page when the API is unavailable", async () => {
        const slug = buildStorefrontSlug(101, "Tra huu co");
        const fetchMock = vi.fn(() => {
            throw new TypeError("Failed to fetch");
        });

        vi.stubGlobal("fetch", fetchMock);

        renderApp(routes.productDetail(slug));

        expect(await screen.findByText(/không thể kết nối đến hệ thống/i)).toBeInTheDocument();
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
        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const path = getRequestPath(input);

            if (path.endsWith("/api/cart") && (!init?.method || init.method === "GET")) {
                return jsonResponse(createCartResponse(0));
            }

            if (path.endsWith("/api/account/profile")) {
                return jsonResponse({
                    data: {
                        id: 1,
                        name: "Nguyen Van A",
                        email: "customer@example.com",
                        phone: "0909123456",
                        address: "123 Nguyen Trai",
                        city: "Ha Noi",
                        favorite_region: "Thai Nguyen",
                        avatar: null,
                        member_since: "2026-04-20T00:00:00.000000Z",
                        newsletter: false,
                        sms_alerts: false,
                        order_email: true,
                        security_alerts: true,
                        addresses: [],
                        reward_snapshot: {
                            tier: "Member",
                            points: 0,
                            next_tier_points: 100,
                            perks: [],
                        },
                        reward_history: [],
                    },
                });
            }

            if (path.endsWith("/api/account/wishlist")) {
                return jsonResponse({
                    data: {
                        product_ids: [],
                        products: [],
                    },
                });
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

        expect(await screen.findByText(/ORD-9001/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Xem chi tiết/i }));
        await user.click(await screen.findByRole("button", { name: /Thêm lại vào giỏ/i }));

        expect(await screen.findByText(/Tra huu co/i)).toBeInTheDocument();

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
