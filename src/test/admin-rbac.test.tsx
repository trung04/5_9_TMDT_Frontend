import { MemoryRouter } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { adaptBackendUserToSession } from "@/shared/api/storefront-adapters";
import { resetDemoState } from "@/shared/lib/store/reset-demo";
import { useAuthStore } from "@/shared/lib/store/use-auth-store";
import { createBackendUser } from "@/test/backend-test-utils";
import { AdminSidebar } from "@/widgets/admin-sidebar";

describe("admin RBAC frontend", () => {
    beforeEach(() => {
        localStorage.clear();
        resetDemoState();
    });

    it("adapts backend admin role and permissions into the auth session", () => {
        const session = adaptBackendUserToSession(
            createBackendUser({
                role: "ADMIN",
                admin_role: {
                    id: 1,
                    name: "Super Admin",
                    slug: "super_admin",
                    is_super: true,
                },
                permissions: ["admin.dashboard.view"],
            }),
        );

        expect(session?.user.role).toBe("admin");
        expect(session?.user.adminRole?.isSuper).toBe(true);
        expect(session?.user.permissions).toEqual(["admin.dashboard.view"]);
    });

    it("shows access management only for super admin sessions", () => {
        act(() => {
            useAuthStore.setState({
                session: {
                    user: {
                        id: "1",
                        name: "Root",
                        email: "root@example.com",
                        role: "admin",
                        adminRole: {
                            id: "1",
                            name: "Super Admin",
                            slug: "super_admin",
                            isSuper: true,
                        },
                        permissions: [],
                    },
                    loggedInAt: "2026-05-21T00:00:00.000Z",
                },
            });
        });

        const { rerender } = render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText("Phan quyen")).toBeInTheDocument();

        act(() => {
            useAuthStore.setState({
                session: {
                    user: {
                        id: "2",
                        name: "Operator",
                        email: "operator@example.com",
                        role: "admin",
                        adminRole: {
                            id: "2",
                            name: "Dashboard Viewer",
                            slug: "dashboard_viewer",
                            isSuper: false,
                        },
                        permissions: ["admin.dashboard.view"],
                    },
                    loggedInAt: "2026-05-21T00:00:00.000Z",
                },
            });
        });

        rerender(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText("Tong quan")).toBeInTheDocument();
        expect(screen.queryByText("Phan quyen")).not.toBeInTheDocument();
        expect(screen.queryByText("Kho san pham")).not.toBeInTheDocument();
    });
});
