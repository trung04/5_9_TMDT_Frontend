import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
    FulfillmentStatus,
    InventoryItem,
    PurchaseRequisition,
    FulfillmentTask,
} from "@/entities/inventory/model/types";
import type { Order } from "@/entities/order/model/types";
import type {
    CustomerRecord,
    SupplierInvitation,
    SupplierPartner,
    SupportTicket,
} from "@/entities/user/model/types";
import {
    customers as seedCustomers,
    fulfillmentTasks as seedFulfillmentTasks,
    inventoryItems as seedInventoryItems,
    requisitions as seedRequisitions,
    suppliers as seedSuppliers,
} from "@/shared/api/mock-data";

interface RequisitionInput {
    inventorySku: string;
    supplierId: string;
    requestedQty: number;
    etaDays: number;
    note?: string;
}

interface SupplierInvitationInput {
    supplierName: string;
    contactName: string;
    email: string;
    categories: string[];
    note: string;
}

interface SupportTicketInput {
    subject: string;
    message: string;
    channel: "supplier" | "warehouse";
}

interface OperationsState {
    suppliers: SupplierPartner[];
    customers: CustomerRecord[];
    inventory: InventoryItem[];
    requisitions: PurchaseRequisition[];
    fulfillmentTasks: FulfillmentTask[];
    supportTickets: SupportTicket[];
    supplierInvitations: SupplierInvitation[];
    nextRequisitionSequence: number;
    nextFulfillmentSequence: number;
    nextSupportSequence: number;
    nextInvitationSequence: number;
    createRequisition: (input: RequisitionInput) => PurchaseRequisition;
    updateRequisitionStatus: (
        requisitionId: string,
        status: PurchaseRequisition["status"],
        actor: string,
        approvedQty?: number,
    ) => void;
    createSupportTicket: (input: SupportTicketInput) => SupportTicket;
    resolveSupportTicket: (ticketId: string) => void;
    inviteSupplier: (input: SupplierInvitationInput) => SupplierInvitation;
    registerPlacedOrder: (order: Order) => void;
    ensureFulfillmentTask: (order: Order) => FulfillmentTask;
    advanceFulfillmentTask: (taskId: string, note?: string) => FulfillmentTask | undefined;
    reset: () => void;
}

function nextInventoryStatus(item: InventoryItem): InventoryItem["status"] {
    const available = item.onHand - item.reserved;

    if (available <= 10) return "critical";
    if (available <= item.reorderPoint) return "low";
    return "healthy";
}

const fulfillmentNextStatus: Record<FulfillmentStatus, FulfillmentStatus> = {
    picking: "packing",
    packing: "awaiting_pickup",
    awaiting_pickup: "shipped",
    shipped: "shipped",
};

const initialState = {
    suppliers: seedSuppliers,
    customers: seedCustomers,
    inventory: seedInventoryItems,
    requisitions: seedRequisitions,
    fulfillmentTasks: seedFulfillmentTasks,
    supportTickets: [] as SupportTicket[],
    supplierInvitations: [] as SupplierInvitation[],
    nextRequisitionSequence: 3000,
    nextFulfillmentSequence: 2000,
    nextSupportSequence: 1,
    nextInvitationSequence: 1,
};

export const useOperationsStore = create<OperationsState>()(
    persist(
        (set, get) => ({
            ...initialState,
            createRequisition: (input) => {
                const requisition: PurchaseRequisition = {
                    id: `REQ-${get().nextRequisitionSequence}`,
                    inventorySku: input.inventorySku,
                    supplierId: input.supplierId,
                    requestedQty: input.requestedQty,
                    etaDays: input.etaDays,
                    status: "submitted",
                    note: input.note?.trim(),
                    statusHistory: [
                        {
                            id: `req-status-${get().nextRequisitionSequence}`,
                            actor: "warehouse",
                            label: "Đã gửi phiếu yêu cầu",
                            createdAt: new Date().toISOString(),
                        },
                    ],
                };

                set((state) => ({
                    requisitions: [requisition, ...state.requisitions],
                    nextRequisitionSequence: state.nextRequisitionSequence + 1,
                }));

                return requisition;
            },
            updateRequisitionStatus: (requisitionId, status, actor, approvedQty) => {
                set((state) => ({
                    requisitions: state.requisitions.map((requisition) =>
                        requisition.id === requisitionId
                            ? {
                                  ...requisition,
                                  status,
                                  approvedQty:
                                      approvedQty ??
                                      requisition.approvedQty ??
                                      requisition.requestedQty,
                                  statusHistory: [
                                      ...(requisition.statusHistory ?? []),
                                      {
                                          id: `${requisitionId}-${status}-${Date.now()}`,
                                          actor,
                                          label: `Cập nhật trạng thái sang ${status}`,
                                          createdAt: new Date().toISOString(),
                                      },
                                  ],
                              }
                            : requisition,
                    ),
                    inventory:
                        status === "received"
                            ? state.inventory.map((item) => {
                                  const requisition = state.requisitions.find(
                                      (current) => current.id === requisitionId,
                                  );

                                  if (!requisition || item.sku !== requisition.inventorySku) {
                                      return item;
                                  }

                                  const onHand =
                                      item.onHand +
                                      (approvedQty ??
                                          requisition.approvedQty ??
                                          requisition.requestedQty);
                                  const reserved = Math.max(0, item.reserved - 5);

                                  return {
                                      ...item,
                                      onHand,
                                      reserved,
                                      status: nextInventoryStatus({
                                          ...item,
                                          onHand,
                                          reserved,
                                      }),
                                  };
                              })
                            : state.inventory,
                }));
            },
            createSupportTicket: (input) => {
                const ticket: SupportTicket = {
                    id: `HELP-${get().nextSupportSequence}`,
                    subject: input.subject.trim(),
                    message: input.message.trim(),
                    channel: input.channel,
                    createdAt: new Date().toISOString(),
                    status: "open",
                };

                set((state) => ({
                    supportTickets: [ticket, ...state.supportTickets],
                    nextSupportSequence: state.nextSupportSequence + 1,
                }));

                return ticket;
            },
            resolveSupportTicket: (ticketId) =>
                set((state) => ({
                    supportTickets: state.supportTickets.map((ticket) =>
                        ticket.id === ticketId ? { ...ticket, status: "resolved" } : ticket,
                    ),
                })),
            inviteSupplier: (input) => {
                const invitation: SupplierInvitation = {
                    id: `INV-${get().nextInvitationSequence}`,
                    supplierName: input.supplierName.trim(),
                    contactName: input.contactName.trim(),
                    email: input.email.trim(),
                    categories: input.categories,
                    note: input.note.trim(),
                    createdAt: new Date().toISOString(),
                    status: "sent",
                };

                set((state) => ({
                    supplierInvitations: [invitation, ...state.supplierInvitations],
                    nextInvitationSequence: state.nextInvitationSequence + 1,
                }));

                return invitation;
            },
            registerPlacedOrder: (order) => {
                set((state) => ({
                    customers: state.customers.some(
                        (customer) => customer.name === order.customerName,
                    )
                        ? state.customers.map((customer) =>
                              customer.name === order.customerName
                                  ? {
                                        ...customer,
                                        orders: customer.orders + 1,
                                        totalSpend: customer.totalSpend + order.total,
                                        status: "loyal",
                                    }
                                  : customer,
                          )
                        : [
                              {
                                  id: `cus-${state.customers.length + 1}`,
                                  name: order.customerName,
                                  location: "Khách hàng mới",
                                  orders: 1,
                                  totalSpend: order.total,
                                  status: "new",
                              },
                              ...state.customers,
                          ],
                    inventory: state.inventory.map((item) => {
                        const matchedLine = order.items.find(
                            (line) => line.productId === item.productId,
                        );

                        if (!matchedLine) return item;

                        const reserved = item.reserved + matchedLine.quantity;

                        return {
                            ...item,
                            reserved,
                            status: nextInventoryStatus({
                                ...item,
                                reserved,
                            }),
                        };
                    }),
                }));
            },
            ensureFulfillmentTask: (order) => {
                const existingTask = get().fulfillmentTasks.find(
                    (task) => task.orderId === order.id,
                );

                if (existingTask) {
                    return existingTask;
                }

                const task: FulfillmentTask = {
                    id: `FUL-${get().nextFulfillmentSequence}`,
                    orderId: order.id,
                    customerName: order.customerName,
                    shippingTier: order.shippingTier,
                    status: "picking",
                    priority: order.shippingTier === "priority" ? "rush" : "standard",
                    assignedZone: order.shippingTier === "priority" ? "Khu C" : "Khu B",
                    etaLabel:
                        order.shippingTier === "priority"
                            ? "Ưu tiên lấy hàng trong 2 giờ"
                            : "Theo ca chiều",
                    statusHistory: [
                        {
                            id: `fulfillment-${get().nextFulfillmentSequence}-created`,
                            actor: "system",
                            label: "Tạo nhiệm vụ kho",
                            createdAt: new Date().toISOString(),
                        },
                    ],
                };

                set((state) => ({
                    fulfillmentTasks: [task, ...state.fulfillmentTasks],
                    nextFulfillmentSequence: state.nextFulfillmentSequence + 1,
                }));

                return task;
            },
            advanceFulfillmentTask: (taskId, note) => {
                const currentTask = get().fulfillmentTasks.find((task) => task.id === taskId);

                if (!currentTask) return undefined;

                const nextTask: FulfillmentTask = {
                    ...currentTask,
                    status: fulfillmentNextStatus[currentTask.status],
                    notes: note ?? currentTask.notes,
                    etaLabel:
                        fulfillmentNextStatus[currentTask.status] === "shipped"
                            ? "Đã bàn giao đơn vị vận chuyển"
                            : currentTask.etaLabel,
                    statusHistory: [
                        ...(currentTask.statusHistory ?? []),
                        {
                            id: `${taskId}-${Date.now()}`,
                            actor: "warehouse",
                            label: `Chuyển sang ${fulfillmentNextStatus[currentTask.status]}`,
                            createdAt: new Date().toISOString(),
                        },
                    ],
                };

                set((state) => ({
                    fulfillmentTasks: state.fulfillmentTasks.map((task) =>
                        task.id === taskId ? nextTask : task,
                    ),
                }));

                return nextTask;
            },
            reset: () => set(initialState),
        }),
        {
            name: "heritage-operations-store",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
