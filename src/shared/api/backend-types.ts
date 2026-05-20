export interface BackendUser {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface BackendUserAddress {
    id: number;
    label: string;
    recipient: string;
    phone: string;
    line1: string;
    city: string;
    note: string | null;
    is_default: boolean;
}

export interface BackendRewardSnapshot {
    tier: string;
    points: number;
    next_tier_points: number;
    perks: string[];
}

export interface BackendRewardRedemption {
    id: number;
    title: string;
    points_used: number;
    status: string;
    created_at: string;
}

export interface BackendAccountProfile {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    city: string | null;
    favorite_region: string | null;
    avatar: string | null;
    member_since: string;
    newsletter: boolean;
    sms_alerts: boolean;
    order_email: boolean;
    security_alerts: boolean;
    addresses: BackendUserAddress[];
    reward_snapshot: BackendRewardSnapshot;
    reward_history: BackendRewardRedemption[];
}

export interface BackendAccountProfileResponse {
    message: string;
    data: BackendAccountProfile;
}

export interface BackendNotification {
    id: number;
    title: string;
    message: string;
    channel: string;
    status: string;
    sent_at: string | null;
    read_at: string | null;
    created_at: string | null;
}

export interface BackendNotificationsResponse {
    message: string;
    data: BackendNotification[];
}

export interface BackendNotificationResponse {
    message: string;
    data: BackendNotification;
}

export interface BackendComplaintOrderSnapshot {
    id: number;
    order_no: string;
    status: string;
    total_amount: number | string;
}

export interface BackendComplaintProductSnapshot {
    id: number;
    name: string;
    sku: string;
}

export interface BackendComplaintResolverSnapshot {
    id: number;
    full_name: string;
}

export interface BackendComplaint {
    id: number;
    reason: string;
    content: string;
    image_url: string | null;
    status: string;
    resolution_note: string | null;
    created_at: string;
    order: BackendComplaintOrderSnapshot | null;
    product: BackendComplaintProductSnapshot | null;
    resolver: BackendComplaintResolverSnapshot | null;
}

export interface BackendComplaintsResponse {
    message: string;
    data: BackendComplaint[];
}

export interface BackendComplaintResponse {
    message: string;
    data: BackendComplaint;
}

export interface BackendWishlistData {
    product_ids: number[];
    products: BackendProduct[];
}

export interface BackendWishlistResponse {
    message: string;
    data: BackendWishlistData;
}

export interface BackendCategory {
    id: number;
    name: string;
    description: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface BackendSupplier {
    id: number;
    supplier_code?: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface BackendProduct {
    id: number;
    category_id: number;
    supplier_id: number | null;
    sku: string;
    name: string;
    description: string;
    image_url?: string | null;
    sale_price: number | string;
    stock_quantity: number;
    is_active: boolean;
    category?: BackendCategory | null;
    supplier?: BackendSupplier | null;
    created_at?: string;
    updated_at?: string;
}

export interface BackendAuthResponse {
    message: string;
    access_token: string;
    token_type: string;
    expires_at?: string | null;
    user: BackendUser;
}

export interface BackendMeResponse {
    user: BackendUser;
    expires_at?: string | null;
}

export interface BackendProductListResponse {
    message: string;
    data: BackendProduct[];
}

export interface BackendProductDetailResponse {
    message: string;
    data: BackendProduct;
}

export interface BackendProductMutationResponse {
    message: string;
    data: BackendProduct;
}

export interface BackendCategoryListResponse {
    message: string;
    data: BackendCategory[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface BackendCategoryMutationResponse {
    message: string;
    data: BackendCategory;
}

export interface BackendSupplierListResponse {
    message: string;
    data: BackendSupplier[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface BackendAdminSettings {
    id: number;
    store_name: string;
    support_email: string | null;
    support_phone: string | null;
    low_stock_threshold: number;
    dashboard_refresh_seconds: number;
    order_auto_confirm: boolean;
    send_daily_summary: boolean;
    maintenance_mode: boolean;
    notes: string | null;
    updated_at: string | null;
}

export interface BackendAdminSettingsResponse {
    message: string;
    data: BackendAdminSettings;
}

export interface BackendCartItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
    product: BackendProduct;
    created_at?: string;
    updated_at?: string;
}

export interface BackendCart {
    id: number;
    status: string;
    item_count: number;
    total_quantity: number;
    subtotal: number | string;
    items: BackendCartItem[];
    created_at?: string;
    updated_at?: string;
}

export interface BackendCartResponse {
    message: string;
    data: BackendCart;
}

export interface BackendPayment {
    id: number;
    transaction_code: string | null;
    payment_method: string;
    payment_status: string;
    amount: number | string;
    gateway_name: string | null;
    gateway_reference: string | null;
    paid_at: string | null;
    raw_payload?: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
}

export interface BackendPaymentStatusHistory {
    id: number;
    payment_id: number;
    order_id: number;
    changed_by_user_id: number | null;
    from_status: string | null;
    to_status: string;
    note: string | null;
    changed_at: string;
}

export interface BackendOrderSummary {
    id: number;
    order_no: string;
    payment_method: string;
    status: string;
    subtotal: number | string;
    shipping_fee: number | string;
    discount_amount: number | string;
    total_amount: number | string;
    stock_deducted?: boolean;
    stock_deducted_at?: string | null;
    shipping_carrier?: string | null;
    shipping_code?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
    cancelled_at?: string | null;
    item_count: number;
    customer?: BackendUser | null;
    payment: BackendPayment | null;
    created_at: string;
    updated_at: string;
}

export interface BackendOrderItem {
    id: number;
    product_id: number;
    product_name_snapshot: string;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
    created_at?: string;
    updated_at?: string;
}

export interface BackendOrderStatusHistory {
    id: number;
    changed_by_user_id: number | null;
    from_status: string | null;
    to_status: string;
    note: string | null;
    changed_at: string;
}

export interface BackendOrderDetail extends BackendOrderSummary {
    recipient_name: string;
    recipient_phone: string;
    shipping_address: string;
    note: string | null;
    allowed_next_statuses: string[];
    allowed_payment_statuses?: string[];
    customer?: BackendUser | null;
    items: BackendOrderItem[];
    status_history: BackendOrderStatusHistory[];
    payment_status_history: BackendPaymentStatusHistory[];
}

export interface BackendOrderDetailResponse {
    message: string;
    data: BackendOrderDetail;
}

export interface BackendOrdersResponse {
    message: string;
    data: BackendOrderSummary[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export type BackendAdminOrderSummary = BackendOrderSummary;
export type BackendAdminOrderDetail = BackendOrderDetail;
export type BackendAdminOrdersResponse = BackendOrdersResponse;
export type BackendAdminOrderDetailResponse = BackendOrderDetailResponse;
