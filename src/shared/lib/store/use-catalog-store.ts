import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Category, Product, Region, Review } from "@/entities/product/model/types";
import type { NewsletterSubscription } from "@/entities/user/model/types";
import {
    categories as seedCategories,
    products as seedProducts,
    regions as seedRegions,
    reviews as seedReviews,
} from "@/shared/api/mock-data";

interface ProductInput {
    name: string;
    detailTitle: string;
    categoryId: string;
    regionId: string;
    description: string;
    shortDescription: string;
    price: number;
}

interface ReviewInput {
    productId: string;
    author: string;
    rating: number;
    title: string;
    body: string;
    media?: Review["media"];
}

interface CatalogState {
    categories: Category[];
    regions: Region[];
    products: Product[];
    reviews: Review[];
    newsletterSubscriptions: NewsletterSubscription[];
    nextProductSequence: number;
    nextCategorySequence: number;
    nextReviewSequence: number;
    nextNewsletterSequence: number;
    createCategory: (name: string, description: string) => Category;
    updateCategory: (categoryId: string, updates: Partial<Category>) => void;
    deleteCategory: (categoryId: string) => boolean;
    createProduct: (input: ProductInput) => Product;
    updateProduct: (productId: string, updates: Partial<Product>) => void;
    deleteProduct: (productId: string) => void;
    addReview: (input: ReviewInput) => Review;
    subscribeNewsletter: (email: string, source: string) => NewsletterSubscription;
    reset: () => void;
}

function slugify(input: string) {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getCategory(state: Pick<CatalogState, "categories">, categoryId: string) {
    return state.categories.find((category) => category.id === categoryId);
}

function getRegion(state: Pick<CatalogState, "regions">, regionId: string) {
    return state.regions.find((region) => region.id === regionId);
}

function syncProductRating(products: Product[], reviews: Review[], productId: string) {
    const productReviews = reviews.filter((review) => review.productId === productId);
    const rating =
        productReviews.length > 0
            ? Number(
                  (
                      productReviews.reduce((sum, review) => sum + review.rating, 0) /
                      productReviews.length
                  ).toFixed(1),
              )
            : 0;

    return products.map((product) =>
        product.id === productId
            ? {
                  ...product,
                  rating,
                  reviewCount: productReviews.length,
              }
            : product,
    );
}

const initialState = {
    categories: seedCategories,
    regions: seedRegions,
    products: seedProducts,
    reviews: seedReviews,
    newsletterSubscriptions: [] as NewsletterSubscription[],
    nextProductSequence: 1,
    nextCategorySequence: 1,
    nextReviewSequence: 100,
    nextNewsletterSequence: 1,
};

export const useCatalogStore = create<CatalogState>()(
    persist(
        (set, get) => ({
            ...initialState,
            createCategory: (name, description) => {
                const category: Category = {
                    id: `cat-custom-${get().nextCategorySequence}`,
                    name: name.trim(),
                    description: description.trim(),
                };

                set((state) => ({
                    categories: [...state.categories, category],
                    nextCategorySequence: state.nextCategorySequence + 1,
                }));

                return category;
            },
            updateCategory: (categoryId, updates) => {
                set((state) => ({
                    categories: state.categories.map((category) =>
                        category.id === categoryId ? { ...category, ...updates } : category,
                    ),
                    products: state.products.map((product) =>
                        product.categoryId === categoryId && updates.name
                            ? { ...product, categoryName: updates.name }
                            : product,
                    ),
                }));
            },
            deleteCategory: (categoryId) => {
                if (get().products.some((product) => product.categoryId === categoryId)) {
                    return false;
                }

                set((state) => ({
                    categories: state.categories.filter((category) => category.id !== categoryId),
                }));

                return true;
            },
            createProduct: (input) => {
                const category = getCategory(get(), input.categoryId);
                const region = getRegion(get(), input.regionId);
                const sequence = get().nextProductSequence;
                const fallbackImage =
                    seedProducts[sequence % seedProducts.length]?.image ?? seedProducts[0].image;

                const product: Product = {
                    id: `prod-custom-${sequence}`,
                    slug: slugify(input.name),
                    name: input.name.trim(),
                    detailTitle: input.detailTitle.trim(),
                    subtitle: input.shortDescription.trim(),
                    categoryId: input.categoryId,
                    categoryName: category?.name ?? input.categoryId,
                    regionId: input.regionId,
                    regionName: region?.name ?? input.regionId,
                    description: input.description.trim(),
                    shortDescription: input.shortDescription.trim(),
                    price: input.price,
                    rating: 0,
                    reviewCount: 0,
                    stockStatus: "in-stock",
                    image: fallbackImage,
                    gallery: [
                        {
                            src: fallbackImage,
                            alt: input.name.trim(),
                        },
                    ],
                    origin: `${region?.name ?? "Việt Nam"}`,
                    weight: "500g",
                    shelfLife: "12 tháng",
                    certifications: ["Demo"],
                    shippingNotice: {
                        title: "Giao hàng tiêu chuẩn",
                        description: "Sản phẩm mới được thêm từ khu quản trị demo.",
                    },
                    sourcing: {
                        title: "Thông tin nguồn gốc",
                        body: input.description.trim(),
                        certificationCards: [
                            {
                                icon: "verified",
                                title: "Dữ liệu demo",
                                description: "Có thể chỉnh sửa tiếp trong khu quản trị.",
                            },
                        ],
                    },
                    heritageCommitments: [
                        {
                            icon: "eco",
                            text: "Thông tin cam kết có thể được cập nhật sau.",
                        },
                    ],
                };

                set((state) => ({
                    products: [product, ...state.products],
                    nextProductSequence: state.nextProductSequence + 1,
                }));

                return product;
            },
            updateProduct: (productId, updates) => {
                set((state) => ({
                    products: state.products.map((product) => {
                        if (product.id !== productId) return product;

                        const nextCategory = updates.categoryId
                            ? getCategory(state, updates.categoryId)
                            : undefined;
                        const nextRegion = updates.regionId
                            ? getRegion(state, updates.regionId)
                            : undefined;

                        return {
                            ...product,
                            ...updates,
                            categoryName:
                                nextCategory?.name ?? updates.categoryName ?? product.categoryName,
                            regionName:
                                nextRegion?.name ?? updates.regionName ?? product.regionName,
                            slug:
                                updates.name && updates.name !== product.name
                                    ? slugify(updates.name)
                                    : product.slug,
                        };
                    }),
                }));
            },
            deleteProduct: (productId) => {
                set((state) => ({
                    products: state.products.filter((product) => product.id !== productId),
                    reviews: state.reviews.filter((review) => review.productId !== productId),
                }));
            },
            addReview: (input) => {
                const review: Review = {
                    id: `rev-${get().nextReviewSequence}`,
                    productId: input.productId,
                    author: input.author,
                    rating: input.rating,
                    title: input.title.trim(),
                    body: input.body.trim(),
                    date: new Date().toISOString().slice(0, 10),
                    verified: true,
                    media: input.media,
                };

                set((state) => {
                    const nextReviews = [review, ...state.reviews];

                    return {
                        reviews: nextReviews,
                        products: syncProductRating(state.products, nextReviews, input.productId),
                        nextReviewSequence: state.nextReviewSequence + 1,
                    };
                });

                return review;
            },
            subscribeNewsletter: (email, source) => {
                const subscription: NewsletterSubscription = {
                    id: `newsletter-${get().nextNewsletterSequence}`,
                    email: email.trim(),
                    source,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    newsletterSubscriptions: [
                        subscription,
                        ...state.newsletterSubscriptions.filter(
                            (item) => item.email.toLowerCase() !== subscription.email.toLowerCase(),
                        ),
                    ],
                    nextNewsletterSequence: state.nextNewsletterSequence + 1,
                }));

                return subscription;
            },
            reset: () => set(initialState),
        }),
        {
            name: "heritage-catalog-store",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
