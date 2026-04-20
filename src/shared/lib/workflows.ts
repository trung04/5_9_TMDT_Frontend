import type { ComplaintDraft } from "@/entities/order/model/types";
import type { Product } from "@/entities/product/model/types";
import type { UserProfile } from "@/entities/user/model/types";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useCatalogStore } from "@/shared/lib/store/use-catalog-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { useOrderStore } from "@/shared/lib/store/use-order-store";

interface PlaceOrderInput {
    customerName: string;
    address: string;
    note?: string;
    items: { productId: string; quantity: number }[];
    total: number;
    shippingTier: "standard" | "express" | "priority";
    paymentMethod: "cod" | "card" | "banking";
}

export function placeCheckoutOrder(input: PlaceOrderInput) {
    const order = useOrderStore.getState().placeOrder(input);
    useOperationsStore.getState().registerPlacedOrder(order);
    useOperationsStore.getState().ensureFulfillmentTask(order);
    return order;
}

export function submitOrderComplaint(draft: ComplaintDraft) {
    return useOrderStore.getState().submitComplaint(draft);
}

export function resolveOrderComplaint(complaintId: string, resolutionNote: string) {
    useOrderStore.getState().resolveComplaint(complaintId, resolutionNote);
}

export function handoffOrderToWarehouse(orderId: string) {
    const order = useOrderStore.getState().orders.find((item) => item.id === orderId);

    if (!order) return undefined;

    useOrderStore.getState().updateDeliveryStatus(orderId, "ready_to_ship", "admin");
    return useOperationsStore.getState().ensureFulfillmentTask({
        ...order,
        deliveryStatus: "ready_to_ship",
    });
}

export function advanceFulfillmentTask(taskId: string, note?: string) {
    const task = useOperationsStore.getState().advanceFulfillmentTask(taskId, note);

    if (!task) return undefined;

    if (task.status === "shipped") {
        useOrderStore.getState().updateDeliveryStatus(task.orderId, "in_transit", "warehouse");
    } else {
        useOrderStore.getState().updateDeliveryStatus(task.orderId, "ready_to_ship", "warehouse");
    }

    return task;
}

export function markOrderDelivered(orderId: string) {
    useOrderStore.getState().updateDeliveryStatus(orderId, "delivered", "admin");
}

export function canCustomerReviewProduct(productId: string, profile: UserProfile) {
    return useOrderStore
        .getState()
        .orders.some(
            (order) =>
                order.customerName === profile.name &&
                order.deliveryStatus === "delivered" &&
                order.items.some((item) => item.productId === productId),
        );
}

export function submitVerifiedReview(
    product: Product,
    author: string,
    rating: number,
    title: string,
    body: string,
    media?: { src: string; alt: string }[],
) {
    return useCatalogStore.getState().addReview({
        productId: product.id,
        author,
        rating,
        title,
        body,
        media,
    });
}

export function getDefaultAddress(profile: UserProfile) {
    return profile.addresses.find((address) => address.isDefault) ?? profile.addresses[0];
}

export function updateProfileAddressFromDefault() {
    const profile = useAccountStore.getState().profile;
    const defaultAddress = getDefaultAddress(profile);

    if (!defaultAddress) return;

    useAccountStore.getState().updateProfile({
        address: defaultAddress.line1,
        city: defaultAddress.city,
    });
}
