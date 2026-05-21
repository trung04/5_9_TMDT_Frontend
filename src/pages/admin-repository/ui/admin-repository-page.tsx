import { useEffect, useMemo, useState } from "react";

import { formatCurrency } from "@/shared/lib/format";
import { useAdminCatalogStore } from "@/shared/lib/store/use-admin-catalog-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, StatCard, SurfaceCard } from "@/shared/ui";

type RepositoryTab = "products" | "categories";

const emptyProductForm = {
    name: "",
    sku: "",
    categoryId: "",
    supplierId: "",
    description: "",
    imageUrl: "",
    salePrice: "0",
    stockQuantity: "0",
    isActive: true,
};

const emptyCategoryForm = {
    name: "",
    description: "",
};

export function AdminRepositoryPage() {
    const [tab, setTab] = useState<RepositoryTab>("products");
    const [query, setQuery] = useState("");
    const [activeProductId, setActiveProductId] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("");
    const [productForm, setProductForm] = useState(emptyProductForm);
    const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
    const products = useAdminCatalogStore((state) => state.products);
    const categories = useAdminCatalogStore((state) => state.categories);
    const suppliers = useAdminCatalogStore((state) => state.suppliers);
    const isLoading = useAdminCatalogStore((state) => state.isLoading);
    const isSaving = useAdminCatalogStore((state) => state.isSaving);
    const error = useAdminCatalogStore((state) => state.error);
    const loadData = useAdminCatalogStore((state) => state.loadData);
    const createProduct = useAdminCatalogStore((state) => state.createProduct);
    const updateProduct = useAdminCatalogStore((state) => state.updateProduct);
    const deleteProduct = useAdminCatalogStore((state) => state.deleteProduct);
    const createCategory = useAdminCatalogStore((state) => state.createCategory);
    const updateCategory = useAdminCatalogStore((state) => state.updateCategory);
    const deleteCategory = useAdminCatalogStore((state) => state.deleteCategory);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const filteredProducts = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return products.filter((product) => {
            if (keyword.length === 0) return true;

            return [product.name, product.sku, product.category?.name, product.supplier?.name]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword);
        });
    }, [products, query]);

    const filteredCategories = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return categories.filter((category) => {
            if (keyword.length === 0) return true;
            return [category.name, category.description].join(" ").toLowerCase().includes(keyword);
        });
    }, [categories, query]);

    const activeProduct =
        filteredProducts.find((product) => String(product.id) === activeProductId) ??
        filteredProducts[0];
    const activeCategory =
        filteredCategories.find((category) => String(category.id) === activeCategoryId) ??
        filteredCategories[0];

    useEffect(() => {
        if (!activeProduct) return;

        setActiveProductId(String(activeProduct.id));
        setProductForm({
            name: activeProduct.name,
            sku: activeProduct.sku,
            categoryId: String(activeProduct.category_id),
            supplierId: activeProduct.supplier_id ? String(activeProduct.supplier_id) : "",
            description: activeProduct.description ?? "",
            imageUrl: activeProduct.image_url ?? "",
            salePrice: String(activeProduct.sale_price),
            stockQuantity: String(activeProduct.stock_quantity),
            isActive: activeProduct.is_active,
        });
    }, [activeProduct]);

    useEffect(() => {
        if (!activeCategory) return;

        setActiveCategoryId(String(activeCategory.id));
        setCategoryForm({
            name: activeCategory.name,
            description: activeCategory.description ?? "",
        });
    }, [activeCategory]);

    const stats = [
        {
            id: "repository-products",
            label: "Tổng sản phẩm",
            value: `${products.length}`,
            tone: "primary" as const,
            icon: "inventory_2",
            delta: `${filteredProducts.length} sản phẩm đang hiển thị`,
        },
        {
            id: "repository-categories",
            label: "Danh mục storefront",
            value: `${categories.length}`,
            tone: "secondary" as const,
            icon: "category",
            delta: `${suppliers.length} nhà cung cấp đang hoạt động`,
        },
        {
            id: "repository-inactive",
            label: "Sản phẩm tạm ẩn",
            value: `${products.filter((product) => !product.is_active).length}`,
            tone: "danger" as const,
            icon: "visibility_off",
            delta: "Khách hàng sẽ không thấy các sản phẩm này",
        },
    ];

    async function handleCreateProduct() {
        const salePrice = Number(productForm.salePrice);
        const stockQuantity = Number(productForm.stockQuantity);

        if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.categoryId) {
            pushToast({
                tone: "warning",
                message: "Cần nhập tên, SKU và danh mục cho sản phẩm.",
            });
            return;
        }

        const result = await createProduct({
            category_id: Number(productForm.categoryId),
            supplier_id: productForm.supplierId ? Number(productForm.supplierId) : null,
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            description: productForm.description.trim(),
            image_url: productForm.imageUrl.trim() || null,
            sale_price: Number.isFinite(salePrice) ? salePrice : 0,
            stock_quantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
            is_active: productForm.isActive,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể tạo sản phẩm." });
            return;
        }

        setActiveProductId(String(result.data.id));
        pushToast({ tone: "success", message: `Đã tạo sản phẩm ${result.data.name}.` });
    }

    async function handleUpdateProduct() {
        if (!activeProduct) return;

        const result = await updateProduct(activeProduct.id, {
            category_id: Number(productForm.categoryId),
            supplier_id: productForm.supplierId ? Number(productForm.supplierId) : null,
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            description: productForm.description.trim(),
            image_url: productForm.imageUrl.trim() || null,
            sale_price: Number(productForm.salePrice),
            stock_quantity: Number(productForm.stockQuantity),
            is_active: productForm.isActive,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể cập nhật sản phẩm." });
            return;
        }

        pushToast({ tone: "success", message: `Đã cập nhật sản phẩm ${result.data.name}.` });
    }

    async function handleDeleteProduct() {
        if (!activeProduct) return;

        const result = await deleteProduct(activeProduct.id);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể xóa sản phẩm." });
            return;
        }

        setActiveProductId("");
        setProductForm(emptyProductForm);
        pushToast({ tone: "success", message: `Đã xóa sản phẩm ${activeProduct.name}.` });
    }

    async function handleCreateCategory() {
        if (!categoryForm.name.trim()) {
            pushToast({ tone: "warning", message: "Cần nhập tên danh mục." });
            return;
        }

        const result = await createCategory({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim(),
            is_active: true,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể tạo danh mục." });
            return;
        }

        setActiveCategoryId(String(result.data.id));
        pushToast({ tone: "success", message: `Đã tạo danh mục ${result.data.name}.` });
    }

    async function handleUpdateCategory() {
        if (!activeCategory) return;

        const result = await updateCategory(activeCategory.id, {
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim(),
            is_active: true,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể cập nhật danh mục." });
            return;
        }

        pushToast({ tone: "success", message: `Đã cập nhật danh mục ${result.data.name}.` });
    }

    async function handleDeleteCategory() {
        if (!activeCategory) return;

        const result = await deleteCategory(activeCategory.id);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể xóa danh mục." });
            return;
        }

        setActiveCategoryId("");
        setCategoryForm(emptyCategoryForm);
        pushToast({ tone: "success", message: `Đã ẩn danh mục ${activeCategory.name}.` });
    }

    return (
        <div className="space-y-8">
            <section className="grid gap-6 xl:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

            <div className="flex gap-3">
                <button
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                        tab === "products"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant"
                    }`}
                    onClick={() => setTab("products")}
                >
                    Sản phẩm
                </button>
                <button
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                        tab === "categories"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant"
                    }`}
                    onClick={() => setTab("categories")}
                >
                    Danh mục
                </button>
            </div>

            <input
                className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Lọc theo tên, SKU, danh mục hoặc nhà cung cấp..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            {tab === "products" ? (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <SurfaceCard className="space-y-4">
                        {isLoading ? (
                            <p className="text-sm text-on-surface-variant">Đang tải sản phẩm...</p>
                        ) : null}
                        {!isLoading && filteredProducts.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">
                                Không có sản phẩm phù hợp bộ lọc hiện tại.
                            </p>
                        ) : null}
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                className={`w-full rounded-3xl p-4 text-left transition ${
                                    product.id === activeProduct?.id
                                        ? "bg-primary/5"
                                        : "bg-surface-container-low hover:bg-surface-container"
                                }`}
                                onClick={() => setActiveProductId(String(product.id))}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        {product.sku}
                                    </p>
                                    <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs text-on-surface-variant">
                                        {product.is_active ? "Đang bán" : "Tạm ẩn"}
                                    </span>
                                </div>
                                <h3 className="mt-2 font-headline text-xl font-semibold">
                                    {product.name}
                                </h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {product.category?.name ?? `Danh mục #${product.category_id}`} -{" "}
                                    {product.supplier?.name ?? "Chưa gán nhà cung cấp"}
                                </p>
                                <p className="mt-3 text-sm font-semibold text-primary">
                                    {formatCurrency(Number(product.sale_price))}
                                </p>
                                <p className="mt-1 text-sm text-on-surface-variant">
                                    Tồn kho: {product.stock_quantity}
                                </p>
                            </button>
                        ))}
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <div>
                            <h3 className="font-headline text-2xl font-bold">Nội dung sản phẩm</h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Tên sản phẩm"
                                value={productForm.name}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="SKU"
                                value={productForm.sku}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        sku: event.target.value,
                                    }))
                                }
                            />
                            <select
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                                value={productForm.categoryId}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        categoryId: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                                value={productForm.supplierId}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        supplierId: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Không gán nhà cung cấp</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Giá bán"
                                type="number"
                                min={0}
                                value={productForm.salePrice}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        salePrice: event.target.value,
                                    }))
                                }
                            />
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Số lượng tồn"
                                type="number"
                                min={0}
                                value={productForm.stockQuantity}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        stockQuantity: event.target.value,
                                    }))
                                }
                            />
                            <textarea
                                className="min-h-28 resize-none rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                                placeholder="Mô tả sản phẩm"
                                value={productForm.description}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                                placeholder="URL hinh anh san pham"
                                value={productForm.imageUrl}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        imageUrl: event.target.value,
                                    }))
                                }
                            />
                            <label className="md:col-span-2 flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface-variant">
                                <input
                                    type="checkbox"
                                    checked={productForm.isActive}
                                    onChange={(event) =>
                                        setProductForm((current) => ({
                                            ...current,
                                            isActive: event.target.checked,
                                        }))
                                    }
                                />
                                Sản phẩm đang hoạt động trên storefront
                            </label>
                        </div>
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => void handleCreateProduct()}
                                disabled={isSaving}
                            >
                                Tạo sản phẩm
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => void handleUpdateProduct()}
                                disabled={!activeProduct || isSaving}
                            >
                                Lưu chỉnh sửa
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => void handleDeleteProduct()}
                                disabled={!activeProduct || isSaving}
                            >
                                Xóa sản phẩm
                            </Button>
                        </div>
                    </SurfaceCard>
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <SurfaceCard className="space-y-4">
                        {isLoading ? (
                            <p className="text-sm text-on-surface-variant">Đang tải danh mục...</p>
                        ) : null}
                        {!isLoading && filteredCategories.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">
                                Không có danh mục phù hợp bộ lọc hiện tại.
                            </p>
                        ) : null}
                        {filteredCategories.map((category) => (
                            <button
                                key={category.id}
                                className={`w-full rounded-3xl p-4 text-left transition ${
                                    category.id === activeCategory?.id
                                        ? "bg-primary/5"
                                        : "bg-surface-container-low hover:bg-surface-container"
                                }`}
                                onClick={() => setActiveCategoryId(String(category.id))}
                            >
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Danh mục
                                </p>
                                <h3 className="mt-2 font-headline text-xl font-semibold">
                                    {category.name}
                                </h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {category.description}
                                </p>
                            </button>
                        ))}
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <div>
                            <h3 className="font-headline text-2xl font-bold">Nội dung danh mục</h3>
                        </div>
                        <input
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Tên danh mục"
                            value={categoryForm.name}
                            onChange={(event) =>
                                setCategoryForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                        <textarea
                            className="min-h-28 w-full resize-none rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Mô tả danh mục"
                            value={categoryForm.description}
                            onChange={(event) =>
                                setCategoryForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => void handleCreateCategory()}
                                disabled={isSaving}
                            >
                                Tạo danh mục
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => void handleUpdateCategory()}
                                disabled={!activeCategory || isSaving}
                            >
                                Lưu chỉnh sửa
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => void handleDeleteCategory()}
                                disabled={!activeCategory || isSaving}
                            >
                                Ẩn danh mục
                            </Button>
                        </div>
                    </SurfaceCard>
                </div>
            )}
        </div>
    );
}
