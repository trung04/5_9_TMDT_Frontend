export interface BackendUser {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    is_active: boolean;
    is_deleted: boolean;
    admin_role?: BackendAdminRoleSummary | null;
    permissions?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface BackendAdminRoleSummary {
    id: number;
    name: string;
    slug: string;
    is_super: boolean;
}

export interface BackendAdminPermission {
    id: number;
    key: string;
    name: string;
    group: string;
    description: string | null;
}

export interface BackendAdminRole {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_super: boolean;
    is_system: boolean;
    users_count: number;
    permissions: BackendAdminPermission[];
    permission_keys: string[];
    created_at?: string;
    updated_at?: string;
}

export interface BackendAdminAccount {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    is_active: boolean;
    is_deleted: boolean;
    admin_role: BackendAdminRoleSummary | null;
    created_by_admin: {
        id: number;
        full_name: string;
        email: string;
    } | null;
    created_at?: string;
    updated_at?: string;
}

export interface BackendAdminPermissionsResponse {
    message: string;
    data: BackendAdminPermission[];
}

export interface BackendAdminRolesResponse {
    message: string;
    data: BackendAdminRole[];
}

export interface BackendAdminRoleResponse {
    message: string;
    data: BackendAdminRole;
}

export interface BackendAdminAccountsResponse {
    message: string;
    data: BackendAdminAccount[];
}

export interface BackendAdminAccountResponse {
    message: string;
    data: BackendAdminAccount;
}

export interface BackendAdminCustomer {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    address: string | null;
    city: string | null;
    favorite_region: string | null;
    avatar_url: string | null;
    newsletter: boolean;
    sms_alerts: boolean;
    order_email: boolean;
    security_alerts: boolean;
    reward_points: number;
    reward_tier: string;
    next_tier_points: number;
    role: string;
    is_active: boolean;
    is_deleted: boolean;
    orders_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface BackendAdminCustomersResponse {
    message: string;
    data: BackendAdminCustomer[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface BackendAdminCustomerResponse {
    message: string;
    data: BackendAdminCustomer;
}

export interface BackendUserAddress {
    id: number;
    label: string;
    recipient: string;
    phone: string;
    line1: string;
    city: string;
    ghn_province_id?: number | null;
    ghn_province_name?: string | null;
    ghn_district_id?: number | null;
    ghn_district_name?: string | null;
    ghn_ward_code?: string | null;
    ghn_ward_name?: string | null;
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

export interface BackendPostAuthor {
    id: number;
    full_name: string;
    email: string;
}

export interface BackendPostComment {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    status: string;
    hidden_at?: string | null;
    created_at: string | null;
    updated_at: string | null;
    author: BackendPostAuthor | null;
    hidden_by?: BackendPostAuthor | null;
}

export interface BackendPost {
    id: number;
    title: string;
    excerpt: string | null;
    body: string;
    cover_image_url: string | null;
    status: string;
    published_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    author: BackendPostAuthor | null;
    likes_count: number;
    comments_count: number;
    comments: BackendPostComment[];
}

export interface BackendPostsResponse {
    message: string;
    data: BackendPost[];
}

export interface BackendPostResponse {
    message: string;
    data: BackendPost;
}

export interface BackendPostCommentResponse {
    message: string;
    data: BackendPostComment;
    meta?: {
        post_id: number;
        comments_count: number;
    };
}

export interface BackendPostLikesResponse {
    message: string;
    data: {
        post_id: number;
        liked: boolean;
        likes_count: number;
    };
}

export interface BackendMyPostLikesResponse {
    message: string;
    data: {
        post_ids: number[];
    };
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
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface BackendRegion {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    image_url?: string | null;
    is_active?: boolean;
    products_count?: number;
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
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface BackendProduct {
    id: number;
    category_id: number;
    supplier_id: number | null;
    region_id?: number | null;
    sku: string;
    slug?: string | null;
    name: string;
    description: string;
    short_description?: string | null;
    image_url?: string | null;
    origin?: string | null;
    weight?: string | null;
    shelf_life?: string | null;
    certifications?: string[] | null;
    gallery?: Array<{ src: string; alt?: string }> | null;
    sale_price: number | string;
    stock_quantity: number;
    is_active: boolean;
    is_deleted: boolean;
    category?: BackendCategory | null;
    supplier?: BackendSupplier | null;
    region?: BackendRegion | null;
    created_at?: string;
    updated_at?: string;
}

export interface BackendShippingCarrier {
    id: number;
    code: string;
    name: string;
    provider: "GHN" | "MANUAL" | string;
    tracking_url_template: string | null;
    default_weight: number;
    default_length: number;
    default_width: number;
    default_height: number;
    default_service_type_id: number | null;
    default_payment_type_id: number | null;
    default_required_note: string | null;
    pickup_name: string | null;
    pickup_phone: string | null;
    pickup_address: string | null;
    pickup_ward_code: string | null;
    pickup_ward_name: string | null;
    pickup_district_id: number | null;
    pickup_district_name: string | null;
    pickup_province_id: number | null;
    pickup_province_name: string | null;
    settings?: Record<string, unknown> | null;
    is_active: boolean;
    is_deleted: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface BackendOrderShipment {
    id: number;
    order_id: number;
    shipping_carrier_id: number;
    provider: string;
    status: string;
    tracking_code: string | null;
    tracking_url: string | null;
    service_type_id: number | null;
    payment_type_id: number | null;
    required_note: string | null;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    shipping_fee: number | string | null;
    cod_amount: number | string | null;
    expected_delivery_time: string | null;
    synced_at: string | null;
    cancelled_at: string | null;
    carrier: Pick<BackendShippingCarrier, "id" | "code" | "name" | "provider"> | null;
    created_at?: string;
    updated_at?: string;
}

export interface BackendGhnProvince {
    ProvinceID: number;
    ProvinceName: string;
    Code?: string;
    NameExtension?: string[];
}

export interface BackendGhnDistrict {
    DistrictID: number;
    ProvinceID: number;
    DistrictName: string;
    Code?: string;
    Type?: number;
    SupportType?: number;
}

export interface BackendGhnWard {
    WardCode: string;
    DistrictID: number;
    WardName: string;
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
    message?: string;
    data: BackendProduct[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
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

export interface BackendShippingCarrierListResponse {
    message: string;
    data: BackendShippingCarrier[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface BackendShippingCarrierMutationResponse {
    message: string;
    data: BackendShippingCarrier;
}

export interface BackendGhnProvincesResponse {
    message: string;
    data: BackendGhnProvince[];
}

export interface BackendGhnDistrictsResponse {
    message: string;
    data: BackendGhnDistrict[];
}

export interface BackendGhnWardsResponse {
    message: string;
    data: BackendGhnWard[];
}

export interface BackendRegionListResponse {
    message: string;
    data: BackendRegion[];
}

export interface BackendNewsletterSubscription {
    id: number;
    email: string;
    source: string;
    created_at?: string;
    updated_at?: string;
}

export interface BackendNewsletterSubscriptionResponse {
    message: string;
    data: BackendNewsletterSubscription;
}

export interface BackendSupplierMutationResponse {
    message: string;
    data: BackendSupplier;
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
    shipping_line1?: string | null;
    shipping_province_id?: number | null;
    shipping_province_name?: string | null;
    shipping_district_id?: number | null;
    shipping_district_name?: string | null;
    shipping_ward_code?: string | null;
    shipping_ward_name?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
    cancelled_at?: string | null;
    item_count: number;
    customer?: BackendUser | null;
    payment: BackendPayment | null;
    shipment?: BackendOrderShipment | null;
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
    shipping_line1?: string | null;
    shipping_province_id?: number | null;
    shipping_province_name?: string | null;
    shipping_district_id?: number | null;
    shipping_district_name?: string | null;
    shipping_ward_code?: string | null;
    shipping_ward_name?: string | null;
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

export interface BackendBulkOrderResultItem {
    orderId: number;
    orderNo: string | null;
    success: boolean;
    message: string;
}

export interface BackendBulkOrderStatusResult {
    total: number;
    success: number;
    failed: number;
    results: BackendBulkOrderResultItem[];
}

export interface BackendBulkOrderStatusResponse {
    message: string;
    data: BackendBulkOrderStatusResult;
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

export interface BackendOperationInventoryItem {
    id: number;
    sku: string;
    product_id: number;
    product_name: string;
    supplier_id: number | null;
    supplier_name: string | null;
    supplier_location: string | null;
    inventory_name: string;
    inventory_location: string | null;
    quantity_on_hand: number;
    reserved: number;
    reorder_level: number;
    safety_stock: number;
    purchase_price: number;
    aisle: string;
    status: "healthy" | "low" | "critical";
    last_counted_at: string | null;
    updated_at: string | null;
}

export interface BackendOperationRequisition {
    id: string;
    inventory_sku: string;
    product_id: number | null;
    product_name: string | null;
    supplier_id: number | null;
    supplier_name: string | null;
    requested_qty: number;
    approved_qty: number | null;
    eta_days: number;
    status: "submitted" | "approved" | "received" | "cancelled";
    note: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface BackendOperationOrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
}

export interface BackendOperationStatusEvent {
    id: string;
    actor: string;
    label: string;
    created_at: string | null;
}

export interface BackendOperationTrackingEvent {
    id: string;
    order_id: string;
    label: string;
    timestamp: string | null;
    completed: boolean;
}

export interface BackendOperationOrder {
    id: string;
    order_no: string | null;
    customer_name: string;
    customer_id: string | null;
    supplier_name: string;
    supplier_id: string | null;
    date: string | null;
    total: number;
    payment_status: "pending" | "paid" | "cod" | "refunded";
    delivery_status: "processing" | "ready_to_ship" | "in_transit" | "delivered" | "disputed";
    shipping_tier: "standard" | "express" | "priority";
    address: string;
    note: string | null;
    items: BackendOperationOrderItem[];
    timeline: BackendOperationTrackingEvent[];
    status_history: BackendOperationStatusEvent[];
    assigned_warehouse_zone: string;
}

export interface BackendOperationFulfillmentTask {
    id: string;
    order_id: string;
    customer_name: string;
    shipping_tier: "standard" | "express" | "priority";
    status: "picking" | "packing" | "awaiting_pickup" | "shipped";
    priority: "standard" | "rush";
    assigned_zone: string;
    eta_label: string;
    notes: string | null;
    status_history: BackendOperationStatusEvent[];
}

export interface BackendSupportTicket {
    id: number;
    subject: string;
    message: string;
    channel: "supplier" | "warehouse";
    status: "open" | "resolved";
    created_at: string | null;
    updated_at: string | null;
    resolved_at: string | null;
}

export interface BackendOperationInventoryResponse {
    message: string;
    data: BackendOperationInventoryItem[];
}

export interface BackendOperationRequisitionsResponse {
    message: string;
    data: BackendOperationRequisition[];
}

export interface BackendOperationRequisitionResponse {
    message: string;
    data: BackendOperationRequisition;
}

export interface BackendOperationOrdersResponse {
    message: string;
    data: BackendOperationOrder[];
}

export interface BackendOperationOrderResponse {
    message: string;
    data: BackendOperationOrder;
}

export interface BackendOperationFulfillmentTasksResponse {
    message: string;
    data: BackendOperationFulfillmentTask[];
}

export interface BackendOperationFulfillmentTaskResponse {
    message: string;
    data: BackendOperationFulfillmentTask;
}

export interface BackendSupportTicketsResponse {
    message: string;
    data: BackendSupportTicket[];
}

export interface BackendSupportTicketResponse {
    message: string;
    data: BackendSupportTicket;
}
