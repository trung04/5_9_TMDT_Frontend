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
    shipping_line1?: string;
    shipping_province_id?: number | null;
    shipping_province_name?: string | null;
    shipping_district_id?: number | null;
    shipping_district_name?: string | null;
    shipping_ward_code?: string | null;
    shipping_ward_name?: string | null;
    note?: string;
    payment_method: "COD" | "BANK_TRANSFER";
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
    cancelOrder: (
        orderId: string,
        payload: {
            reason: string;
            note?: string;
        },
    ) => Promise<AsyncResult<CustomerOrderDetailView>>;
    confirmBankTransferSubmitted: (
        orderId: string,
        note?: string,
    ) => Promise<AsyncResult<CustomerOrderDetailView>>;
    confirmDelivery: (orderId: string) => Promise<AsyncResult<CustomerOrderDetailView>>;
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

function paginationFromOrdersResponse(response: BackendOrdersResponse): CustomerOrdersPagination {
    const nestedPagination = response.pagination;

    return {
        currentPage: response.current_page ?? nestedPagination?.current_page ?? 1,
        lastPage: response.last_page ?? nestedPagination?.last_page ?? 1,
        perPage: response.per_page ?? nestedPagination?.per_page ?? response.data.length,
        total: response.total ?? nestedPagination?.total ?? response.data.length,
    };
}

function mergeSummary(detail: CustomerOrderDetailView): CustomerOrderSummaryView {
    return {
        id: detail.id,
        orderNo: detail.orderNo,
        paymentMethod: detail.paymentMethod,
        status: detail.status,
        subtotal: detail.subtotal,
        shippingFee: detail.shippingFee,
        discountAmount: detail.discountAmount,
        totalAmount: detail.totalAmount,
        itemCount: detail.itemCount,
        payment: detail.payment,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
    };
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
                error: "Ban can dang nhap lai de xem don hang.",
            };
        }

        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await apiRequest<BackendOrdersResponse>(
                `/orders?page=${page}&per_page=${perPage}`,
                { token },
            );
            const orders = response.data.map(adaptBackendOrderSummary);
            const pagination = paginationFromOrdersResponse(response);

            set({
                orders,
                pagination,
                isLoading: false,
                error: null,
            });

            return { success: true, data: orders };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({ isLoading: false, error: SESSION_EXPIRED_MESSAGE });
                useAuthStore.getState().clearSession();

                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tai lich su don hang.";
            set({ isLoading: false, error: message });

            return { success: false, error: message };
        }
    },
    loadOrder: async (orderId) => {
        const cached = get().orderDetails[orderId];

        if (cached) {
            return { success: true, data: cached };
        }

        const token = sessionToken();

        if (!token) {
            return {
                success: false,
                error: "Ban can dang nhap lai de xem chi tiet don hang.",
            };
        }

        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest<BackendOrderDetailResponse>(`/orders/${orderId}`, { token });
            const order = adaptBackendOrderDetail(response.data);

            set((state) => ({
                isLoading: false,
                error: null,
                orderDetails: {
                    ...state.orderDetails,
                    [order.id]: order,
                },
            }));

            return { success: true, data: order };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({ isLoading: false, error: SESSION_EXPIRED_MESSAGE });
                useAuthStore.getState().clearSession();

                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tai chi tiet don hang.";
            set({ isLoading: false, error: message });

            return { success: false, error: message };
        }
    },
    checkout: async (payload) => {
        const token = sessionToken();

        if (!token) {
            return {
                success: false,
                error: "Ban can dang nhap lai de tiep tuc dat hang.",
            };
        }

        set({ isSubmitting: true, error: null });

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
                orders: [mergeSummary(order), ...state.orders],
                orderDetails: {
                    ...state.orderDetails,
                    [order.id]: order,
                },
            }));

            return { success: true, data: order };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({ isSubmitting: false, error: SESSION_EXPIRED_MESSAGE });
                useAuthStore.getState().clearSession();

                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the hoan tat dat hang.";
            set({ isSubmitting: false, error: message });

            return { success: false, error: message };
        }
    },
    cancelOrder: async (orderId, payload) => {
        const token = sessionToken();

        if (!token) {
            return {
                success: false,
                error: "Bạn cần đăng nhập lại để hủy đơn hàng.",
            };
        }

        set({ isSubmitting: true, error: null });

        try {
            const response = await apiRequest<BackendOrderDetailResponse>(`/orders/${orderId}/cancel`, {
                method: "PATCH",
                token,
                body: {
                    reason: payload.reason,
                    note: payload.note?.trim() ? payload.note.trim() : undefined,
                },
            });
            const order = adaptBackendOrderDetail(response.data);

            set((state) => ({
                isSubmitting: false,
                error: null,
                orders: state.orders.map((item) => (item.id === order.id ? mergeSummary(order) : item)),
                orderDetails: {
                    ...state.orderDetails,
                    [order.id]: order,
                },
            }));

            return { success: true, data: order };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({ isSubmitting: false, error: SESSION_EXPIRED_MESSAGE });
                useAuthStore.getState().clearSession();

                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Không thể hủy đơn hàng.";
            set({ isSubmitting: false, error: message });

            return { success: false, error: message };
        }
    },
    confirmBankTransferSubmitted: async (orderId, note) => {
        const token = sessionToken();

        if (!token) {
            return {
                success: false,
                error: "Ban can dang nhap lai de xac nhan da chuyen khoan.",
            };
        }

        set({ isSubmitting: true, error: null });

        try {
            const response = await apiRequest<BackendOrderDetailResponse>(
                `/orders/${orderId}/bank-transfer-submitted`,
                {
                    method: "PATCH",
                    token,
                    body: {
                        note: note?.trim() ? note.trim() : undefined,
                    },
                },
            );
            const order = adaptBackendOrderDetail(response.data);

            set((state) => ({
                isSubmitting: false,
                error: null,
                orders: state.orders.map((item) => (item.id === order.id ? mergeSummary(order) : item)),
                orderDetails: {
                    ...state.orderDetails,
                    [order.id]: order,
                },
            }));

            return { success: true, data: order };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({ isSubmitting: false, error: SESSION_EXPIRED_MESSAGE });
                useAuthStore.getState().clearSession();

                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the gui xac nhan chuyen khoan.";
            set({ isSubmitting: false, error: message });

            return { success: false, error: message };
        }
    },
    confirmDelivery: async (orderId) => {
        const token = sessionToken();

        if (!token) {
            return {
                success: false,
                error: "Ban can dang nhap lai de xac nhan da nhan hang.",
            };
        }

        set({ isSubmitting: true, error: null });

        try {
            const response = await apiRequest<BackendOrderDetailResponse>(`/orders/${orderId}/confirm-delivery`, {
                method: "PATCH",
                token,
            });
            const order = adaptBackendOrderDetail(response.data);

            set((state) => ({
                isSubmitting: false,
                error: null,
                orders: state.orders.map((item) => (item.id === order.id ? mergeSummary(order) : item)),
                orderDetails: {
                    ...state.orderDetails,
                    [order.id]: order,
                },
            }));

            return { success: true, data: order };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                set({ isSubmitting: false, error: SESSION_EXPIRED_MESSAGE });
                useAuthStore.getState().clearSession();

                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the xac nhan da nhan hang.";
            set({ isSubmitting: false, error: message });

            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useCustomerOrdersStore.getState().reset();
});
