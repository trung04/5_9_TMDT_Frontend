import { create } from "zustand";

import type {
    BackendBulkOrderStatusResponse,
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

interface BulkUpdatePayload {
    orderIds: number[];
    action: "CONFIRM" | "PACK" | "SHIP" | "DELIVER" | "MARK_DELIVERY_FAILED" | "CANCEL" | "RESHIP";
    note?: string;
}

interface AdminOrdersState {
    orders: BackendAdminOrderSummary[];
    orderDetails: Record<string, BackendAdminOrderDetail>;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    loadOrders: () => Promise<AsyncResult<BackendAdminOrderSummary[]>>;
    loadOrder: (orderId: string) => Promise<AsyncResult<BackendAdminOrderDetail>>;
    updateStatus: (
        orderId: string,
        status: string,
        note?: string,
        options?: {
            restockInventory?: boolean;
        },
    ) => Promise<AsyncResult<BackendAdminOrderDetail>>;
    updatePaymentStatus: (
        orderId: string,
        paymentStatus: string,
        note?: string,
    ) => Promise<AsyncResult<BackendAdminOrderDetail>>;
    bulkUpdateStatus: (
        payload: BulkUpdatePayload,
    ) => Promise<AsyncResult<BackendBulkOrderStatusResponse["data"]>>;
    reset: () => void;
}

const initialState = {
    orders: [] as BackendAdminOrderSummary[],
    orderDetails: {} as Record<string, BackendAdminOrderDetail>,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
};

const SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

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
        stock_deducted: detail.stock_deducted,
        stock_deducted_at: detail.stock_deducted_at,
        shipping_carrier: detail.shipping_carrier,
        shipping_code: detail.shipping_code,
        shipped_at: detail.shipped_at,
        delivered_at: detail.delivered_at,
        cancelled_at: detail.cancelled_at,
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
            return { success: false, error: "Bạn cần đăng nhập admin để xem đơn hàng." };
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

            const message = error instanceof Error ? error.message : "Không thể tải danh sách đơn hàng.";
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
            return { success: false, error: "Bạn cần đăng nhập admin để xem chi tiết đơn hàng." };
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

            const message = error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng.";
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    updateStatus: async (orderId, status, note, options) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Bạn cần đăng nhập admin để cập nhật trạng thái." };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminOrderDetailResponse>(`/admin/orders/${orderId}/status`, {
                method: "PATCH",
                token: accessToken,
                body: {
                    status,
                    note: note?.trim() ? note.trim() : undefined,
                    restock_inventory: options?.restockInventory,
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

            const message = error instanceof Error ? error.message : "Không thể cập nhật trạng thái đơn hàng.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updatePaymentStatus: async (orderId, paymentStatus, note) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Bạn cần đăng nhập admin để cập nhật trạng thái thanh toán." };
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

            const message = error instanceof Error ? error.message : "Không thể cập nhật trạng thái thanh toán.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    bulkUpdateStatus: async (payload) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Bạn cần đăng nhập admin để xử lý hàng loạt." };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendBulkOrderStatusResponse>("/admin/orders/bulk-status", {
                method: "POST",
                token: accessToken,
                body: {
                    orderIds: payload.orderIds,
                    action: payload.action,
                    note: payload.note?.trim() ? payload.note.trim() : undefined,
                },
            });

            set({ isSaving: false, error: null });

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Không thể xử lý hàng loạt đơn hàng.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useAdminOrdersStore.getState().reset();
});
