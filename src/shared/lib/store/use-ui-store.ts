import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UiState {
    catalogView: "grid" | "list";
    selectedSupplierOrderId: string;
    selectedWarehouseSku: string;
    setCatalogView: (view: "grid" | "list") => void;
    setSelectedSupplierOrderId: (orderId: string) => void;
    setSelectedWarehouseSku: (sku: string) => void;
    reset: () => void;
}

const initialState = {
    catalogView: "grid" as const,
    selectedSupplierOrderId: "HH-7721",
    selectedWarehouseSku: "SKU-TEA-014",
};

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            ...initialState,
            setCatalogView: (catalogView) => set({ catalogView }),
            setSelectedSupplierOrderId: (selectedSupplierOrderId) =>
                set({ selectedSupplierOrderId }),
            setSelectedWarehouseSku: (selectedWarehouseSku) => set({ selectedWarehouseSku }),
            reset: () => set(initialState),
        }),
        {
            name: "heritage-ui-store",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
