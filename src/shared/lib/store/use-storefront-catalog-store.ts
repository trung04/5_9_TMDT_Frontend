import { create } from "zustand";

import type { Category, Product } from "@/entities/product/model/types";
import type {
    BackendCategoryListResponse,
    BackendProductDetailResponse,
    BackendProductListResponse,
    BackendSupplierListResponse,
} from "@/shared/api/backend-types";
import { apiRequest } from "@/shared/api/backend-client";
import {
    adaptBackendCategory,
    adaptBackendProduct,
    adaptBackendSupplierOption,
    type StorefrontSupplierOption,
} from "@/shared/api/storefront-adapters";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useShopStore } from "@/shared/lib/store/use-shop-store";

interface StorefrontCatalogState {
    categories: Category[];
    suppliers: StorefrontSupplierOption[];
    products: Product[];
    productDetails: Record<string, Product>;
    status: "idle" | "loading" | "ready" | "error";
    error: string | null;
    loadCatalog: (force?: boolean) => Promise<void>;
    loadProductById: (productId: string) => Promise<Product | null>;
    reset: () => void;
}

const initialState = {
    categories: [] as Category[],
    suppliers: [] as StorefrontSupplierOption[],
    products: [] as Product[],
    productDetails: {} as Record<string, Product>,
    status: "idle" as const,
    error: null as string | null,
};

export const useStorefrontCatalogStore = create<StorefrontCatalogState>()((set, get) => ({
    ...initialState,
    loadCatalog: async (force = false) => {
        if (!force) {
            const status = get().status;

            if (status === "loading" || status === "ready") {
                return;
            }
        }

        set({
            status: "loading",
            error: null,
        });

        try {
            const [productsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
                apiRequest<BackendProductListResponse>("/products"),
                apiRequest<BackendCategoryListResponse>("/categories"),
                apiRequest<BackendSupplierListResponse>("/suppliers"),
            ]);

            const categories = categoriesResponse.data.map(adaptBackendCategory);
            const suppliers = suppliersResponse.data.map(adaptBackendSupplierOption);
            const products = productsResponse.data.map((product, index) =>
                adaptBackendProduct(product, index),
            );
            const validProductIds = products.map((product) => product.id);

            useShopStore.getState().pruneProductReferences(validProductIds);
            useCartStore.getState().pruneGuestItems(validProductIds);

            set({
                categories,
                suppliers,
                products,
                productDetails: products.reduce<Record<string, Product>>((accumulator, product) => {
                    accumulator[product.id] = product;
                    return accumulator;
                }, {}),
                status: "ready",
                error: null,
            });
        } catch (error) {
            set({
                status: "error",
                error: error instanceof Error ? error.message : "Không thể tải danh mục storefront.",
            });
        }
    },
    loadProductById: async (productId) => {
        try {
            const response = await apiRequest<BackendProductDetailResponse>(`/products/${productId}`);
            const nextProduct = adaptBackendProduct(response.data);

            set((state) => ({
                productDetails: {
                    ...state.productDetails,
                    [nextProduct.id]: {
                        ...(state.products.find((product) => product.id === nextProduct.id) ??
                            state.productDetails[nextProduct.id] ??
                            {}),
                        ...nextProduct,
                    },
                },
            }));

            return nextProduct;
        } catch {
            return null;
        }
    },
    reset: () => set(initialState),
}));
