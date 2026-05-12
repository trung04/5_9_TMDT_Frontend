export const customerOrderStatusLabels: Record<string, string> = {
    PENDING: "Cho xac nhan",
    CONFIRMED: "Da xac nhan",
    PACKED: "Da dong goi",
    SHIPPED: "Dang giao",
    DELIVERED: "Da giao",
    PAID: "Da thanh toan",
    CANCELLED: "Da huy",
};

export const customerPaymentStatusLabels: Record<string, string> = {
    PENDING: "Cho thanh toan",
    SUCCESS: "Thanh toan thanh cong",
    FAILED: "Thanh toan that bai",
    REFUNDED: "Da hoan tien",
    CANCELLED: "Da huy",
};

export const customerPaymentMethodLabels: Record<string, string> = {
    COD: "Thanh toan khi nhan hang",
    CREDIT_CARD: "The ngan hang",
    BANK_TRANSFER: "Chuyen khoan ngan hang",
    E_WALLET: "Vi dien tu",
};

export function fallbackBackendLabel(value: string) {
    return value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
}
