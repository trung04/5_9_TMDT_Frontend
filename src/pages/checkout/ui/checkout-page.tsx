import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/lib/format";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useCartStore } from "@/shared/lib/store/use-cart-store";
import { useCustomerOrdersStore } from "@/shared/lib/store/use-customer-orders-store";
import { Icon } from "@/shared/ui";

type CheckoutForm = {
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    note: string;
};

type CheckoutPaymentMethod = "COD" | "BANK_TRANSFER" | "E_WALLET";

const paymentOptions: Array<{
    id: CheckoutPaymentMethod;
    label: string;
    description: string;
    defaultGateway?: string;
}> = [
    {
        id: "COD",
        label: "Thanh toán khi nhận hàng",
        description: "Thanh toán tiền mặt cho shipper khi đơn đến nơi.",
    },
    {
        id: "BANK_TRANSFER",
        label: "Chuyển khoản ngân hàng",
        description: "Nhận thông tin chuyển khoản và chờ admin xác nhận giao dịch.",
        defaultGateway: "Vietcombank",
    },
    {
        id: "E_WALLET",
        label: "Ví điện tử",
        description: "Mô phỏng thanh toán qua cổng ví như MoMo hoặc ZaloPay.",
        defaultGateway: "MoMo",
    },
];

function getDefaultAddress(profile: ReturnType<typeof useAccountStore.getState>["profile"]) {
    return profile.addresses.find((address) => address.isDefault) ?? profile.addresses[0];
}

function buildForm(profile: ReturnType<typeof useAccountStore.getState>["profile"]): CheckoutForm {
    const defaultAddress = getDefaultAddress(profile);

    return {
        recipientName: defaultAddress?.recipient ?? profile.name,
        recipientPhone: defaultAddress?.phone ?? profile.phone,
        shippingAddress: [defaultAddress?.line1 ?? profile.address, defaultAddress?.city ?? profile.city]
            .filter(Boolean)
            .join(", "),
        note: defaultAddress?.note ?? "",
    };
}

export function CheckoutPage() {
    const navigate = useNavigate();
    const profile = useAccountStore((state) => state.profile);
    const updateProfile = useAccountStore((state) => state.updateProfile);
    const loadCart = useCartStore((state) => state.loadCart);
    const cart = useCartStore((state) => state.cart);
    const setQuantity = useCartStore((state) => state.setQuantity);
    const removeItem = useCartStore((state) => state.removeItem);
    const isCartLoading = useCartStore((state) => state.isLoading);
    const cartError = useCartStore((state) => state.error);
    const checkout = useCustomerOrdersStore((state) => state.checkout);
    const isSubmitting = useCustomerOrdersStore((state) => state.isSubmitting);
    const [form, setForm] = useState<CheckoutForm>(() => buildForm(profile));
    const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("COD");
    const [paymentGateway, setPaymentGateway] = useState("Vietcombank");
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        void loadCart();
    }, [loadCart]);

    useEffect(() => {
        setForm(buildForm(profile));
    }, [profile]);

    const cartItems = cart?.items ?? [];
    const subtotal = cart?.subtotal ?? 0;
    const shippingFee = 0;
    const discount = 0;
    const total = subtotal + shippingFee - discount;

    function updateField<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handlePlaceOrder() {
        setSubmitError("");
        const requiredFields: Array<keyof CheckoutForm> = [
            "recipientName",
            "recipientPhone",
            "shippingAddress",
        ];

        if (requiredFields.some((field) => form[field].trim().length === 0)) {
            setSubmitError("Vui lòng hoàn tất đầy đủ thông tin nhận hàng trước khi đặt đơn.");
            return;
        }

        const result = await checkout({
            recipient_name: form.recipientName.trim(),
            recipient_phone: form.recipientPhone.trim(),
            shipping_address: form.shippingAddress.trim(),
            note: form.note.trim(),
            payment_method: paymentMethod,
            payment_gateway: paymentMethod === "COD" ? undefined : paymentGateway.trim(),
        });

        if (!result.success || !result.data) {
            setSubmitError(result.error ?? "Không thể hoàn tất đơn hàng.");
            return;
        }

        updateProfile({
            name: form.recipientName.trim(),
            phone: form.recipientPhone.trim(),
            address: form.shippingAddress.trim(),
        });
        await loadCart();
        void navigate(routes.orderSuccess(result.data.id));
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-6 pb-20 pt-24">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                <div className="space-y-12 lg:col-span-7">
                    <section>
                        <div className="mb-8 flex items-baseline justify-between">
                            <h1 className="font-headline text-2xl font-semibold tracking-tight">
                                Giỏ hàng của bạn
                            </h1>
                            <span className="text-sm text-zinc-500">
                                {cart?.itemCount ?? 0} mặt hàng
                            </span>
                        </div>

                        <div className="space-y-6">
                            {cartItems.length === 0 ? (
                                <div className="rounded-xl bg-surface-container-lowest p-10 text-center">
                                    <p className="text-on-surface-variant">
                                        {isCartLoading
                                            ? "Đang tải giỏ hàng..."
                                            : cartError ?? "Chưa có sản phẩm nào trong giỏ."}
                                    </p>
                                    <Link
                                        className="mt-4 inline-block text-primary hover:underline"
                                        to={routes.products}
                                    >
                                        Quay lại mua sắm
                                    </Link>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <article
                                        key={item.id}
                                        className="flex items-center gap-6 rounded-xl bg-surface-container-lowest p-6"
                                    >
                                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between gap-4">
                                                <div>
                                                    <h3 className="font-headline text-lg font-semibold">
                                                        {item.product.name}
                                                    </h3>
                                                    <p className="mt-1 font-semibold text-primary">
                                                        {formatCurrency(item.unitPrice)}
                                                    </p>
                                                </div>
                                                <button
                                                    className="text-zinc-400 transition-colors hover:text-error"
                                                    onClick={() => void removeItem(item.productId)}
                                                    aria-label={`Xóa ${item.product.name}`}
                                                >
                                                    <Icon name="delete" />
                                                </button>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center rounded-full bg-surface-container px-2 py-1">
                                                    <button
                                                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white"
                                                        onClick={() =>
                                                            void setQuantity(
                                                                item.productId,
                                                                Math.max(1, item.quantity - 1),
                                                            )
                                                        }
                                                        aria-label={`Giảm số lượng ${item.product.name}`}
                                                    >
                                                        <Icon name="remove" className="text-sm" />
                                                    </button>
                                                    <span className="px-4 text-sm font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white"
                                                        onClick={() =>
                                                            void setQuantity(
                                                                item.productId,
                                                                item.quantity + 1,
                                                            )
                                                        }
                                                        aria-label={`Tăng số lượng ${item.product.name}`}
                                                    >
                                                        <Icon name="add" className="text-sm" />
                                                    </button>
                                                </div>
                                                <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs text-secondary">
                                                    Cập nhật đơn
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="space-y-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="font-headline text-2xl font-semibold">
                                    Thông tin nhận hàng
                                </h2>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    Vui lòng điền thông tin nhận hàng chính xác để chúng tôi giao đơn đúng địa chỉ.
                                </p>
                            </div>
                            <Link
                                className="text-sm font-medium text-primary hover:underline"
                                to={routes.accountAddresses}
                            >
                                Sổ địa chỉ local
                            </Link>
                        </div>

                        <div className="rounded-xl bg-surface-container-lowest p-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Người nhận
                                    </label>
                                    <input
                                        className="w-full rounded-xl border-b-2 border-transparent bg-surface-container-highest px-4 py-3 outline-none transition-all focus:border-primary focus:ring-0"
                                        value={form.recipientName}
                                        onChange={(event) =>
                                            updateField("recipientName", event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Số điện thoại
                                    </label>
                                    <input
                                        className="w-full rounded-xl border-b-2 border-transparent bg-surface-container-highest px-4 py-3 outline-none transition-all focus:border-primary focus:ring-0"
                                        value={form.recipientPhone}
                                        onChange={(event) =>
                                            updateField("recipientPhone", event.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="mt-6 space-y-2">
                                <label className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Địa chỉ giao hàng
                                </label>
                                <textarea
                                    className="min-h-28 w-full rounded-xl border-b-2 border-transparent bg-surface-container-highest px-4 py-3 outline-none transition-all focus:border-primary focus:ring-0"
                                    value={form.shippingAddress}
                                    onChange={(event) =>
                                        updateField("shippingAddress", event.target.value)
                                    }
                                />
                            </div>
                            <div className="mt-6 space-y-2">
                                <label className="text-xs uppercase tracking-widest text-on-surface-variant">
                                    Ghi chú
                                </label>
                                <textarea
                                    className="min-h-24 w-full rounded-xl border-b-2 border-transparent bg-surface-container-highest px-4 py-3 outline-none transition-all focus:border-primary focus:ring-0"
                                    value={form.note}
                                    onChange={(event) => updateField("note", event.target.value)}
                                />
                            </div>

                            <div className="mt-8 space-y-4">
                                <div>
                                    <h3 className="font-headline text-xl font-semibold">
                                        Phương thức thanh toán
                                    </h3>
                                    <p className="mt-2 text-sm text-on-surface-variant">
                                        Chọn cách thanh toán phù hợp trước khi tạo đơn hàng.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {paymentOptions.map((option) => (
                                        <label
                                            key={option.id}
                                            className={`block cursor-pointer rounded-xl border px-4 py-4 transition ${
                                                paymentMethod === option.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-outline-variant/20 bg-surface-container-low"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={paymentMethod === option.id}
                                                    onChange={() => {
                                                        setPaymentMethod(option.id);
                                                        setPaymentGateway(option.defaultGateway ?? "");
                                                    }}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-semibold text-on-surface">
                                                        {option.label}
                                                    </p>
                                                    <p className="mt-1 text-sm text-on-surface-variant">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {paymentMethod !== "COD" ? (
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-on-surface-variant">
                                            Cổng thanh toán
                                        </label>
                                        <input
                                            className="w-full rounded-xl border-b-2 border-transparent bg-surface-container-highest px-4 py-3 outline-none transition-all focus:border-primary focus:ring-0"
                                            value={paymentGateway}
                                            onChange={(event) => setPaymentGateway(event.target.value)}
                                            placeholder={
                                                paymentMethod === "BANK_TRANSFER"
                                                    ? "Vietcombank"
                                                    : "MoMo"
                                            }
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-8 lg:col-span-5">
                    <section className="rounded-xl bg-surface-container-lowest p-8">
                        <h2 className="font-headline text-2xl font-semibold">Tóm tắt đơn hàng</h2>

                        <div className="mt-6 space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-on-surface-variant">Tạm tính</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-on-surface-variant">Vận chuyển</span>
                                <span>{formatCurrency(shippingFee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-on-surface-variant">Giảm giá</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                            <div className="h-px bg-outline-variant/20" />
                            <div className="flex justify-between font-headline text-2xl font-bold">
                                <span>Tổng cộng</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl bg-surface-container-low p-5 text-sm">
                            <p className="font-semibold">
                                {paymentOptions.find((option) => option.id === paymentMethod)?.label}
                            </p>
                            <p className="mt-2 text-on-surface-variant">
                                {paymentMethod === "COD"
                                    ? "Bạn sẽ thanh toán cho shipper khi đơn được giao thành công."
                                    : paymentMethod === "BANK_TRANSFER"
                                      ? `Đơn hàng sẽ tạo ở trạng thái chờ xác nhận thanh toán qua ${paymentGateway || "ngân hàng"}.`
                                      : `Đơn hàng sẽ tạo ở trạng thái chờ xác nhận thanh toán qua ${paymentGateway || "ví điện tử"}.`}
                            </p>
                        </div>
                        {submitError ? (
                            <div className="mt-4 rounded-xl border border-error/20 bg-error-container/60 px-4 py-3 text-sm text-error">
                                {submitError}
                            </div>
                        ) : null}

                        <button
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={cartItems.length === 0 || isSubmitting}
                            onClick={() => void handlePlaceOrder()}
                        >
                            <span>{isSubmitting ? "Đang đặt hàng..." : "Đặt hàng"}</span>
                            <Icon name="arrow_forward" />
                        </button>
                    </section>

                    <section className="rounded-xl bg-surface-container-lowest p-8">
                        <h2 className="font-headline text-xl font-semibold">Lưu ý</h2>
                        <div className="mt-6 space-y-3">
                            {[
                                "Giỏ hàng của bạn được cập nhật liên tục khi thay đổi số lượng.",
                                "Đơn hàng sẽ lưu đúng phương thức thanh toán mà bạn vừa chọn.",
                                "Nếu chọn chuyển khoản hoặc ví điện tử, admin có thể xác nhận trạng thái thanh toán sau.",
                            ].map((helper) => (
                                <div
                                    key={helper}
                                    className="rounded-xl border border-outline-variant/20 px-4 py-4 text-sm text-on-surface-variant"
                                >
                                    {helper}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
