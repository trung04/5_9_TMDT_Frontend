import { cn } from "@/shared/lib/cn";

interface IconProps {
    name: string;
    className?: string;
    fill?: boolean;
}

export function Icon({ name, className, fill = false }: IconProps) {
    return (
        <span
            className={cn("material-symbols-outlined select-none", className)}
            style={{
                fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
            }}
            aria-hidden="true"
        >
            {name}
        </span>
    );
}
