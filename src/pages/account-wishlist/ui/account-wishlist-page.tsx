import { useEffect } from "react";

import { ProductCard } from "@/entities/product/ui/product-card";
import { routes } from "@/shared/config/routes";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useShopStore } from "@/shared/lib/store/use-shop-store";
import { useStorefrontCatalogStore } from "@/shared/lib/store/use-storefront-catalog-store";
import { ButtonLink, SurfaceCard } from "@/shared/ui";

export function AccountWishlistPage() {
    const addItem = useCartStore((state) => state.addItem);
    const wishlistIds = useShopStore((state) => state.wishlistIds);
    const recentlyViewedIds = useShopStore((state) => state.recentlyViewedIds);
    const isWishlistLoading = useShopStore((state) => state.isWishlistLoading);
    const wishlistError = useShopStore((state) => state.error);
    const loadWishlist = useShopStore((state) => state.loadWishlist);
    const products = useStorefrontCatalogStore((state) => state.products);
    const loadCatalog = useStorefrontCatalogStore((state) => state.loadCatalog);

    useEffect(() => {
        void loadCatalog();
        void loadWishlist();
    }, [loadCatalog, loadWishlist]);

    const wishlistProducts = wishlistIds
        .map((productId) => products.find((product) => product.id === productId))
        .filter((product): product is NonNullable<typeof product> => Boolean(product));
    const fallbackProducts = recentlyViewedIds
        .map((productId) => products.find((product) => product.id === productId))
        .filter((product): product is NonNullable<typeof product> => Boolean(product))
        .filter((product) => !wishlistIds.includes(product.id));

    return (
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-24">
            <div className="space-y-6">
                <div>
                    <h1 className="font-headline text-2xl font-bold tracking-tight">Danh sach yeu thich</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Danh sach nay duoc dong bo voi tai khoan backend cua ban va chi hien thi san
                        pham con ton tai trong cua hang.
                    </p>
                </div>

                {isWishlistLoading ? (
                    <SurfaceCard className="text-center text-on-surface-variant">
                        Dang tai danh sach yeu thich...
                    </SurfaceCard>
                ) : wishlistError ? (
                    <SurfaceCard className="text-center text-on-surface-variant">
                        {wishlistError}
                    </SurfaceCard>
                ) : wishlistProducts.length > 0 ? (
                    <div className="grid gap-6 xl:grid-cols-2">
                        {wishlistProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                view="list"
                                onAddToCart={(productId) => void addItem(productId, 1)}
                            />
                        ))}
                    </div>
                ) : (
                    <SurfaceCard className="space-y-4 text-center">
                        <h2 className="font-headline text-2xl font-semibold text-on-surface">
                            Danh sach yeu thich dang trong
                        </h2>
                        <p className="text-on-surface-variant">
                            Hay luu san pham ban thich de chung xuat hien o day.
                        </p>
                        <div className="flex justify-center">
                            <ButtonLink to={routes.products}>Kham pha san pham</ButtonLink>
                        </div>
                    </SurfaceCard>
                )}

                {fallbackProducts.length > 0 ? (
                    <section className="space-y-6">
                        <div>
                            <h2 className="font-headline text-3xl font-bold text-on-surface">
                                Ban co the muon luu them
                            </h2>
                            <p className="mt-2 text-on-surface-variant">
                                Cac san pham ban vua xem nhung chua them vao wishlist.
                            </p>
                        </div>
                        <div className="grid gap-6 xl:grid-cols-3">
                            {fallbackProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={(productId) => void addItem(productId, 1)}
                                />
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    );
}
