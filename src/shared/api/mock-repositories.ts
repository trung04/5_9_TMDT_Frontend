import type { MetricCardData } from "@/shared/types/ui";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useCatalogStore } from "@/shared/lib/store/use-catalog-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { useOrderStore } from "@/shared/lib/store/use-order-store";

function getOrders() {
    return [...useOrderStore.getState().orders].sort(
        (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
    );
}

function getMetrics(): MetricCardData[] {
    const orders = getOrders();
    const customers = useOperationsStore.getState().customers;
    const products = useCatalogStore.getState().products;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    return [
        {
            id: "metric-sales",
            label: "Doanh thu toàn hệ",
            value: `${Math.round(totalRevenue / 1000).toLocaleString("vi-VN")}k VND`,
            delta: `${orders.filter((order) => order.deliveryStatus === "delivered").length} đơn đã giao`,
            tone: "primary",
            icon: "payments",
            helperText: "tính trên toàn bộ đơn đang có trong hệ thống demo",
        },
        {
            id: "metric-orders",
            label: "Tổng đơn hàng",
            value: `${orders.length}`,
            delta: `${orders.filter((order) => order.deliveryStatus === "processing").length} đơn đang xử lý`,
            tone: "secondary",
            icon: "shopping_bag",
            helperText: "bao gồm đơn seed và đơn phát sinh khi thao tác",
        },
        {
            id: "metric-users",
            label: "Người dùng hoạt động",
            value: `${customers.length}`,
            delta: `${products.length} sản phẩm đang hoạt động`,
            tone: "tertiary",
            icon: "person_celebrate",
            helperText: "dữ liệu khách hàng và danh mục đang được đồng bộ runtime",
        },
        {
            id: "metric-aov",
            label: "Giá trị đơn trung bình",
            value: `${Math.round(averageOrderValue / 1000).toLocaleString("vi-VN")}k VND`,
            delta: `${useOrderStore.getState().complaints.length} khiếu nại đang mở`,
            tone: "success",
            icon: "sell",
            helperText: "AOV được tính lại theo trạng thái dữ liệu hiện tại",
        },
    ];
}

export const catalogRepository = {
    listProducts: () => useCatalogStore.getState().products,
    listCategories: () => useCatalogStore.getState().categories,
    listRegions: () => useCatalogStore.getState().regions,
    listReviews: () => useCatalogStore.getState().reviews,
    getCategoryById: (categoryId: string) =>
        useCatalogStore.getState().categories.find((category) => category.id === categoryId),
    getProductById: (productId: string) =>
        useCatalogStore.getState().products.find((item) => item.id === productId),
    getProductBySlug: (slug: string) =>
        useCatalogStore.getState().products.find((item) => item.slug === slug),
    getProductsByCategory: (categoryId: string) =>
        useCatalogStore.getState().products.filter((product) => product.categoryId === categoryId),
    getRegionById: (regionId: string) =>
        useCatalogStore.getState().regions.find((region) => region.id === regionId),
    getProductsByRegion: (regionId: string) =>
        useCatalogStore.getState().products.filter((product) => product.regionId === regionId),
    getRelatedProducts: (productId: string) =>
        useCatalogStore
            .getState()
            .products.filter((product) => product.id !== productId)
            .slice(0, 3),
    getReviewsByProductId: (productId: string) =>
        useCatalogStore.getState().reviews.filter((review) => review.productId === productId),
    listNewsletterSubscriptions: () => useCatalogStore.getState().newsletterSubscriptions,
};

export const accountRepository = {
    getProfile: () => useAccountStore.getState().profile,
    getRewardSnapshot: () => useAccountStore.getState().rewardSnapshot,
    listOrders: () =>
        getOrders().filter(
            (order) => order.customerName === useAccountStore.getState().profile.name,
        ),
    getOrderById: (orderId: string) => getOrders().find((order) => order.id === orderId),
    listComplaints: () =>
        useOrderStore
            .getState()
            .complaints.filter((complaint) =>
                accountRepository.listOrders().some((order) => order.id === complaint.orderId),
            ),
};

export const adminRepository = {
    getMetrics,
    listCustomers: () => useOperationsStore.getState().customers,
    listSuppliers: () => useOperationsStore.getState().suppliers,
    listOrders: () => getOrders(),
    listProducts: () => useCatalogStore.getState().products,
    listComplaints: () => useOrderStore.getState().complaints,
    listInvitations: () => useOperationsStore.getState().supplierInvitations,
};

export const operationsRepository = {
    listInventory: () => useOperationsStore.getState().inventory,
    listRequisitions: () => useOperationsStore.getState().requisitions,
    listFulfillmentTasks: () => useOperationsStore.getState().fulfillmentTasks,
    listSupplierOrders: () => getOrders().filter((order) => order.supplierName.length > 0),
    listSupportTickets: () => useOperationsStore.getState().supportTickets,
    listSupplierInvitations: () => useOperationsStore.getState().supplierInvitations,
    getSupplierById: (supplierId: string) =>
        useOperationsStore.getState().suppliers.find((supplier) => supplier.id === supplierId),
};
