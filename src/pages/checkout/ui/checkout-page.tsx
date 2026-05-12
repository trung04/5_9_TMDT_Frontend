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
        label: "Thanh toan khi nhan hang",
        description: "Thanh toan tien mat cho shipper khi don den noi.",
    },
    {
        id: "BANK_TRANSFER",
        label: "Chuyen khoan ngan hang",
        description: "Nhan thong tin chuyen khoan va cho admin xac nhan giao dich.",
        defaultGateway: "Vietcombank",
    },
    {
        id: "E_WALLET",
        label: "Vi dien tu",
        description: "Mo phong thanh toan qua cong vi nhu MoMo hoac ZaloPay.",
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
            setSubmitError("Vui long hoan tat day du thong tin nhan hang truoc khi dat don.");
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
            setSubmitError(result.error ?? "Khong the hoan tat don hang.");
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
                                Gio hang cua ban
                            </h1>
                            <span className="text-sm text-zinc-500">
                                {cart?.itemCount ?? 0} mat hang
                            </span>
                        </div>

                        <div className="space-y-6">
                            {cartItems.length === 0 ? (
                                <div className="rounded-xl bg-surface-container-lowest p-10 text-center">
                                    <p className="text-on-surface-variant">
                                        {isCartLoading
                                            ? "Dang tai gio hang..."
                                            : cartError ?? "Chua co san pham nao trong gio."}
                                    </p>
                                    <Link
                                        className="mt-4 inline-block text-primary hover:underline"
                                        to={routes.products}
                                    >
                                        Quay lai mua sam
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
                                                    aria-label={`Xoa ${item.product.name}`}
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
                                                        aria-label={`Giam so luong ${item.product.name}`}
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
                                                        aria-label={`Tang so luong ${item.product.name}`}
                                                    >
                                                        <Icon name="add" className="text-sm" />
                                                    </button>
                                                </div>
                                                <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs text-secondary">
                                                    Cap nhat don
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
                                    Thong tin nhan hang
                                </h2>
                                <p className="mt-2 text-sm text-on-surface-variant">
                                    Vui long dien thong tin nhan hang chinh xac de chung toi giao don dung dia chi.
                                </p>
                            </div>
                            <Link
                                className="text-sm font-medium text-primary hover:underline"
                                to={routes.accountAddresses}
                            >
                                So dia chi local
                            </Link>
                        </div>

                        <div className="rounded-xl bg-surface-container-lowest p-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        Nguoi nhan
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
                                        So dien thoai
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
                                    Dia chi giao hang
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
                                    Ghi chu
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
                                        Phuong thuc thanh toan
                                    </h3>
                                    <p className="mt-2 text-sm text-on-surface-variant">
                                        Chon cach thanh toan phu hop truoc khi tao don hang.
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
                                            Cong thanh toan
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
                        <h2 className="font-headline text-2xl font-semibold">Tom tat don hang</h2>

                        <div className="mt-6 space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-on-surface-variant">Tam tinh</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-on-surface-variant">Van chuyen</span>
                                <span>{formatCurrency(shippingFee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-on-surface-variant">Giam gia</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                            <div className="h-px bg-outline-variant/20" />
                            <div className="flex justify-between font-headline text-2xl font-bold">
                                <span>Tong cong</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl bg-surface-container-low p-5 text-sm">
                            <p className="font-semibold">
                                {paymentOptions.find((option) => option.id === paymentMethod)?.label}
                            </p>
                            <p className="mt-2 text-on-surface-variant">
                                {paymentMethod === "COD"
                                    ? "Ban se thanh toan cho shipper khi don duoc giao thanh cong."
                                    : paymentMethod === "BANK_TRANSFER"
                                      ? `Don hang se tao o trang thai cho xac nhan thanh toan qua ${paymentGateway || "ngan hang"}.`
                                      : `Don hang se tao o trang thai cho xac nhan thanh toan qua ${paymentGateway || "vi dien tu"}.`}
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
                            <span>{isSubmitting ? "Dang dat hang..." : "Dat hang"}</span>
                            <Icon name="arrow_forward" />
                        </button>
                    </section>

                    <section className="rounded-xl bg-surface-container-lowest p-8">
                        <h2 className="font-headline text-xl font-semibold">Luu y</h2>
                        <div className="mt-6 space-y-3">
                            {[
                                "Gio hang cua ban duoc cap nhat lien tuc khi thay doi so luong.",
                                "Don hang se luu dung phuong thuc thanh toan ma ban vua chon.",
                                "Neu chon chuyen khoan hoac vi dien tu, admin co the xac nhan trang thai thanh toan sau.",
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
