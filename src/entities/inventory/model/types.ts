export type InventoryHealth = "healthy" | "low" | "critical";
export type RequisitionStatus = "draft" | "submitted" | "approved";
export type ExtendedRequisitionStatus = RequisitionStatus | "received" | "cancelled";
export type FulfillmentStatus = "picking" | "packing" | "awaiting_pickup" | "shipped";

export interface InventoryStatusEvent {
    id: string;
    actor: string;
    label: string;
    createdAt: string;
}

export interface InventoryItem {
    sku: string;
    productId: string;
    productName?: string;
    supplierId: string;
    supplierName?: string;
    onHand: number;
    reserved: number;
    reorderPoint: number;
    purchasePrice: number;
    aisle: string;
    status: InventoryHealth;
}

export interface PurchaseRequisition {
    id: string;
    inventorySku: string;
    productId?: string;
    productName?: string;
    supplierId: string;
    supplierName?: string;
    requestedQty: number;
    approvedQty?: number;
    etaDays: number;
    status: ExtendedRequisitionStatus;
    note?: string;
    statusHistory?: InventoryStatusEvent[];
}

export interface FulfillmentTask {
    id: string;
    orderId: string;
    customerName: string;
    shippingTier: "standard" | "express" | "priority";
    status: FulfillmentStatus;
    priority: "standard" | "rush";
    assignedZone: string;
    etaLabel: string;
    notes?: string;
    statusHistory?: InventoryStatusEvent[];
}
