import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
    AuthSession,
    AuthSource,
    DemoCredential,
    UserRole,
} from "@/entities/user/model/types";
import type { BackendAuthResponse, BackendMeResponse } from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { adaptBackendUserToSession } from "@/shared/api/storefront-adapters";
import { routes } from "@/shared/config/routes";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { runProtectedSessionCleanup } from "@/shared/lib/store/protected-session";
import { useShopStore } from "@/shared/lib/store/use-shop-store";

const demoCredentials: DemoCredential[] = [
    {
        id: "demo-admin",
        role: "admin",
        displayName: "Quản trị demo",
        email: "admin@heritage.local",
        password: "123456",
        redirectTo: routes.adminDashboard,
    },
    {
        id: "demo-supplier",
        role: "supplier",
        displayName: "Nhà cung cấp demo",
        email: "supplier@heritage.local",
        password: "123456",
        redirectTo: routes.supplierOrders,
    },
    {
        id: "demo-warehouse",
        role: "warehouse",
        displayName: "Kho demo",
        email: "warehouse@heritage.local",
        password: "123456",
        redirectTo: routes.warehouseInventory,
    },
];

interface AuthActionResult {
    success: boolean;
    error?: string;
}

interface RegisterPayload {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    passwordConfirmation: string;
}

interface AuthState {
    credentials: DemoCredential[];
    session: AuthSession | null;
    accessToken: string | null;
    accessTokenExpiresAt: string | null;
    authSource: AuthSource | null;
    isHydrating: boolean;
    isSubmitting: boolean;
    login: (email: string, password: string) => Promise<AuthActionResult>;
    register: (payload: RegisterPayload) => Promise<AuthActionResult>;
    loginAsRole: (role: UserRole) => AuthActionResult;
    logout: () => Promise<void>;
    changePassword: (currentPassword: string, nextPassword: string) => AuthActionResult;
    hydrateSession: () => Promise<void>;
    clearSession: () => void;
    reset: () => void;
}

function createDemoSession(credential: DemoCredential): AuthSession {
    return {
        user: {
            id: credential.id,
            name: credential.displayName,
            email: credential.email,
            role: credential.role,
        },
        loggedInAt: new Date().toISOString(),
    };
}

function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false;

    return Date.parse(expiresAt) <= Date.now();
}

const initialState = {
    credentials: demoCredentials,
    session: null as AuthSession | null,
    accessToken: null as string | null,
    accessTokenExpiresAt: null as string | null,
    authSource: null as AuthSource | null,
    isHydrating: false,
    isSubmitting: false,
};

function clearAuthState(set: (payload: Partial<AuthState>) => void) {
    set({
        session: null,
        accessToken: null,
        accessTokenExpiresAt: null,
        authSource: null,
        isHydrating: false,
        isSubmitting: false,
    });
    runProtectedSessionCleanup();
}

async function applyAuthenticatedBackendSession(
    response: BackendAuthResponse,
    set: (payload: Partial<AuthState>) => void,
) {
    const session = adaptBackendUserToSession(response.user);

    if (!session) {
        set({ isSubmitting: false });
        return {
            success: false,
            error: "Không thể xử lý thông tin tài khoản. Vui lòng thử lại.",
        };
    }

    set({
        session,
        accessToken: response.access_token,
        accessTokenExpiresAt: response.expires_at ?? null,
        authSource: "backend",
        isSubmitting: false,
    });

    if (session.user.role === "customer") {
        await useAccountStore.getState().loadProfile();
        await useShopStore.getState().loadWishlist();
    }

    return { success: true };
}

export function redirectForRole(role: UserRole) {
    if (role === "customer") return routes.accountProfile;
    if (role === "admin") return routes.adminDashboard;
    if (role === "supplier") return routes.supplierOrders;
    if (role === "warehouse") return routes.warehouseInventory;

    return routes.home;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            ...initialState,
            login: async (email, password) => {
                set({ isSubmitting: true });

                try {
                    const response = await apiRequest<BackendAuthResponse>("/login", {
                        method: "POST",
                        body: {
                            email: email.trim(),
                            password,
                        },
                    });

                    return await applyAuthenticatedBackendSession(response, set);
                } catch (error) {
                    set({ isSubmitting: false });

                    return {
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Không thể đăng nhập. Vui lòng kiểm tra email và mật khẩu.",
                    };
                }
            },
            register: async (payload) => {
                set({ isSubmitting: true });

                try {
                    const response = await apiRequest<BackendAuthResponse>("/register", {
                        method: "POST",
                        body: {
                            full_name: payload.fullName.trim(),
                            email: payload.email.trim(),
                            phone: payload.phone.trim(),
                            password: payload.password,
                            password_confirmation: payload.passwordConfirmation,
                        },
                    });

                    return await applyAuthenticatedBackendSession(response, set);
                } catch (error) {
                    set({ isSubmitting: false });

                    return {
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Không thể đăng ký tài khoản lúc này. Vui lòng thử lại.",
                    };
                }
            },
            loginAsRole: (role) => {
                const credential = get().credentials.find((item) => item.role === role);

                if (!credential) {
                    return {
                        success: false,
                        error: "Không có tài khoản demo cho vai trò này.",
                    };
                }

                set({
                    session: createDemoSession(credential),
                    accessToken: null,
                    accessTokenExpiresAt: null,
                    authSource: "demo",
                });

                return { success: true };
            },
            logout: async () => {
                const currentToken = get().accessToken;
                const authSource = get().authSource;

                if (authSource === "backend" && isExpired(get().accessTokenExpiresAt)) {
                    clearAuthState(set);
                    return;
                }

                if (authSource === "backend" && currentToken) {
                    try {
                        await apiRequest("/logout", {
                            method: "POST",
                            token: currentToken,
                        });
                    } catch {
                    }
                }

                clearAuthState(set);
            },
            changePassword: (currentPassword, nextPassword) => {
                const session = get().session;

                if (!session) {
                    return { success: false, error: "Bạn cần đăng nhập trước." };
                }

                if (get().authSource === "backend") {
                    return {
                        success: false,
                        error: "Tính năng đổi mật khẩu backend đang được phát triển.",
                    };
                }

                const matchedCredential = get().credentials.find(
                    (credential) => credential.id === session.user.id,
                );

                if (!matchedCredential || matchedCredential.password !== currentPassword) {
                    return {
                        success: false,
                        error: "Mật khẩu hiện tại chưa chính xác.",
                    };
                }

                if (nextPassword.trim().length < 6) {
                    return {
                        success: false,
                        error: "Mật khẩu mới phải có ít nhất 6 ký tự.",
                    };
                }

                set((state) => ({
                    credentials: state.credentials.map((credential) =>
                        credential.id === matchedCredential.id
                            ? { ...credential, password: nextPassword.trim() }
                            : credential,
                    ),
                }));

                return { success: true };
            },
            hydrateSession: async () => {
                const currentToken = get().accessToken;
                const authSource = get().authSource;

                if (authSource === "backend" && isExpired(get().accessTokenExpiresAt)) {
                    clearAuthState(set);
                    return;
                }

                if (!currentToken || authSource !== "backend") {
                    set({ isHydrating: false });
                    return;
                }

                set({ isHydrating: true });

                try {
                    const response = await apiRequest<BackendMeResponse>("/me", {
                        token: currentToken,
                    });
                    const session = adaptBackendUserToSession(response.user);

                    if (!session) {
                        clearAuthState(set);
                        return;
                    }

                    set({
                        session,
                        accessTokenExpiresAt: response.expires_at ?? get().accessTokenExpiresAt,
                        authSource: "backend",
                        isHydrating: false,
                    });

                    if (session.user.role === "customer") {
                        await useAccountStore.getState().loadProfile();
                        await useShopStore.getState().loadWishlist();
                    }
                } catch (error) {
                    if (isUnauthorizedApiError(error)) {
                        clearAuthState(set);
                        return;
                    }

                    set({ isHydrating: false });
                }
            },
            clearSession: () => clearAuthState(set),
            reset: () => set(initialState),
        }),
        {
            name: "heritage-auth-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                credentials: state.credentials,
                session: state.session,
                accessToken: state.accessToken,
                accessTokenExpiresAt: state.accessTokenExpiresAt,
                authSource: state.authSource,
            }),
        },
    ),
);
