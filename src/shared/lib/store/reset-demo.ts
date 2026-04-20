import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useCatalogStore } from "@/shared/lib/store/use-catalog-store";
import { useCustomerOrdersStore } from "@/shared/lib/store/use-customer-orders-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { useOperationsStore } from "@/shared/lib/store/use-operations-store";
import { useOrderStore } from "@/shared/lib/store/use-order-store";
import { useShopStore } from "@/shared/lib/store/use-shop-store";
import { useStorefrontCatalogStore } from "@/shared/lib/store/use-storefront-catalog-store";
import { useUiStore } from "@/shared/lib/store/use-ui-store";

export function resetDemoState() {
    useAuthStore.getState().reset();
    useAccountStore.getState().reset();
    useCatalogStore.getState().reset();
    useOperationsStore.getState().reset();
    useOrderStore.getState().reset();
    useCustomerOrdersStore.getState().reset();
    useCartStore.getState().reset();
    useShopStore.getState().reset();
    useStorefrontCatalogStore.getState().reset();
    useUiStore.getState().reset();
    useFeedbackStore.getState().clear();
}
