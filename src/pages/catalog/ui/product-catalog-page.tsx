import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/lib/format";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useStorefrontCatalogStore } from "@/shared/lib/store/use-storefront-catalog-store";
import { useUiStore } from "@/shared/lib/store/use-ui-store";
import { Icon } from "@/shared/ui";

type SortValue = "popular" | "newest" | "price-asc" | "price-desc";

export function ProductCatalogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const addItem = useCartStore((state) => state.addItem);
    const catalogView = useUiStore((state) => state.catalogView);
    const setCatalogView = useUiStore((state) => state.setCatalogView);
    const categories = useStorefrontCatalogStore((state) => state.categories);
    const suppliers = useStorefrontCatalogStore((state) => state.suppliers);
    const products = useStorefrontCatalogStore((state) => state.products);
    const status = useStorefrontCatalogStore((state) => state.status);
    const error = useStorefrontCatalogStore((state) => state.error);
    const loadCatalog = useStorefrontCatalogStore((state) => state.loadCatalog);
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.get("categories")?.split(",").filter(Boolean) ?? [],
    );
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(
        searchParams.get("suppliers")?.split(",").filter(Boolean) ?? [],
    );
    const [priceLimit, setPriceLimit] = useState(Number(searchParams.get("price") ?? 30000000));
    const [sort, setSort] = useState<SortValue>(
        (searchParams.get("sort") as SortValue | null) ?? "popular",
    );
    const [ratingMin, setRatingMin] = useState(Number(searchParams.get("ratingMin") ?? 0));

    const searchParamSignature = searchParams.toString();

    useEffect(() => {
        void loadCatalog();
    }, [loadCatalog]);

    useEffect(() => {
        setSearch(searchParams.get("search") ?? "");
        setSelectedCategories(searchParams.get("categories")?.split(",").filter(Boolean) ?? []);
        setSelectedSuppliers(searchParams.get("suppliers")?.split(",").filter(Boolean) ?? []);
        setPriceLimit(Number(searchParams.get("price") ?? 30000000));
        setSort((searchParams.get("sort") as SortValue | null) ?? "popular");
        setRatingMin(Number(searchParams.get("ratingMin") ?? 0));
    }, [searchParamSignature, searchParams]);

    useEffect(() => {
        const nextParams = new URLSearchParams();

        if (search) nextParams.set("search", search);
        if (selectedCategories.length) nextParams.set("categories", selectedCategories.join(","));
        if (selectedSuppliers.length) nextParams.set("suppliers", selectedSuppliers.join(","));
        if (sort !== "popular") nextParams.set("sort", sort);
        if (priceLimit !== 30000000) nextParams.set("price", String(priceLimit));
        if (ratingMin > 0) nextParams.set("ratingMin", String(ratingMin));

        if (nextParams.toString() !== searchParamSignature) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [
        priceLimit,
        ratingMin,
        search,
        searchParamSignature,
        selectedCategories,
        selectedSuppliers,
        setSearchParams,
        sort,
    ]);

    const visibleProducts = [...products]
        .filter(
            (product) =>
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.shortDescription.toLowerCase().includes(search.toLowerCase()),
        )
        .filter((product) =>
            selectedCategories.length === 0
                ? true
                : selectedCategories.includes(product.categoryId),
        )
        .filter((product) =>
            selectedSuppliers.length === 0 ? true : selectedSuppliers.includes(product.regionId),
        )
        .filter((product) => product.price <= priceLimit)
        .filter((product) => (ratingMin > 0 ? product.rating >= ratingMin : true))
        .sort((first, second) => {
            if (sort === "price-asc") return first.price - second.price;
            if (sort === "price-desc") return second.price - first.price;
            if (sort === "newest") return second.reviewCount - first.reviewCount;
            return second.rating - first.rating;
        });

    function toggleSelection(value: string, current: string[], setValue: (next: string[]) => void) {
        setValue(
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
        );
    }

    function resetFilters() {
        setSearch("");
        setSelectedCategories([]);
        setSelectedSuppliers([]);
        setPriceLimit(30000000);
        setSort("popular");
        setRatingMin(0);
    }

    const isLoading = status === "loading" || status === "idle";

    return (
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-24">
            <nav className="mb-8 flex items-center space-x-2 text-sm text-on-surface-variant">
                <Link className="transition-colors hover:text-primary" to={routes.home}>
                    Home
                </Link>
                <Icon name="chevron_right" className="text-sm" />
                <Link className="transition-colors hover:text-primary" to={routes.products}>
                    Shop
                </Link>
                <Icon name="chevron_right" className="text-sm" />
                <span className="font-medium text-primary">Storefront Backend</span>
            </nav>

            <div className="flex flex-col gap-12 lg:flex-row">
                <aside className="w-full space-y-10 lg:w-1/4">
                    <div className="space-y-3">
                        <h3 className="font-headline text-lg font-semibold tracking-tight text-on-surface">
                            Tìm kiếm
                        </h3>
                        <div className="relative">
                            <input
                                className="w-full rounded-xl border-b-2 border-transparent bg-surface-container-highest px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                placeholder="Tìm tên sản phẩm..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                            <Icon name="search" className="absolute right-3 top-3 text-outline" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="border-b border-outline-variant/30 pb-2 font-headline text-lg font-semibold tracking-tight text-on-surface">
                            Danh mục
                        </h3>
                        <div className="flex flex-col space-y-3">
                            {categories.map((category) => (
                                <label
                                    key={category.id}
                                    className="group flex cursor-pointer items-center"
                                >
                                    <input
                                        className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
                                        type="checkbox"
                                        checked={selectedCategories.includes(category.id)}
                                        onChange={() =>
                                            toggleSelection(
                                                category.id,
                                                selectedCategories,
                                                setSelectedCategories,
                                            )
                                        }
                                    />
                                    <span className="ml-3 text-on-surface-variant transition-colors group-hover:text-primary">
                                        {category.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="border-b border-outline-variant/30 pb-2 font-headline text-lg font-semibold tracking-tight text-on-surface">
                            Nhà cung cấp
                        </h3>
                        <div className="flex flex-col space-y-3">
                            {suppliers.map((supplier) => (
                                <label
                                    key={supplier.id}
                                    className="group flex cursor-pointer items-center"
                                >
                                    <input
                                        className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
                                        type="checkbox"
                                        checked={selectedSuppliers.includes(supplier.id)}
                                        onChange={() =>
                                            toggleSelection(
                                                supplier.id,
                                                selectedSuppliers,
                                                setSelectedSuppliers,
                                            )
                                        }
                                    />
                                    <span className="ml-3 text-on-surface-variant transition-colors group-hover:text-primary">
                                        {supplier.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="border-b border-outline-variant/30 pb-2 font-headline text-lg font-semibold tracking-tight text-on-surface">
                            Khoảng giá
                        </h3>
                        <div className="px-2">
                            <input
                                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
                                type="range"
                                min={0}
                                max={30000000}
                                step={500000}
                                value={priceLimit}
                                onChange={(event) => setPriceLimit(Number(event.target.value))}
                            />
                            <div className="mt-3 flex justify-between text-xs uppercase tracking-wider text-outline">
                                <span>0đ</span>
                                <span>{priceLimit.toLocaleString("vi-VN")}đ</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="border-b border-outline-variant/30 pb-2 font-headline text-lg font-semibold tracking-tight text-on-surface">
                            Đánh giá
                        </h3>
                        <div className="flex flex-col space-y-2">
                            <button
                                className="flex items-center text-left"
                                onClick={() => setRatingMin((value) => (value === 4 ? 0 : 4))}
                            >
                                <div className="flex text-tertiary">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <Icon key={index} name="star" className="text-sm" fill />
                                    ))}
                                    <Icon name="star" className="text-sm text-outline-variant" />
                                </div>
                                <span className="ml-2 text-sm text-on-surface-variant transition-colors hover:text-primary">
                                    Từ 4 sao trở lên
                                </span>
                                {ratingMin === 4 ? (
                                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                                        On
                                    </span>
                                ) : null}
                            </button>
                        </div>
                    </div>

                    <button
                        className="w-full rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-[0.98]"
                        onClick={resetFilters}
                    >
                        Xóa tất cả bộ lọc
                    </button>
                </aside>

                <section className="w-full lg:w-3/4">
                    <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
                                Sản phẩm storefront
                            </h1>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                {visibleProducts.length} sản phẩm từ backend phù hợp bộ lọc
                            </p>
                        </div>

                        <div className="flex w-full items-center space-x-4 sm:w-auto">
                            <div className="relative min-w-[180px]">
                                <select
                                    className="w-full appearance-none rounded-full border-none bg-surface-container-low px-5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                    value={sort}
                                    onChange={(event) => setSort(event.target.value as SortValue)}
                                >
                                    <option value="popular">Phổ biến nhất</option>
                                    <option value="newest">Mới nhất</option>
                                    <option value="price-asc">Giá: Thấp đến Cao</option>
                                    <option value="price-desc">Giá: Cao đến Thấp</option>
                                </select>
                                <Icon
                                    name="expand_more"
                                    className="pointer-events-none absolute right-4 top-2.5 text-lg text-outline"
                                />
                            </div>
                            <div className="flex rounded-full bg-surface-container-low p-1">
                                <button
                                    className={`rounded-full p-2 ${
                                        catalogView === "grid"
                                            ? "bg-surface-container-lowest text-primary shadow-sm"
                                            : "text-outline hover:text-on-surface"
                                    }`}
                                    onClick={() => setCatalogView("grid")}
                                    aria-label="Chế độ lưới"
                                >
                                    <Icon name="grid_view" />
                                </button>
                                <button
                                    className={`rounded-full p-2 ${
                                        catalogView === "list"
                                            ? "bg-surface-container-lowest text-primary shadow-sm"
                                            : "text-outline hover:text-on-surface"
                                    }`}
                                    onClick={() => setCatalogView("list")}
                                    aria-label="Chế độ danh sách"
                                >
                                    <Icon name="view_list" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {visibleProducts.length === 0 ? (
                        <div className="rounded-xl bg-surface-container-lowest p-10 text-center">
                            <h2 className="font-headline text-2xl font-semibold">
                                {isLoading ? "Đang tải catalog backend..." : "Chưa có sản phẩm phù hợp"}
                            </h2>
                            <p className="mt-3 text-on-surface-variant">
                                {isLoading
                                    ? "Storefront đang chờ API trả dữ liệu sản phẩm, danh mục và nhà cung cấp."
                                    : error ?? "Hãy thử nới rộng bộ lọc hoặc tải lại trang."}
                            </p>
                        </div>
                    ) : catalogView === "grid" ? (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleProducts.map((product) => (
                                <article
                                    key={product.id}
                                    className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest transition-all duration-300 hover:-translate-y-1"
                                >
                                    <Link
                                        to={routes.productDetail(product.slug)}
                                        className="relative aspect-[4/5] overflow-hidden"
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary shadow-lg">
                                            {product.badge ?? product.regionName}
                                        </span>
                                    </Link>
                                    <div className="flex flex-1 flex-col space-y-3 p-6">
                                        <div className="flex items-start justify-between">
                                            <Link
                                                to={routes.productDetail(product.slug)}
                                                className="font-headline text-lg font-semibold leading-tight transition-colors group-hover:text-primary"
                                            >
                                                {product.name}
                                            </Link>
                                            <div className="flex items-center text-tertiary">
                                                <Icon name="star" className="text-[16px]" fill />
                                                <span className="ml-1 text-xs font-bold">
                                                    {product.rating.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
                                            {product.shortDescription}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between pt-4">
                                            <span className="text-xl font-bold text-on-surface">
                                                {formatCurrency(product.price)}
                                            </span>
                                            <button
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary transition-all active:scale-90"
                                                onClick={() => void addItem(product.id, 1)}
                                                aria-label={`Thêm vào giỏ ${product.name}`}
                                            >
                                                <Icon name="shopping_basket" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {visibleProducts.map((product) => (
                                <article
                                    key={product.id}
                                    className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 md:flex-row"
                                >
                                    <Link to={routes.productDetail(product.slug)} className="md:w-56">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="aspect-[4/5] w-full rounded-xl object-cover"
                                        />
                                    </Link>
                                    <div className="flex flex-1 flex-col justify-between gap-4">
                                        <div>
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                                                    {product.badge ?? product.regionName}
                                                </span>
                                                <span className="text-sm text-on-surface-variant">
                                                    {product.regionName}
                                                </span>
                                            </div>
                                            <Link
                                                to={routes.productDetail(product.slug)}
                                                className="font-headline text-2xl font-semibold"
                                            >
                                                {product.name}
                                            </Link>
                                            <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                                                {product.description}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-bold text-on-surface">
                                                    {formatCurrency(product.price)}
                                                </span>
                                                <span className="text-sm text-on-surface-variant">
                                                    {product.rating.toFixed(1)} / 5
                                                </span>
                                            </div>
                                            <div className="flex gap-3">
                                                <Link
                                                    to={routes.productDetail(product.slug)}
                                                    className="rounded-full border border-outline-variant/30 px-5 py-3 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
                                                >
                                                    Xem chi tiết
                                                </Link>
                                                <button
                                                    className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
                                                    onClick={() => void addItem(product.id, 1)}
                                                >
                                                    Thêm vào giỏ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
