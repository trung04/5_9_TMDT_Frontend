import { create } from "zustand";

import type {
    BackendAdminCustomer,
    BackendAdminCustomerResponse,
    BackendAdminCustomersResponse,
} from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { registerProtectedSessionCleanup } from "@/shared/lib/store/protected-session";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AdminCustomerPayload {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
    address?: string | null;
    city?: string | null;
    favorite_region?: string | null;
    avatar_url?: string | null;
    newsletter?: boolean;
    sms_alerts?: boolean;
    order_email?: boolean;
    security_alerts?: boolean;
    reward_points?: number;
    reward_tier?: string;
    next_tier_points?: number;
    status?: string;
    is_active?: boolean;
}

interface AdminUserState {
    customers: BackendAdminCustomer[];
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    loadCustomers: () => Promise<AsyncResult>;
    createCustomer: (payload: AdminCustomerPayload) => Promise<AsyncResult<BackendAdminCustomer>>;
    updateCustomer: (
        customerId: number,
        payload: AdminCustomerPayload,
    ) => Promise<AsyncResult<BackendAdminCustomer>>;
    blockCustomer: (customerId: number) => Promise<AsyncResult<BackendAdminCustomer>>;
    reset: () => void;
}

const initialState = {
    customers: [] as BackendAdminCustomer[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
};

const SESSION_EXPIRED_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai.";

function token() {
    return useAuthStore.getState().accessToken;
}

export const useAdminUserStore = create<AdminUserState>()((set) => ({
    ...initialState,
    loadCustomers: async () => {
        const accessToken = token();

        if (!accessToken) {
            return {
                success: false,
                error: "Ban can dang nhap admin de tai danh sach users.",
            };
        }

        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest<BackendAdminCustomersResponse>(
                "/admin/users?per_page=200",
                { token: accessToken },
            );

            set({ customers: response.data, isLoading: false, error: null });
            return { success: true };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tai danh sach users.";
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    createCustomer: async (payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de tao user." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminCustomerResponse>("/admin/users", {
                method: "POST",
                token: accessToken,
                body: payload,
            });

            set((state) => ({
                customers: [response.data, ...state.customers],
                isSaving: false,
                error: null,
            }));
            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tao user.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateCustomer: async (customerId, payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de cap nhat user." };

        const { password: _password, ...body } = payload;
        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminCustomerResponse>(
                `/admin/users/${customerId}`,
                {
                    method: "PUT",
                    token: accessToken,
                    body,
                },
            );

            set((state) => ({
                customers: state.customers.map((customer) =>
                    customer.id === customerId ? response.data : customer,
                ),
                isSaving: false,
                error: null,
            }));
            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the cap nhat user.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    blockCustomer: async (customerId) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de khoa user." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminCustomerResponse>(
                `/admin/users/${customerId}`,
                {
                    method: "DELETE",
                    token: accessToken,
                },
            );

            set((state) => ({
                customers: state.customers.map((customer) =>
                    customer.id === customerId ? response.data : customer,
                ),
                isSaving: false,
                error: null,
            }));
            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the khoa user.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useAdminUserStore.getState().reset();
});
