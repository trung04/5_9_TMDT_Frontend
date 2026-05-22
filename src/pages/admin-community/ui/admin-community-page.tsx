import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/shared/api/backend-client";
import { hasAdminPermission } from "@/shared/lib/auth";
import { downloadTextFile } from "@/shared/lib/download";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { useFeedbackStore } from "@/shared/lib/store/use-feedback-store";
import { usePostStore, type PostPayload } from "@/shared/lib/store/use-post-store";
import type { StatusTone } from "@/shared/types/ui";
import { Badge, Button, SurfaceCard } from "@/shared/ui";

type CommunityTab = "posts" | "suppliers" | "customers";

interface CommunitySupplier {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    product_count: number;
    status: string;
}

interface CommunityCustomer {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    order_count: number;
    total_spend: number;
    status: string;
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
    if (!value) return "Chưa có";

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

export function AdminCommunityPage() {
    const [tab, setTab] = useState<CommunityTab>("posts");
    const [query, setQuery] = useState("");
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState(initialInviteForm);
    const [suppliers, setSuppliers] = useState<CommunitySupplier[]>([]);
    const [customers, setCustomers] = useState<CommunityCustomer[]>([]);
    const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
    const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
    const [isInvitationSaving, setIsInvitationSaving] = useState(false);
    const [communityError, setCommunityError] = useState("");
    const [activePostId, setActivePostId] = useState("");
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
    const deletePost = usePostStore((state) => state.deletePost);
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
                    nextError instanceof Error ? nextError.message : "Không thể tải dữ liệu cộng đồng.",
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
                    label: "Bài viết",
                    visible:
                        canViewPosts ||
                        canCreatePost ||
                        canUpdatePost ||
                        canDeletePost ||
                        canModerateComments,
                },
                {
                    id: "suppliers" as const,
                    label: "Nhà cung cấp",
                    visible: canViewCommunity || canCreateInvitation,
                },
                {
                    id: "customers" as const,
                    label: "Khách hàng",
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

    const filteredPosts = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return adminPosts.filter((post) => {
            if (keyword.length === 0) return true;
            return [post.title, post.excerpt, post.body, post.author?.full_name]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword);
        });
    }, [adminPosts, query]);

    const filteredSuppliers = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return suppliers.filter((supplier) =>
            [supplier.name, supplier.contact_name, supplier.email, supplier.address]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword),
        );
    }, [query, suppliers]);

    const filteredCustomers = useMemo(() => {
        const keyword = query.trim().toLowerCase();

        return customers.filter((customer) =>
            [customer.full_name, customer.email, customer.phone]
                .join(" ")
                .toLowerCase()
                .includes(keyword),
        );
    }, [customers, query]);

    const activePost =
        filteredPosts.find((post) => String(post.id) === activePostId) ?? filteredPosts[0] ?? null;

    useEffect(() => {
        if (!activePost || activePostId === "new") return;

        setActivePostId(String(activePost.id));
        setPostForm({
            title: activePost.title,
            excerpt: activePost.excerpt ?? "",
            body: activePost.body,
            coverImageUrl: activePost.cover_image_url ?? "",
            status: activePost.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        });
    }, [activePost, activePostId]);

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

    function updatePostField<K extends keyof typeof emptyPostForm>(
        key: K,
        value: (typeof emptyPostForm)[K],
    ) {
        setPostForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function resetPostForm() {
        setActivePostId("new");
        setPostForm(emptyPostForm);
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
            pushToast({
                tone: "warning",
                message: "Vui lòng nhập đầy đủ tên đơn vị, người liên hệ và email.",
            });
            return;
        }

        if (!accessToken) {
            pushToast({
                tone: "warning",
                message: "Bạn cần đăng nhập admin để gửi lời mời.",
            });
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
            setInviteOpen(false);
            setIsInvitationSaving(false);
            pushToast({
                tone: "success",
                message: `Đã tạo lời mời ${response.data.id} cho ${response.data.supplier_name}.`,
            });
        } catch (nextError) {
            setIsInvitationSaving(false);
            pushToast({
                tone: "warning",
                message: nextError instanceof Error ? nextError.message : "Không thể gửi lời mời.",
            });
        }
    }

    async function handleCreatePost() {
        if (!postForm.title.trim() || !postForm.body.trim()) {
            pushToast({ tone: "warning", message: "Cần nhập tiêu đề và nội dung bài viết." });
            return;
        }

        const result = await createPost(buildPostPayload());

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể tạo bài viết." });
            return;
        }

        setActivePostId(String(result.data.id));
        pushToast({ tone: "success", message: `Đã tạo bài viết ${result.data.title}.` });
    }

    async function handleUpdatePost() {
        if (!activePost || activePostId === "new") return;

        const result = await updatePost(activePost.id, buildPostPayload());

        if (!result.success || !result.data) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể cập nhật bài viết." });
            return;
        }

        pushToast({ tone: "success", message: `Đã cập nhật bài viết ${result.data.title}.` });
    }

    async function handleDeletePost() {
        if (!activePost || activePostId === "new") return;

        const result = await deletePost(activePost.id);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể xóa bài viết." });
            return;
        }

        resetPostForm();
        pushToast({ tone: "success", message: `Đã xóa bài viết ${activePost.title}.` });
    }

    async function handleToggleComment(commentId: number, status: "VISIBLE" | "HIDDEN") {
        const result = await updateCommentVisibility(commentId, status);

        if (!result.success) {
            pushToast({ tone: "warning", message: result.error ?? "Không thể cập nhật bình luận." });
            return;
        }

        pushToast({ tone: "success", message: "Đã cập nhật trạng thái bình luận." });
    }

    function renderPostList() {
        if (!canViewPosts && !canCreatePost) {
            return (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Bạn chưa có quyền xem danh sách bài viết.
                </SurfaceCard>
            );
        }

        if (canViewPosts && adminStatus === "loading") {
            return (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Đang tải bài viết...
                </SurfaceCard>
            );
        }

        if (canViewPosts && adminStatus === "error") {
            return <SurfaceCard className="text-sm text-error">{adminError}</SurfaceCard>;
        }

        return (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
                <SurfaceCard className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-headline text-xl font-semibold">Danh sách bài viết</h3>
                        <Button size="sm" variant="secondary" disabled={!canCreatePost} onClick={resetPostForm}>
                            Bài mới
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {!canViewPosts ? (
                            <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                                Bạn chưa có quyền xem danh sách, nhưng vẫn có thể tạo bài viết mới.
                            </p>
                        ) : filteredPosts.length === 0 ? (
                            <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                                Chưa có bài viết phù hợp.
                            </p>
                        ) : (
                            filteredPosts.map((post) => (
                                <button
                                    key={post.id}
                                    type="button"
                                    className={`w-full rounded-2xl p-4 text-left transition ${
                                        activePost?.id === post.id && activePostId !== "new"
                                            ? "bg-primary/10 text-on-surface"
                                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                                    }`}
                                    onClick={() => setActivePostId(String(post.id))}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-on-surface">{post.title}</p>
                                            <p className="mt-1 line-clamp-2 text-sm">
                                                {post.excerpt || post.body}
                                            </p>
                                        </div>
                                        <Badge tone={postStatusTone(post.status)}>{post.status}</Badge>
                                    </div>
                                    <p className="mt-3 text-xs">
                                        {post.likes_count} thích · {post.comments_count} bình luận ·{" "}
                                        {formatAdminDate(post.published_at)}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </SurfaceCard>

                <SurfaceCard className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="font-headline text-xl font-semibold">
                                {activePostId === "new" ? "Tạo bài viết" : "Chi tiết bài viết"}
                            </h3>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                Bài viết trạng thái PUBLISHED sẽ hiển thị ngoài trang /story.
                            </p>
                        </div>
                        {activePost && activePostId !== "new" ? (
                            <Badge tone={postStatusTone(activePost.status)}>{activePost.status}</Badge>
                        ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Tiêu đề"
                            value={postForm.title}
                            onChange={(event) => updatePostField("title", event.target.value)}
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="URL ảnh bìa"
                            value={postForm.coverImageUrl}
                            onChange={(event) => updatePostField("coverImageUrl", event.target.value)}
                        />
                    </div>
                    <textarea
                        className="min-h-20 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Mô tả ngắn"
                        value={postForm.excerpt}
                        onChange={(event) => updatePostField("excerpt", event.target.value)}
                    />
                    <textarea
                        className="min-h-44 w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Nội dung bài viết"
                        value={postForm.body}
                        onChange={(event) => updatePostField("body", event.target.value)}
                    />
                    <select
                        className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                        value={postForm.status}
                        onChange={(event) =>
                            updatePostField("status", event.target.value as "DRAFT" | "PUBLISHED")
                        }
                    >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                    </select>

                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            variant="secondary"
                            disabled={isPostSaving || !canCreatePost}
                            onClick={() => void handleCreatePost()}
                        >
                            Tạo mới
                        </Button>
                        <Button
                            disabled={isPostSaving || !activePost || activePostId === "new" || !canUpdatePost}
                            onClick={() => void handleUpdatePost()}
                        >
                            Cập nhật
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isPostSaving || !activePost || activePostId === "new" || !canDeletePost}
                            onClick={() => void handleDeletePost()}
                        >
                            Xóa
                        </Button>
                    </div>

                    {activePost && activePostId !== "new" ? (
                        <div className="space-y-3 border-t border-outline-variant/15 pt-5">
                            <h4 className="font-headline text-lg font-semibold">Bình luận</h4>
                            {activePost.comments.length === 0 ? (
                                <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                                    Chưa có bình luận.
                                </p>
                            ) : (
                                activePost.comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="rounded-2xl bg-surface-container-low p-4 text-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold">
                                                    {comment.author?.full_name ?? "Khách hàng"}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">
                                                    {formatAdminDate(comment.created_at)}
                                                </p>
                                            </div>
                                            <Badge
                                                tone={comment.status === "VISIBLE" ? "success" : "danger"}
                                            >
                                                {comment.status}
                                            </Badge>
                                        </div>
                                        <p className="mt-3 leading-6 text-on-surface-variant">
                                            {comment.content}
                                        </p>
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
                                                {comment.status === "VISIBLE" ? "Ẩn" : "Hiện lại"}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </SurfaceCard>
            </div>
        );
    }

    function renderSuppliers() {
        return (
            <div className="grid gap-6 xl:grid-cols-3">
                {filteredSuppliers.map((supplier) => (
                    <SurfaceCard key={supplier.id} className="space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tertiary-fixed text-tertiary">
                                {supplier.name.slice(0, 1)}
                            </div>
                            <Badge tone="primary">{supplier.status}</Badge>
                        </div>
                        <div>
                            <h3 className="font-headline text-xl font-semibold">{supplier.name}</h3>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {supplier.address ?? "Không có địa chỉ"}
                            </p>
                        </div>
                        <div className="space-y-2 text-sm text-on-surface-variant">
                            <p>Liên hệ chính: {supplier.contact_name ?? "Chưa cập nhật"}</p>
                            <p>Email: {supplier.email ?? "Chưa cập nhật"}</p>
                            <p>Số sản phẩm: {supplier.product_count}</p>
                        </div>
                    </SurfaceCard>
                ))}
            </div>
        );
    }

    function renderCustomers() {
        return (
            <div className="grid gap-6 xl:grid-cols-2">
                {filteredCustomers.map((customer) => (
                    <SurfaceCard key={customer.id} className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-headline text-xl font-semibold">
                                    {customer.full_name}
                                </h3>
                                <p className="text-sm text-on-surface-variant">{customer.email}</p>
                            </div>
                            <Badge>{customer.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="rounded-2xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">Đơn hàng</p>
                                <p className="mt-2 font-headline text-2xl font-bold">
                                    {customer.order_count}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-surface-container-low p-4">
                                <p className="text-on-surface-variant">Tổng chi tiêu</p>
                                <p className="mt-2 font-headline text-2xl font-bold">
                                    {Math.round(Number(customer.total_spend) / 1000)}K
                                </p>
                            </div>
                        </div>
                    </SurfaceCard>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-on-surface">
                        Cộng đồng
                    </h1>
                    <p className="mt-2 text-sm text-on-surface-variant">
                        Quản lý bài viết, đối tác và khách hàng trong cùng một khu vực.
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
                            pushToast({
                                tone: "success",
                                message: "Đã xuất dữ liệu cộng đồng.",
                            });
                        }}
                    >
                        Xuất dữ liệu
                    </Button>
                    <Button
                        disabled={!canCreateInvitation}
                        onClick={() => setInviteOpen((current) => !current)}
                    >
                        Mời nhà cung cấp
                    </Button>
                </div>
            </section>

            {communityError ? <SurfaceCard className="text-sm text-error">{communityError}</SurfaceCard> : null}
            {isLoadingCommunity ? (
                <SurfaceCard className="text-sm text-on-surface-variant">
                    Đang tải dữ liệu cộng đồng...
                </SurfaceCard>
            ) : null}

            {inviteOpen ? (
                <SurfaceCard className="space-y-4">
                    <div>
                        <h3 className="font-headline text-2xl font-bold">Tạo lời mời đối tác</h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            Thông tin sẽ được gửi vào backend và hiện trong danh sách lời mời.
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Tên đơn vị"
                            value={inviteForm.supplierName}
                            onChange={(event) => updateInviteField("supplierName", event.target.value)}
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Người liên hệ"
                            value={inviteForm.contactName}
                            onChange={(event) => updateInviteField("contactName", event.target.value)}
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Email"
                            value={inviteForm.email}
                            onChange={(event) => updateInviteField("email", event.target.value)}
                        />
                        <input
                            className="rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                            placeholder="Danh mục, phân tách bằng dấu phẩy"
                            value={inviteForm.categories}
                            onChange={(event) => updateInviteField("categories", event.target.value)}
                        />
                    </div>
                    <textarea
                        className="min-h-24 w-full rounded-2xl bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/15"
                        placeholder="Ghi chú lời mời"
                        value={inviteForm.note}
                        onChange={(event) => updateInviteField("note", event.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            disabled={isInvitationSaving || !canCreateInvitation}
                            onClick={() => void handleSubmitInvite()}
                        >
                            {isInvitationSaving ? "Đang gửi..." : "Gửi lời mời"}
                        </Button>
                    </div>
                </SurfaceCard>
            ) : null}

            {invitations.length > 0 ? (
                <SurfaceCard className="space-y-3">
                    <h3 className="font-headline text-xl font-semibold">Lời mời gần đây</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {invitations.slice(0, 4).map((invitation) => (
                            <div key={invitation.id} className="rounded-2xl bg-surface-container-low p-4 text-sm">
                                <p className="font-semibold">{invitation.supplier_name}</p>
                                <p className="mt-1 text-on-surface-variant">
                                    {invitation.contact_name} · {invitation.email}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-widest text-primary">
                                    {invitation.status}
                                </p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>
            ) : null}

            <div className="flex flex-wrap gap-3">
                {visibleTabs.map((item) => (
                    <button
                        key={item.id}
                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                            tab === item.id
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container-low text-on-surface-variant"
                        }`}
                        onClick={() => setTab(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <input
                className="w-full rounded-3xl bg-surface-container-highest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Lọc theo bài viết, đối tác hoặc khách hàng..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />

            {tab === "posts" ? renderPostList() : null}
            {tab === "suppliers" ? renderSuppliers() : null}
            {tab === "customers" ? renderCustomers() : null}
        </div>
    );
}
