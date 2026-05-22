import { create } from "zustand";

import type {
    BackendShippingCarrier,
    BackendShippingCarrierListResponse,
    BackendShippingCarrierMutationResponse,
} from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { registerProtectedSessionCleanup } from "@/shared/lib/store/protected-session";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ShippingCarrierPayload {
    code: string;
    name: string;
    provider: "GHN" | "MANUAL" | string;
    tracking_url_template?: string | null;
    default_weight?: number;
    default_length?: number;
    default_width?: number;
    default_height?: number;
    default_service_type_id?: number | null;
    default_payment_type_id?: number | null;
    default_required_note?: string | null;
    pickup_name?: string | null;
    pickup_phone?: string | null;
    pickup_address?: string | null;
    pickup_ward_code?: string | null;
    pickup_ward_name?: string | null;
    pickup_district_id?: number | null;
    pickup_district_name?: string | null;
    pickup_province_id?: number | null;
    pickup_province_name?: string | null;
    is_active?: boolean;
    is_deleted?: boolean;
}

interface LoadOptions {
    activeOnly?: boolean;
}

interface AdminShippingCarriersState {
    carriers: BackendShippingCarrier[];
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    loadCarriers: (options?: LoadOptions) => Promise<AsyncResult<BackendShippingCarrier[]>>;
    createCarrier: (payload: ShippingCarrierPayload) => Promise<AsyncResult<BackendShippingCarrier>>;
    updateCarrier: (carrierId: number, payload: ShippingCarrierPayload) => Promise<AsyncResult<BackendShippingCarrier>>;
    deleteCarrier: (carrierId: number) => Promise<AsyncResult<BackendShippingCarrier>>;
    reset: () => void;
}

const initialState = {
    carriers: [] as BackendShippingCarrier[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
};

const SESSION_EXPIRED_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai.";

function token() {
    return useAuthStore.getState().accessToken;
}

function listPath(options?: LoadOptions) {
    const params = new URLSearchParams();
    params.set("per_page", "100");

    if (options?.activeOnly) {
        params.set("active_only", "1");
    }

    return `/admin/shipping-carriers?${params.toString()}`;
}

export const useAdminShippingCarriersStore = create<AdminShippingCarriersState>()((set) => ({
    ...initialState,
    loadCarriers: async (options) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de tai don vi van chuyen." };
        }

        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest<BackendShippingCarrierListResponse>(listPath(options), {
                token: accessToken,
            });

            set({
                carriers: response.data,
                isLoading: false,
                error: null,
            });

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                set({ isLoading: false, error: SESSION_EXPIRED_MESSAGE });
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tai don vi van chuyen.";
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    createCarrier: async (payload) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de tao don vi van chuyen." };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendShippingCarrierMutationResponse>("/admin/shipping-carriers", {
                method: "POST",
                token: accessToken,
                body: payload,
            });

            set((state) => ({
                carriers: [response.data, ...state.carriers],
                isSaving: false,
                error: null,
            }));

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                set({ isSaving: false, error: SESSION_EXPIRED_MESSAGE });
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tao don vi van chuyen.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateCarrier: async (carrierId, payload) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de cap nhat don vi van chuyen." };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendShippingCarrierMutationResponse>(
                `/admin/shipping-carriers/${carrierId}`,
                {
                    method: "PUT",
                    token: accessToken,
                    body: payload,
                },
            );

            set((state) => ({
                carriers: state.carriers.map((carrier) => (carrier.id === carrierId ? response.data : carrier)),
                isSaving: false,
                error: null,
            }));

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                set({ isSaving: false, error: SESSION_EXPIRED_MESSAGE });
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the cap nhat don vi van chuyen.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    deleteCarrier: async (carrierId) => {
        const accessToken = token();

        if (!accessToken) {
            return { success: false, error: "Ban can dang nhap admin de an don vi van chuyen." };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendShippingCarrierMutationResponse>(
                `/admin/shipping-carriers/${carrierId}`,
                {
                    method: "DELETE",
                    token: accessToken,
                },
            );

            set((state) => ({
                carriers: state.carriers.map((carrier) => (carrier.id === carrierId ? response.data : carrier)),
                isSaving: false,
                error: null,
            }));

            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                set({ isSaving: false, error: SESSION_EXPIRED_MESSAGE });
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the an don vi van chuyen.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useAdminShippingCarriersStore.getState().reset();
});
