import { useEffect, useMemo, useState } from "react";

import { formatCurrency } from "@/shared/lib/format";
import { hasAdminPermission } from "@/shared/lib/auth";
import { useAdminCatalogStore } from "@/shared/lib/store/use-admin-catalog-store";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, StatCard, SurfaceCard } from "@/shared/ui";

type RepositoryTab = "products" | "categories" | "suppliers";

interface AdminRepositoryPageProps {
    initialTab?: RepositoryTab;
    lockedTab?: RepositoryTab;
}

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

const emptySupplierForm = {
    supplierCode: "",
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    isActive: true,
};

export function AdminRepositoryPage({
    initialTab = "products",
    lockedTab,
}: AdminRepositoryPageProps = {}) {
    const [tab, setTab] = useState<RepositoryTab>(lockedTab ?? initialTab);
    const [query, setQuery] = useState("");
    const [activeProductId, setActiveProductId] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("");
    const [activeSupplierId, setActiveSupplierId] = useState("");
    const [productForm, setProductForm] = useState(emptyProductForm);
    const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
    const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
    const user = useAuthStore((state) => state.session?.user ?? null);
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
    const createSupplier = useAdminCatalogStore((state) => state.createSupplier);
    const updateSupplier = useAdminCatalogStore((state) => state.updateSupplier);
    const deleteSupplier = useAdminCatalogStore((state) => state.deleteSupplier);
    const pushToast = useFeedbackStore((state) => state.pushToast);

    const canViewProducts = hasAdminPermission(user, "admin.products.view");
    const canCreateProduct = hasAdminPermission(user, "admin.products.create");
    const canUpdateProduct = hasAdminPermission(user, "admin.products.update");
    const canDeleteProduct = hasAdminPermission(user, "admin.products.delete");
    const canCreateCategory = hasAdminPermission(user, "admin.categories.create");
    const canUpdateCategory = hasAdminPermission(user, "admin.categories.update");
    const canDeleteCategory = hasAdminPermission(user, "admin.categories.delete");
    const canCreateSupplier = hasAdminPermission(user, "admin.suppliers.create");
    const canUpdateSupplier = hasAdminPermission(user, "admin.suppliers.update");
    const canDeleteSupplier = hasAdminPermission(user, "admin.suppliers.delete");

    const visibleTabs = useMemo(() => {
        const tabs = [
                {
                    id: "products" as const,
                    label: "San pham",
                    visible:
                        canViewProducts ||
                        canCreateProduct ||
                        canUpdateProduct ||
                        canDeleteProduct,
                },
                {
                    id: "categories" as const,
                    label: "Danh muc",
                    visible: canCreateCategory || canUpdateCategory || canDeleteCategory,
                },
                {
                    id: "suppliers" as const,
                    label: "Nha cung cap",
                    visible: canCreateSupplier || canUpdateSupplier || canDeleteSupplier,
                },
            ].filter((item) => item.visible);

        return lockedTab ? tabs.filter((item) => item.id === lockedTab) : tabs;
    },
        [
            canCreateCategory,
            canCreateProduct,
            canCreateSupplier,
            canDeleteCategory,
            canDeleteProduct,
            canDeleteSupplier,
            canUpdateCategory,
            canUpdateProduct,
            canUpdateSupplier,
            canViewProducts,
            lockedTab,
        ],
    );

    useEffect(() => {
        void loadData({ includeProducts: canViewProducts });
    }, [canViewProducts, loadData]);

    useEffect(() => {
        if (lockedTab) {
            setTab(lockedTab);
            return;
        }

        if (visibleTabs.length > 0 && !visibleTabs.some((item) => item.id === tab)) {
            setTab(visibleTabs[0].id);
        }
    }, [lockedTab, tab, visibleTabs]);

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

    const filteredSuppliers = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return suppliers.filter((supplier) => {
            if (keyword.length === 0) return true;

            return [
                supplier.supplier_code,
                supplier.name,
                supplier.contact_name,
                supplier.phone,
                supplier.email,
                supplier.address,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword);
        });
    }, [query, suppliers]);

    const activeProduct =
        activeProductId === "new"
            ? undefined
            : (filteredProducts.find((product) => String(product.id) === activeProductId) ??
              filteredProducts[0]);
    const activeCategory =
        activeCategoryId === "new"
            ? undefined
            : (filteredCategories.find((category) => String(category.id) === activeCategoryId) ??
              filteredCategories[0]);
    const activeSupplier =
        activeSupplierId === "new"
            ? undefined
            : (filteredSuppliers.find((supplier) => String(supplier.id) === activeSupplierId) ??
              filteredSuppliers[0]);

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

    useEffect(() => {
        if (!activeSupplier) return;

        setActiveSupplierId(String(activeSupplier.id));
        setSupplierForm({
            supplierCode: activeSupplier.supplier_code ?? "",
            name: activeSupplier.name,
            contactName: activeSupplier.contact_name ?? "",
            phone: activeSupplier.phone ?? "",
            email: activeSupplier.email ?? "",
            address: activeSupplier.address ?? "",
            isActive: activeSupplier.is_active ?? true,
        });
    }, [activeSupplier]);

    const stats = [
        {
            id: "repository-products",
            label: "Tong san pham",
            value: canViewProducts ? `${products.length}` : "-",
            tone: "primary" as const,
            icon: "inventory_2",
            delta: canViewProducts
                ? `${filteredProducts.length} san pham dang hien thi`
                : "Chua co quyen xem danh sach san pham",
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
            value: canViewProducts
                ? `${products.filter((product) => !product.is_active).length}`
                : "-",
            tone: "danger" as const,
            icon: "visibility_off",
            delta: "Khach hang se khong thay cac san pham nay",
        },
    ];

    function resetProductForm() {
        setActiveProductId("new");
        setProductForm(emptyProductForm);
    }

    function resetCategoryForm() {
        setActiveCategoryId("new");
        setCategoryForm(emptyCategoryForm);
    }

    function resetSupplierForm() {
        setActiveSupplierId("new");
        setSupplierForm(emptySupplierForm);
    }

    async function handleCreateProduct() {
        const salePrice = Number(productForm.salePrice);
        const stockQuantity = Number(productForm.stockQuantity);

        if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.categoryId) {
            pushToast({
                tone: "warning",
                message: "Can nhap ten, SKU va danh muc cho san pham.",
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
            image_url: productForm.imageUrl.trim() || null,
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

        resetProductForm();
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

        resetCategoryForm();
        pushToast({ tone: "success", message: `Da an danh muc ${activeCategory.name}.` });
    }

    async function handleCreateSupplier() {
        if (!supplierForm.supplierCode.trim() || !supplierForm.name.trim() || !supplierForm.phone.trim()) {
            pushToast({ tone: "warning", message: "Can nhap ma, ten va so dien thoai nha cung cap." });
            return;
        }

        const result = await createSupplier({
            supplier_code: supplierForm.supplierCode.trim(),
            name: supplierForm.name.trim(),
            contact_name: supplierForm.contactName.trim() || null,
            phone: supplierForm.phone.trim(),
            email: supplierForm.email.trim() || null,
            address: supplierForm.address.trim() || null,
            is_active: supplierForm.isActive,
        });

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the tao nha cung cap." });
            return;
        }

        setActiveSupplierId(String(result.data.id));
        pushToast({ tone: "success", message: `Da tao nha cung cap ${result.data.name}.` });
    }

    async function handleUpdateSupplier() {
        if (!activeSupplier) return;

        const result = await updateSupplier(activeSupplier.id, {
            supplier_code: supplierForm.supplierCode.trim(),
            name: supplierForm.name.trim(),
            contact_name: supplierForm.contactName.trim() || null,
            phone: supplierForm.phone.trim(),
            email: supplierForm.email.trim() || null,
            address: supplierForm.address.trim() || null,
            is_active: supplierForm.isActive,
        });

        if (!result.success || !result.data) {
            pushToast({
                tone: "warning",
                message: result.error ?? "Khong the cap nhat nha cung cap.",
            });
            return;
        }

        pushToast({ tone: "success", message: `Da cap nhat nha cung cap ${result.data.name}.` });
    }

    async function handleDeleteSupplier() {
        if (!activeSupplier) return;

        const result = await deleteSupplier(activeSupplier.id);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the xoa nha cung cap." });
            return;
        }

        resetSupplierForm();
        pushToast({ tone: "success", message: `Da xoa nha cung cap ${activeSupplier.name}.` });
    }

    function renderProductTab() {
        return (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SurfaceCard className="space-y-4">
                    {!canViewProducts ? (
                        <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                            Ban chua co quyen xem danh sach san pham.
                        </p>
                    ) : null}
                    {isLoading && canViewProducts ? (
                        <p className="text-sm text-on-surface-variant">Dang tai san pham...</p>
                    ) : null}
                    {!isLoading && canViewProducts && filteredProducts.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                            Khong co san pham phu hop bo loc hien tai.
                        </p>
                    ) : null}
                    {canViewProducts
                        ? filteredProducts.map((product) => (
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
                                          {product.is_active ? "Dang ban" : "Tam an"}
                                      </span>
                                  </div>
                                  <h3 className="mt-2 font-headline text-xl font-semibold">
                                      {product.name}
                                  </h3>
                                  <p className="mt-2 text-sm text-on-surface-variant">
                                      {product.category?.name ?? `Danh muc #${product.category_id}`} -{" "}
                                      {product.supplier?.name ?? "Chua gan nha cung cap"}
                                  </p>
                                  <p className="mt-3 text-sm font-semibold text-primary">
                                      {formatCurrency(Number(product.sale_price))}
                                  </p>
                                  <p className="mt-1 text-sm text-on-surface-variant">
                                      Ton kho: {product.stock_quantity}
                                  </p>
                              </button>
                          ))
                        : null}
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-headline text-2xl font-bold">Noi dung san pham</h3>
                        <Button variant="outline" size="sm" onClick={resetProductForm}>
                            Tao moi
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Ten san pham"
                            value={productForm.name}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, name: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="SKU"
                            value={productForm.sku}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, sku: event.target.value }))
                            }
                        />
                        <select
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none"
                            value={productForm.categoryId}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, categoryId: event.target.value }))
                            }
                        >
                            <option value="">Chon danh muc</option>
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
                                setProductForm((current) => ({ ...current, supplierId: event.target.value }))
                            }
                        >
                            <option value="">Khong gan nha cung cap</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Gia ban"
                            type="number"
                            min={0}
                            value={productForm.salePrice}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, salePrice: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="So luong ton"
                            type="number"
                            min={0}
                            value={productForm.stockQuantity}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, stockQuantity: event.target.value }))
                            }
                        />
                        <textarea
                            className="min-h-28 resize-none rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                            placeholder="Mo ta san pham"
                            value={productForm.description}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, description: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15 md:col-span-2"
                            placeholder="URL hinh anh san pham"
                            value={productForm.imageUrl}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, imageUrl: event.target.value }))
                            }
                        />
                        <label className="flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface-variant md:col-span-2">
                            <input
                                type="checkbox"
                                checked={productForm.isActive}
                                onChange={(event) =>
                                    setProductForm((current) => ({ ...current, isActive: event.target.checked }))
                                }
                            />
                            San pham dang hoat dong tren storefront
                        </label>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => void handleCreateProduct()}
                            disabled={isSaving || !canCreateProduct}
                        >
                            Tao san pham
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => void handleUpdateProduct()}
                            disabled={!activeProduct || isSaving || !canUpdateProduct}
                        >
                            Luu chinh sua
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => void handleDeleteProduct()}
                            disabled={!activeProduct || isSaving || !canDeleteProduct}
                        >
                            Xoa san pham
                        </Button>
                    </div>
                </SurfaceCard>
            </div>
        );
    }

    function renderCategoryTab() {
        return (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SurfaceCard className="space-y-4">
                    {isLoading ? (
                        <p className="text-sm text-on-surface-variant">Dang tai danh muc...</p>
                    ) : null}
                    {!isLoading && filteredCategories.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                            Khong co danh muc phu hop bo loc hien tai.
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
                                Danh muc
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
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-headline text-2xl font-bold">Noi dung danh muc</h3>
                        <Button variant="outline" size="sm" onClick={resetCategoryForm}>
                            Tao moi
                        </Button>
                    </div>
                    <input
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Ten danh muc"
                        value={categoryForm.name}
                        onChange={(event) =>
                            setCategoryForm((current) => ({ ...current, name: event.target.value }))
                        }
                    />
                    <textarea
                        className="min-h-28 w-full resize-none rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Mo ta danh muc"
                        value={categoryForm.description}
                        onChange={(event) =>
                            setCategoryForm((current) => ({ ...current, description: event.target.value }))
                        }
                    />
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => void handleCreateCategory()}
                            disabled={isSaving || !canCreateCategory}
                        >
                            Tao danh muc
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => void handleUpdateCategory()}
                            disabled={!activeCategory || isSaving || !canUpdateCategory}
                        >
                            Luu chinh sua
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => void handleDeleteCategory()}
                            disabled={!activeCategory || isSaving || !canDeleteCategory}
                        >
                            An danh muc
                        </Button>
                    </div>
                </SurfaceCard>
            </div>
        );
    }

    function renderSupplierTab() {
        return (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SurfaceCard className="space-y-4">
                    {isLoading ? (
                        <p className="text-sm text-on-surface-variant">Dang tai nha cung cap...</p>
                    ) : null}
                    {!isLoading && filteredSuppliers.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">
                            Khong co nha cung cap phu hop bo loc hien tai.
                        </p>
                    ) : null}
                    {filteredSuppliers.map((supplier) => (
                        <button
                            key={supplier.id}
                            className={`w-full rounded-3xl p-4 text-left transition ${
                                supplier.id === activeSupplier?.id
                                    ? "bg-primary/5"
                                    : "bg-surface-container-low hover:bg-surface-container"
                            }`}
                            onClick={() => setActiveSupplierId(String(supplier.id))}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    {supplier.supplier_code ?? `SUP-${supplier.id}`}
                                </p>
                                <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs text-on-surface-variant">
                                    {supplier.is_active === false ? "Tam dung" : "Dang hoat dong"}
                                </span>
                            </div>
                            <h3 className="mt-2 font-headline text-xl font-semibold">
                                {supplier.name}
                            </h3>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {supplier.contact_name ?? "Chua co lien he"} - {supplier.phone ?? "Chua co SDT"}
                            </p>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {supplier.email ?? "Chua co email"}
                            </p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                {supplier.address ?? "Chua co dia chi"}
                            </p>
                        </button>
                    ))}
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-headline text-2xl font-bold">Noi dung nha cung cap</h3>
                        <Button variant="outline" size="sm" onClick={resetSupplierForm}>
                            Tao moi
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Ma nha cung cap"
                            value={supplierForm.supplierCode}
                            onChange={(event) =>
                                setSupplierForm((current) => ({
                                    ...current,
                                    supplierCode: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Ten nha cung cap"
                            value={supplierForm.name}
                            onChange={(event) =>
                                setSupplierForm((current) => ({ ...current, name: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Nguoi lien he"
                            value={supplierForm.contactName}
                            onChange={(event) =>
                                setSupplierForm((current) => ({
                                    ...current,
                                    contactName: event.target.value,
                                }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="So dien thoai"
                            value={supplierForm.phone}
                            onChange={(event) =>
                                setSupplierForm((current) => ({ ...current, phone: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Email"
                            value={supplierForm.email}
                            onChange={(event) =>
                                setSupplierForm((current) => ({ ...current, email: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Dia chi"
                            value={supplierForm.address}
                            onChange={(event) =>
                                setSupplierForm((current) => ({ ...current, address: event.target.value }))
                            }
                        />
                        <label className="flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface-variant md:col-span-2">
                            <input
                                type="checkbox"
                                checked={supplierForm.isActive}
                                onChange={(event) =>
                                    setSupplierForm((current) => ({
                                        ...current,
                                        isActive: event.target.checked,
                                    }))
                                }
                            />
                            Nha cung cap dang hoat dong
                        </label>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => void handleCreateSupplier()}
                            disabled={isSaving || !canCreateSupplier}
                        >
                            Tao nha cung cap
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => void handleUpdateSupplier()}
                            disabled={!activeSupplier || isSaving || !canUpdateSupplier}
                        >
                            Luu chinh sua
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => void handleDeleteSupplier()}
                            disabled={!activeSupplier || isSaving || !canDeleteSupplier}
                        >
                            Xoa nha cung cap
                        </Button>
                    </div>
                </SurfaceCard>
            </div>
        );
    }

    const activeTab = lockedTab ?? (visibleTabs.some((item) => item.id === tab) ? tab : visibleTabs[0]?.id);
    const pageMeta = {
        products: {
            title: "Products",
            description: "Quan ly product repository, gia ban, ton kho va nha cung cap theo mau admin.",
        },
        categories: {
            title: "Categories",
            description: "Quan ly category storefront va noi dung hien thi trong catalog.",
        },
        suppliers: {
            title: "Suppliers",
            description: "Quan ly ho so nha cung cap, lien he va trang thai hop tac.",
        },
    }[activeTab ?? "products"];

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                        Catalog / Management
                    </p>
                    <h1 className="mt-3 font-headline text-3xl font-bold text-on-surface">
                        {pageMeta.title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                        {pageMeta.description}
                    </p>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard key={stat.id} metric={stat} />
                ))}
            </section>

            {!lockedTab ? (
                <div className="flex flex-wrap gap-3">
                    {visibleTabs.map((item) => (
                        <button
                            key={item.id}
                            className={`rounded-full px-4 py-2 text-sm font-medium ${
                                activeTab === item.id
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container-low text-on-surface-variant"
                            }`}
                            onClick={() => setTab(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            ) : null}

            <input
                className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Loc theo ten, ma, danh muc hoac nha cung cap..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />

            {error ? <SurfaceCard className="text-sm text-error">{error}</SurfaceCard> : null}

            {visibleTabs.length === 0 ? (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Ban chua co quyen thao tac trong kho san pham.
                </SurfaceCard>
            ) : null}
            {activeTab === "products" ? renderProductTab() : null}
            {activeTab === "categories" ? renderCategoryTab() : null}
            {activeTab === "suppliers" ? renderSupplierTab() : null}
        </div>
    );
}
