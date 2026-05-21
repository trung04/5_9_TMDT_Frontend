import { routes } from "@/shared/config/routes";
import { Badge, ButtonLink, SurfaceCard } from "@/shared/ui";

const storyPillars = [
    {
        title: "Chọn lọc theo mùa",
        description:
            "Mỗi đợt ra mắt được biên tập theo mùa vụ thật, ưu tiên độ tươi mới và câu chuyện sản xuất rõ ràng.",
    },
    {
        title: "Kể chuyện vùng miền",
        description:
            "Sản phẩm không đứng một mình mà luôn đi kèm bối cảnh địa lý, cách làm và con người phía sau.",
    },
    {
        title: "Thiết kế để bán hàng",
        description:
            "Từ hero, card, wishlist đến checkout đều được ghép thành một luồng storefront chặt chẽ, dễ mở rộng.",
    },
];

const sourcingSteps = [
    "Khảo sát nhà sản xuất và kiểm tra lô hàng mẫu.",
    "Biên tập câu chuyện, vùng nguyên liệu và chuẩn hóa thông tin hiển thị.",
    "Đưa sản phẩm vào storefront với filter, wishlist và luồng mua hàng liền mạch.",
];

export function StoryPage() {
    return (
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-24">
            <section className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
                <SurfaceCard className="space-y-6">
                    <Badge tone="primary">Câu chuyện Heritage Harvest</Badge>
                    <div>
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
                            Một storefront dành cho đặc sản Việt, không chỉ để trưng bày mà để kể
                            đúng câu chuyện.
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-on-surface-variant">
                            Heritage Harvest được phát triển như một hệ frontend thương mại điện tử
                            có khả năng liên kết chặt chẽ giữa nội dung biên tập, trải nghiệm mua
                            hàng, quản trị đơn và dữ liệu vận hành.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <ButtonLink to={routes.products}>Xem bộ sưu tập hiện có</ButtonLink>
                        <ButtonLink to={routes.regions} variant="secondary">
                            Khám phá vùng miền
                        </ButtonLink>
                    </div>
                </SurfaceCard>

                <SurfaceCard tone="low" className="space-y-5">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                        Ba nguyên tắc thiết kế
                    </h2>
                    <div className="space-y-4">
                        {storyPillars.map((pillar) => (
                            <div
                                key={pillar.title}
                                className="rounded-3xl bg-surface-container-lowest p-5"
                            >
                                <h3 className="font-headline text-xl font-semibold text-on-surface">
                                    {pillar.title}
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                                    {pillar.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>
            </section>

            <section className="mt-16 grid gap-8 xl:grid-cols-[1fr_0.9fr]">
                <SurfaceCard tone="low" className="space-y-4">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                        Quy trình tuyển chọn
                    </p>
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                        Từ nhà sản xuất đến một trải nghiệm mua sắm đủ đầu-cuối.
                    </h2>
                    <div className="space-y-3">
                        {sourcingSteps.map((step, index) => (
                            <div
                                key={step}
                                className="flex gap-4 rounded-3xl bg-surface-container-lowest p-4"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                                    {index + 1}
                                </span>
                                <p className="text-sm leading-6 text-on-surface-variant">{step}</p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>

                <SurfaceCard className="space-y-4">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                        Frontend system
                    </p>
                    <h2 className="font-headline text-2xl font-bold text-on-surface">
                        Các phần đã được kết nối lại thành một luồng e-commerce hoàn chỉnh hơn.
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            "Điều hướng nội dung cho Câu chuyện và Vùng miền",
                            "Wishlist gắn vào header, card sản phẩm, trang chi tiết và tài khoản",
                            "Checkout có giao vận, mã ưu đãi và trang đặt hàng thành công",
                            "Đơn hàng mới đi ngược trở lại lịch sử đơn trong tài khoản",
                        ].map((item) => (
                            <div
                                key={item}
                                className="rounded-3xl bg-surface-container-low p-5 text-sm text-on-surface-variant"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </SurfaceCard>
            </section>
        </div>
    );
}
