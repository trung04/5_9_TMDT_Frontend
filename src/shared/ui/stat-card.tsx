import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import type { MetricCardData, StatusTone } from "@/shared/types/ui";

const toneMap: Record<StatusTone, string> = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary-container/70",
    tertiary: "text-tertiary bg-tertiary-fixed/60",
    success: "text-primary bg-on-primary-container",
    warning: "text-tertiary bg-tertiary/10",
    danger: "text-error bg-error-container",
    neutral: "text-on-surface-variant bg-surface-container-high",
};

interface StatCardProps {
    metric: MetricCardData;
    className?: string;
}

export function StatCard({ metric, className }: StatCardProps) {
    return (
        <article
            className={cn(
                "flex h-full flex-col rounded-3xl bg-surface-container-lowest p-6 shadow-ambient",
                className,
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn("rounded-2xl p-3", toneMap[metric.tone])}>
                    <Icon name={metric.icon} className="text-2xl" fill />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface">
                    {metric.label}
                </p>
            </div>

            <div className="flex flex-1 items-center justify-center pt-6 text-center">
                <h3 className="font-headline text-3xl font-bold text-on-surface">{metric.value}</h3>
            </div>
        </article>
    );
}
