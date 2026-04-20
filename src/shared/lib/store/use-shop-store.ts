import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ShopState {
    wishlistIds: string[];
    recentlyViewedIds: string[];
    toggleWishlist: (productId: string) => void;
    addRecentlyViewed: (productId: string) => void;
    pruneProductReferences: (validProductIds: string[]) => void;
    reset: () => void;
}

const initialState = {
    wishlistIds: [] as string[],
    recentlyViewedIds: [] as string[],
};

export const useShopStore = create<ShopState>()(
    persist(
        (set) => ({
            ...initialState,
            toggleWishlist: (productId) =>
                set((state) => ({
                    wishlistIds: state.wishlistIds.includes(productId)
                        ? state.wishlistIds.filter((item) => item !== productId)
                        : [productId, ...state.wishlistIds],
                })),
            addRecentlyViewed: (productId) =>
                set((state) => ({
                    recentlyViewedIds: [
                        productId,
                        ...state.recentlyViewedIds.filter((item) => item !== productId),
                    ].slice(0, 6),
                })),
            pruneProductReferences: (validProductIds) =>
                set((state) => ({
                    wishlistIds: state.wishlistIds.filter((item) => validProductIds.includes(item)),
                    recentlyViewedIds: state.recentlyViewedIds.filter((item) =>
                        validProductIds.includes(item),
                    ),
                })),
            reset: () => set(initialState),
        }),
        {
            name: "heritage-shop-store",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
