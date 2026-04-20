import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartItem } from "@/entities/product/model/types";
import type { BackendCartResponse } from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { adaptBackendCart, type CustomerCartView } from "@/shared/api/storefront-adapters";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { registerProtectedSessionCleanup } from "@/shared/lib/store/protected-session";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

interface CartState {
    guestItems: CartItem[];
    items: CartItem[];
    cart: CustomerCartView | null;
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;
    loadCart: () => Promise<AsyncResult<CustomerCartView>>;
    addItem: (productId: string, quantity: number) => Promise<AsyncResult<CustomerCartView>>;
    setQuantity: (productId: string, quantity: number) => Promise<AsyncResult<CustomerCartView>>;
    removeItem: (productId: string) => Promise<AsyncResult<CustomerCartView>>;
    syncGuestCart: () => Promise<AsyncResult<CustomerCartView>>;
    pruneGuestItems: (validProductIds: string[]) => void;
    resetServerState: () => void;
    clear: () => void;
    reset: () => void;
}

function upsertItem(items: CartItem[], productId: string, quantity: number) {
    const existing = items.find((item) => item.productId === productId);

    if (!existing) {
        return [...items, { productId, quantity }];
    }

    return items.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
    );
}

const initialState = {
    guestItems: [] as CartItem[],
    items: [] as CartItem[],
    cart: null as CustomerCartView | null,
    isLoading: false,
    isSyncing: false,
    error: null as string | null,
};

const SESSION_EXPIRED_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai.";

function authState() {
    return useAuthStore.getState();
}

function isBackendCustomerSession() {
    const state = authState();

    return state.authSource === "backend" && state.session?.user.role === "customer";
}

function numericProductId(productId: string) {
    const parsed = Number(productId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeGuestItems(items: CartItem[]) {
    return items.filter((item) => item.quantity > 0);
}

function syncBackendCart(set: (payload: Partial<CartState>) => void, cart: CustomerCartView) {
    set({
        cart,
        items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        })),
        error: null,
    });
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            ...initialState,
            loadCart: async () => {
                if (!isBackendCustomerSession()) {
                    set((state) => ({
                        cart: null,
                        items: state.guestItems,
                        error: null,
                    }));

                    return { success: true };
                }

                const token = authState().accessToken;

                if (!token) {
                    return {
                        success: false,
                        error: "Bạn cần đăng nhập lại để tải giỏ hàng.",
                    };
                }

                set({
                    isLoading: true,
                    error: null,
                });

                try {
                    const response = await apiRequest<BackendCartResponse>("/cart", {
                        token,
                    });
                    const cart = adaptBackendCart(response.data);

                    syncBackendCart(set, cart);
                    set({ isLoading: false });

                    return {
                        success: true,
                        data: cart,
                    };
                } catch (error) {
                    if (isUnauthorizedApiError(error)) {
                        useAuthStore.getState().clearSession();

                        return {
                            success: false,
                            error: SESSION_EXPIRED_MESSAGE,
                        };
                    }

                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : "Không thể tải giỏ hàng.",
                    });

                    return {
                        success: false,
                        error: error instanceof Error ? error.message : "Không thể tải giỏ hàng.",
                    };
                }
            },
            addItem: async (productId, quantity) => {
                if (quantity <= 0) {
                    return {
                        success: false,
                        error: "Số lượng phải lớn hơn 0.",
                    };
                }

                if (!isBackendCustomerSession()) {
                    set((state) => {
                        const guestItems = upsertItem(state.guestItems, productId, quantity);

                        return {
                            guestItems,
                            items: guestItems,
                            error: null,
                        };
                    });

                    return { success: true };
                }

                const token = authState().accessToken;
                const parsedProductId = numericProductId(productId);

                if (!token || !parsedProductId) {
                    return {
                        success: false,
                        error: "Sản phẩm không còn hợp lệ trên storefront hiện tại.",
                    };
                }

                try {
                    const response = await apiRequest<BackendCartResponse>("/cart/items", {
                        method: "POST",
                        token,
                        body: {
                            product_id: parsedProductId,
                            quantity,
                        },
                    });
                    const cart = adaptBackendCart(response.data);

                    syncBackendCart(set, cart);

                    return {
                        success: true,
                        data: cart,
                    };
                } catch (error) {
                    if (isUnauthorizedApiError(error)) {
                        useAuthStore.getState().clearSession();

                        return {
                            success: false,
                            error: SESSION_EXPIRED_MESSAGE,
                        };
                    }

                    set({
                        error: error instanceof Error ? error.message : "Không thể thêm vào giỏ.",
                    });

                    return {
                        success: false,
                        error: error instanceof Error ? error.message : "Không thể thêm vào giỏ.",
                    };
                }
            },
            setQuantity: async (productId, quantity) => {
                if (quantity <= 0) {
                    return get().removeItem(productId);
                }

                if (!isBackendCustomerSession()) {
                    set((state) => {
                        const guestItems = normalizeGuestItems(
                            state.guestItems.map((item) =>
                                item.productId === productId ? { ...item, quantity } : item,
                            ),
                        );

                        return {
                            guestItems,
                            items: guestItems,
                            error: null,
                        };
                    });

                    return { success: true };
                }

                const token = authState().accessToken;
                const cartItem = get().cart?.items.find((item) => item.productId === productId);

                if (!token || !cartItem) {
                    return {
                        success: false,
                        error: "Không tìm thấy mặt hàng cần cập nhật trong giỏ.",
                    };
                }

                try {
                    const response = await apiRequest<BackendCartResponse>(`/cart/items/${cartItem.id}`, {
                        method: "PATCH",
                        token,
                        body: {
                            quantity,
                        },
                    });
                    const cart = adaptBackendCart(response.data);

                    syncBackendCart(set, cart);

                    return {
                        success: true,
                        data: cart,
                    };
                } catch (error) {
                    if (isUnauthorizedApiError(error)) {
                        useAuthStore.getState().clearSession();

                        return {
                            success: false,
                            error: SESSION_EXPIRED_MESSAGE,
                        };
                    }

                    set({
                        error: error instanceof Error ? error.message : "Không thể cập nhật giỏ hàng.",
                    });

                    return {
                        success: false,
                        error: error instanceof Error ? error.message : "Không thể cập nhật giỏ hàng.",
                    };
                }
            },
            removeItem: async (productId) => {
                if (!isBackendCustomerSession()) {
                    set((state) => {
                        const guestItems = state.guestItems.filter((item) => item.productId !== productId);

                        return {
                            guestItems,
                            items: guestItems,
                            error: null,
                        };
                    });

                    return { success: true };
                }

                const token = authState().accessToken;
                const cartItem = get().cart?.items.find((item) => item.productId === productId);

                if (!token || !cartItem) {
                    return {
                        success: false,
                        error: "Không tìm thấy mặt hàng cần xóa trong giỏ.",
                    };
                }

                try {
                    const response = await apiRequest<BackendCartResponse>(`/cart/items/${cartItem.id}`, {
                        method: "DELETE",
                        token,
                    });
                    const cart = adaptBackendCart(response.data);

                    syncBackendCart(set, cart);

                    return {
                        success: true,
                        data: cart,
                    };
                } catch (error) {
                    if (isUnauthorizedApiError(error)) {
                        useAuthStore.getState().clearSession();

                        return {
                            success: false,
                            error: SESSION_EXPIRED_MESSAGE,
                        };
                    }

                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : "Không thể xóa mặt hàng khỏi giỏ.",
                    });

                    return {
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Không thể xóa mặt hàng khỏi giỏ.",
                    };
                }
            },
            syncGuestCart: async () => {
                if (!isBackendCustomerSession()) {
                    return { success: true };
                }

                const token = authState().accessToken;

                if (!token) {
                    return {
                        success: false,
                        error: "Bạn cần đăng nhập lại để đồng bộ giỏ hàng.",
                    };
                }

                const validGuestItems = normalizeGuestItems(
                    get().guestItems.filter((item) => numericProductId(item.productId) !== null),
                );

                if (validGuestItems.length !== get().guestItems.length) {
                    set({
                        guestItems: validGuestItems,
                    });
                }

                if (validGuestItems.length === 0) {
                    return get().loadCart();
                }

                set({
                    isSyncing: true,
                    error: null,
                });

                try {
                    for (const item of validGuestItems) {
                        await apiRequest("/cart/items", {
                            method: "POST",
                            token,
                            body: {
                                product_id: numericProductId(item.productId),
                                quantity: item.quantity,
                            },
                        });
                    }

                    set({
                        guestItems: [],
                        isSyncing: false,
                    });

                    return get().loadCart();
                } catch (error) {
                    if (isUnauthorizedApiError(error)) {
                        useAuthStore.getState().clearSession();

                        return {
                            success: false,
                            error: SESSION_EXPIRED_MESSAGE,
                        };
                    }

                    set({
                        isSyncing: false,
                        error: error instanceof Error ? error.message : "Không thể đồng bộ giỏ hàng.",
                    });

                    return {
                        success: false,
                        error: error instanceof Error ? error.message : "Không thể đồng bộ giỏ hàng.",
                    };
                }
            },
            pruneGuestItems: (validProductIds) =>
                set((state) => {
                    const guestItems = state.guestItems.filter((item) =>
                        validProductIds.includes(item.productId),
                    );

                    return {
                        guestItems,
                        items: isBackendCustomerSession() ? state.items : guestItems,
                    };
                }),
            resetServerState: () =>
                set((state) => ({
                    cart: null,
                    items: state.guestItems,
                    isLoading: false,
                    isSyncing: false,
                    error: null,
                })),
            clear: () => set({ guestItems: [], items: [], cart: null, error: null }),
            reset: () => set(initialState),
        }),
        {
            name: "heritage-cart-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                guestItems: state.guestItems,
                items: state.guestItems,
            }),
        },
    ),
);

registerProtectedSessionCleanup(() => {
    useCartStore.getState().resetServerState();
});
