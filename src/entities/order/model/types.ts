export type PaymentStatus = "pending" | "paid" | "cod" | "refunded";
export type DeliveryStatus =
    | "processing"
    | "ready_to_ship"
    | "in_transit"
    | "delivered"
    | "disputed";
export type ShippingTier = "standard" | "express" | "priority";

export interface StatusEvent {
    id: string;
    actor: string;
    label: string;
    createdAt: string;
}

export interface OrderLineItem {
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
}

export interface TrackingEvent {
    id: string;
    orderId: string;
    label: string;
    timestamp: string;
    completed: boolean;
}

export interface ComplaintDraft {
    orderId: string;
    reason: string;
    message: string;
}

export interface ComplaintRecord extends ComplaintDraft {
    id: string;
    createdAt: string;
    status: "open" | "resolved";
    orderSnapshotTotal: number;
    previousDeliveryStatus: DeliveryStatus;
    resolutionNote?: string;
}

export interface Order {
    id: string;
    customerName: string;
    customerId?: string;
    supplierName: string;
    supplierId?: string;
    date: string;
    total: number;
    paymentStatus: PaymentStatus;
    deliveryStatus: DeliveryStatus;
    shippingTier: ShippingTier;
    address: string;
    note?: string;
    items: OrderLineItem[];
    timeline: TrackingEvent[];
    statusHistory?: StatusEvent[];
    complaintIds?: string[];
    assignedWarehouseZone?: string;
}
