import { useEffect, useMemo, useState } from "react";

import type { BackendPost } from "@/shared/api/backend-types";
import { apiRequest } from "@/shared/api/backend-client";
import { hasAdminPermission } from "@/shared/lib/auth";
import { downloadTextFile } from "@/shared/lib/download";
import { formatCurrency } from "@/shared/lib/format";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { usePostStore, type PostPayload } from "@/shared/lib/store/use-post-store";
import type { StatusTone, TableColumn } from "@/shared/types/ui";
import { AdminDrawer, Badge, Button, DataTable, Icon, SurfaceCard, cn } from "@/shared/ui";

type CommunityTab = "posts" | "suppliers" | "customers";
type DrawerMode = "view" | "create" | "edit";

interface CommunitySupplier {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    product_count: number;
    is_active: boolean;
    is_deleted: boolean;
}

interface CommunityCustomer {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    order_count: number;
    total_spend: number;
    is_active: boolean;
    is_deleted: boolean;
}

interface CommunityInvitation {
    id: number;
    supplier_name: string;
    contact_name: string;
    email: string;
    categories: string[];
    note: string | null;
    status: string;
    created_at: string;
}

interface CommunityResponse {
    message: string;
    data: {
        suppliers: CommunitySupplier[];
        customers: CommunityCustomer[];
        invitations: CommunityInvitation[];
    };
}

type DrawerState =
    | { entity: "post"; mode: DrawerMode; id?: string }
    | { entity: "supplier"; mode: "view"; id: string }
    | { entity: "customer"; mode: "view"; id: string }
    | { entity: "invite"; mode: "create" };

const initialInviteForm = {
    supplierName: "",
    contactName: "",
    email: "",
    categories: "",
    note: "",
};

const emptyPostForm = {
    title: "",
    excerpt: "",
    body: "",
    coverImageUrl: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
};

function formatAdminDate(value: string | null | undefined) {
    if (!value) return "Chua co";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function postStatusTone(status: string): StatusTone {
    return status === "PUBLISHED" ? "success" : "neutral";
}

function communityStatusTone(status: string): StatusTone {
    if (status === "ACTIVE" || status === "APPROVED" || status === "SENT") return "success";
    if (status === "PENDING") return "warning";
    if (status === "BLOCKED" || status === "REJECTED" || status === "INACTIVE") return "danger";
    return "neutral";
}

function activeEntityLabel(entity: { is_active: boolean; is_deleted: boolean }) {
    return entity.is_active && !entity.is_deleted ? "ACTIVE" : "INACTIVE";
}

function activeEntityTone(entity: { is_active: boolean; is_deleted: boolean }): StatusTone {
    return entity.is_active && !entity.is_deleted ? "success" : "warning";
}

function FieldValue({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
        <div className="rounded-2xl bg-surface-container-low p-4 text-sm">
            <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
            <p className="mt-2 font-medium text-on-surface">{value || "Chua cap nhat"}</p>
        </div>
    );
}

function ActionButton({
    label,
    icon,
    disabled,
    onClick,
    tone = "neutral",
}: {
    label: string;
    icon: string;
    disabled?: boolean;
    onClick: () => void;
    tone?: "neutral" | "primary" | "danger";
}) {
    return (
        <button
            type="button"
            className={cn(
                "rounded-xl p-2 transition disabled:cursor-not-allowed disabled:opacity-40",
                tone === "danger"
                    ? "text-error hover:bg-error-container/40"
                    : tone === "primary"
                      ? "text-primary hover:bg-primary/10"
                      : "text-on-surface-variant hover:bg-surface-container-low",
            )}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
        >
            <Icon name={icon} className="text-xl" />
        </button>
    );
}

function postPayloadFromPost(post: BackendPost, status = post.status): PostPayload {
    return {
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        cover_image_url: post.cover_image_url,
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    };
}

export function AdminCommunityPage() {
    const [tab, setTab] = useState<CommunityTab>("posts");
    const [query, setQuery] = useState("");
    const [drawer, setDrawer] = useState<DrawerState | null>(null);
    const [inviteForm, setInviteForm] = useState(initialInviteForm);
    const [suppliers, setSuppliers] = useState<CommunitySupplier[]>([]);
    const [customers, setCustomers] = useState<CommunityCustomer[]>([]);
    const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
    const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
    const [isInvitationSaving, setIsInvitationSaving] = useState(false);
    const [communityError, setCommunityError] = useState("");
    const [postForm, setPostForm] = useState(emptyPostForm);
    const accessToken = useAuthStore((state) => state.accessToken);
    const user = useAuthStore((state) => state.session?.user ?? null);
    const pushToast = useFeedbackStore((state) => state.pushToast);
    const adminPosts = usePostStore((state) => state.adminPosts);
    const adminStatus = usePostStore((state) => state.adminStatus);
    const adminError = usePostStore((state) => state.adminError);
    const isPostSaving = usePostStore((state) => state.isSaving);
    const loadAdminPosts = usePostStore((state) => state.loadAdminPosts);
    const createPost = usePostStore((state) => state.createPost);
    const updatePost = usePostStore((state) => state.updatePost);
    const updateCommentVisibility = usePostStore((state) => state.updateCommentVisibility);

    const canViewCommunity = hasAdminPermission(user, "admin.community.view");
    const canCreateInvitation = hasAdminPermission(user, "admin.community.invitation.create");
    const canViewPosts = hasAdminPermission(user, "admin.community.posts.view");
    const canCreatePost = hasAdminPermission(user, "admin.community.posts.create");
    const canUpdatePost = hasAdminPermission(user, "admin.community.posts.update");
    const canDeletePost = hasAdminPermission(user, "admin.community.posts.delete");
    const canModerateComments = hasAdminPermission(user, "admin.community.comments.moderate");
    const canLoadCommunity = canViewCommunity;

    useEffect(() => {
        if (!accessToken || !canLoadCommunity) {
            setIsLoadingCommunity(false);
            return;
        }

        let cancelled = false;

        async function loadCommunity() {
            setIsLoadingCommunity(true);
            setCommunityError("");

            try {
                const response = await apiRequest<CommunityResponse>("/admin/community", {
                    token: accessToken,
                });

                if (cancelled) return;

                setSuppliers(response.data.suppliers);
                setCustomers(response.data.customers);
                setInvitations(response.data.invitations);
                setIsLoadingCommunity(false);
            } catch (nextError) {
                if (cancelled) return;

                setCommunityError(
                    nextError instanceof Error ? nextError.message : "Khong the tai du lieu cong dong.",
                );
                setIsLoadingCommunity(false);
            }
        }

        void loadCommunity();

        return () => {
            cancelled = true;
        };
    }, [accessToken, canLoadCommunity]);

    useEffect(() => {
        if (!accessToken || !canViewPosts) return;

        void loadAdminPosts();
    }, [accessToken, canViewPosts, loadAdminPosts]);

    const visibleTabs = useMemo(
        () =>
            [
                {
                    id: "posts" as const,
                    label: "Bai viet",
                    visible: canViewPosts || canCreatePost || canUpdatePost || canDeletePost || canModerateComments,
                },
                {
                    id: "suppliers" as const,
                    label: "Nha cung cap",
                    visible: canViewCommunity || canCreateInvitation,
                },
                {
                    id: "customers" as const,
                    label: "Khach hang",
                    visible: canViewCommunity,
                },
            ].filter((item) => item.visible),
        [
            canCreateInvitation,
            canCreatePost,
            canDeletePost,
            canModerateComments,
            canUpdatePost,
            canViewCommunity,
            canViewPosts,
        ],
    );

    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.some((item) => item.id === tab)) {
            setTab(visibleTabs[0].id);
        }
    }, [tab, visibleTabs]);

    const keyword = query.trim().toLowerCase();

    const filteredPosts = useMemo(() => {
        return adminPosts.filter((post) => {
            if (!keyword) return true;
            return [post.title, post.excerpt, post.body, post.author?.full_name]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword);
        });
    }, [adminPosts, keyword]);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) => {
            if (!keyword) return true;
            return [supplier.name, supplier.contact_name, supplier.email, supplier.address]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword);
        });
    }, [keyword, suppliers]);

    const filteredCustomers = useMemo(() => {
        return customers.filter((customer) => {
            if (!keyword) return true;
            return [customer.full_name, customer.email, customer.phone].join(" ").toLowerCase().includes(keyword);
        });
    }, [customers, keyword]);

    const activePost =
        drawer?.entity === "post" && drawer.id
            ? adminPosts.find((post) => String(post.id) === drawer.id) ?? null
            : null;
    const activeSupplier =
        drawer?.entity === "supplier" ? suppliers.find((supplier) => String(supplier.id) === drawer.id) ?? null : null;
    const activeCustomer =
        drawer?.entity === "customer" ? customers.find((customer) => String(customer.id) === drawer.id) ?? null : null;

    const exportPayload = useMemo(
        () => ({
            suppliers,
            customers,
            invitations,
            posts: adminPosts,
            exportedAt: new Date().toISOString(),
        }),
        [adminPosts, customers, invitations, suppliers],
    );

    function updateInviteField<K extends keyof typeof initialInviteForm>(
        key: K,
        value: (typeof initialInviteForm)[K],
    ) {
        setInviteForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function updatePostField<K extends keyof typeof emptyPostForm>(key: K, value: (typeof emptyPostForm)[K]) {
        setPostForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function openCreatePostDrawer() {
        setPostForm(emptyPostForm);
        setDrawer({ entity: "post", mode: "create" });
    }

    function openPostDrawer(post: BackendPost, mode: "view" | "edit") {
        if (mode === "edit") {
            setPostForm({
                title: post.title,
                excerpt: post.excerpt ?? "",
                body: post.body,
                coverImageUrl: post.cover_image_url ?? "",
                status: post.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
            });
        }

        setDrawer({ entity: "post", mode, id: String(post.id) });
    }

    function buildPostPayload(): PostPayload {
        return {
            title: postForm.title.trim(),
            excerpt: postForm.excerpt.trim() || null,
            body: postForm.body.trim(),
            cover_image_url: postForm.coverImageUrl.trim() || null,
            status: postForm.status,
        };
    }

    async function handleSubmitInvite() {
        if (
            inviteForm.supplierName.trim().length === 0 ||
            inviteForm.contactName.trim().length === 0 ||
            inviteForm.email.trim().length === 0
        ) {
            pushToast({ tone: "warning", message: "Vui long nhap day du ten don vi, nguoi lien he va email." });
            return;
        }

        if (!accessToken) {
            pushToast({ tone: "warning", message: "Ban can dang nhap admin de gui loi moi." });
            return;
        }

        setIsInvitationSaving(true);

        try {
            const response = await apiRequest<{
                message: string;
                data: CommunityInvitation;
            }>("/admin/community/invitations", {
                method: "POST",
                token: accessToken,
                body: {
                    supplier_name: inviteForm.supplierName.trim(),
                    contact_name: inviteForm.contactName.trim(),
                    email: inviteForm.email.trim(),
                    categories: inviteForm.categories
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    note: inviteForm.note.trim() || null,
                },
            });

            setInvitations((current) => [response.data, ...current]);
            setInviteForm(initialInviteForm);
            setDrawer(null);
            setIsInvitationSaving(false);
            pushToast({
                tone: "success",
                message: `Da tao loi moi ${response.data.id} cho ${response.data.supplier_name}.`,
            });
        } catch (nextError) {
            setIsInvitationSaving(false);
            pushToast({
                tone: "warning",
                message: nextError instanceof Error ? nextError.message : "Khong the gui loi moi.",
            });
        }
    }

    async function handleCreatePost() {
        if (!postForm.title.trim() || !postForm.body.trim()) {
            pushToast({ tone: "warning", message: "Can nhap tieu de va noi dung bai viet." });
            return;
        }

        const result = await createPost(buildPostPayload());

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the tao bai viet." });
            return;
        }

        setDrawer({ entity: "post", mode: "view", id: String(result.data.id) });
        pushToast({ tone: "success", message: `Da tao bai viet ${result.data.title}.` });
    }

    async function handleUpdatePost() {
        if (!activePost) return;

        const result = await updatePost(activePost.id, buildPostPayload());

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat bai viet." });
            return;
        }

        setDrawer({ entity: "post", mode: "view", id: String(result.data.id) });
        pushToast({ tone: "success", message: `Da cap nhat bai viet ${result.data.title}.` });
    }

    async function handleMovePostToDraft(post: BackendPost) {
        const result = await updatePost(post.id, postPayloadFromPost(post, "DRAFT"));

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the an bai viet." });
            return;
        }

        setDrawer({ entity: "post", mode: "view", id: String(result.data.id) });
        pushToast({ tone: "success", message: `Da chuyen ${result.data.title} ve DRAFT.` });
    }

    async function handleToggleComment(commentId: number, status: "VISIBLE" | "HIDDEN") {
        const result = await updateCommentVisibility(commentId, status);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Khong the cap nhat binh luan." });
            return;
        }

        pushToast({ tone: "success", message: "Da cap nhat trang thai binh luan." });
    }

    const postColumns: TableColumn<BackendPost>[] = [
        {
            key: "post",
            title: "Bai viet",
            width: "28%",
            render: (post) => (
                <div>
                    <p className="font-semibold text-on-surface">{post.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{post.excerpt || post.body}</p>
                </div>
            ),
        },
        {
            key: "author",
            title: "Tac gia",
            width: "18%",
            render: (post) => (
                <div>
                    <p className="font-medium">{post.author?.full_name ?? "Admin"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{post.author?.email ?? "Chua co email"}</p>
                </div>
            ),
        },
        {
            key: "status",
            title: "Trang thai",
            width: "12%",
            nowrap: true,
            render: (post) => <Badge tone={postStatusTone(post.status)}>{post.status}</Badge>,
        },
        {
            key: "engagement",
            title: "Tuong tac",
            width: "14%",
            nowrap: true,
            render: (post) => (
                <span>
                    {post.likes_count} thich / {post.comments_count} binh luan
                </span>
            ),
        },
        {
            key: "published",
            title: "Xuat ban",
            width: "14%",
            nowrap: true,
            render: (post) => formatAdminDate(post.published_at),
        },
        {
            key: "actions",
            title: "Actions",
            align: "right",
            width: "14%",
            nowrap: true,
            render: (post) => (
                <div className="flex justify-end gap-1">
                    <ActionButton
                        label={`Xem ${post.title}`}
                        icon="visibility"
                        tone="primary"
                        onClick={() => openPostDrawer(post, "view")}
                    />
                    <ActionButton
                        label={`Sua ${post.title}`}
                        icon="edit"
                        disabled={!canUpdatePost}
                        onClick={() => openPostDrawer(post, "edit")}
                    />
                    <ActionButton
                        label={`Chuyen ${post.title} ve Draft`}
                        icon="visibility_off"
                        tone="danger"
                        disabled={!canDeletePost || post.status !== "PUBLISHED"}
                        onClick={() => void handleMovePostToDraft(post)}
                    />
                </div>
            ),
        },
    ];

    const supplierColumns: TableColumn<CommunitySupplier>[] = [
        {
            key: "supplier",
            title: "Nha cung cap",
            width: "28%",
            render: (supplier) => (
                <div>
                    <p className="font-semibold text-on-surface">{supplier.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{supplier.address ?? "Chua co dia chi"}</p>
                </div>
            ),
        },
        {
            key: "contact",
            title: "Lien he",
            width: "24%",
            render: (supplier) => (
                <div>
                    <p className="font-medium">{supplier.contact_name ?? "Chua cap nhat"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{supplier.email ?? "Chua co email"}</p>
                </div>
            ),
        },
        {
            key: "phone",
            title: "Dien thoai",
            width: "14%",
            nowrap: true,
            render: (supplier) => supplier.phone ?? "Chua cap nhat",
        },
        {
            key: "products",
            title: "San pham",
            align: "right",
            width: "10%",
            nowrap: true,
            render: (supplier) => supplier.product_count,
        },
        {
            key: "status",
            title: "Trang thai",
            width: "14%",
            nowrap: true,
            render: (supplier) => <Badge tone={activeEntityTone(supplier)}>{activeEntityLabel(supplier)}</Badge>,
        },
        {
            key: "actions",
            title: "Actions",
            align: "right",
            width: "10%",
            nowrap: true,
            render: (supplier) => (
                <ActionButton
                    label={`Xem ${supplier.name}`}
                    icon="visibility"
                    tone="primary"
                    onClick={() => setDrawer({ entity: "supplier", mode: "view", id: String(supplier.id) })}
                />
            ),
        },
    ];

    const customerColumns: TableColumn<CommunityCustomer>[] = [
        {
            key: "customer",
            title: "Khach hang",
            width: "28%",
            render: (customer) => (
                <div>
                    <p className="font-semibold text-on-surface">{customer.full_name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{customer.email}</p>
                </div>
            ),
        },
        {
            key: "phone",
            title: "Dien thoai",
            width: "16%",
            nowrap: true,
            render: (customer) => customer.phone || "Chua cap nhat",
        },
        {
            key: "orders",
            title: "Don hang",
            align: "right",
            width: "10%",
            nowrap: true,
            render: (customer) => customer.order_count,
        },
        {
            key: "spend",
            title: "Tong chi",
            align: "right",
            width: "16%",
            nowrap: true,
            render: (customer) => formatCurrency(Number(customer.total_spend)),
        },
        {
            key: "status",
            title: "Trang thai",
            width: "16%",
            nowrap: true,
            render: (customer) => <Badge tone={activeEntityTone(customer)}>{activeEntityLabel(customer)}</Badge>,
        },
        {
            key: "actions",
            title: "Actions",
            align: "right",
            width: "14%",
            nowrap: true,
            render: (customer) => (
                <ActionButton
                    label={`Xem ${customer.full_name}`}
                    icon="visibility"
                    tone="primary"
                    onClick={() => setDrawer({ entity: "customer", mode: "view", id: String(customer.id) })}
                />
            ),
        },
    ];

    const invitationColumns: TableColumn<CommunityInvitation>[] = [
        {
            key: "supplier",
            title: "Nha cung cap",
            width: "30%",
            render: (invitation) => (
                <div>
                    <p className="font-semibold text-on-surface">{invitation.supplier_name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{invitation.email}</p>
                </div>
            ),
        },
        {
            key: "contact",
            title: "Nguoi lien he",
            width: "20%",
            render: (invitation) => invitation.contact_name,
        },
        {
            key: "categories",
            title: "Danh muc",
            width: "24%",
            render: (invitation) => invitation.categories.join(", ") || "Chua chon",
        },
        {
            key: "status",
            title: "Trang thai",
            width: "12%",
            nowrap: true,
            render: (invitation) => <Badge tone={communityStatusTone(invitation.status)}>{invitation.status}</Badge>,
        },
        {
            key: "created",
            title: "Ngay tao",
            width: "14%",
            nowrap: true,
            render: (invitation) => formatAdminDate(invitation.created_at),
        },
    ];

    const currentRows =
        tab === "posts" ? filteredPosts.length : tab === "suppliers" ? filteredSuppliers.length : filteredCustomers.length;

    function renderPostTable() {
        if (!canViewPosts && !canCreatePost) {
            return (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Ban chua co quyen xem danh sach bai viet.
                </SurfaceCard>
            );
        }

        if (canViewPosts && adminStatus === "error") {
            return <SurfaceCard className="text-sm text-error">{adminError}</SurfaceCard>;
        }

        return (
            <SurfaceCard className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="font-headline text-xl font-semibold text-on-surface">Danh sach bai viet</h3>
                        <p className="mt-1 text-sm text-on-surface-variant">{currentRows} bai viet dang hien thi</p>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={!canCreatePost}
                        onClick={openCreatePostDrawer}
                        iconLeft={<Icon name="add" className="text-lg" />}
                    >
                        Bai moi
                    </Button>
                </div>

                {!canViewPosts ? (
                    <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                        Ban chua co quyen xem danh sach, nhung van co the tao bai viet moi.
                    </div>
                ) : (
                    <DataTable
                        rows={filteredPosts}
                        columns={postColumns}
                        getRowKey={(post) => String(post.id)}
                        isLoading={adminStatus === "loading"}
                        loadingMessage="Dang tai bai viet..."
                        emptyMessage="Chua co bai viet phu hop."
                        minWidth="980px"
                        pagination={{ pageSize: 5, itemLabel: "bai viet" }}
                        onRowClick={(post) => openPostDrawer(post, "view")}
                    />
                )}
            </SurfaceCard>
        );
    }

    function renderSuppliersTable() {
        return (
            <SurfaceCard className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="font-headline text-xl font-semibold text-on-surface">Nha cung cap</h3>
                        <p className="mt-1 text-sm text-on-surface-variant">{currentRows} dong dang hien thi</p>
                    </div>
                    <Button
                        size="sm"
                        disabled={!canCreateInvitation}
                        onClick={() => setDrawer({ entity: "invite", mode: "create" })}
                        iconLeft={<Icon name="person_add" className="text-lg" />}
                    >
                        Moi nha cung cap
                    </Button>
                </div>
                <DataTable
                    rows={filteredSuppliers}
                    columns={supplierColumns}
                    getRowKey={(supplier) => String(supplier.id)}
                    isLoading={isLoadingCommunity}
                    loadingMessage="Dang tai nha cung cap..."
                    emptyMessage="Chua co nha cung cap phu hop."
                    minWidth="920px"
                    pagination={{ pageSize: 6, itemLabel: "nha cung cap" }}
                    onRowClick={(supplier) => setDrawer({ entity: "supplier", mode: "view", id: String(supplier.id) })}
                />
            </SurfaceCard>
        );
    }

    function renderCustomersTable() {
        return (
            <SurfaceCard className="space-y-4">
                <div>
                    <h3 className="font-headline text-xl font-semibold text-on-surface">Khach hang</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{currentRows} dong dang hien thi</p>
                </div>
                <DataTable
                    rows={filteredCustomers}
                    columns={customerColumns}
                    getRowKey={(customer) => String(customer.id)}
                    isLoading={isLoadingCommunity}
                    loadingMessage="Dang tai khach hang..."
                    emptyMessage="Chua co khach hang phu hop."
                    minWidth="920px"
                    pagination={{ pageSize: 6, itemLabel: "khach hang" }}
                    onRowClick={(customer) => setDrawer({ entity: "customer", mode: "view", id: String(customer.id) })}
                />
            </SurfaceCard>
        );
    }

    function renderPostDrawerContent(mode: DrawerMode) {
        if (mode === "create" || mode === "edit") {
            return (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Tieu de"
                            value={postForm.title}
                            onChange={(event) => updatePostField("title", event.target.value)}
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="URL anh bia"
                            value={postForm.coverImageUrl}
                            onChange={(event) => updatePostField("coverImageUrl", event.target.value)}
                        />
                    </div>
                    <textarea
                        className="min-h-20 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Mo ta ngan"
                        value={postForm.excerpt}
                        onChange={(event) => updatePostField("excerpt", event.target.value)}
                    />
                    <textarea
                        className="min-h-56 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Noi dung bai viet"
                        value={postForm.body}
                        onChange={(event) => updatePostField("body", event.target.value)}
                    />
                    <select
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        value={postForm.status}
                        onChange={(event) => updatePostField("status", event.target.value as "DRAFT" | "PUBLISHED")}
                    >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                </div>
            );
        }

        if (!activePost) {
            return <p className="text-sm text-on-surface-variant">Khong tim thay bai viet.</p>;
        }

        return (
            <div className="space-y-6">
                {activePost.cover_image_url ? (
                    <img
                        src={activePost.cover_image_url}
                        alt=""
                        className="aspect-[16/9] w-full rounded-2xl object-cover"
                    />
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                    <FieldValue label="Tieu de" value={activePost.title} />
                    <FieldValue label="Tac gia" value={activePost.author?.full_name ?? "Admin"} />
                    <FieldValue label="Ngay xuat ban" value={formatAdminDate(activePost.published_at)} />
                    <FieldValue label="Tuong tac" value={`${activePost.likes_count} thich / ${activePost.comments_count} binh luan`} />
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4 text-sm leading-6">
                    <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">Mo ta</p>
                    <p className="mt-2 text-on-surface">{activePost.excerpt || "Chua cap nhat"}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4 text-sm leading-6">
                    <p className="text-xs font-label uppercase tracking-[0.14em] text-on-surface-variant">Noi dung</p>
                    <p className="mt-2 whitespace-pre-line text-on-surface">{activePost.body}</p>
                </div>

                <div className="space-y-3 border-t border-outline-variant/15 pt-5">
                    <h4 className="font-headline text-lg font-semibold">Binh luan</h4>
                    {activePost.comments.length === 0 ? (
                        <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                            Chua co binh luan.
                        </p>
                    ) : (
                        activePost.comments.map((comment) => (
                            <div key={comment.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{comment.author?.full_name ?? "Khach hang"}</p>
                                        <p className="text-xs text-on-surface-variant">
                                            {formatAdminDate(comment.created_at)}
                                        </p>
                                    </div>
                                    <Badge tone={comment.status === "VISIBLE" ? "success" : "danger"}>
                                        {comment.status}
                                    </Badge>
                                </div>
                                <p className="mt-3 leading-6 text-on-surface-variant">{comment.content}</p>
                                <div className="mt-3 flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={!canModerateComments || isPostSaving}
                                        onClick={() =>
                                            void handleToggleComment(
                                                comment.id,
                                                comment.status === "VISIBLE" ? "HIDDEN" : "VISIBLE",
                                            )
                                        }
                                    >
                                        {comment.status === "VISIBLE" ? "An" : "Hien lai"}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    function renderInviteDrawerContent() {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <input
                        className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Ten don vi"
                        value={inviteForm.supplierName}
                        onChange={(event) => updateInviteField("supplierName", event.target.value)}
                    />
                    <input
                        className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Nguoi lien he"
                        value={inviteForm.contactName}
                        onChange={(event) => updateInviteField("contactName", event.target.value)}
                    />
                    <input
                        className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Email"
                        value={inviteForm.email}
                        onChange={(event) => updateInviteField("email", event.target.value)}
                    />
                    <input
                        className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Danh muc, phan tach bang dau phay"
                        value={inviteForm.categories}
                        onChange={(event) => updateInviteField("categories", event.target.value)}
                    />
                </div>
                <textarea
                    className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                    placeholder="Ghi chu loi moi"
                    value={inviteForm.note}
                    onChange={(event) => updateInviteField("note", event.target.value)}
                />
            </div>
        );
    }

    function drawerTitle() {
        if (!drawer) return "";
        if (drawer.entity === "invite") return "Moi nha cung cap";
        if (drawer.entity === "supplier") return activeSupplier?.name ?? "Chi tiet nha cung cap";
        if (drawer.entity === "customer") return activeCustomer?.full_name ?? "Chi tiet khach hang";
        if (drawer.mode === "create") return "Tao bai viet";
        if (drawer.mode === "edit") return activePost?.title ?? "Chinh sua bai viet";
        return activePost?.title ?? "Chi tiet bai viet";
    }

    function drawerSubtitle() {
        if (!drawer) return null;
        if (drawer.entity === "post" && activePost) {
            return <Badge tone={postStatusTone(activePost.status)}>{activePost.status}</Badge>;
        }
        if (drawer.entity === "supplier" && activeSupplier) {
            return <Badge tone={activeEntityTone(activeSupplier)}>{activeEntityLabel(activeSupplier)}</Badge>;
        }
        if (drawer.entity === "customer" && activeCustomer) {
            return <Badge tone={activeEntityTone(activeCustomer)}>{activeEntityLabel(activeCustomer)}</Badge>;
        }
        return null;
    }

    function drawerContent() {
        if (!drawer) return null;
        if (drawer.entity === "post") return renderPostDrawerContent(drawer.mode);
        if (drawer.entity === "invite") return renderInviteDrawerContent();
        if (drawer.entity === "supplier") {
            if (!activeSupplier) return <p className="text-sm text-on-surface-variant">Khong tim thay nha cung cap.</p>;

            return (
                <div className="grid gap-4 md:grid-cols-2">
                    <FieldValue label="Ten" value={activeSupplier.name} />
                    <FieldValue label="Nguoi lien he" value={activeSupplier.contact_name} />
                    <FieldValue label="Email" value={activeSupplier.email} />
                    <FieldValue label="Dien thoai" value={activeSupplier.phone} />
                    <FieldValue label="Dia chi" value={activeSupplier.address} />
                    <FieldValue label="So san pham" value={activeSupplier.product_count} />
                </div>
            );
        }

        if (!activeCustomer) return <p className="text-sm text-on-surface-variant">Khong tim thay khach hang.</p>;

        return (
            <div className="grid gap-4 md:grid-cols-2">
                <FieldValue label="Ho ten" value={activeCustomer.full_name} />
                <FieldValue label="Email" value={activeCustomer.email} />
                <FieldValue label="Dien thoai" value={activeCustomer.phone} />
                <FieldValue label="Don hang" value={activeCustomer.order_count} />
                <FieldValue label="Tong chi" value={formatCurrency(Number(activeCustomer.total_spend))} />
                <FieldValue label="Trang thai" value={activeEntityLabel(activeCustomer)} />
            </div>
        );
    }

    function drawerFooter() {
        if (!drawer) return null;

        if (drawer.entity === "post" && drawer.mode === "create") {
            return (
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="outline" onClick={() => setDrawer(null)}>
                        Huy
                    </Button>
                    <Button disabled={isPostSaving || !canCreatePost} onClick={() => void handleCreatePost()}>
                        {isPostSaving ? "Dang tao..." : "Tao moi"}
                    </Button>
                </div>
            );
        }

        if (drawer.entity === "post" && drawer.mode === "edit") {
            return (
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="outline" onClick={() => setDrawer(null)}>
                        Huy
                    </Button>
                    <Button disabled={isPostSaving || !activePost || !canUpdatePost} onClick={() => void handleUpdatePost()}>
                        {isPostSaving ? "Dang luu..." : "Luu thay doi"}
                    </Button>
                </div>
            );
        }

        if (drawer.entity === "post" && drawer.mode === "view" && activePost) {
            return (
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="outline" onClick={() => setDrawer(null)}>
                        Dong
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={!canUpdatePost}
                        onClick={() => openPostDrawer(activePost, "edit")}
                    >
                        Chinh sua
                    </Button>
                    <Button
                        variant="outline"
                        disabled={isPostSaving || !canDeletePost || activePost.status !== "PUBLISHED"}
                        onClick={() => void handleMovePostToDraft(activePost)}
                    >
                        Chuyen Draft
                    </Button>
                </div>
            );
        }

        if (drawer.entity === "invite") {
            return (
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="outline" onClick={() => setDrawer(null)}>
                        Huy
                    </Button>
                    <Button disabled={isInvitationSaving || !canCreateInvitation} onClick={() => void handleSubmitInvite()}>
                        {isInvitationSaving ? "Dang gui..." : "Gui loi moi"}
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDrawer(null)}>
                    Dong
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <h1 className="mt-3 font-headline text-3xl font-bold text-on-surface">
                        Cộng đồng
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                        Quản lý bài viết, lời mời nhà cung cấp và hoạt động cộng đồng.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="secondary"
                        disabled={!canViewCommunity && !canViewPosts}
                        onClick={() => {
                            downloadTextFile(
                                "community-data.json",
                                JSON.stringify(exportPayload, null, 2),
                                "application/json",
                            );
                            pushToast({ tone: "success", message: "Da xuat du lieu cong dong." });
                        }}
                        iconLeft={<Icon name="download" className="text-lg" />}
                    >
                        Xuat du lieu
                    </Button>
                    <Button
                        disabled={!canCreateInvitation}
                        onClick={() => setDrawer({ entity: "invite", mode: "create" })}
                        iconLeft={<Icon name="person_add" className="text-lg" />}
                    >
                        Moi nha cung cap
                    </Button>
                </div>
            </section>

            {communityError ? <SurfaceCard className="text-sm text-error">{communityError}</SurfaceCard> : null}

            {invitations.length > 0 ? (
                <SurfaceCard className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold text-on-surface">Loi moi gan day</h3>
                    <DataTable
                        rows={invitations.slice(0, 4)}
                        columns={invitationColumns}
                        getRowKey={(invitation) => String(invitation.id)}
                        minWidth="820px"
                        pagination={{ pageSize: 4, itemLabel: "loi moi" }}
                    />
                </SurfaceCard>
            ) : null}

            <div className="flex flex-wrap gap-3">
                {visibleTabs.map((item) => (
                    <button
                        type="button"
                        key={item.id}
                        className={cn(
                            "rounded-full px-4 py-2 text-sm font-medium",
                            tab === item.id
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container-low text-on-surface-variant",
                        )}
                        onClick={() => setTab(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <input
                className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Loc theo bai viet, doi tac hoac khach hang..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />

            {tab === "posts" ? renderPostTable() : null}
            {tab === "suppliers" ? renderSuppliersTable() : null}
            {tab === "customers" ? renderCustomersTable() : null}

            <AdminDrawer
                open={Boolean(drawer)}
                mode={drawer?.mode ?? "view"}
                title={drawerTitle()}
                subtitle={drawerSubtitle()}
                onClose={() => setDrawer(null)}
                footer={drawerFooter()}
            >
                {drawerContent()}
            </AdminDrawer>
        </div>
    );
}
