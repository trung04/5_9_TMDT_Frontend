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
    BackendSupplierMutationResponse,
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
    image_url?: string | null;
    sale_price: number;
    stock_quantity: number;
    is_active?: boolean;
    is_deleted?: boolean;
}

interface CategoryPayload {
    name: string;
    description?: string;
    is_active?: boolean;
    is_deleted?: boolean;
}

interface SupplierPayload {
    supplier_code: string;
    name: string;
    contact_name?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    is_active?: boolean;
    is_deleted?: boolean;
}

interface LoadDataOptions {
    includeProducts?: boolean;
    includeInactiveCategories?: boolean;
    includeInactiveSuppliers?: boolean;
}

interface AdminCatalogState {
    products: BackendProduct[];
    categories: BackendCategory[];
    suppliers: BackendSupplier[];
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    loadData: (options?: LoadDataOptions) => Promise<AsyncResult>;
    createProduct: (payload: ProductPayload) => Promise<AsyncResult<BackendProduct>>;
    updateProduct: (productId: number, payload: ProductPayload) => Promise<AsyncResult<BackendProduct>>;
    deleteProduct: (productId: number) => Promise<AsyncResult<BackendProduct>>;
    createCategory: (payload: CategoryPayload) => Promise<AsyncResult<BackendCategory>>;
    updateCategory: (categoryId: number, payload: CategoryPayload) => Promise<AsyncResult<BackendCategory>>;
    deleteCategory: (categoryId: number) => Promise<AsyncResult<BackendCategory>>;
    createSupplier: (payload: SupplierPayload) => Promise<AsyncResult<BackendSupplier>>;
    updateSupplier: (supplierId: number, payload: SupplierPayload) => Promise<AsyncResult<BackendSupplier>>;
    deleteSupplier: (supplierId: number) => Promise<AsyncResult<BackendSupplier>>;
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

const SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

function token() {
    return useAuthStore.getState().accessToken;
}

async function refreshStorefrontCatalog() {
    try {
        await useStorefrontCatalogStore.getState().loadCatalog(true);
    } catch {
        // Admin mutations should not fail just because the storefront cache cannot refresh.
    }
}

export const useAdminCatalogStore = create<AdminCatalogState>()((set) => ({
    ...initialState,
    loadData: async (options = { includeProducts: true }) => {
        const accessToken = token();

        if (!accessToken) {
            return {
                success: false,
                error: "Bạn cần đăng nhập admin để tải kho dữ liệu.",
            };
        }

        set({ isLoading: true, error: null });

        try {
            const [productsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
                options.includeProducts
                    ? apiRequest<BackendProductListResponse>("/admin/products", { token: accessToken })
                    : Promise.resolve({
                          message: "Products skipped.",
                          data: [],
                      } satisfies BackendProductListResponse),
                apiRequest<BackendCategoryListResponse>(
                    options.includeInactiveCategories
                        ? "/admin/categories?per_page=200"
                        : "/categories?per_page=100",
                    { token: accessToken },
                ),
                apiRequest<BackendSupplierListResponse>(
                    options.includeInactiveSuppliers
                        ? "/admin/suppliers?per_page=200"
                        : "/suppliers?per_page=100",
                    { token: accessToken },
                ),
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

            const message = error instanceof Error ? error.message : "Không thể tải dữ liệu admin.";
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    createProduct: async (payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Bạn cần đăng nhập admin để tạo sản phẩm." };

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

            const message = error instanceof Error ? error.message : "Không thể tạo sản phẩm.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateProduct: async (productId, payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Bạn cần đăng nhập admin để cập nhật sản phẩm." };

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

            const message = error instanceof Error ? error.message : "Không thể cập nhật sản phẩm.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    deleteProduct: async (productId) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de an san pham." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendProductMutationResponse>(
                `/admin/products/${productId}`,
                {
                    method: "DELETE",
                    token: accessToken,
                },
            );

            set((state) => ({
                products: state.products.map((product) =>
                    product.id === productId ? response.data : product,
                ),
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

            const message = error instanceof Error ? error.message : "Khong the an san pham.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    createCategory: async (payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Bạn cần đăng nhập admin để tạo danh mục." };

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

            const message = error instanceof Error ? error.message : "Không thể tạo danh mục.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateCategory: async (categoryId, payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Bạn cần đăng nhập admin để cập nhật danh mục." };

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

            const message = error instanceof Error ? error.message : "Không thể cập nhật danh mục.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    deleteCategory: async (categoryId) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de an danh muc." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendCategoryMutationResponse>(
                `/admin/categories/${categoryId}`,
                {
                    method: "DELETE",
                    token: accessToken,
                },
            );

            set((state) => ({
                categories: state.categories.map((category) =>
                    category.id === categoryId ? response.data : category,
                ),
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

            const message = error instanceof Error ? error.message : "Khong the an danh muc.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    createSupplier: async (payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de tao nha cung cap." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendSupplierMutationResponse>("/admin/suppliers", {
                method: "POST",
                token: accessToken,
                body: payload,
            });

            set((state) => ({
                suppliers: [...state.suppliers, response.data],
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

            const message = error instanceof Error ? error.message : "Khong the tao nha cung cap.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateSupplier: async (supplierId, payload) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de cap nhat nha cung cap." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendSupplierMutationResponse>(
                `/admin/suppliers/${supplierId}`,
                {
                    method: "PUT",
                    token: accessToken,
                    body: payload,
                },
            );

            set((state) => ({
                suppliers: state.suppliers.map((supplier) =>
                    supplier.id === supplierId ? response.data : supplier,
                ),
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

            const message = error instanceof Error ? error.message : "Khong the cap nhat nha cung cap.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    deleteSupplier: async (supplierId) => {
        const accessToken = token();
        if (!accessToken) return { success: false, error: "Ban can dang nhap admin de an nha cung cap." };

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendSupplierMutationResponse>(
                `/admin/suppliers/${supplierId}`,
                {
                    method: "DELETE",
                    token: accessToken,
                },
            );

            set((state) => ({
                suppliers: state.suppliers.map((supplier) =>
                    supplier.id === supplierId ? response.data : supplier,
                ),
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

            const message = error instanceof Error ? error.message : "Khong the an nha cung cap.";
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () => set(initialState),
}));

registerProtectedSessionCleanup(() => {
    useAdminCatalogStore.getState().reset();
});
