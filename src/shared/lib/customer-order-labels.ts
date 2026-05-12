export const customerOrderStatusLabels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PACKED: "Đã đóng gói",
    SHIPPED: "Đang giao",
    DELIVERED: "Đã giao",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
};

export const customerPaymentStatusLabels: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    SUCCESS: "Thanh toán thành công",
    FAILED: "Thanh toán thất bại",
    REFUNDED: "Đã hoàn tiền",
    CANCELLED: "Đã hủy",
};

export const customerPaymentMethodLabels: Record<string, string> = {
    COD: "Thanh toán khi nhận hàng",
    CREDIT_CARD: "Thẻ ngân hàng",
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    E_WALLET: "Ví điện tử",
};

export function fallbackBackendLabel(value: string) {
    return value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
}
