import { create } from "zustand";

import type {
    BackendGhnDistrict,
    BackendGhnDistrictsResponse,
    BackendGhnProvince,
    BackendGhnProvincesResponse,
    BackendGhnWard,
    BackendGhnWardsResponse,
} from "@/shared/api/backend-types";
import { apiRequest } from "@/shared/api/backend-client";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

interface GhnLocationState {
    provinces: BackendGhnProvince[];
    districtsByProvince: Record<string, BackendGhnDistrict[]>;
    wardsByDistrict: Record<string, BackendGhnWard[]>;
    isLoadingProvinces: boolean;
    isLoadingDistricts: boolean;
    isLoadingWards: boolean;
    error: string | null;
    loadProvinces: () => Promise<AsyncResult<BackendGhnProvince[]>>;
    loadDistricts: (provinceId: number) => Promise<AsyncResult<BackendGhnDistrict[]>>;
    loadWards: (districtId: number) => Promise<AsyncResult<BackendGhnWard[]>>;
    reset: () => void;
}

const initialState = {
    provinces: [] as BackendGhnProvince[],
    districtsByProvince: {} as Record<string, BackendGhnDistrict[]>,
    wardsByDistrict: {} as Record<string, BackendGhnWard[]>,
    isLoadingProvinces: false,
    isLoadingDistricts: false,
    isLoadingWards: false,
    error: null as string | null,
};

export const useGhnLocationStore = create<GhnLocationState>()((set, get) => ({
    ...initialState,
    loadProvinces: async () => {
        const cached = get().provinces;

        if (cached.length > 0) {
            return { success: true, data: cached };
        }

        set({ isLoadingProvinces: true, error: null });

        try {
            const response = await apiRequest<BackendGhnProvincesResponse>("/shipping/ghn/provinces");

            set({
                provinces: response.data,
                isLoadingProvinces: false,
                error: null,
            });

            return { success: true, data: response.data };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the tai tinh/thanh GHN.";
            set({ isLoadingProvinces: false, error: message });
            return { success: false, error: message };
        }
    },
    loadDistricts: async (provinceId) => {
        const key = String(provinceId);
        const cached = get().districtsByProvince[key];

        if (cached?.length) {
            return { success: true, data: cached };
        }

        set({ isLoadingDistricts: true, error: null });

        try {
            const response = await apiRequest<BackendGhnDistrictsResponse>(
                `/shipping/ghn/districts?province_id=${encodeURIComponent(provinceId)}`,
            );

            set((state) => ({
                districtsByProvince: {
                    ...state.districtsByProvince,
                    [key]: response.data,
                },
                isLoadingDistricts: false,
                error: null,
            }));

            return { success: true, data: response.data };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the tai quan/huyen GHN.";
            set({ isLoadingDistricts: false, error: message });
            return { success: false, error: message };
        }
    },
    loadWards: async (districtId) => {
        const key = String(districtId);
        const cached = get().wardsByDistrict[key];

        if (cached?.length) {
            return { success: true, data: cached };
        }

        set({ isLoadingWards: true, error: null });

        try {
            const response = await apiRequest<BackendGhnWardsResponse>(
                `/shipping/ghn/wards?district_id=${encodeURIComponent(districtId)}`,
            );

            set((state) => ({
                wardsByDistrict: {
                    ...state.wardsByDistrict,
                    [key]: response.data,
                },
                isLoadingWards: false,
                error: null,
            }));

            return { success: true, data: response.data };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the tai phuong/xa GHN.";
            set({ isLoadingWards: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));
