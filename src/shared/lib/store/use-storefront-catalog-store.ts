import { create } from "zustand";

import type { Category, Product, Region } from "@/entities/product/model/types";
import type {
    BackendCategoryListResponse,
    BackendProductDetailResponse,
    BackendProductListResponse,
    BackendRegionListResponse,
    BackendSupplierListResponse,
} from "@/shared/api/backend-types";
import { apiRequest } from "@/shared/api/backend-client";
import {
    adaptBackendCategory,
    adaptBackendProduct,
    adaptBackendRegion,
    adaptBackendSupplierOption,
    type StorefrontSupplierOption,
} from "@/shared/api/storefront-adapters";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useShopStore } from "@/shared/lib/store/use-shop-store";

const DEFAULT_PRODUCT_PAGE_SIZE = 15;

interface CatalogPagination {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}

interface LoadCatalogOptions {
    force?: boolean;
    page?: number;
    perPage?: number;
    search?: string;
    categoryIds?: string[];
    supplierIds?: string[];
    maxPrice?: number;
    sort?: string;
}

interface StorefrontCatalogState {
    categories: Category[];
    regions: Region[];
    suppliers: StorefrontSupplierOption[];
    products: Product[];
    productDetails: Record<string, Product>;
    productsPagination: CatalogPagination | null;
    productsQuery: string | null;
    status: "idle" | "loading" | "ready" | "error";
    error: string | null;
    loadCatalog: (options?: boolean | LoadCatalogOptions) => Promise<void>;
    loadProductById: (productId: string) => Promise<Product | null>;
    reset: () => void;
}

const initialState = {
    categories: [] as Category[],
    regions: [] as Region[],
    suppliers: [] as StorefrontSupplierOption[],
    products: [] as Product[],
    productDetails: {} as Record<string, Product>,
    productsPagination: null as CatalogPagination | null,
    productsQuery: null as string | null,
    status: "idle" as const,
    error: null as string | null,
};

function resolveLoadOptions(options: boolean | LoadCatalogOptions | undefined): Required<LoadCatalogOptions> {
    if (typeof options === "boolean") {
        return {
            force: options,
            page: 1,
            perPage: DEFAULT_PRODUCT_PAGE_SIZE,
            search: "",
            categoryIds: [],
            supplierIds: [],
            maxPrice: 0,
            sort: "popular",
        };
    }

    return {
        force: options?.force ?? false,
        page: options?.page ?? 1,
        perPage: options?.perPage ?? DEFAULT_PRODUCT_PAGE_SIZE,
        search: options?.search ?? "",
        categoryIds: options?.categoryIds ?? [],
        supplierIds: options?.supplierIds ?? [],
        maxPrice: options?.maxPrice ?? 0,
        sort: options?.sort ?? "popular",
    };
}

function productQueryFromOptions(options: Required<LoadCatalogOptions>) {
    const params = new URLSearchParams({
        page: String(Math.max(1, options.page)),
        per_page: String(Math.max(1, options.perPage)),
    });
    const search = options.search.trim();

    if (search) params.set("keyword", search);
    if (options.categoryIds.length) params.set("category_id", options.categoryIds.join(","));
    if (options.supplierIds.length) params.set("supplier_id", options.supplierIds.join(","));
    if (options.maxPrice > 0) params.set("max_price", String(options.maxPrice));
    if (options.sort !== "popular") params.set("sort", options.sort);

    return params.toString();
}

function paginationFromProductsResponse(response: BackendProductListResponse): CatalogPagination {
    const legacyPagination = response.pagination;

    return {
        currentPage: response.current_page ?? legacyPagination?.current_page ?? 1,
        lastPage: response.last_page ?? legacyPagination?.last_page ?? 1,
        perPage: response.per_page ?? legacyPagination?.per_page ?? response.data.length,
        total: response.total ?? legacyPagination?.total ?? response.data.length,
    };
}

export const useStorefrontCatalogStore = create<StorefrontCatalogState>()((set, get) => ({
    ...initialState,
    loadCatalog: async (options) => {
        const resolvedOptions = resolveLoadOptions(options);
        const productQuery = productQueryFromOptions(resolvedOptions);

        if (!resolvedOptions.force) {
            const status = get().status;

            if ((status === "loading" || status === "ready") && get().productsQuery === productQuery) {
                return;
            }
        }

        set({
            status: "loading",
            error: null,
        });

        try {
            const [productsResponse, categoriesResponse, suppliersResponse, regionsResponse] = await Promise.all([
                apiRequest<BackendProductListResponse>(`/products?${productQuery}`),
                apiRequest<BackendCategoryListResponse>("/categories?per_page=100"),
                apiRequest<BackendSupplierListResponse>("/suppliers?per_page=100"),
                apiRequest<BackendRegionListResponse>("/regions"),
            ]);

            const categories = categoriesResponse.data.map(adaptBackendCategory);
            const regions = regionsResponse.data.map(adaptBackendRegion);
            const suppliers = suppliersResponse.data.map(adaptBackendSupplierOption);
            const products = productsResponse.data.map((product, index) =>
                adaptBackendProduct(product, index),
            );
            const validProductIds = products.map((product) => product.id);

            useShopStore.getState().pruneProductReferences(validProductIds);
            useCartStore.getState().pruneGuestItems(validProductIds);

            set({
                categories,
                regions,
                suppliers,
                products,
                productsPagination: paginationFromProductsResponse(productsResponse),
                productsQuery: productQuery,
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
