import { NavLink } from "react-router-dom";

import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import type { ShellNavItem } from "@/shared/types/ui";

interface SidebarNavProps {
    items: ShellNavItem[];
    className?: string;
}

export function SidebarNav({ items, className }: SidebarNavProps) {
    return (
        <nav className={cn("space-y-1", className)}>
            {items.map((item) =>
                item.to ? (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        end={item.to === "/" || item.to === "/admin"}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                                isActive
                                    ? "border-r-4 border-primary bg-white/75 text-primary shadow-sm"
                                    : "text-on-surface-variant hover:bg-white/35 hover:text-primary",
                            )
                        }
                    >
                        <Icon name={item.icon} className="text-xl" fill={item.to !== undefined} />
                        <span>{item.label}</span>
                    </NavLink>
                ) : (
                    <div
                        key={item.label}
                        className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-on-surface-variant/40"
                    >
                        <Icon name={item.icon} className="text-xl" />
                        <span>{item.label}</span>
                    </div>
                ),
            )}
        </nav>
    );
}
