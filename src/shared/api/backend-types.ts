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
    supplier_id: number;
    sku: string;
    name: string;
    description: string;
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
    user: BackendUser;
}

export interface BackendMeResponse {
    user: BackendUser;
}

export interface BackendProductListResponse {
    message: string;
    data: BackendProduct[];
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

export interface BackendProductDetailResponse {
    message: string;
    data: BackendProduct;
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
    created_at?: string;
    updated_at?: string;
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
    item_count: number;
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
    items: BackendOrderItem[];
    status_history: BackendOrderStatusHistory[];
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
