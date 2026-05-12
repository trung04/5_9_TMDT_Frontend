import type { Product, ProductStockStatus } from "@/entities/product/model/types";
import type {
    AccountComplaint,
    AccountNotification,
    AuthSession,
    AuthUser,
    RewardRedemption,
    RewardSnapshot,
    UserAddress,
    UserProfile,
    UserRole,
} from "@/entities/user/model/types";
import type {
    BackendAccountProfile,
    BackendCart,
    BackendCartItem,
    BackendCategory,
    BackendComplaint,
    BackendNotification,
    BackendOrderDetail,
    BackendOrderItem,
    BackendOrderStatusHistory,
    BackendOrderSummary,
    BackendPayment,
    BackendProduct,
    BackendSupplier,
    BackendUser,
} from "@/shared/api/backend-types";
import { products as seedProducts } from "@/shared/api/mock-data";

export interface StorefrontSupplierOption {
    id: string;
    name: string;
    description: string;
}

export interface CustomerCartItemView {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: Product;
}

export interface CustomerCartView {
    id: string;
    status: string;
    itemCount: number;
    totalQuantity: number;
    subtotal: number;
    items: CustomerCartItemView[];
}

export interface CustomerPaymentView {
    id: string;
    transactionCode: string | null;
    paymentMethod: string;
    paymentStatus: string;
    amount: number;
    gatewayName: string | null;
    gatewayReference: string | null;
    paidAt: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerOrderSummaryView {
    id: string;
    orderNo: string;
    paymentMethod: string;
    status: string;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    totalAmount: number;
    itemCount: number;
    payment: CustomerPaymentView | null;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerOrderItemView {
    id: string;
    productId: string;
    productNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface CustomerOrderStatusHistoryView {
    id: string;
    changedByUserId: number | null;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    changedAt: string;
}

export interface CustomerOrderDetailView extends CustomerOrderSummaryView {
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    note: string;
    items: CustomerOrderItemView[];
    statusHistory: CustomerOrderStatusHistoryView[];
}

const fallbackImages = seedProducts.slice(0, 6).map((product) => product.image);

function fallbackProduct(index: number) {
    return seedProducts[index % seedProducts.length] ?? seedProducts[0];
}

export function slugify(input: string) {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function buildStorefrontSlug(productId: string | number, name: string) {
    return `${slugify(name)}-${productId}`;
}

function numberValue(value: number | string | null | undefined) {
    return Number(value ?? 0);
}

function stockStatusForProduct(product: BackendProduct): ProductStockStatus {
    if (!product.is_active || product.stock_quantity <= 0) return "preorder";
    if (product.stock_quantity <= 5) return "low-stock";
    return "in-stock";
}

export function normalizeUserRole(role: string): UserRole | null {
    const normalized = role.trim().toUpperCase();

    if (normalized === "CUSTOMER") return "customer";
    if (normalized === "ADMIN") return "admin";
    if (normalized === "SUPPLIER") return "supplier";
    if (normalized === "WAREHOUSE" || normalized === "WAREHOUSE_STAFF") return "warehouse";

    return null;
}

export function adaptBackendUserToAuthUser(user: BackendUser): AuthUser | null {
    const role = normalizeUserRole(user.role);

    if (!role) return null;

    return {
        id: String(user.id),
        name: user.full_name,
        email: user.email,
        role,
    };
}

export function adaptBackendUserToSession(user: BackendUser): AuthSession | null {
    const authUser = adaptBackendUserToAuthUser(user);

    if (!authUser) return null;

    return {
        user: authUser,
        loggedInAt: new Date().toISOString(),
    };
}

export function adaptBackendCategory(category: BackendCategory) {
    return {
        id: String(category.id),
        name: category.name,
        description: category.description,
    };
}

export function adaptBackendUserAddress(address: BackendAccountProfile["addresses"][number]): UserAddress {
    return {
        id: String(address.id),
        label: address.label,
        recipient: address.recipient,
        phone: address.phone,
        line1: address.line1,
        city: address.city,
        note: address.note ?? "",
        isDefault: address.is_default,
    };
}

export function adaptBackendRewardSnapshot(snapshot: BackendAccountProfile["reward_snapshot"]): RewardSnapshot {
    return {
        tier: snapshot.tier,
        points: snapshot.points,
        nextTierPoints: snapshot.next_tier_points,
        perks: snapshot.perks,
    };
}

export function adaptBackendRewardRedemption(
    item: BackendAccountProfile["reward_history"][number],
): RewardRedemption {
    return {
        id: String(item.id),
        title: item.title,
        pointsUsed: item.points_used,
        createdAt: item.created_at,
        status: item.status,
    };
}

export function adaptBackendAccountProfile(profile: BackendAccountProfile): UserProfile {
    return {
        id: String(profile.id),
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address ?? "",
        city: profile.city ?? "",
        favoriteRegion: profile.favorite_region ?? "",
        avatar: profile.avatar ?? "",
        memberSince: profile.member_since,
        newsletter: profile.newsletter,
        smsAlerts: profile.sms_alerts,
        orderEmail: profile.order_email,
        securityAlerts: profile.security_alerts,
        addresses: profile.addresses.map(adaptBackendUserAddress),
        rewardHistory: profile.reward_history.map(adaptBackendRewardRedemption),
    };
}

export function adaptBackendNotification(notification: BackendNotification): AccountNotification {
    return {
        id: String(notification.id),
        title: notification.title,
        message: notification.message,
        channel: notification.channel,
        status: notification.status,
        sentAt: notification.sent_at ?? "",
        readAt: notification.read_at ?? "",
        createdAt: notification.created_at ?? "",
    };
}

export function adaptBackendComplaint(complaint: BackendComplaint): AccountComplaint {
    return {
        id: String(complaint.id),
        reason: complaint.reason,
        content: complaint.content,
        imageUrl: complaint.image_url ?? "",
        status: complaint.status,
        resolutionNote: complaint.resolution_note ?? "",
        createdAt: complaint.created_at,
        orderId: complaint.order ? String(complaint.order.id) : "",
        orderNo: complaint.order?.order_no ?? "",
        orderStatus: complaint.order?.status ?? "",
        orderTotalAmount: numberValue(complaint.order?.total_amount ?? 0),
        productId: complaint.product ? String(complaint.product.id) : "",
        productName: complaint.product?.name ?? "",
        productSku: complaint.product?.sku ?? "",
        resolverName: complaint.resolver?.full_name ?? "",
    };
}

export function adaptBackendSupplierOption(supplier: BackendSupplier): StorefrontSupplierOption {
    return {
        id: String(supplier.id),
        name: supplier.name,
        description: supplier.address ?? supplier.contact_name ?? supplier.email ?? "Nhà cung cấp đối tác",
    };
}

export function adaptBackendProduct(product: BackendProduct, index = 0): Product {
    const fallback = fallbackProduct(index);
    const supplierName = product.supplier?.name ?? `Nhà cung cấp #${product.supplier_id}`;
    const categoryName = product.category?.name ?? `Danh mục #${product.category_id}`;
    const image = fallbackImages[index % fallbackImages.length] ?? fallback.image;

    return {
        id: String(product.id),
        slug: buildStorefrontSlug(product.id, product.name),
        name: product.name,
        detailTitle: product.name,
        subtitle: `${categoryName} · ${supplierName}`,
        categoryId: String(product.category_id),
        categoryName,
        regionId: String(product.supplier_id),
        regionName: supplierName,
        description: product.description,
        shortDescription: product.description,
        price: numberValue(product.sale_price),
        originalPrice: undefined,
        rating: fallback.rating,
        reviewCount: fallback.reviewCount,
        stockStatus: stockStatusForProduct(product),
        badge: fallback.badge ?? categoryName,
        tag: product.sku,
        image,
        gallery: [
            {
                src: image,
                alt: product.name,
            },
            {
                src: fallback.gallery[0]?.src ?? image,
                alt: fallback.gallery[0]?.alt ?? product.name,
            },
        ],
        origin: supplierName,
        weight: "Theo cấu hình nhà bán",
        shelfLife:
            product.stock_quantity > 0 ? `Tồn kho ${product.stock_quantity} sản phẩm` : "Tạm hết hàng",
        certifications: [categoryName, product.sku],
        shippingNotice: {
            title: product.stock_quantity > 0 ? "Sẵn sàng giao hàng" : "Cần xác nhận tồn kho",
            description:
                product.stock_quantity > 0
                    ? "Sản phẩm đang có sẵn trên hệ thống và có thể thêm vào giỏ hàng ngay."
                    : "Vui lòng theo dõi cập nhật tồn kho trên storefront.",
        },
        sourcing: {
            title: "Thông tin sản phẩm",
            body: product.description,
            certificationCards: [
                {
                    icon: "inventory_2",
                    title: "Mã SKU",
                    description: product.sku,
                },
                {
                    icon: "storefront",
                    title: "Nhà cung cấp",
                    description: supplierName,
                },
            ],
        },
        heritageCommitments: [
            {
                icon: "verified",
                text: `Danh mục: ${categoryName}`,
            },
            {
                icon: "local_shipping",
                text: product.stock_quantity > 0 ? "Sản phẩm có sẵn - Đặt hàng ngay." : "Tồn kho sẽ được cập nhật sau.",
            },
            {
                icon: "sell",
                text: `Giá hiện tại ${numberValue(product.sale_price).toLocaleString("vi-VN")} VND`,
            },
        ],
    };
}

export function adaptBackendCartItem(item: BackendCartItem, index = 0): CustomerCartItemView {
    return {
        id: String(item.id),
        productId: String(item.product_id),
        quantity: item.quantity,
        unitPrice: numberValue(item.unit_price),
        lineTotal: numberValue(item.line_total),
        product: adaptBackendProduct(item.product, index),
    };
}

export function adaptBackendCart(cart: BackendCart): CustomerCartView {
    return {
        id: String(cart.id),
        status: cart.status,
        itemCount: cart.item_count,
        totalQuantity: cart.total_quantity,
        subtotal: numberValue(cart.subtotal),
        items: cart.items.map((item, index) => adaptBackendCartItem(item, index)),
    };
}

function adaptPayment(payment: BackendPayment): CustomerPaymentView {
    return {
        id: String(payment.id),
        transactionCode: payment.transaction_code,
        paymentMethod: payment.payment_method,
        paymentStatus: payment.payment_status,
        amount: numberValue(payment.amount),
        gatewayName: payment.gateway_name,
        gatewayReference: payment.gateway_reference,
        paidAt: payment.paid_at,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
    };
}

export function adaptBackendOrderSummary(order: BackendOrderSummary): CustomerOrderSummaryView {
    return {
        id: String(order.id),
        orderNo: order.order_no,
        paymentMethod: order.payment_method,
        status: order.status,
        subtotal: numberValue(order.subtotal),
        shippingFee: numberValue(order.shipping_fee),
        discountAmount: numberValue(order.discount_amount),
        totalAmount: numberValue(order.total_amount),
        itemCount: order.item_count,
        payment: order.payment ? adaptPayment(order.payment) : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
    };
}

function adaptOrderItem(item: BackendOrderItem): CustomerOrderItemView {
    return {
        id: String(item.id),
        productId: String(item.product_id),
        productNameSnapshot: item.product_name_snapshot,
        quantity: item.quantity,
        unitPrice: numberValue(item.unit_price),
        lineTotal: numberValue(item.line_total),
    };
}

function adaptStatusHistory(history: BackendOrderStatusHistory): CustomerOrderStatusHistoryView {
    return {
        id: String(history.id),
        changedByUserId: history.changed_by_user_id,
        fromStatus: history.from_status,
        toStatus: history.to_status,
        note: history.note,
        changedAt: history.changed_at,
    };
}

export function adaptBackendOrderDetail(order: BackendOrderDetail): CustomerOrderDetailView {
    const summary = adaptBackendOrderSummary(order);

    return {
        ...summary,
        recipientName: order.recipient_name,
        recipientPhone: order.recipient_phone,
        shippingAddress: order.shipping_address,
        note: order.note ?? "",
        items: order.items.map(adaptOrderItem),
        statusHistory: order.status_history.map(adaptStatusHistory),
    };
}
