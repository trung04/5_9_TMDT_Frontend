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
        filteredProducts.find((product) => String(product.id) === activeProductId) ?? filteredProducts[0];
    const activeCategory =
        filteredCategories.find((category) => String(category.id) === activeCategoryId) ?? filteredCategories[0];

    useEffect(() => {
        if (!activeProduct) return;

        setActiveProductId(String(activeProduct.id));
        setProductForm({
            name: activeProduct.name,
            sku: activeProduct.sku,
            categoryId: String(activeProduct.category_id),
            supplierId: activeProduct.supplier_id ? String(activeProduct.supplier_id) : "",
            description: activeProduct.description ?? "",
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
            label: "Tong san pham",
            value: `${products.length}`,
            tone: "primary" as const,
            icon: "inventory_2",
            delta: `${filteredProducts.length} san pham dang hien thi`,
            
        },
        {
            id: "repository-categories",
            label: "Danh muc storefront",
            value: `${categories.length}`,
            tone: "secondary" as const,
            icon: "category",
            delta: `${suppliers.length} nha cung cap dang hoat dong`,
            
        },
        {
            id: "repository-inactive",
            label: "San pham tam an",
            value: `${products.filter((product) => !product.is_active).length}`,
            tone: "danger" as const,
            icon: "visibility_off",
            delta: "Khach hang se khong thay cac san pham nay",
            
        },
    ];

    async function handleCreateProduct() {
        const salePrice = Number(productForm.salePrice);
        const stockQuantity = Number(productForm.stockQuantity);

        if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.categoryId) {
            pushToast({ tone: "warning", message: "Can nhap ten, SKU va danh muc cho san pham." });
            return;
        }

        const result = await createProduct({
            category_id: Number(productForm.categoryId),
            supplier_id: productForm.supplierId ? Number(productForm.supplierId) : null,
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            description: productForm.description.trim(),
            sale_price: Number.isFinite(salePrice) ? salePrice : 0,
            stock_quantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
            is_active: productForm.isActive,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the tao san pham." });
            return;
        }

        setActiveProductId(String(result.data.id));
        pushToast({ tone: "success", message: `Da tao san pham ${result.data.name}.` });
    }

    async function handleUpdateProduct() {
        if (!activeProduct) return;

        const result = await updateProduct(activeProduct.id, {
            category_id: Number(productForm.categoryId),
            supplier_id: productForm.supplierId ? Number(productForm.supplierId) : null,
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            description: productForm.description.trim(),
            sale_price: Number(productForm.salePrice),
            stock_quantity: Number(productForm.stockQuantity),
            is_active: productForm.isActive,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat san pham." });
            return;
        }

        pushToast({ tone: "success", message: `Da cap nhat san pham ${result.data.name}.` });
    }

    async function handleDeleteProduct() {
        if (!activeProduct) return;

        const result = await deleteProduct(activeProduct.id);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the xoa san pham." });
            return;
        }

        setActiveProductId("");
        setProductForm(emptyProductForm);
        pushToast({ tone: "success", message: `Da xoa san pham ${activeProduct.name}.` });
    }

    async function handleCreateCategory() {
        if (!categoryForm.name.trim()) {
            pushToast({ tone: "warning", message: "Can nhap ten danh muc." });
            return;
        }

        const result = await createCategory({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim(),
            is_active: true,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the tao danh muc." });
            return;
        }

        setActiveCategoryId(String(result.data.id));
        pushToast({ tone: "success", message: `Da tao danh muc ${result.data.name}.` });
    }

    async function handleUpdateCategory() {
        if (!activeCategory) return;

        const result = await updateCategory(activeCategory.id, {
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim(),
            is_active: true,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat danh muc." });
            return;
        }

        pushToast({ tone: "success", message: `Da cap nhat danh muc ${result.data.name}.` });
    }

    async function handleDeleteCategory() {
        if (!activeCategory) return;

        const result = await deleteCategory(activeCategory.id);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the xoa danh muc." });
            return;
        }

        setActiveCategoryId("");
        setCategoryForm(emptyCategoryForm);
        pushToast({ tone: "success", message: `Da an danh muc ${activeCategory.name}.` });
    }

    return (
        <div className="space-y-8">
            <section className="grid gap-6 xl:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

            <div className="flex gap-3">
                <button className={`rounded-full px-4 py-2 text-sm font-medium ${tab === "products" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`} onClick={() => setTab("products")}>San pham</button>
                <button className={`rounded-full px-4 py-2 text-sm font-medium ${tab === "categories" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`} onClick={() => setTab("categories")}>Danh muc</button>
            </div>

            <input className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15" placeholder="Loc theo ten, SKU, danh muc hoac nha cung cap..." value={query} onChange={(event) => setQuery(event.target.value)} />

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            {tab === "products" ? (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <SurfaceCard className="space-y-4">
                        {isLoading ? <p className="text-sm text-on-surface-variant">Dang tai san pham...</p> : null}
                        {!isLoading && filteredProducts.length === 0 ? <p className="text-sm text-on-surface-variant">Khong co san pham phu hop bo loc hien tai.</p> : null}
                        {filteredProducts.map((product) => (
                            <button key={product.id} className={`w-full rounded-3xl p-4 text-left transition ${product.id === activeProduct?.id ? "bg-primary/5" : "bg-surface-container-low hover:bg-surface-container"}`} onClick={() => setActiveProductId(String(product.id))}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">{product.sku}</p>
                                    <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs text-on-surface-variant">{product.is_active ? "Dang ban" : "Tam an"}</span>
                                </div>
                                <h3 className="mt-2 font-headline text-xl font-semibold">{product.name}</h3>
                                <p className="mt-2 text-sm text-on-surface-variant">{product.category?.name ?? `Danh muc #${product.category_id}`} - {product.supplier?.name ?? "Chua gan nha cung cap"}</p>
                                <p className="mt-3 text-sm font-semibold text-primary">{formatCurrency(Number(product.sale_price))}</p>
                                <p className="mt-1 text-sm text-on-surface-variant">Ton kho: {product.stock_quantity}</p>
                            </button>
                        ))}
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <div>
                            <h3 className="font-headline text-2xl font-bold">Nội dung sản phẩm</h3>
                            
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <input className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15" placeholder="Ten san pham" value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} />
                            <input className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15" placeholder="SKU" value={productForm.sku} onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))} />
                            <select className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none" value={productForm.categoryId} onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Chon danh muc</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                            <select className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none" value={productForm.supplierId} onChange={(event) => setProductForm((current) => ({ ...current, supplierId: event.target.value }))}><option value="">Khong gan nha cung cap</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>
                            <input className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15" placeholder="Gia ban" type="number" min={0} value={productForm.salePrice} onChange={(event) => setProductForm((current) => ({ ...current, salePrice: event.target.value }))} />
                            <input className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15" placeholder="So luong ton" type="number" min={0} value={productForm.stockQuantity} onChange={(event) => setProductForm((current) => ({ ...current, stockQuantity: event.target.value }))} />
                            <textarea className="min-h-28 resize-none rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2" placeholder="Mo ta san pham" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} />
                            <label className="md:col-span-2 flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface-variant"><input type="checkbox" checked={productForm.isActive} onChange={(event) => setProductForm((current) => ({ ...current, isActive: event.target.checked }))} />San pham dang hoat dong tren storefront</label>
                        </div>
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button variant="secondary" onClick={() => void handleCreateProduct()} disabled={isSaving}>Tao san pham</Button>
                            <Button variant="outline" onClick={() => void handleUpdateProduct()} disabled={!activeProduct || isSaving}>Luu chinh sua</Button>
                            <Button variant="ghost" onClick={() => void handleDeleteProduct()} disabled={!activeProduct || isSaving}>Xoa san pham</Button>
                        </div>
                    </SurfaceCard>
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <SurfaceCard className="space-y-4">
                        {isLoading ? <p className="text-sm text-on-surface-variant">Dang tai danh muc...</p> : null}
                        {!isLoading && filteredCategories.length === 0 ? <p className="text-sm text-on-surface-variant">Khong co danh muc phu hop bo loc hien tai.</p> : null}
                        {filteredCategories.map((category) => (
                            <button key={category.id} className={`w-full rounded-3xl p-4 text-left transition ${category.id === activeCategory?.id ? "bg-primary/5" : "bg-surface-container-low hover:bg-surface-container"}`} onClick={() => setActiveCategoryId(String(category.id))}>
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Danh muc</p>
                                <h3 className="mt-2 font-headline text-xl font-semibold">{category.name}</h3>
                                <p className="mt-2 text-sm text-on-surface-variant">{category.description}</p>
                            </button>
                        ))}
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <div>
                            <h3 className="font-headline text-2xl font-bold">Nội dung danh mục</h3>
                            
                        </div>
                        <input className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15" placeholder="Ten danh muc" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} />
                        <textarea className="min-h-28 w-full resize-none rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15" placeholder="Mo ta danh muc" value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} />
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button variant="secondary" onClick={() => void handleCreateCategory()} disabled={isSaving}>Tao danh muc</Button>
                            <Button variant="outline" onClick={() => void handleUpdateCategory()} disabled={!activeCategory || isSaving}>Luu chinh sua</Button>
                            <Button variant="ghost" onClick={() => void handleDeleteCategory()} disabled={!activeCategory || isSaving}>An danh muc</Button>
                        </div>
                    </SurfaceCard>
                </div>
            )}
        </div>
    );
}
