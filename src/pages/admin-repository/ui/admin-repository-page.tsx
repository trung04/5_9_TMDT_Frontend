import { useEffect, useMemo, useState } from "react";

import { stockStatusLabels } from "@/shared/lib/labels";
import { useCatalogStore } from "@/shared/lib/store/use-catalog-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, StatCard, SurfaceCard } from "@/shared/ui";

type RepositoryTab = "products" | "categories";

const emptyProductForm = {
    name: "",
    detailTitle: "",
    categoryId: "",
    regionId: "",
    shortDescription: "",
    description: "",
    price: "0",
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
    const products = useCatalogStore((state) => state.products);
    const categories = useCatalogStore((state) => state.categories);
    const regions = useCatalogStore((state) => state.regions);
    const createCategory = useCatalogStore((state) => state.createCategory);
    const updateCategory = useCatalogStore((state) => state.updateCategory);
    const deleteCategory = useCatalogStore((state) => state.deleteCategory);
    const createProduct = useCatalogStore((state) => state.createProduct);
    const updateProduct = useCatalogStore((state) => state.updateProduct);
    const deleteProduct = useCatalogStore((state) => state.deleteProduct);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    const filteredProducts = useMemo(
        () =>
            products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())),
        [products, query],
    );
    const filteredCategories = useMemo(
        () =>
            categories.filter((category) =>
                category.name.toLowerCase().includes(query.toLowerCase()),
            ),
        [categories, query],
    );
    const activeProduct =
        filteredProducts.find((product) => product.id === activeProductId) ?? filteredProducts[0];
    const activeCategory =
        filteredCategories.find((category) => category.id === activeCategoryId) ??
        filteredCategories[0];

    useEffect(() => {
        if (!activeProduct) return;

        setActiveProductId(activeProduct.id);
        setProductForm({
            name: activeProduct.name,
            detailTitle: activeProduct.detailTitle,
            categoryId: activeProduct.categoryId,
            regionId: activeProduct.regionId,
            shortDescription: activeProduct.shortDescription,
            description: activeProduct.description,
            price: String(activeProduct.price),
        });
    }, [activeProduct]);

    useEffect(() => {
        if (!activeCategory) return;

        setActiveCategoryId(activeCategory.id);
        setCategoryForm({
            name: activeCategory.name,
            description: activeCategory.description,
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
            helperText: "toàn bộ dữ liệu đang được quản trị trong runtime",
        },
        {
            id: "repository-categories",
            label: "Danh mục hoạt động",
            value: `${categories.length}`,
            tone: "secondary" as const,
            icon: "category",
            delta: `${regions.length} vùng nguồn gốc`,
            helperText: "được dùng để nhóm catalog storefront",
        },
        {
            id: "repository-lowstock",
            label: "SKU cần theo dõi",
            value: `${products.filter((product) => product.stockStatus !== "in-stock").length}`,
            tone: "danger" as const,
            icon: "warning",
            delta: "Theo trạng thái catalog",
            helperText: "dựa trên nhãn stock status hiện tại",
        },
    ];

    function updateProductField<K extends keyof typeof emptyProductForm>(
        key: K,
        value: (typeof emptyProductForm)[K],
    ) {
        setProductForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function updateCategoryField<K extends keyof typeof emptyCategoryForm>(
        key: K,
        value: (typeof emptyCategoryForm)[K],
    ) {
        setCategoryForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function handleCreateProduct() {
        if (
            productForm.name.trim().length === 0 ||
            productForm.detailTitle.trim().length === 0 ||
            productForm.categoryId.length === 0 ||
            productForm.regionId.length === 0
        ) {
            pushToast({
                tone: "warning",
                message: "Vui lòng nhập đủ tên, tiêu đề chi tiết, danh mục và vùng.",
            });
            return;
        }

        const createdProduct = createProduct({
            name: productForm.name,
            detailTitle: productForm.detailTitle,
            categoryId: productForm.categoryId,
            regionId: productForm.regionId,
            description: productForm.description,
            shortDescription: productForm.shortDescription,
            price: Number(productForm.price),
        });

        setActiveProductId(createdProduct.id);
        pushToast({
            tone: "success",
            message: `Đã tạo sản phẩm ${createdProduct.name}.`,
        });
    }

    function handleUpdateProduct() {
        if (!activeProduct) return;

        updateProduct(activeProduct.id, {
            name: productForm.name.trim(),
            detailTitle: productForm.detailTitle.trim(),
            categoryId: productForm.categoryId,
            regionId: productForm.regionId,
            shortDescription: productForm.shortDescription.trim(),
            description: productForm.description.trim(),
            price: Number(productForm.price),
        });

        pushToast({
            tone: "success",
            message: `Đã cập nhật sản phẩm ${productForm.name.trim()}.`,
        });
    }

    function handleDeleteProduct() {
        if (!activeProduct) return;

        deleteProduct(activeProduct.id);
        setActiveProductId("");
        setProductForm(emptyProductForm);
        pushToast({
            tone: "warning",
            message: `Đã xoá sản phẩm ${activeProduct.name}.`,
        });
    }

    function handleCreateCategory() {
        if (categoryForm.name.trim().length === 0 || categoryForm.description.trim().length === 0) {
            pushToast({
                tone: "warning",
                message: "Vui lòng nhập tên và mô tả danh mục.",
            });
            return;
        }

        const category = createCategory(categoryForm.name, categoryForm.description);
        setActiveCategoryId(category.id);
        pushToast({
            tone: "success",
            message: `Đã tạo danh mục ${category.name}.`,
        });
    }

    function handleUpdateCategory() {
        if (!activeCategory) return;

        updateCategory(activeCategory.id, {
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim(),
        });
        pushToast({
            tone: "success",
            message: `Đã cập nhật danh mục ${categoryForm.name.trim()}.`,
        });
    }

    function handleDeleteCategory() {
        if (!activeCategory) return;

        const deleted = deleteCategory(activeCategory.id);

        if (!deleted) {
            pushToast({
                tone: "warning",
                message: "Không thể xoá danh mục đang còn sản phẩm liên kết.",
            });
            return;
        }

        setActiveCategoryId("");
        setCategoryForm(emptyCategoryForm);
        pushToast({
            tone: "warning",
            message: `Đã xoá danh mục ${activeCategory.name}.`,
        });
    }

    return (
        <div className="space-y-8">
            <section className="space-y-1">
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Kho dữ liệu sản phẩm
                </h2>
                <p className="text-on-surface-variant">
                    Tạo, cập nhật và xoá sản phẩm hoặc danh mục ngay trên runtime state của ứng
                    dụng.
                </p>
            </section>

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
                placeholder="Lọc trong kho dữ liệu..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />

            {tab === "products" ? (
                <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                    <SurfaceCard className="space-y-4">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                className={`w-full rounded-3xl p-4 text-left transition ${
                                    product.id === activeProduct?.id
                                        ? "bg-primary/5"
                                        : "bg-surface-container-low hover:bg-surface-container"
                                }`}
                                onClick={() => setActiveProductId(product.id)}
                            >
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    {product.regionName}
                                </p>
                                <h3 className="mt-2 font-headline text-xl font-semibold">
                                    {product.name}
                                </h3>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    {product.shortDescription}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                        {product.categoryName}
                                    </span>
                                    <span className="rounded-full bg-surface-container-highest px-3 py-1 text-on-surface-variant">
                                        {stockStatusLabels[product.stockStatus]}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <div>
                            <h3 className="font-headline text-2xl font-bold">Biểu mẫu sản phẩm</h3>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                Chỉnh sửa sản phẩm đang chọn hoặc nhập dữ liệu mới để tạo bản ghi
                                mới.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Tên sản phẩm"
                                value={productForm.name}
                                onChange={(event) => updateProductField("name", event.target.value)}
                            />
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Tiêu đề chi tiết"
                                value={productForm.detailTitle}
                                onChange={(event) =>
                                    updateProductField("detailTitle", event.target.value)
                                }
                            />
                            <select
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                                value={productForm.categoryId}
                                onChange={(event) =>
                                    updateProductField("categoryId", event.target.value)
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
                                value={productForm.regionId}
                                onChange={(event) =>
                                    updateProductField("regionId", event.target.value)
                                }
                            >
                                <option value="">Chọn vùng</option>
                                {regions.map((region) => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                                placeholder="Mô tả ngắn"
                                value={productForm.shortDescription}
                                onChange={(event) =>
                                    updateProductField("shortDescription", event.target.value)
                                }
                            />
                            <textarea
                                className="min-h-28 rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                                placeholder="Mô tả đầy đủ"
                                value={productForm.description}
                                onChange={(event) =>
                                    updateProductField("description", event.target.value)
                                }
                            />
                            <input
                                className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                placeholder="Giá bán"
                                type="number"
                                min={0}
                                value={productForm.price}
                                onChange={(event) =>
                                    updateProductField("price", event.target.value)
                                }
                            />
                        </div>
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button variant="secondary" onClick={handleCreateProduct}>
                                Tạo sản phẩm
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleUpdateProduct}
                                disabled={!activeProduct}
                            >
                                Lưu chỉnh sửa
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleDeleteProduct}
                                disabled={!activeProduct}
                            >
                                Xoá sản phẩm
                            </Button>
                        </div>
                    </SurfaceCard>
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                    <SurfaceCard className="space-y-4">
                        {filteredCategories.map((category) => (
                            <button
                                key={category.id}
                                className={`w-full rounded-3xl p-4 text-left transition ${
                                    category.id === activeCategory?.id
                                        ? "bg-primary/5"
                                        : "bg-surface-container-low hover:bg-surface-container"
                                }`}
                                onClick={() => setActiveCategoryId(category.id)}
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
                            <h3 className="font-headline text-2xl font-bold">Biểu mẫu danh mục</h3>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                Cập nhật cấu trúc catalog hoặc tạo danh mục mới cho storefront.
                            </p>
                        </div>
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Tên danh mục"
                            value={categoryForm.name}
                            onChange={(event) => updateCategoryField("name", event.target.value)}
                        />
                        <textarea
                            className="min-h-28 rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Mô tả danh mục"
                            value={categoryForm.description}
                            onChange={(event) =>
                                updateCategoryField("description", event.target.value)
                            }
                        />
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button variant="secondary" onClick={handleCreateCategory}>
                                Tạo danh mục
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleUpdateCategory}
                                disabled={!activeCategory}
                            >
                                Lưu chỉnh sửa
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleDeleteCategory}
                                disabled={!activeCategory}
                            >
                                Xoá danh mục
                            </Button>
                        </div>
                    </SurfaceCard>
                </div>
            )}
        </div>
    );
}
