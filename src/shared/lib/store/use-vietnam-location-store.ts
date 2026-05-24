import { create } from "zustand";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface VietnamProvince {
    code: number;
    name: string;
    codename: string;
    division_type: string;
    districts?: VietnamDistrict[];
}

export interface VietnamDistrict {
    code: number;
    name: string;
    codename: string;
    division_type: string;
    province_code: number;
    wards?: VietnamWard[];
}

export interface VietnamWard {
    code: number;
    name: string;
    codename: string;
    division_type: string;
    district_code: number;
}

interface VietnamLocationState {
    provinces: VietnamProvince[];
    districtsByProvince: Record<string, VietnamDistrict[]>;
    wardsByDistrict: Record<string, VietnamWard[]>;
    isLoadingProvinces: boolean;
    isLoadingDistricts: boolean;
    isLoadingWards: boolean;
    error: string | null;
    loadProvinces: () => Promise<AsyncResult<VietnamProvince[]>>;
    loadDistricts: (provinceCode: number) => Promise<AsyncResult<VietnamDistrict[]>>;
    loadWards: (districtCode: number) => Promise<AsyncResult<VietnamWard[]>>;
    reset: () => void;
}

const VIETNAM_LOCATION_API_BASE = "https://provinces.open-api.vn/api/v1";

const initialState = {
    provinces: [] as VietnamProvince[],
    districtsByProvince: {} as Record<string, VietnamDistrict[]>,
    wardsByDistrict: {} as Record<string, VietnamWard[]>,
    isLoadingProvinces: false,
    isLoadingDistricts: false,
    isLoadingWards: false,
    error: null as string | null,
};

function buildDistrictCache(provinces: VietnamProvince[]) {
    return provinces.reduce<Record<string, VietnamDistrict[]>>((cache, province) => {
        cache[String(province.code)] = province.districts ?? [];
        return cache;
    }, {});
}

function locationErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message && error.message !== "Failed to fetch") {
        return error.message;
    }

    return fallback;
}

async function locationRequest<T>(path: string) {
    const response = await fetch(`${VIETNAM_LOCATION_API_BASE}${path}`, {
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Location API request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
}

export const useVietnamLocationStore = create<VietnamLocationState>()((set, get) => ({
    ...initialState,
    loadProvinces: async () => {
        const cached = get().provinces;

        if (cached.length > 0) {
            return { success: true, data: cached };
        }

        set({ isLoadingProvinces: true, error: null });

        try {
            const provinces = await locationRequest<VietnamProvince[]>("/?depth=2");

            set({
                provinces,
                districtsByProvince: buildDistrictCache(provinces),
                isLoadingProvinces: false,
                error: null,
            });

            return { success: true, data: provinces };
        } catch (error) {
            const message = locationErrorMessage(error, "Khong the tai danh sach tinh/thanh.");
            set({ isLoadingProvinces: false, error: message });
            return { success: false, error: message };
        }
    },
    loadDistricts: async (provinceCode) => {
        const key = String(provinceCode);
        const cached = get().districtsByProvince[key];

        if (cached) {
            return { success: true, data: cached };
        }

        set({ isLoadingDistricts: true, error: null });

        try {
            if (get().provinces.length === 0) {
                const provincesResult = await get().loadProvinces();

                if (!provincesResult.success) {
                    set({ isLoadingDistricts: false });
                    return { success: false, error: provincesResult.error };
                }
            }

            const province = get().provinces.find((item) => item.code === provinceCode);
            const districts = province?.districts ?? [];

            set((state) => ({
                districtsByProvince: {
                    ...state.districtsByProvince,
                    [key]: districts,
                },
                isLoadingDistricts: false,
                error: null,
            }));

            return { success: true, data: districts };
        } catch (error) {
            const message = locationErrorMessage(error, "Khong the tai danh sach quan/huyen.");
            set({ isLoadingDistricts: false, error: message });
            return { success: false, error: message };
        }
    },
    loadWards: async (districtCode) => {
        const key = String(districtCode);
        const cached = get().wardsByDistrict[key];

        if (cached) {
            return { success: true, data: cached };
        }

        set({ isLoadingWards: true, error: null });

        try {
            const district = await locationRequest<VietnamDistrict>(`/d/${encodeURIComponent(districtCode)}?depth=2`);
            const wards = district.wards ?? [];

            set((state) => ({
                wardsByDistrict: {
                    ...state.wardsByDistrict,
                    [key]: wards,
                },
                isLoadingWards: false,
                error: null,
            }));

            return { success: true, data: wards };
        } catch (error) {
            const message = locationErrorMessage(error, "Khong the tai danh sach phuong/xa.");
            set({ isLoadingWards: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));
