import { create } from "zustand";

import type {
    FulfillmentTask,
    InventoryItem,
    PurchaseRequisition,
} from "@/entities/inventory/model/types";
import type { Order } from "@/entities/order/model/types";
import type { SupportTicket, SupplierPartner } from "@/entities/user/model/types";
import type {
    BackendOperationFulfillmentTask,
    BackendOperationFulfillmentTaskResponse,
    BackendOperationFulfillmentTasksResponse,
    BackendOperationInventoryItem,
    BackendOperationInventoryResponse,
    BackendOperationOrder,
    BackendOperationOrderResponse,
    BackendOperationOrdersResponse,
    BackendOperationRequisition,
    BackendOperationRequisitionResponse,
    BackendOperationRequisitionsResponse,
    BackendSupportTicket,
    BackendSupportTicketResponse,
    BackendSupportTicketsResponse,
} from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

interface CreateRequisitionInput {
    productId: string;
    requestedQty: number;
    note?: string;
}

interface CreateSupportTicketInput {
    subject: string;
    message: string;
    channel: "supplier" | "warehouse";
}

interface OperationsDataState {
    inventory: InventoryItem[];
    requisitions: PurchaseRequisition[];
    supplierOrders: Order[];
    fulfillmentTasks: FulfillmentTask[];
    supportTickets: SupportTicket[];
    suppliers: SupplierPartner[];
    productsById: Record<string, { id: string; sku: string; name: string }>;
    status: "idle" | "loading" | "ready" | "error";
    error: string | null;
    loadOperations: (force?: boolean) => Promise<AsyncResult>;
    createRequisition: (input: CreateRequisitionInput) => Promise<AsyncResult<PurchaseRequisition>>;
    updateRequisitionStatus: (
        requisitionId: string,
        status: "approved" | "received" | "cancelled",
    ) => Promise<AsyncResult<PurchaseRequisition>>;
    updateOrderDeliveryStatus: (
        orderId: string,
        deliveryStatus: Order["deliveryStatus"],
        note?: string,
    ) => Promise<AsyncResult<Order>>;
    advanceFulfillmentTask: (taskId: string, note?: string) => Promise<AsyncResult<FulfillmentTask>>;
    createSupportTicket: (input: CreateSupportTicketInput) => Promise<AsyncResult<SupportTicket>>;
    resolveSupportTicket: (ticketId: string) => Promise<AsyncResult<SupportTicket>>;
    reset: () => void;
}

const initialState = {
    inventory: [] as InventoryItem[],
    requisitions: [] as PurchaseRequisition[],
    supplierOrders: [] as Order[],
    fulfillmentTasks: [] as FulfillmentTask[],
    supportTickets: [] as SupportTicket[],
    suppliers: [] as SupplierPartner[],
    productsById: {} as Record<string, { id: string; sku: string; name: string }>,
    status: "idle" as const,
    error: null as string | null,
};

function token() {
    const state = useAuthStore.getState();

    if (state.authSource !== "backend") {
        return null;
    }

    return state.accessToken;
}

function authError() {
    return "Can dang nhap bang tai khoan tu database de xem du lieu van hanh.";
}

function handleError(error: unknown) {
    if (isUnauthorizedApiError(error)) {
        useAuthStore.getState().clearSession();
    }

    return error instanceof Error ? error.message : "Khong the tai du lieu van hanh.";
}

function adaptInventoryItem(item: BackendOperationInventoryItem): InventoryItem {
    return {
        sku: item.sku,
        productId: String(item.product_id),
        productName: item.product_name,
        supplierId: item.supplier_id ? String(item.supplier_id) : "",
        supplierName: item.supplier_name ?? undefined,
        onHand: item.quantity_on_hand,
        reserved: item.reserved,
        reorderPoint: item.reorder_level,
        purchasePrice: item.purchase_price,
        aisle: item.aisle,
        status: item.status,
    };
}

function adaptRequisition(item: BackendOperationRequisition): PurchaseRequisition {
    return {
        id: item.id,
        inventorySku: item.inventory_sku,
        productId: item.product_id ? String(item.product_id) : undefined,
        productName: item.product_name ?? undefined,
        supplierId: item.supplier_id ? String(item.supplier_id) : "",
        supplierName: item.supplier_name ?? undefined,
        requestedQty: item.requested_qty,
        approvedQty: item.approved_qty ?? undefined,
        etaDays: item.eta_days,
        status: item.status,
        note: item.note ?? undefined,
        statusHistory: [
            {
                id: `${item.id}-created`,
                actor: "System",
                label: item.status,
                createdAt: item.created_at ?? new Date().toISOString(),
            },
        ],
    };
}

function adaptOperationOrder(item: BackendOperationOrder): Order {
    return {
        id: item.id,
        customerName: item.customer_name,
        customerId: item.customer_id ?? undefined,
        supplierName: item.supplier_name,
        supplierId: item.supplier_id ?? undefined,
        date: item.date ?? new Date().toISOString(),
        total: item.total,
        paymentStatus: item.payment_status,
        deliveryStatus: item.delivery_status,
        shippingTier: item.shipping_tier,
        address: item.address,
        note: item.note ?? undefined,
        items: item.items.map((line) => ({
            productId: line.product_id,
            productName: line.product_name,
            quantity: line.quantity,
            unitPrice: line.unit_price,
        })),
        timeline: item.timeline.map((event) => ({
            id: event.id,
            orderId: event.order_id,
            label: event.label,
            timestamp: event.timestamp ?? new Date().toISOString(),
            completed: event.completed,
        })),
        statusHistory: item.status_history.map((event) => ({
            id: event.id,
            actor: event.actor,
            label: event.label,
            createdAt: event.created_at ?? new Date().toISOString(),
        })),
        assignedWarehouseZone: item.assigned_warehouse_zone,
    };
}

function adaptFulfillmentTask(item: BackendOperationFulfillmentTask): FulfillmentTask {
    return {
        id: item.id,
        orderId: item.order_id,
        customerName: item.customer_name,
        shippingTier: item.shipping_tier,
        status: item.status,
        priority: item.priority,
        assignedZone: item.assigned_zone,
        etaLabel: item.eta_label,
        notes: item.notes ?? undefined,
        statusHistory: item.status_history.map((event) => ({
            id: event.id,
            actor: event.actor,
            label: event.label,
            createdAt: event.created_at ?? new Date().toISOString(),
        })),
    };
}

function adaptTicket(item: BackendSupportTicket): SupportTicket {
    return {
        id: String(item.id),
        subject: item.subject,
        message: item.message,
        channel: item.channel,
        status: item.status,
        createdAt: item.created_at ?? new Date().toISOString(),
    };
}

function buildSuppliers(inventory: BackendOperationInventoryItem[]): SupplierPartner[] {
    return [
        ...new Map(
            inventory
                .filter((item) => item.supplier_id && item.supplier_name)
                .map((item) => [
                    String(item.supplier_id),
                    {
                        id: String(item.supplier_id),
                        name: item.supplier_name ?? "",
                        location: item.supplier_location ?? item.inventory_location ?? "",
                        contactName: "",
                        categories: [],
                        partnerTier: "Verified",
                        monthlyRevenue: 0,
                        responseTime: "2-3 ngay",
                        status: "active" as const,
                        image: "",
                    },
                ]),
        ).values(),
    ];
}

function buildProductsById(inventory: BackendOperationInventoryItem[]) {
    return inventory.reduce<Record<string, { id: string; sku: string; name: string }>>((accumulator, item) => {
        accumulator[String(item.product_id)] = {
            id: String(item.product_id),
            sku: item.sku,
            name: item.product_name,
        };

        return accumulator;
    }, {});
}

export const useOperationsDataStore = create<OperationsDataState>()((set, get) => ({
    ...initialState,
    loadOperations: async (force = false) => {
        if (!force && ["loading", "ready"].includes(get().status)) {
            return { success: true };
        }

        const currentToken = token();

        if (!currentToken) {
            set({ status: "error", error: authError() });
            return { success: false, error: authError() };
        }

        set({ status: "loading", error: null });

        try {
            const [inventoryResponse, requisitionsResponse, ordersResponse, tasksResponse, ticketsResponse] =
                await Promise.all([
                    apiRequest<BackendOperationInventoryResponse>("/operations/inventory", { token: currentToken }),
                    apiRequest<BackendOperationRequisitionsResponse>("/operations/requisitions", { token: currentToken }),
                    apiRequest<BackendOperationOrdersResponse>("/operations/supplier-orders", { token: currentToken }),
                    apiRequest<BackendOperationFulfillmentTasksResponse>("/operations/fulfillment-tasks", { token: currentToken }),
                    apiRequest<BackendSupportTicketsResponse>("/support-tickets", { token: currentToken }),
                ]);

            set({
                inventory: inventoryResponse.data.map(adaptInventoryItem),
                requisitions: requisitionsResponse.data.map(adaptRequisition),
                supplierOrders: ordersResponse.data.map(adaptOperationOrder),
                fulfillmentTasks: tasksResponse.data.map(adaptFulfillmentTask),
                supportTickets: ticketsResponse.data.map(adaptTicket),
                suppliers: buildSuppliers(inventoryResponse.data),
                productsById: buildProductsById(inventoryResponse.data),
                status: "ready",
                error: null,
            });

            return { success: true };
        } catch (error) {
            const message = handleError(error);
            set({ status: "error", error: message });
            return { success: false, error: message };
        }
    },
    createRequisition: async (input) => {
        const currentToken = token();

        if (!currentToken) return { success: false, error: authError() };

        try {
            const response = await apiRequest<BackendOperationRequisitionResponse>("/operations/requisitions", {
                method: "POST",
                token: currentToken,
                body: {
                    product_id: Number(input.productId),
                    requested_qty: input.requestedQty,
                    reason: input.note ?? null,
                },
            });
            const requisition = adaptRequisition(response.data);

            set((state) => ({
                requisitions: [requisition, ...state.requisitions],
            }));

            return { success: true, data: requisition };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
    updateRequisitionStatus: async (requisitionId, status) => {
        const currentToken = token();

        if (!currentToken) return { success: false, error: authError() };

        try {
            const response = await apiRequest<BackendOperationRequisitionResponse>(
                `/operations/requisitions/${requisitionId}/status`,
                {
                    method: "PATCH",
                    token: currentToken,
                    body: { status },
                },
            );
            const requisition = adaptRequisition(response.data);

            set((state) => ({
                requisitions: state.requisitions.map((item) =>
                    item.id === requisition.id ? requisition : item,
                ),
            }));

            return { success: true, data: requisition };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
    updateOrderDeliveryStatus: async (orderId, deliveryStatus, note) => {
        const currentToken = token();

        if (!currentToken) return { success: false, error: authError() };

        try {
            const response = await apiRequest<BackendOperationOrderResponse>(
                `/operations/orders/${orderId}/delivery-status`,
                {
                    method: "PATCH",
                    token: currentToken,
                    body: {
                        delivery_status: deliveryStatus,
                        note,
                    },
                },
            );
            const order = adaptOperationOrder(response.data);

            set((state) => ({
                supplierOrders: state.supplierOrders.map((item) => (item.id === order.id ? order : item)),
            }));

            return { success: true, data: order };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
    advanceFulfillmentTask: async (taskId, note) => {
        const currentToken = token();

        if (!currentToken) return { success: false, error: authError() };

        try {
            const response = await apiRequest<BackendOperationFulfillmentTaskResponse>(
                `/operations/fulfillment-tasks/${taskId}/advance`,
                {
                    method: "PATCH",
                    token: currentToken,
                    body: { note },
                },
            );
            const task = adaptFulfillmentTask(response.data);

            set((state) => ({
                fulfillmentTasks: state.fulfillmentTasks.map((item) => (item.id === task.id ? task : item)),
            }));

            await get().loadOperations(true);

            return { success: true, data: task };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
    createSupportTicket: async (input) => {
        const currentToken = token();

        if (!currentToken) return { success: false, error: authError() };

        try {
            const response = await apiRequest<BackendSupportTicketResponse>("/support-tickets", {
                method: "POST",
                token: currentToken,
                body: input,
            });
            const ticket = adaptTicket(response.data);

            set((state) => ({
                supportTickets: [ticket, ...state.supportTickets],
            }));

            return { success: true, data: ticket };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
    resolveSupportTicket: async (ticketId) => {
        const currentToken = token();

        if (!currentToken) return { success: false, error: authError() };

        try {
            const response = await apiRequest<BackendSupportTicketResponse>(
                `/support-tickets/${ticketId}/resolve`,
                {
                    method: "PATCH",
                    token: currentToken,
                },
            );
            const ticket = adaptTicket(response.data);

            set((state) => ({
                supportTickets: state.supportTickets.map((item) => (item.id === ticket.id ? ticket : item)),
            }));

            return { success: true, data: ticket };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
    reset: () => set(initialState),
}));
