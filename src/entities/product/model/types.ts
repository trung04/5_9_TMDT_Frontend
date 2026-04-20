export type ProductStockStatus = "in-stock" | "low-stock" | "preorder";

export interface Category {
    id: string;
    name: string;
    description: string;
}

export interface Region {
    id: string;
    name: string;
    description: string;
}

export interface Product {
    id: string;
    slug: string;
    name: string;
    detailTitle: string;
    subtitle: string;
    categoryId: string;
    categoryName: string;
    regionId: string;
    regionName: string;
    description: string;
    shortDescription: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    stockStatus: ProductStockStatus;
    badge?: string;
    tag?: string;
    image: string;
    gallery: ProductMedia[];
    origin: string;
    weight: string;
    shelfLife: string;
    certifications: string[];
    shippingNotice: ProductCallout;
    sourcing: ProductSourcingContent;
    heritageCommitments: ProductCommitment[];
}

export interface Review {
    id: string;
    productId: string;
    author: string;
    rating: number;
    title: string;
    body: string;
    date: string;
    verified: boolean;
    media?: ProductMedia[];
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface ProductMedia {
    src: string;
    alt: string;
}

export interface ProductCallout {
    title: string;
    description: string;
}

export interface ProductCertificationCard {
    icon: string;
    title: string;
    description: string;
}

export interface ProductSourcingContent {
    title: string;
    body: string;
    certificationCards: ProductCertificationCard[];
}

export interface ProductCommitment {
    icon: string;
    text: string;
}
