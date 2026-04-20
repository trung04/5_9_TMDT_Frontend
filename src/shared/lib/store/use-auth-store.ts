import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
    AuthSession,
    AuthSource,
    DemoCredential,
    UserRole,
} from "@/entities/user/model/types";
import type { BackendAuthResponse, BackendMeResponse, BackendUser } from "@/shared/api/backend-types";
import { apiRequest, isUnauthorizedApiError } from "@/shared/api/backend-client";
import { adaptBackendUserToSession, normalizeUserRole } from "@/shared/api/storefront-adapters";
import { routes } from "@/shared/config/routes";
import { useAccountStore } from "@/shared/lib/store/use-account-store";
import { runProtectedSessionCleanup } from "@/shared/lib/store/protected-session";

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

interface LoginResult {
    success: boolean;
    error?: string;
}

interface AuthState {
    credentials: DemoCredential[];
    session: AuthSession | null;
    accessToken: string | null;
    authSource: AuthSource | null;
    isHydrating: boolean;
    isSubmitting: boolean;
    login: (email: string, password: string) => Promise<LoginResult>;
    loginAsRole: (role: UserRole) => LoginResult;
    logout: () => Promise<void>;
    changePassword: (currentPassword: string, nextPassword: string) => LoginResult;
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

function syncProfile(user: BackendUser) {
    useAccountStore.getState().updateProfile({
        name: user.full_name,
        email: user.email,
        phone: user.phone,
    });
}

const initialState = {
    credentials: demoCredentials,
    session: null as AuthSession | null,
    accessToken: null as string | null,
    authSource: null as AuthSource | null,
    isHydrating: false,
    isSubmitting: false,
};

function clearAuthState(set: (payload: Partial<AuthState>) => void) {
    set({
        session: null,
        accessToken: null,
        authSource: null,
        isHydrating: false,
        isSubmitting: false,
    });
    runProtectedSessionCleanup();
}

export function redirectForRole(role: UserRole) {
    if (role === "customer") return routes.accountProfile;

    return (
        demoCredentials.find((credential) => credential.role === role)?.redirectTo ?? routes.home
    );
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
                    const normalizedRole = normalizeUserRole(response.user.role);

                    if (normalizedRole !== "customer") {
                        set({ isSubmitting: false });

                        return {
                            success: false,
                            error: "Form đăng nhập này hiện chỉ hỗ trợ tài khoản khách hàng.",
                        };
                    }

                    const session = adaptBackendUserToSession(response.user);

                    if (!session) {
                        set({ isSubmitting: false });

                        return {
                            success: false,
                            error: "Không thể tạo phiên đăng nhập từ backend.",
                        };
                    }

                    syncProfile(response.user);
                    set({
                        session,
                        accessToken: response.access_token,
                        authSource: "backend",
                        isSubmitting: false,
                    });

                    return { success: true };
                } catch (error) {
                    set({ isSubmitting: false });

                    return {
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Không thể kết nối backend để đăng nhập.",
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
                    authSource: "demo",
                });

                return { success: true };
            },
            logout: async () => {
                const token = get().accessToken;
                const authSource = get().authSource;

                if (authSource === "backend" && token) {
                    try {
                        await apiRequest("/logout", {
                            method: "POST",
                            token,
                        });
                    } catch {
                        // Ignore transport errors and always clear local auth state.
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
                        error: "Tính năng đổi mật khẩu backend chưa được tích hợp ở frontend này.",
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
                const token = get().accessToken;
                const authSource = get().authSource;

                if (!token || authSource !== "backend") {
                    set({ isHydrating: false });
                    return;
                }

                set({ isHydrating: true });

                try {
                    const response = await apiRequest<BackendMeResponse>("/me", {
                        token,
                    });
                    const session = adaptBackendUserToSession(response.user);

                    if (!session) {
                        clearAuthState(set);
                        return;
                    }

                    syncProfile(response.user);
                    set({
                        session,
                        authSource: "backend",
                        isHydrating: false,
                    });
                } catch (error) {
                    if (isUnauthorizedApiError(error)) {
                        clearAuthState(set);
                        return;
                    }

                    set({
                        isHydrating: false,
                    });
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
                authSource: state.authSource,
            }),
        },
    ),
);
