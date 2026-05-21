import { Navigate, Route, Routes } from "react-router-dom";

import { AccountLayout } from "@/app/layouts/account-layout";
import { AdminLayout } from "@/app/layouts/admin-layout";
import { PortalLayout } from "@/app/layouts/portal-layout";
import { StorefrontLayout } from "@/app/layouts/storefront-layout";
import { RouteGuard } from "@/app/route-guard";
import { AccountAddressesPage } from "@/pages/account-addresses/ui/account-addresses-page";
import { AccountDisputesPage } from "@/pages/account-disputes/ui/account-disputes-page";
import { AccountNotificationsPage } from "@/pages/account-notifications/ui/account-notifications-page";
import { AccountWishlistPage } from "@/pages/account-wishlist/ui/account-wishlist-page";
import { AccountOrdersPage } from "@/pages/account-orders/ui/account-orders-page";
import { AccountProfilePage } from "@/pages/account-profile/ui/account-profile-page";
import { AccountRewardsPage } from "@/pages/account-rewards/ui/account-rewards-page";
import { AccountSecurityPage } from "@/pages/account-security/ui/account-security-page";
import { AdminCommunityPage } from "@/pages/admin-community/ui/admin-community-page";
import { AdminAccessPage } from "@/pages/admin-access/ui/admin-access-page";
import { AdminDashboardPage } from "@/pages/admin-dashboard/ui/admin-dashboard-page";
import { AdminLogisticsPage } from "@/pages/admin-logistics/ui/admin-logistics-page";
import { AdminRepositoryPage } from "@/pages/admin-repository/ui/admin-repository-page";
import { AdminSettingsPage } from "@/pages/admin-settings/ui/admin-settings-page";
import { ProductCatalogPage } from "@/pages/catalog/ui/product-catalog-page";
import { CheckoutPage } from "@/pages/checkout/ui/checkout-page";
import { HomePage } from "@/pages/home/ui/home-page";
import { LoginPage } from "@/pages/login/ui/login-page";
import { LogoutPage } from "@/pages/logout/ui/logout-page";
import { OrderSuccessPage } from "@/pages/order-success/ui/order-success-page";
import { ProductDetailPage } from "@/pages/product-detail/ui/product-detail-page";
import { RegionsPage } from "@/pages/regions/ui/regions-page";
import { StoryPage } from "@/pages/story/ui/story-page";
import { SupplierHelpPage } from "@/pages/supplier-help/ui/supplier-help-page";
import { SupplierInventoryPage } from "@/pages/supplier-inventory/ui/supplier-inventory-page";
import { SupplierOrdersPage } from "@/pages/supplier-orders/ui/supplier-orders-page";
import { SupplierProcessingPage } from "@/pages/supplier-processing/ui/supplier-processing-page";
import { SupplierRequisitionsPage } from "@/pages/supplier-requisitions/ui/supplier-requisitions-page";
import { UnauthorizedPage } from "@/pages/unauthorized/ui/unauthorized-page";
import { WarehouseFulfillmentPage } from "@/pages/warehouse-fulfillment/ui/warehouse-fulfillment-page";
import { WarehouseHelpPage } from "@/pages/warehouse-help/ui/warehouse-help-page";
import { WarehouseInventoryPage } from "@/pages/warehouse-inventory/ui/warehouse-inventory-page";
import { WarehouseRequisitionsPage } from "@/pages/warehouse-requisitions/ui/warehouse-requisitions-page";
import { WarehouseSupplierOrdersPage } from "@/pages/warehouse-supplier-orders/ui/warehouse-supplier-orders-page";
import { routes as appRoutes } from "@/shared/config/routes";

export function AppRoutes() {
    return (
        <Routes>
            <Route element={<StorefrontLayout />}>
                <Route path={appRoutes.home} element={<HomePage />} />
                <Route path={appRoutes.login} element={<LoginPage />} />
                <Route path={appRoutes.register} element={<LoginPage />} />
                <Route path={appRoutes.logout} element={<LogoutPage />} />
                <Route path={appRoutes.unauthorized} element={<UnauthorizedPage />} />
                <Route path={appRoutes.products} element={<ProductCatalogPage />} />
                <Route path={appRoutes.productDetail()} element={<ProductDetailPage />} />
                <Route path={appRoutes.story} element={<StoryPage />} />
                <Route path={appRoutes.regions} element={<RegionsPage />} />
                <Route path={appRoutes.checkout} element={<CheckoutPage />} />
                <Route
                    path={appRoutes.orderSuccess()}
                    element={
                        <RouteGuard allowedRoles={["customer"]}>
                            <OrderSuccessPage />
                        </RouteGuard>
                    }
                />
            </Route>

            <Route
                element={
                    <RouteGuard allowedRoles={["customer"]}>
                        <AccountLayout />
                    </RouteGuard>
                }
            >
                <Route path={appRoutes.accountProfile} element={<AccountProfilePage />} />
                <Route path={appRoutes.accountSecurity} element={<AccountSecurityPage />} />
                <Route
                    path={appRoutes.accountNotifications}
                    element={<AccountNotificationsPage />}
                />
                <Route path={appRoutes.accountAddresses} element={<AccountAddressesPage />} />
                <Route path={appRoutes.accountRewards} element={<AccountRewardsPage />} />
                <Route path={appRoutes.accountDisputes} element={<AccountDisputesPage />} />
                <Route path={appRoutes.accountWishlist} element={<AccountWishlistPage />} />
                <Route path={appRoutes.accountOrders} element={<AccountOrdersPage />} />
                <Route path={appRoutes.accountOrderDetail()} element={<AccountOrdersPage />} />
            </Route>

            <Route
                element={
                    <RouteGuard allowedRoles={["admin"]}>
                        <AdminLayout />
                    </RouteGuard>
                }
            >
                <Route path={appRoutes.adminDashboard} element={<AdminDashboardPage />} />
                <Route path={appRoutes.adminCommunity} element={<AdminCommunityPage />} />
                <Route path={appRoutes.adminRepository} element={<AdminRepositoryPage />} />
                <Route path={appRoutes.adminLogistics} element={<AdminLogisticsPage />} />
                <Route path={appRoutes.adminSettings} element={<AdminSettingsPage />} />
                <Route path={appRoutes.adminAccess} element={<AdminAccessPage />} />
            </Route>

            <Route
                element={
                    <RouteGuard allowedRoles={["supplier", "warehouse"]}>
                        <PortalLayout />
                    </RouteGuard>
                }
            >
                <Route path={appRoutes.supplierInventory} element={<SupplierInventoryPage />} />
                <Route
                    path={appRoutes.supplierRequisitions}
                    element={<SupplierRequisitionsPage />}
                />
                <Route path={appRoutes.supplierProcessing} element={<SupplierProcessingPage />} />
                <Route path={appRoutes.supplierOrders} element={<SupplierOrdersPage />} />
                <Route path={appRoutes.supplierHelp} element={<SupplierHelpPage />} />
                <Route path={appRoutes.warehouseInventory} element={<WarehouseInventoryPage />} />
                <Route
                    path={appRoutes.warehouseRequisitions}
                    element={<WarehouseRequisitionsPage />}
                />
                <Route
                    path={appRoutes.warehouseFulfillment}
                    element={<WarehouseFulfillmentPage />}
                />
                <Route
                    path={appRoutes.warehouseSupplierOrders}
                    element={<WarehouseSupplierOrdersPage />}
                />
                <Route path={appRoutes.warehouseHelp} element={<WarehouseHelpPage />} />
            </Route>

            <Route path="/account" element={<Navigate replace to={appRoutes.accountProfile} />} />
            <Route path="/admin" element={<Navigate replace to={appRoutes.adminDashboard} />} />
            <Route path="/supplier" element={<Navigate replace to={appRoutes.supplierOrders} />} />
            <Route
                path="/warehouse"
                element={<Navigate replace to={appRoutes.warehouseInventory} />}
            />
            <Route path="*" element={<Navigate replace to={appRoutes.home} />} />
        </Routes>
    );
}
