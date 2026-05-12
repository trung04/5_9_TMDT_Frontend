import { create } from "zustand";

import type {
    BackendAdminOrderDetail,
    BackendAdminOrderDetailResponse,
    BackendAdminOrderSummary,
    BackendAdminOrdersResponse,
} from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { registerProtectedSessionCleanup } from "@/shared/lib/store/protected-session";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

interface AdminOrdersState {
    orders: BackendAdminOrderSummary[];
    orderDetails: Record<string, BackendAdminOrderDetail>;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    loadOrders: () => Promise<AsyncResult<BackendAdminOrderSummary[]>>;
    loadOrder: (orderId: string) => Promise<AsyncResult<BackendAdminOrderDetail>>;
    updateStatus: (orderId: string, status: string, note?: string) => Promise<AsyncResult<BackendAdminOrderDetail>>;
    updatePaymentStatus: (
        orderId: string,
        paymentStatus: string,
        note?: string,
    ) => Promise<AsyncResult<BackendAdminOrderDetail>>;
    reset: () => void;
}

const initialState = {
    orders: [] as BackendAdminOrderSummary[],
    orderDetails: {} as Record<string, BackendAdminOrderDetail>,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
};

const SESSION_EXPIRED_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai.";

function token() {
    return useAuthStore.getState().accessToken;
}

function mergeSummary(detail: BackendAdminOrderDetail): BackendAdminOrderSummary {
    return {
        id: detail.id,
        order_no: detail.order_no,
        payment_method: detail.payment_method,
        status: detail.status,
        subtotal: detail.subtotal,
        shipping_fee: detail.shipping_fee,
        discount_amount: detail.discount_amount,
        total_amount: detail.total_amount,
        item_count: detail.item_count,
        customer: detail.customer ?? null,
        payment: detail.payment,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
    };
}

export const useAdminOrdersStore = create<AdminOrdersState>()((set, get) => ({
    ...initialState,
    loadOrders: async () => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de xem don hang." };
        }

        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest<BackendAdminOrdersResponse>("/admin/orders?per_page=100", {
                token: accessToken,
            });

            set({
                orders: response.data,
                isLoading: false,
                error: null,
            });

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tai danh sach don hang.";
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    loadOrder: async (orderId) => {
        const cached = get().orderDetails[orderId];

        if (cached) {
            return { success: true, data: cached };
        }

        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de xem chi tiet don hang." };
        }

        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest<BackendAdminOrderDetailResponse>(`/admin/orders/${orderId}`, {
                token: accessToken,
            });

            set((state) => ({
                isLoading: false,
                error: null,
                orderDetails: {
                    ...state.orderDetails,
                    [orderId]: response.data,
                },
                orders: state.orders.map((order) =>
                    String(order.id) === orderId ? mergeSummary(response.data) : order,
                ),
            }));

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tai chi tiet don hang.";
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    updateStatus: async (orderId, status, note) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de cap nhat trang thai." };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminOrderDetailResponse>(`/admin/orders/${orderId}/status`, {
                method: "PATCH",
                token: accessToken,
                body: {
                    status,
                    note: note?.trim() ? note.trim() : undefined,
                },
            });

            set((state) => ({
                isSaving: false,
                error: null,
                orderDetails: {
                    ...state.orderDetails,
                    [orderId]: response.data,
                },
                orders: state.orders.map((order) =>
                    String(order.id) === orderId ? mergeSummary(response.data) : order,
                ),
            }));

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the cap nhat trang thai don hang.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updatePaymentStatus: async (orderId, paymentStatus, note) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de cap nhat trang thai thanh toan." };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminOrderDetailResponse>(`/admin/orders/${orderId}/payment-status`, {
                method: "PATCH",
                token: accessToken,
                body: {
                    payment_status: paymentStatus,
                    note: note?.trim() ? note.trim() : undefined,
                },
            });

            set((state) => ({
                isSaving: false,
                error: null,
                orderDetails: {
                    ...state.orderDetails,
                    [orderId]: response.data,
                },
                orders: state.orders.map((order) =>
                    String(order.id) === orderId ? mergeSummary(response.data) : order,
                ),
            }));

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the cap nhat trang thai thanh toan.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useAdminOrdersStore.getState().reset();
});
