import { useEffect, useMemo, useState } from "react";

import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { useGhnLocationStore } from "@/shared/lib/store/use-ghn-location-store";
import { Button, SurfaceCard } from "@/shared/ui";

const emptyForm = {
    label: "",
    recipient: "",
    phone: "",
    line1: "",
    city: "",
    ghnProvinceId: "",
    ghnProvinceName: "",
    ghnDistrictId: "",
    ghnDistrictName: "",
    ghnWardCode: "",
    ghnWardName: "",
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
    const provinces = useGhnLocationStore((state) => state.provinces);
    const districtsByProvince = useGhnLocationStore((state) => state.districtsByProvince);
    const wardsByDistrict = useGhnLocationStore((state) => state.wardsByDistrict);
    const loadProvinces = useGhnLocationStore((state) => state.loadProvinces);
    const loadDistricts = useGhnLocationStore((state) => state.loadDistricts);
    const loadWards = useGhnLocationStore((state) => state.loadWards);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        void loadProvinces();
    }, [loadProvinces]);

    useEffect(() => {
        if (!form.ghnProvinceId) return;
        void loadDistricts(Number(form.ghnProvinceId));
    }, [form.ghnProvinceId, loadDistricts]);

    useEffect(() => {
        if (!form.ghnDistrictId) return;
        void loadWards(Number(form.ghnDistrictId));
    }, [form.ghnDistrictId, loadWards]);

    const editingAddress = useMemo(
        () => profile.addresses.find((address) => address.id === editingId),
        [editingId, profile.addresses],
    );
    const districts = form.ghnProvinceId ? districtsByProvince[form.ghnProvinceId] ?? [] : [];
    const wards = form.ghnDistrictId ? wardsByDistrict[form.ghnDistrictId] ?? [] : [];

    function addressText(address: (typeof profile.addresses)[number]) {
        return [
            address.line1,
            address.ghnWardName,
            address.ghnDistrictName,
            address.ghnProvinceName || address.city,
        ]
            .filter(Boolean)
            .join(", ");
    }

    function submitPayload() {
        return {
            label: form.label,
            recipient: form.recipient,
            phone: form.phone,
            line1: form.line1,
            city: form.ghnProvinceName || form.city,
            ghnProvinceId: form.ghnProvinceId ? Number(form.ghnProvinceId) : null,
            ghnProvinceName: form.ghnProvinceName || null,
            ghnDistrictId: form.ghnDistrictId ? Number(form.ghnDistrictId) : null,
            ghnDistrictName: form.ghnDistrictName || null,
            ghnWardCode: form.ghnWardCode || null,
            ghnWardName: form.ghnWardName || null,
            note: form.note,
        };
    }

    async function handleSubmit() {
        if (
            !form.label ||
            !form.recipient ||
            !form.phone ||
            !form.line1 ||
            !form.ghnProvinceId ||
            !form.ghnDistrictId ||
            !form.ghnWardCode
        ) {
            setMessage("Vui long dien day du dia chi GHN.");
            return;
        }

        const result = editingAddress
            ? await updateAddress(editingAddress.id, submitPayload())
            : await addAddress(submitPayload());

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
                            Quan ly dia chi GHN de tao van don chinh xac sau khi dat hang.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {profile.addresses.map((address) => (
                            <div key={address.id} className="rounded-3xl bg-surface-container-low p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-primary">{address.label}</p>
                                        <p className="mt-2 font-semibold">{address.recipient}</p>
                                        <p className="text-sm text-on-surface-variant">{address.phone}</p>
                                        <p className="mt-2 text-sm text-on-surface-variant">{addressText(address)}</p>
                                        {address.note ? (
                                            <p className="mt-2 text-sm text-on-surface-variant">{address.note}</p>
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
                                                ghnProvinceId: address.ghnProvinceId ? String(address.ghnProvinceId) : "",
                                                ghnProvinceName: address.ghnProvinceName ?? "",
                                                ghnDistrictId: address.ghnDistrictId ? String(address.ghnDistrictId) : "",
                                                ghnDistrictName: address.ghnDistrictName ?? "",
                                                ghnWardCode: address.ghnWardCode ?? "",
                                                ghnWardName: address.ghnWardName ?? "",
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
                        ["line1", "Dia chi chi tiet"],
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
                        <span className="font-medium">Tinh/thanh GHN</span>
                        <select
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            value={form.ghnProvinceId}
                            onChange={(event) => {
                                const province = provinces.find((item) => String(item.ProvinceID) === event.target.value);
                                setForm((current) => ({
                                    ...current,
                                    city: province?.ProvinceName ?? "",
                                    ghnProvinceId: event.target.value,
                                    ghnProvinceName: province?.ProvinceName ?? "",
                                    ghnDistrictId: "",
                                    ghnDistrictName: "",
                                    ghnWardCode: "",
                                    ghnWardName: "",
                                }));
                            }}
                        >
                            <option value="">Chon tinh/thanh</option>
                            {provinces.map((province) => (
                                <option key={province.ProvinceID} value={province.ProvinceID}>
                                    {province.ProvinceName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Quan/huyen GHN</span>
                        <select
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            value={form.ghnDistrictId}
                            disabled={!form.ghnProvinceId}
                            onChange={(event) => {
                                const district = districts.find((item) => String(item.DistrictID) === event.target.value);
                                setForm((current) => ({
                                    ...current,
                                    ghnDistrictId: event.target.value,
                                    ghnDistrictName: district?.DistrictName ?? "",
                                    ghnWardCode: "",
                                    ghnWardName: "",
                                }));
                            }}
                        >
                            <option value="">Chon quan/huyen</option>
                            {districts.map((district) => (
                                <option key={district.DistrictID} value={district.DistrictID}>
                                    {district.DistrictName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Phuong/xa GHN</span>
                        <select
                            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            value={form.ghnWardCode}
                            disabled={!form.ghnDistrictId}
                            onChange={(event) => {
                                const ward = wards.find((item) => item.WardCode === event.target.value);
                                setForm((current) => ({
                                    ...current,
                                    ghnWardCode: event.target.value,
                                    ghnWardName: ward?.WardName ?? "",
                                }));
                            }}
                        >
                            <option value="">Chon phuong/xa</option>
                            {wards.map((ward) => (
                                <option key={ward.WardCode} value={ward.WardCode}>
                                    {ward.WardName}
                                </option>
                            ))}
                        </select>
                    </label>

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
                            {isSaving ? "Dang luu..." : editingAddress ? "Luu dia chi" : "Them dia chi"}
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
