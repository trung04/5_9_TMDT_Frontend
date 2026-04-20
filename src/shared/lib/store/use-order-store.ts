import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
    Order,
    ComplaintDraft,
    ComplaintRecord,
    ShippingTier,
} from "@/entities/order/model/types";
import type { CartItem } from "@/entities/product/model/types";
import { inventoryItems, orders as seedOrders, products, suppliers } from "@/shared/api/mock-data";

type CheckoutPaymentMethod = "cod" | "card" | "banking";

interface PlaceOrderInput {
    customerName: string;
    address: string;
    note?: string;
    items: CartItem[];
    total: number;
    shippingTier: ShippingTier;
    paymentMethod: CheckoutPaymentMethod;
}

interface OrderState {
    orders: Order[];
    complaints: ComplaintRecord[];
    nextOrderSequence: number;
    nextComplaintSequence: number;
    placeOrder: (input: PlaceOrderInput) => Order;
    updateDeliveryStatus: (
        orderId: string,
        nextStatus: Order["deliveryStatus"],
        actor: string,
    ) => void;
    submitComplaint: (draft: ComplaintDraft) => ComplaintRecord | null;
    resolveComplaint: (complaintId: string, resolutionNote: string) => void;
    reset: () => void;
}

const initialSequence = 22050;

function resolveSupplier(items: CartItem[]) {
    const supplierIds = new Set(
        items
            .map(
                (item) =>
                    inventoryItems.find(
                        (inventoryItem) => inventoryItem.productId === item.productId,
                    )?.supplierId,
            )
            .filter((supplierId): supplierId is string => Boolean(supplierId)),
    );

    const supplierName = [...supplierIds]
        .map((supplierId) => suppliers.find((supplier) => supplier.id === supplierId))
        .find(Boolean);

    return supplierName;
}

function createTimeline(orderId: string, paymentMethod: CheckoutPaymentMethod) {
    const now = new Date().toISOString();

    return [
        {
            id: `${orderId}-timeline-1`,
            orderId,
            label: "Đơn hàng đã được tạo",
            timestamp: now,
            completed: true,
        },
        {
            id: `${orderId}-timeline-2`,
            orderId,
            label:
                paymentMethod === "cod"
                    ? "Chờ xác nhận thanh toán khi nhận hàng"
                    : "Thanh toán đã được xác nhận",
            timestamp: now,
            completed: paymentMethod !== "cod",
        },
        {
            id: `${orderId}-timeline-3`,
            orderId,
            label: "Đang chuẩn bị bàn giao cho kho",
            timestamp: now,
            completed: false,
        },
    ];
}

function normalizeSeedOrders(): Order[] {
    return seedOrders.map((order) => ({
        ...order,
        complaintIds: order.complaintIds ?? [],
        statusHistory: order.statusHistory ?? [
            {
                id: `${order.id}-seed-status`,
                actor: "seed",
                label: `Khởi tạo trạng thái ${order.deliveryStatus}`,
                createdAt: order.date,
            },
        ],
    }));
}

const initialState = {
    orders: normalizeSeedOrders(),
    complaints: [] as ComplaintRecord[],
    nextOrderSequence: initialSequence,
    nextComplaintSequence: 1,
};

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            ...initialState,
            placeOrder: (input) => {
                let createdOrder: Order | undefined;

                set((state) => {
                    const orderId = `HH-${state.nextOrderSequence}`;
                    const supplier = resolveSupplier(input.items);
                    const orderDate = new Date().toISOString();

                    createdOrder = {
                        id: orderId,
                        customerName: input.customerName,
                        customerId: "demo-customer",
                        supplierName: supplier?.name ?? "Trung tâm điều phối Heritage Harvest",
                        supplierId: supplier?.id,
                        date: orderDate,
                        total: input.total,
                        paymentStatus: input.paymentMethod === "cod" ? "cod" : "paid",
                        deliveryStatus: "processing",
                        shippingTier: input.shippingTier,
                        address: input.address,
                        note: input.note,
                        items: input.items.map((item) => {
                            const product = products.find(
                                (productItem) => productItem.id === item.productId,
                            );

                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: product?.price ?? 0,
                            };
                        }),
                        timeline: createTimeline(orderId, input.paymentMethod),
                        statusHistory: [
                            {
                                id: `${orderId}-status-created`,
                                actor: "customer",
                                label: "Khởi tạo đơn hàng mới",
                                createdAt: orderDate,
                            },
                        ],
                        complaintIds: [],
                        assignedWarehouseZone:
                            input.shippingTier === "priority" ? "Khu C" : "Khu B",
                    };

                    return {
                        orders: [createdOrder, ...state.orders],
                        nextOrderSequence: state.nextOrderSequence + 1,
                    };
                });

                return createdOrder as Order;
            },
            updateDeliveryStatus: (orderId, nextStatus, actor) =>
                set((state) => ({
                    orders: state.orders.map((order) =>
                        order.id === orderId
                            ? {
                                  ...order,
                                  deliveryStatus: nextStatus,
                                  statusHistory: [
                                      ...(order.statusHistory ?? []),
                                      {
                                          id: `${orderId}-${nextStatus}-${Date.now()}`,
                                          actor,
                                          label: `Cập nhật trạng thái sang ${nextStatus}`,
                                          createdAt: new Date().toISOString(),
                                      },
                                  ],
                              }
                            : order,
                    ),
                })),
            submitComplaint: (draft) => {
                const order = get().orders.find((current) => current.id === draft.orderId);

                if (!order) return null;

                const complaint: ComplaintRecord = {
                    id: `CMP-${get().nextComplaintSequence}`,
                    orderId: draft.orderId,
                    reason: draft.reason.trim(),
                    message: draft.message.trim(),
                    createdAt: new Date().toISOString(),
                    status: "open",
                    orderSnapshotTotal: order.total,
                    previousDeliveryStatus: order.deliveryStatus,
                };

                set((state) => ({
                    complaints: [complaint, ...state.complaints],
                    nextComplaintSequence: state.nextComplaintSequence + 1,
                    orders: state.orders.map((currentOrder) =>
                        currentOrder.id === draft.orderId
                            ? {
                                  ...currentOrder,
                                  deliveryStatus: "disputed",
                                  complaintIds: [
                                      ...(currentOrder.complaintIds ?? []),
                                      complaint.id,
                                  ],
                                  statusHistory: [
                                      ...(currentOrder.statusHistory ?? []),
                                      {
                                          id: `${currentOrder.id}-complaint-${Date.now()}`,
                                          actor: "customer",
                                          label: "Khách hàng đã gửi khiếu nại",
                                          createdAt: complaint.createdAt,
                                      },
                                  ],
                              }
                            : currentOrder,
                    ),
                }));

                return complaint;
            },
            resolveComplaint: (complaintId, resolutionNote) => {
                const complaint = get().complaints.find((current) => current.id === complaintId);

                if (!complaint) return;

                set((state) => ({
                    complaints: state.complaints.map((current) =>
                        current.id === complaintId
                            ? {
                                  ...current,
                                  status: "resolved",
                                  resolutionNote: resolutionNote.trim(),
                              }
                            : current,
                    ),
                    orders: state.orders.map((order) =>
                        order.id === complaint.orderId
                            ? {
                                  ...order,
                                  deliveryStatus: complaint.previousDeliveryStatus,
                                  statusHistory: [
                                      ...(order.statusHistory ?? []),
                                      {
                                          id: `${order.id}-resolved-${Date.now()}`,
                                          actor: "admin",
                                          label: "Khiếu nại đã được xử lý",
                                          createdAt: new Date().toISOString(),
                                      },
                                  ],
                              }
                            : order,
                    ),
                }));
            },
            reset: () => set(initialState),
        }),
        {
            name: "heritage-order-store",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
