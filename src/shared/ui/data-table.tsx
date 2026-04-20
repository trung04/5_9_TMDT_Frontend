import { cn } from "@/shared/lib/cn";
import type { TableColumn } from "@/shared/types/ui";

interface DataTableProps<T> {
    rows: T[];
    columns: TableColumn<T>[];
    getRowKey: (row: T) => string;
    className?: string;
    rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({
    rows,
    columns,
    getRowKey,
    className,
    rowClassName,
}: DataTableProps<T>) {
    return (
        <div className={cn("overflow-x-auto rounded-[1.5rem]", className)}>
            <table className="min-w-full text-left">
                <thead className="bg-surface-container-low">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={cn(
                                    "px-6 py-4 text-[11px] font-label uppercase tracking-widest text-on-surface-variant/70",
                                    column.align === "center" && "text-center",
                                    column.align === "right" && "text-right",
                                    column.className,
                                )}
                            >
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr
                            key={getRowKey(row)}
                            className={cn(
                                index % 2 === 0 ? "bg-surface" : "bg-surface-container-low/60",
                                "transition hover:bg-surface-container-lowest",
                                rowClassName?.(row),
                            )}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={cn(
                                        "px-6 py-5 align-top text-sm leading-6 text-on-surface",
                                        column.align === "center" && "text-center",
                                        column.align === "right" && "text-right",
                                        column.className,
                                    )}
                                >
                                    {column.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
