import { create } from "zustand";

import type {
    BackendCategory,
    BackendCategoryListResponse,
    BackendCategoryMutationResponse,
    BackendProduct,
    BackendProductListResponse,
    BackendProductMutationResponse,
    BackendSupplier,
    BackendSupplierListResponse,
} from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { useStorefrontCatalogStore } from "@/shared/lib/store/use-storefront-catalog-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { registerProtectedSessionCleanup } from "@/shared/lib/store/protected-session";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

interface ProductPayload {
    category_id: number;
    supplier_id?: number | null;
    sku: string;
    name: string;
    description?: string;
    sale_price: number;
    stock_quantity: number;
    is_active?: boolean;
}

interface CategoryPayload {
    name: string;
    description?: string;
    is_active?: boolean;
}

interface AdminCatalogState {
    products: BackendProduct[];
    categories: BackendCategory[];
    suppliers: BackendSupplier[];
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    loadData: () => Promise<AsyncResult>;
    createProduct: (payload: ProductPayload) => Promise<AsyncResult<BackendProduct>>;
    updateProduct: (productId: number, payload: ProductPayload) => Promise<AsyncResult<BackendProduct>>;
    deleteProduct: (productId: number) => Promise<AsyncResult>;
    createCategory: (payload: CategoryPayload) => Promise<AsyncResult<BackendCategory>>;
    updateCategory: (categoryId: number, payload: CategoryPayload) => Promise<AsyncResult<BackendCategory>>;
    deleteCategory: (categoryId: number) => Promise<AsyncResult>;
    reset: () => void;
}

const initialState = {
    products: [] as BackendProduct[],
    categories: [] as BackendCategory[],
    suppliers: [] as BackendSupplier[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
};

const SESSION_EXPIRED_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai.";

function token() {
    return useAuthStore.getState().accessToken;
}

async function refreshStorefrontCatalog() {
    try {
        await useStorefrontCatalogStore.getState().loadCatalog(true);
    } catch {
    }
}

export const useAdminCatalogStore = create<AdminCatalogState>()((set) => ({
    ...initialState,
    loadData: async () => {
        const accessToken = token();

        if (!accessToken) {
            return {
                success: false,
                error: "Ban can dang nhap admin de tai kho du lieu.",
            };
        }

        set({ isLoading: true, error: null });

        try {
            const [productsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
                apiRequest<BackendProductListResponse>("/admin/products", { token: accessToken }),
                apiRequest<BackendCategoryListResponse>("/categories?per_page=100", { token: accessToken }),
                apiRequest<BackendSupplierListResponse>("/suppliers?per_page=100", { token: accessToken }),
            ]);

            set({
                products: productsResponse.data,
                categories: categoriesResponse.data,
                suppliers: suppliersResponse.data,
                isLoading: false,
                error: null,
            });

            return { success: true };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tai du lieu admin.";
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    createProduct: async (payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de tao san pham." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendProductMutationResponse>("/admin/products", {
                method: "POST",
                token: accessToken,
                body: payload,
            });

            set((state) => ({
                products: [response.data, ...state.products],
                isSaving: false,
                error: null,
            }));
            await refreshStorefrontCatalog();
            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tao san pham.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateProduct: async (productId, payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de cap nhat san pham." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendProductMutationResponse>(`/admin/products/${productId}`, {
                method: "PUT",
                token: accessToken,
                body: payload,
            });

            set((state) => ({
                products: state.products.map((product) => (product.id === productId ? response.data : product)),
                isSaving: false,
                error: null,
            }));
            await refreshStorefrontCatalog();
            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the cap nhat san pham.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    deleteProduct: async (productId) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de xoa san pham." };

        set({ isSaving: true, error: null });

        try {
            await apiRequest(`/admin/products/${productId}`, {
                method: "DELETE",
                token: accessToken,
            });

            set((state) => ({
                products: state.products.filter((product) => product.id !== productId),
                isSaving: false,
                error: null,
            }));
            await refreshStorefrontCatalog();
            return { success: true };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the xoa san pham.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    createCategory: async (payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de tao danh muc." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendCategoryMutationResponse>("/admin/categories", {
                method: "POST",
                token: accessToken,
                body: payload,
            });

            set((state) => ({
                categories: [...state.categories, response.data],
                isSaving: false,
                error: null,
            }));
            await refreshStorefrontCatalog();
            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the tao danh muc.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateCategory: async (categoryId, payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de cap nhat danh muc." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendCategoryMutationResponse>(`/admin/categories/${categoryId}`, {
                method: "PUT",
                token: accessToken,
                body: payload,
            });

            set((state) => ({
                categories: state.categories.map((category) => (category.id === categoryId ? response.data : category)),
                isSaving: false,
                error: null,
            }));
            await refreshStorefrontCatalog();
            return { success: true, data: response.data };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the cap nhat danh muc.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    deleteCategory: async (categoryId) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de xoa danh muc." };

        set({ isSaving: true, error: null });

        try {
            await apiRequest(`/admin/categories/${categoryId}`, {
                method: "DELETE",
                token: accessToken,
            });

            set((state) => ({
                categories: state.categories.filter((category) => category.id !== categoryId),
                isSaving: false,
                error: null,
            }));
            await refreshStorefrontCatalog();
            return { success: true };
        } catch (error) {
            if (isUnauthorizedApiError(error)) {
                useAuthStore.getState().clearSession();
                return { success: false, error: SESSION_EXPIRED_MESSAGE };
            }

            const message = error instanceof Error ? error.message : "Khong the xoa danh muc.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useAdminCatalogStore.getState().reset();
});
