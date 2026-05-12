import { useEffect, useMemo, useState } from "react";

import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { Button, SurfaceCard } from "@/shared/ui";

const emptyForm = {
    label: "",
    recipient: "",
    phone: "",
    line1: "",
    city: "",
    note: "",
};

export function AccountAddressesPage() {
    const profile = useAccountStore((state) => state.profile);
    const loadProfile = useAccountStore((state) => state.loadProfile);
    const addAddress = useAccountStore((state) => state.addAddress);
    const updateAddress = useAccountStore((state) => state.updateAddress);
    const removeAddress = useAccountStore((state) => state.removeAddress);
    const setDefaultAddress = useAccountStore((state) => state.setDefaultAddress);
    const isSaving = useAccountStore((state) => state.isSaving);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const editingAddress = useMemo(
        () => profile.addresses.find((address) => address.id === editingId),
        [editingId, profile.addresses],
    );

    async function handleSubmit() {
        if (!form.label || !form.recipient || !form.phone || !form.line1 || !form.city) {
            setMessage("Vui long dien day du thong tin dia chi.");
            return;
        }

        const result = editingAddress
            ? await updateAddress(editingAddress.id, form)
            : await addAddress(form);

        if (!result.success) {
            setMessage(result.error ?? "Khong the luu dia chi.");
            return;
        }

        setMessage(editingAddress ? "Da cap nhat dia chi." : "Da them dia chi moi.");
        setForm(emptyForm);
        setEditingId("");
        pushToast({
            tone: "success",
            message: "So dia chi da duoc luu.",
        });
    }

    return (
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-24">
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                <SurfaceCard className="space-y-5">
                    <div>
                        <h1 className="font-headline text-2xl font-bold">So dia chi nhan hang</h1>
                        <p className="mt-2 text-on-surface-variant">
                            Quan ly nhieu dia chi giao nhan va chon dia chi mac dinh cho checkout.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {profile.addresses.map((address) => (
                            <div key={address.id} className="rounded-3xl bg-surface-container-low p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-primary">
                                            {address.label}
                                        </p>
                                        <p className="mt-2 font-semibold">{address.recipient}</p>
                                        <p className="text-sm text-on-surface-variant">{address.phone}</p>
                                        <p className="mt-2 text-sm text-on-surface-variant">
                                            {address.line1}, {address.city}
                                        </p>
                                        {address.note ? (
                                            <p className="mt-2 text-sm text-on-surface-variant">
                                                {address.note}
                                            </p>
                                        ) : null}
                                    </div>
                                    {address.isDefault ? (
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                                            Mac dinh
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setEditingId(address.id);
                                            setForm({
                                                label: address.label,
                                                recipient: address.recipient,
                                                phone: address.phone,
                                                line1: address.line1,
                                                city: address.city,
                                                note: address.note ?? "",
                                            });
                                        }}
                                    >
                                        Chinh sua
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isSaving}
                                        onClick={async () => {
                                            const result = await setDefaultAddress(address.id);

                                            pushToast({
                                                tone: result.success ? "success" : "warning",
                                                message: result.success
                                                    ? "Da cap nhat dia chi mac dinh."
                                                    : (result.error ?? "Khong the dat dia chi mac dinh."),
                                            });
                                        }}
                                    >
                                        Dat lam mac dinh
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isSaving}
                                        onClick={async () => {
                                            const result = await removeAddress(address.id);

                                            pushToast({
                                                tone: result.success ? "success" : "warning",
                                                message: result.success
                                                    ? "Da xoa dia chi."
                                                    : (result.error ?? "Khong the xoa dia chi."),
                                            });
                                        }}
                                    >
                                        Xoa
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>

                <SurfaceCard tone="low" className="space-y-4">
                    <h2 className="font-headline text-2xl font-bold">
                        {editingAddress ? "Chinh sua dia chi" : "Them dia chi moi"}
                    </h2>
                    {[
                        ["label", "Nhan goi nho"],
                        ["recipient", "Nguoi nhan"],
                        ["phone", "So dien thoai"],
                        ["line1", "Dia chi"],
                        ["city", "Thanh pho"],
                    ].map(([key, label]) => (
                        <label key={key} className="block space-y-2 text-sm">
                            <span className="font-medium">{label}</span>
                            <input
                                className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                                value={form[key as keyof typeof form]}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        [key]: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    ))}
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Ghi chu</span>
                        <textarea
                            className="min-h-28 w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            value={form.note}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    note: event.target.value,
                                }))
                            }
                        />
                    </label>
                    {message ? <p className="text-sm text-primary">{message}</p> : null}
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => void handleSubmit()} disabled={isSaving}>
                            {isSaving
                                ? "Dang luu..."
                                : editingAddress
                                  ? "Luu dia chi"
                                  : "Them dia chi"}
                        </Button>
                        {editingAddress ? (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setEditingId("");
                                    setForm(emptyForm);
                                }}
                            >
                                Huy chinh sua
                            </Button>
                        ) : null}
                    </div>
                </SurfaceCard>
            </div>
        </div>
    );
}
