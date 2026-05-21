import { create } from "zustand";

import type {
    BackendAdminAccount,
    BackendAdminAccountResponse,
    BackendAdminAccountsResponse,
    BackendAdminPermission,
    BackendAdminPermissionsResponse,
    BackendAdminRole,
    BackendAdminRoleResponse,
    BackendAdminRolesResponse,
} from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { registerProtectedSessionCleanup } from "@/shared/lib/store/protected-session";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";

interface AsyncResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AdminRoleForm {
    id?: number;
    name: string;
    description: string;
    permissions: string[];
}

export interface AdminAccountForm {
    id?: number;
    fullName: string;
    email: string;
    phone: string;
    adminRoleId: number | "";
    status: string;
    isActive: boolean;
    password: string;
}

interface AdminAccessState {
    permissions: BackendAdminPermission[];
    roles: BackendAdminRole[];
    admins: BackendAdminAccount[];
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    loadAll: () => Promise<AsyncResult>;
    saveRole: (payload: AdminRoleForm) => Promise<AsyncResult<BackendAdminRole>>;
    deleteRole: (roleId: number) => Promise<AsyncResult>;
    saveAdmin: (payload: AdminAccountForm) => Promise<AsyncResult<BackendAdminAccount>>;
    updateAdminStatus: (
        adminId: number,
        status: string,
        isActive: boolean,
    ) => Promise<AsyncResult<BackendAdminAccount>>;
    updateAdminPassword: (adminId: number, password: string) => Promise<AsyncResult>;
    reset: () => void;
}

const SESSION_EXPIRED_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai.";

function tokenOrError() {
    const token = useAuthStore.getState().accessToken;
    return token ? { token } : { error: "Ban can dang nhap super admin." };
}

function handleError(error: unknown, fallback: string) {
    if (isUnauthorizedApiError(error)) {
        useAuthStore.getState().clearSession();
        return SESSION_EXPIRED_MESSAGE;
    }

    return error instanceof Error ? error.message : fallback;
}

export const useAdminAccessStore = create<AdminAccessState>()((set, get) => ({
    permissions: [],
    roles: [],
    admins: [],
    isLoading: false,
    isSaving: false,
    error: null,
    loadAll: async () => {
        const tokenResult = tokenOrError();

        if ("error" in tokenResult) {
            return { success: false, error: tokenResult.error };
        }

        set({ isLoading: true, error: null });

        try {
            const [permissionsResponse, rolesResponse, adminsResponse] = await Promise.all([
                apiRequest<BackendAdminPermissionsResponse>("/admin/access/permissions", {
                    token: tokenResult.token,
                }),
                apiRequest<BackendAdminRolesResponse>("/admin/access/roles", {
                    token: tokenResult.token,
                }),
                apiRequest<BackendAdminAccountsResponse>("/admin/access/admins", {
                    token: tokenResult.token,
                }),
            ]);

            set({
                permissions: permissionsResponse.data,
                roles: rolesResponse.data,
                admins: adminsResponse.data,
                isLoading: false,
                error: null,
            });

            return { success: true };
        } catch (error) {
            const message = handleError(error, "Khong the tai du lieu phan quyen.");
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },
    saveRole: async (payload) => {
        const tokenResult = tokenOrError();

        if ("error" in tokenResult) {
            return { success: false, error: tokenResult.error };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminRoleResponse>(
                payload.id ? `/admin/access/roles/${payload.id}` : "/admin/access/roles",
                {
                    method: payload.id ? "PUT" : "POST",
                    token: tokenResult.token,
                    body: {
                        name: payload.name.trim(),
                        description: payload.description.trim() || null,
                        permissions: payload.permissions,
                    },
                },
            );

            const nextRoles = payload.id
                ? get().roles.map((role) => (role.id === response.data.id ? response.data : role))
                : [response.data, ...get().roles];

            set({ roles: nextRoles, isSaving: false, error: null });
            return { success: true, data: response.data };
        } catch (error) {
            const message = handleError(error, "Khong the luu role admin.");
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    deleteRole: async (roleId) => {
        const tokenResult = tokenOrError();

        if ("error" in tokenResult) {
            return { success: false, error: tokenResult.error };
        }

        set({ isSaving: true, error: null });

        try {
            await apiRequest(`/admin/access/roles/${roleId}`, {
                method: "DELETE",
                token: tokenResult.token,
            });

            set({
                roles: get().roles.filter((role) => role.id !== roleId),
                isSaving: false,
                error: null,
            });
            return { success: true };
        } catch (error) {
            const message = handleError(error, "Khong the xoa role admin.");
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    saveAdmin: async (payload) => {
        const tokenResult = tokenOrError();

        if ("error" in tokenResult) {
            return { success: false, error: tokenResult.error };
        }

        set({ isSaving: true, error: null });

        try {
            const body: Record<string, unknown> = {
                full_name: payload.fullName.trim(),
                email: payload.email.trim(),
                phone: payload.phone.trim(),
                admin_role_id: payload.adminRoleId,
                status: payload.status,
                is_active: payload.isActive,
            };

            if (!payload.id || payload.password.trim()) {
                body.password = payload.password;
            }

            const response = await apiRequest<BackendAdminAccountResponse>(
                payload.id ? `/admin/access/admins/${payload.id}` : "/admin/access/admins",
                {
                    method: payload.id ? "PUT" : "POST",
                    token: tokenResult.token,
                    body,
                },
            );

            const nextAdmins = payload.id
                ? get().admins.map((admin) =>
                      admin.id === response.data.id ? response.data : admin,
                  )
                : [response.data, ...get().admins];

            set({ admins: nextAdmins, isSaving: false, error: null });
            return { success: true, data: response.data };
        } catch (error) {
            const message = handleError(error, "Khong the luu tai khoan admin.");
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateAdminStatus: async (adminId, status, isActive) => {
        const tokenResult = tokenOrError();

        if ("error" in tokenResult) {
            return { success: false, error: tokenResult.error };
        }

        set({ isSaving: true, error: null });

        try {
            const response = await apiRequest<BackendAdminAccountResponse>(
                `/admin/access/admins/${adminId}/status`,
                {
                    method: "PATCH",
                    token: tokenResult.token,
                    body: {
                        status,
                        is_active: isActive,
                    },
                },
            );

            set({
                admins: get().admins.map((admin) =>
                    admin.id === response.data.id ? response.data : admin,
                ),
                isSaving: false,
                error: null,
            });
            return { success: true, data: response.data };
        } catch (error) {
            const message = handleError(error, "Khong the cap nhat trang thai admin.");
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    updateAdminPassword: async (adminId, password) => {
        const tokenResult = tokenOrError();

        if ("error" in tokenResult) {
            return { success: false, error: tokenResult.error };
        }

        set({ isSaving: true, error: null });

        try {
            await apiRequest(`/admin/access/admins/${adminId}/password`, {
                method: "PATCH",
                token: tokenResult.token,
                body: { password },
            });

            set({ isSaving: false, error: null });
            return { success: true };
        } catch (error) {
            const message = handleError(error, "Khong the doi mat khau admin.");
            set({ isSaving: false, error: message });
            return { success: false, error: message };
        }
    },
    reset: () =>
        set({
            permissions: [],
            roles: [],
            admins: [],
            isLoading: false,
            isSaving: false,
            error: null,
        }),
}));

registerProtectedSessionCleanup(() => {
    useAdminAccessStore.getState().reset();
});
