import { NavLink } from "react-router-dom";

import type { RewardSnapshot, UserProfile } from "@/entities/user/model/types";
import { routes } from "@/shared/config/routes";
import { ProfileSummaryCard, cn } from "@/shared/ui";

export interface ProfileSidebarProps {
    profile: UserProfile;
    rewards: RewardSnapshot;
}

export function AccountSidebar({ profile, rewards }: ProfileSidebarProps) {
    const itemClasses = ({ isActive }: { isActive: boolean }) =>
        cn(
            "block rounded-full px-4 py-2.5 text-sm font-medium transition",
            isActive
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary",
        );

    return (
        <aside className="space-y-6">
            <ProfileSummaryCard profile={profile} rewards={rewards} />
            <div className="rounded-3xl bg-surface-container-low p-4">
                <nav className="flex flex-col gap-2">
                    <NavLink className={itemClasses} to={routes.accountProfile}>
                        Thông tin cá nhân
                    </NavLink>
                    <NavLink className={itemClasses} to={routes.accountWishlist}>
                        Danh sách yêu thích
                    </NavLink>
                    <NavLink className={itemClasses} to={routes.accountOrders}>
                        Lịch sử đơn hàng
                    </NavLink>
                </nav>
            </div>
        </aside>
    );
}
