import type { Order } from "@/entities/order/model/types";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { deliveryStatusLabels, paymentStatusLabels } from "@/shared/lib/labels";
import { Badge, Button, DataTable } from "@/shared/ui";
import type { TableColumn } from "@/shared/types/ui";

export interface OrderTableProps {
    orders: Order[];
    activeOrderId?: string;
    onSelectOrder?: (orderId: string) => void;
    mode?: "account" | "supplier" | "admin";
}

function paymentTone(order: Order) {
    if (order.paymentStatus === "paid") return "primary" as const;
    if (order.paymentStatus === "cod") return "secondary" as const;
    if (order.paymentStatus === "refunded") return "danger" as const;
    return "neutral" as const;
}

function deliveryTone(order: Order) {
    if (order.deliveryStatus === "delivered") return "success" as const;
    if (order.deliveryStatus === "in_transit") return "warning" as const;
    if (order.deliveryStatus === "disputed") return "danger" as const;
    return "primary" as const;
}

export function OrderTable({
    orders,
    activeOrderId,
    onSelectOrder,
    mode = "supplier",
}: OrderTableProps) {
    const columns: TableColumn<Order>[] = [
        {
            key: "orderId",
            title: "Mã đơn",
            render: (order) => <span className="font-semibold">#{order.id}</span>,
        },
        ...(mode !== "account"
            ? [
                  {
                      key: "customer",
                      title: mode === "admin" ? "Khách hàng" : "Người mua / Nhà cung cấp",
                      render: (order: Order) => (
                          <div>
                              <p className="font-medium text-on-surface">{order.customerName}</p>
                              <p className="text-xs text-on-surface-variant">
                                  {order.supplierName}
                              </p>
                          </div>
                      ),
                  } satisfies TableColumn<Order>,
              ]
            : []),
        {
            key: "date",
            title: "Ngày",
            render: (order) => (
                <span className="text-on-surface-variant">{formatDate(order.date)}</span>
            ),
        },
        {
            key: "total",
            title: "Tổng tiền",
            render: (order) => <span className="font-semibold">{formatCurrency(order.total)}</span>,
        },
        {
            key: "payment",
            title: "Thanh toán",
            render: (order) => (
                <Badge tone={paymentTone(order)}>{paymentStatusLabels[order.paymentStatus]}</Badge>
            ),
        },
        {
            key: "delivery",
            title: "Vận chuyển",
            render: (order) => (
                <Badge tone={deliveryTone(order)}>
                    {deliveryStatusLabels[order.deliveryStatus]}
                </Badge>
            ),
        },
        {
            key: "action",
            title: "Thao tác",
            align: "right",
            render: (order) => (
                <Button variant="ghost" size="sm" onClick={() => onSelectOrder?.(order.id)}>
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            rows={orders}
            columns={columns}
            getRowKey={(order) => order.id}
            rowClassName={(order) =>
                order.id === activeOrderId ? "border-l-4 border-primary bg-primary/5" : undefined
            }
        />
    );
}
