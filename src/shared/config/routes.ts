import type { UserRole } from "@/entities/user/model/types";

export interface ProductQueryOptions {
    search?: string;
    categories?: string[];
    suppliers?: string[];
    regions?: string[];
    sort?: string;
    price?: number;
    ratingMin?: number;
}

function withQuery(path: string, options: ProductQueryOptions = {}) {
    const params = new URLSearchParams();

    if (options.search) params.set("search", options.search);
    if (options.categories?.length) params.set("categories", options.categories.join(","));
    if (options.suppliers?.length) params.set("suppliers", options.suppliers.join(","));
    if (options.regions?.length) params.set("regions", options.regions.join(","));
    if (options.sort) params.set("sort", options.sort);
    if (options.price) params.set("price", String(options.price));
    if (options.ratingMin) params.set("ratingMin", String(options.ratingMin));

    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

export const routes = {
    home: "/",
    login: "/login",
    logout: "/logout",
    unauthorized: "/unauthorized",
    products: "/products",
    productsWithQuery: (options: ProductQueryOptions = {}) => withQuery("/products", options),
    productDetail: (slug = ":slug") => `/products/${slug}`,
    story: "/story",
    regions: "/regions",
    checkout: "/checkout",
    orderSuccess: (orderId = ":orderId") => `/checkout/success/${orderId}`,
    accountProfile: "/account/profile",
    accountSecurity: "/account/security",
    accountNotifications: "/account/notifications",
    accountAddresses: "/account/addresses",
    accountRewards: "/account/rewards",
    accountDisputes: "/account/disputes",
    accountOrders: "/account/orders",
    accountOrderDetail: (orderId = ":orderId") => `/account/orders/${orderId}`,
    accountWishlist: "/account/wishlist",
    adminDashboard: "/admin/dashboard",
    adminCommunity: "/admin/community",
    adminRepository: "/admin/repository",
    adminLogistics: "/admin/logistics",
    adminSettings: "/admin/settings",
    supplierInventory: "/supplier/inventory",
    supplierRequisitions: "/supplier/requisitions",
    supplierProcessing: "/supplier/processing",
    supplierOrders: "/supplier/orders",
    supplierHelp: "/supplier/help",
    warehouseInventory: "/warehouse/inventory",
    warehouseRequisitions: "/warehouse/requisitions",
    warehouseFulfillment: "/warehouse/fulfillment",
    warehouseSupplierOrders: "/warehouse/supplier-orders",
    warehouseHelp: "/warehouse/help",
} as const;

export const roleProtectedPrefixes = [
    {
        prefix: "/account",
        roles: ["customer"] as UserRole[],
    },
    {
        prefix: "/admin",
        roles: ["admin"] as UserRole[],
    },
    {
        prefix: "/supplier",
        roles: ["supplier"] as UserRole[],
    },
    {
        prefix: "/warehouse",
        roles: ["warehouse"] as UserRole[],
    },
];
