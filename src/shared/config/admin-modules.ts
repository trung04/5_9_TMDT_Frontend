import type { AuthUser } from "@/entities/user/model/types";
import { routes } from "@/shared/config/routes";
import { hasAnyAdminPermission } from "@/shared/lib/auth";

export type AdminModuleId =
    | "dashboard"
    | "users"
    | "products"
    | "categories"
    | "suppliers"
    | "shippingCarriers"
    | "community"
    | "logistics"
    | "settings"
    | "access"
    | "supplierInventory"
    | "supplierRequisitions"
    | "supplierProcessing"
    | "supplierOrders"
    | "supplierHelp"
    | "warehouseInventory"
    | "warehouseRequisitions"
    | "warehouseFulfillment"
    | "warehouseSupplierOrders"
    | "warehouseHelp";

export interface AdminModule {
    id: AdminModuleId;
    label: string;
    to: string;
    icon: string;
    permissions: string[];
    section: "overview" | "commerce" | "supplier" | "warehouse" | "system";
    superOnly?: boolean;
}

export const adminModules: AdminModule[] = [
    {
        id: "dashboard",
        label: "Tổng quan",
        to: routes.adminDashboard,
        icon: "dashboard",
        permissions: ["admin.dashboard.view"],
        section: "overview",
    },
    {
        id: "users",
        label: "Người dùng",
        to: routes.adminUsers,
        icon: "group",
        permissions: [
            "admin.users.view",
            "admin.users.create",
            "admin.users.update",
            "admin.users.delete",
        ],
        section: "commerce",
    },
    {
        id: "products",
        label: "Sản phẩm",
        to: routes.adminProducts,
        icon: "inventory_2",
        permissions: [
            "admin.products.view",
            "admin.products.create",
            "admin.products.update",
            "admin.products.delete",
        ],
        section: "commerce",
    },
    {
        id: "categories",
        label: "Danh mục",
        to: routes.adminCategories,
        icon: "category",
        permissions: [
            "admin.categories.create",
            "admin.categories.update",
            "admin.categories.delete",
        ],
        section: "commerce",
    },
    {
        id: "suppliers",
        label: "Nhà cung cấp",
        to: routes.adminSuppliers,
        icon: "local_shipping",
        permissions: [
            "admin.suppliers.create",
            "admin.suppliers.update",
            "admin.suppliers.delete",
        ],
        section: "commerce",
    },
    {
        id: "shippingCarriers",
        label: "Vận chuyển",
        to: routes.adminShippingCarriers,
        icon: "local_shipping",
        permissions: [
            "admin.shipping_carriers.view",
            "admin.shipping_carriers.create",
            "admin.shipping_carriers.update",
            "admin.shipping_carriers.delete",
        ],
        section: "commerce",
    },
    {
        id: "logistics",
        label: "Điều phối đơn",
        to: routes.adminLogistics,
        icon: "shopping_cart",
        permissions: [
            "admin.orders.view",
            "admin.orders.status.update",
            "admin.orders.payment.update",
            "admin.orders.bulk.update",
        ],
        section: "commerce",
    },
    {
        id: "community",
        label: "Cộng đồng",
        to: routes.adminCommunity,
        icon: "group",
        permissions: [
            "admin.community.view",
            "admin.community.invitation.create",
            "admin.community.posts.view",
            "admin.community.posts.create",
            "admin.community.posts.update",
            "admin.community.posts.delete",
            "admin.community.comments.moderate",
        ],
        section: "commerce",
    },
    {
        id: "settings",
        label: "Cài đặt",
        to: routes.adminSettings,
        icon: "settings",
        permissions: ["admin.settings.view", "admin.settings.update"],
        section: "system",
    },
    {
        id: "access",
        label: "Phân quyền",
        to: routes.adminAccess,
        icon: "admin_panel_settings",
        permissions: [],
        section: "system",
        superOnly: true,
    },
    {
        id: "supplierInventory",
        label: "Tồn kho NCC",
        to: routes.adminSupplierInventory,
        icon: "inventory_2",
        permissions: ["admin.supplier.inventory.view"],
        section: "supplier",
    },
    {
        id: "supplierRequisitions",
        label: "Phiếu NCC",
        to: routes.adminSupplierRequisitions,
        icon: "assignment_turned_in",
        permissions: ["admin.supplier.requisitions.view"],
        section: "supplier",
    },
    {
        id: "supplierProcessing",
        label: "Xử lý đơn NCC",
        to: routes.adminSupplierProcessing,
        icon: "package_2",
        permissions: ["admin.supplier.processing.view"],
        section: "supplier",
    },
    {
        id: "supplierOrders",
        label: "Đơn NCC",
        to: routes.adminSupplierOrders,
        icon: "local_shipping",
        permissions: ["admin.supplier.orders.view"],
        section: "supplier",
    },
    {
        id: "supplierHelp",
        label: "Hỗ trợ NCC",
        to: routes.adminSupplierHelp,
        icon: "help",
        permissions: ["admin.supplier.help.view"],
        section: "supplier",
    },
    {
        id: "warehouseInventory",
        label: "Tồn kho",
        to: routes.adminWarehouseInventory,
        icon: "inventory_2",
        permissions: ["admin.warehouse.inventory.view"],
        section: "warehouse",
    },
    {
        id: "warehouseRequisitions",
        label: "Phiếu tái nhập",
        to: routes.adminWarehouseRequisitions,
        icon: "assignment_turned_in",
        permissions: ["admin.warehouse.requisitions.view"],
        section: "warehouse",
    },
    {
        id: "warehouseFulfillment",
        label: "Fulfillment",
        to: routes.adminWarehouseFulfillment,
        icon: "package_2",
        permissions: ["admin.warehouse.fulfillment.view"],
        section: "warehouse",
    },
    {
        id: "warehouseSupplierOrders",
        label: "Đơn NCC tại kho",
        to: routes.adminWarehouseSupplierOrders,
        icon: "local_shipping",
        permissions: ["admin.warehouse.supplier_orders.view"],
        section: "warehouse",
    },
    {
        id: "warehouseHelp",
        label: "Hỗ trợ kho",
        to: routes.adminWarehouseHelp,
        icon: "help",
        permissions: ["admin.warehouse.help.view"],
        section: "warehouse",
    },
];

export function isSuperAdmin(user: AuthUser | null | undefined) {
    return user?.role === "admin" && user.adminRole?.isSuper === true;
}

export function canAccessAdminModule(
    user: AuthUser | null | undefined,
    module: AdminModule,
) {
    if (!user || user.role !== "admin") return false;
    if (module.superOnly) return isSuperAdmin(user);

    return hasAnyAdminPermission(user, module.permissions);
}

export function getAdminModule(moduleId: AdminModuleId) {
    return adminModules.find((module) => module.id === moduleId);
}

export function getFirstAccessibleAdminModule(user: AuthUser | null | undefined) {
    return adminModules.find((module) => canAccessAdminModule(user, module)) ?? null;
}
