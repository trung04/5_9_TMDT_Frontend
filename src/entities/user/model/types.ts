export type UserRole = "customer" | "admin" | "supplier" | "warehouse";
export type AuthSource = "backend" | "demo";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    adminRole?: {
        id: string;
        name: string;
        slug: string;
        isSuper: boolean;
    } | null;
    permissions?: string[];
}

export interface AuthSession {
    user: AuthUser;
    loggedInAt: string;
}

export interface RolePermission {
    role: UserRole;
    redirectTo: string;
}

export interface DemoCredential {
    id: string;
    role: UserRole;
    displayName: string;
    email: string;
    password: string;
    redirectTo: string;
}

export interface UserAddress {
    id: string;
    label: string;
    recipient: string;
    phone: string;
    line1: string;
    city: string;
    note?: string;
    isDefault: boolean;
}

export interface RewardRedemption {
    id: string;
    title: string;
    pointsUsed: number;
    createdAt: string;
    status: string;
}

export interface AccountNotification {
    id: string;
    title: string;
    message: string;
    channel: string;
    status: string;
    sentAt: string;
    readAt: string;
    createdAt: string;
}

export interface AccountComplaint {
    id: string;
    reason: string;
    content: string;
    imageUrl: string;
    status: string;
    resolutionNote: string;
    createdAt: string;
    orderId: string;
    orderNo: string;
    orderStatus: string;
    orderTotalAmount: number;
    productId: string;
    productName: string;
    productSku: string;
    resolverName: string;
}

export interface NewsletterSubscription {
    id: string;
    email: string;
    source: string;
    createdAt: string;
}

export interface SupportTicket {
    id: string;
    subject: string;
    message: string;
    channel: "supplier" | "warehouse";
    createdAt: string;
    status: "open" | "resolved";
}

export interface SupplierInvitation {
    id: string;
    supplierName: string;
    contactName: string;
    email: string;
    categories: string[];
    note: string;
    createdAt: string;
    status: "draft" | "sent";
}

export interface RewardSnapshot {
    tier: string;
    points: number;
    nextTierPoints: number;
    perks: string[];
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    favoriteRegion: string;
    avatar: string;
    memberSince: string;
    newsletter: boolean;
    smsAlerts: boolean;
    orderEmail: boolean;
    securityAlerts: boolean;
    addresses: UserAddress[];
    rewardHistory: RewardRedemption[];
}

export interface CustomerRecord {
    id: string;
    name: string;
    location: string;
    orders: number;
    totalSpend: number;
    status: "loyal" | "new" | "at-risk";
}

export interface SupplierPartner {
    id: string;
    name: string;
    location: string;
    contactName: string;
    categories: string[];
    partnerTier: string;
    monthlyRevenue: number;
    responseTime: string;
    status: "active" | "reviewing";
    image: string;
}
