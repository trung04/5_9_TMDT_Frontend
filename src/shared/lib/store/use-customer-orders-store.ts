import { create } from "zustand";

import type { BackendOrderDetailResponse, BackendOrdersResponse } from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import {
    adaptBackendOrderDetail,
    adaptBackendOrderSummary,
    type CustomerOrderDetailView,
    type CustomerOrderSummaryView,
} from "@/shared/api/storefront-adapters";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { registerProtectedSessionCleanup } from "@/shared/lib/store/protected-session";

export interface CustomerOrdersPagination {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}

interface CheckoutInput {
    recipient_name: string;
    recipient_phone: string;
    shipping_address: string;
    note?: string;
    payment_method: "COD" | "BANK_TRANSFER" | "E_WALLET";
    payment_gateway?: string;
}

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

interface CustomerOrdersState {
    orders: CustomerOrderSummaryView[];
    orderDetails: Record<string, CustomerOrderDetailView>;
    pagination: CustomerOrdersPagination | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    loadOrders: (page?: number, perPage?: number) => Promise<AsyncResult<CustomerOrderSummaryView[]>>;
    loadOrder: (orderId: string) => Promise<AsyncResult<CustomerOrderDetailView>>;
    checkout: (payload: CheckoutInput) => Promise<AsyncResult<CustomerOrderDetailView>>;
    reset: () => void;
}

const initialState = {
    orders: [] as CustomerOrderSummaryView[],
    orderDetails: {} as Record<string, CustomerOrderDetailView>,
    pagination: null as CustomerOrdersPagination | null,
    isLoading: false,
    isSubmitting: false,
    error: null as string | null,
};

const SESSION_EXPIRED_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai.";

function sessionToken() {
    return useAuthStore.getState().accessToken;
}

export const useCustomerOrdersStore = create<CustomerOrdersState>()((set, get) => ({
    ...initialState,
    loadOrders: async (page = 1, perPage = 15) => {
        const token = sessionToken();

        if (!token) {
            set({
                orders: [],
                pagination: null,
            });

            return {
                success: false,
                error: "Bạn cần đăng nhập lại để xem đơn hàng.",
            };
        }

        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await apiRequest<BackendOrdersResponse>(
                `/orders?page=${page}&per_page=${perPage}`,
                {
                    token,
                },
            );
            const orders = response.data.map(adaptBackendOrderSummary);

            set({
                orders,
                pagination: {
                    currentPage: response.pagination.current_page,
                    lastPage: response.pagination.last_page,
                    perPage: response.pagination.per_page,
                    total: response.pagination.total,
                },
                isLoading: false,
                error: null,
            });

            return {
                success: true,
                data: orders,
            };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({
                    isLoading: false,
                    error: SESSION_EXPIRED_MESSAGE,
                });
                useAuthStore.getState().clearSession();

                return {
                    success: false,
                    error: SESSION_EXPIRED_MESSAGE,
                };
            }

            set({
                isLoading: false,
                error: error instanceof Error ? error.message : "Không thể tải lịch sử đơn hàng.",
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : "Không thể tải lịch sử đơn hàng.",
            };
        }
    },
    loadOrder: async (orderId) => {
        const cached = get().orderDetails[orderId];

        if (cached) {
            return {
                success: true,
                data: cached,
            };
        }

        const token = sessionToken();

        if (!token) {
            return {
                success: false,
                error: "Bạn cần đăng nhập lại để xem chi tiết đơn hàng.",
            };
        }

        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await apiRequest<BackendOrderDetailResponse>(`/orders/${orderId}`, {
                token,
            });
            const order = adaptBackendOrderDetail(response.data);

            set((state) => ({
                isLoading: false,
                error: null,
                orderDetails: {
                    ...state.orderDetails,
                    [order.id]: order,
                },
            }));

            return {
                success: true,
                data: order,
            };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({
                    isLoading: false,
                    error: SESSION_EXPIRED_MESSAGE,
                });
                useAuthStore.getState().clearSession();

                return {
                    success: false,
                    error: SESSION_EXPIRED_MESSAGE,
                };
            }

            set({
                isLoading: false,
                error: error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng.",
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng.",
            };
        }
    },
    checkout: async (payload) => {
        const token = sessionToken();

        if (!token) {
            return {
                success: false,
                error: "Bạn cần đăng nhập lại để tiếp tục đặt hàng.",
            };
        }

        set({
            isSubmitting: true,
            error: null,
        });

        try {
            const response = await apiRequest<BackendOrderDetailResponse>("/orders/checkout", {
                method: "POST",
                token,
                body: payload,
            });
            const order = adaptBackendOrderDetail(response.data);

            set((state) => ({
                isSubmitting: false,
                error: null,
                orders: [adaptBackendOrderSummary(response.data), ...state.orders],
                orderDetails: {
                    ...state.orderDetails,
                    [order.id]: order,
                },
            }));

            return {
                success: true,
                data: order,
            };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({
                    isSubmitting: false,
                    error: SESSION_EXPIRED_MESSAGE,
                });
                useAuthStore.getState().clearSession();

                return {
                    success: false,
                    error: SESSION_EXPIRED_MESSAGE,
                };
            }

            set({
                isSubmitting: false,
                error: error instanceof Error ? error.message : "Không thể hoàn tất đặt hàng.",
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : "Không thể hoàn tất đặt hàng.",
            };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useCustomerOrdersStore.getState().reset();
});
