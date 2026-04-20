import type {
    ExtendedRequisitionStatus,
    FulfillmentStatus,
    InventoryHealth,
} from "@/entities/inventory/model/types";
import type { DeliveryStatus, PaymentStatus, ShippingTier } from "@/entities/order/model/types";
import type { ProductStockStatus } from "@/entities/product/model/types";
import type { CustomerRecord, SupplierPartner } from "@/entities/user/model/types";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    cod: "Thanh toán khi nhận hàng",
    refunded: "Đã hoàn tiền",
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
    processing: "Đang xử lý",
    ready_to_ship: "Sẵn sàng giao",
    in_transit: "Đang vận chuyển",
    delivered: "Đã giao",
    disputed: "Có khiếu nại",
};

export const shippingTierLabels: Record<ShippingTier, string> = {
    standard: "Tiêu chuẩn",
    express: "Nhanh",
    priority: "Ưu tiên",
};

export const stockStatusLabels: Record<ProductStockStatus, string> = {
    "in-stock": "Còn hàng",
    "low-stock": "Sắp hết",
    preorder: "Đặt trước",
};

export const inventoryHealthLabels: Record<InventoryHealth, string> = {
    healthy: "Ổn định",
    low: "Cảnh báo",
    critical: "Khẩn cấp",
};

export const requisitionStatusLabels: Record<ExtendedRequisitionStatus, string> = {
    draft: "Nháp",
    submitted: "Đã gửi",
    approved: "Đã duyệt",
    received: "Đã nhận",
    cancelled: "Đã hủy",
};

export const fulfillmentStatusLabels: Record<FulfillmentStatus, string> = {
    picking: "Đang lấy hàng",
    packing: "Đang đóng gói",
    awaiting_pickup: "Chờ đơn vị vận chuyển",
    shipped: "Đã gửi hàng",
};

export const customerStatusLabels: Record<CustomerRecord["status"], string> = {
    loyal: "Thân thiết",
    new: "Mới",
    "at-risk": "Cần chăm sóc",
};

export const supplierStatusLabels: Record<SupplierPartner["status"], string> = {
    active: "Đang hợp tác",
    reviewing: "Đang đánh giá",
};
