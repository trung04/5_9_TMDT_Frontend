import { cn } from "@/shared/lib/cn";

interface TabItem {
    label: string;
    value: string;
}

interface TabsProps {
    items: TabItem[];
    activeValue: string;
    onChange: (value: string) => void;
    className?: string;
}

export function Tabs({ items, activeValue, onChange, className }: TabsProps) {
    return (
        <div
            className={cn(
                "flex flex-wrap gap-2 rounded-full bg-surface-container-highest/40 p-1.5",
                className,
            )}
        >
            {items.map((item) => {
                const isActive = item.value === activeValue;

                return (
                    <button
                        key={item.value}
                        className={cn(
                            "rounded-full px-5 py-2 text-sm font-medium transition",
                            isActive
                                ? "bg-surface-container-lowest text-primary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface",
                        )}
                        onClick={() => onChange(item.value)}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
