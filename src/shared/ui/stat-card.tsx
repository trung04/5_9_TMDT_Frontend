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
                "flex h-full flex-col justify-between rounded-3xl bg-surface-container-lowest p-6 shadow-ambient",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className={cn("rounded-2xl p-3", toneMap[metric.tone])}>
                    <Icon name={metric.icon} className="text-2xl" fill />
                </div>
                {metric.delta ? (
                    <span className="text-xs font-label font-semibold text-primary">
                        {metric.delta}
                    </span>
                ) : null}
            </div>
            <div className="space-y-1">
                <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant/70">
                    {metric.label}
                </p>
                <h3 className="font-headline text-3xl font-bold text-on-surface">{metric.value}</h3>
                {metric.helperText ? (
                    <p className="text-sm text-on-surface-variant">{metric.helperText}</p>
                ) : null}
            </div>
        </article>
    );
}
