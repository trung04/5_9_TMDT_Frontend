import { catalogRepository } from "@/shared/api/mock-repositories";
import { routes } from "@/shared/config/routes";
import { ButtonLink, SurfaceCard } from "@/shared/ui";

export function RegionsPage() {
    const regions = catalogRepository.listRegions();

    return (
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-24">
            <section className="space-y-4">
                <p className="text-xs uppercase tracking-widest text-primary">Khám phá vùng miền</p>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
                    Khu nội dung vùng miền vẫn giữ chất kể chuyện.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-on-surface-variant">
                    Tìm hiểu đặc sản vùng miền, câu chuyện nguồn gốc và những trải nghiệm mua sắm đặc sắc.
                </p>
            </section>

            <section className="mt-12 grid gap-6 xl:grid-cols-2">
                {regions.map((region, index) => {
                    const regionProducts = catalogRepository.getProductsByRegion(region.id);
                    const featuredProduct = regionProducts[index] ?? regionProducts[0];

                    return (
                        <SurfaceCard key={region.id} className="overflow-hidden p-0">
                            <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                                <img
                                    src={featuredProduct?.image}
                                    alt={region.name}
                                    className="h-full w-full object-cover"
                                />
                                <div className="space-y-5 p-6">
                                    <p className="text-xs uppercase tracking-widest text-primary">
                                        Nội dung minh họa
                                    </p>
                                    <h2 className="font-headline text-3xl font-bold text-on-surface">
                                        {region.name}
                                    </h2>
                                    <p className="text-sm leading-6 text-on-surface-variant">
                                        {region.description}
                                    </p>
                                    {featuredProduct ? (
                                        <div className="rounded-3xl bg-surface-container-low p-5">
                                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                                Sản phẩm minh họa
                                            </p>
                                            <p className="mt-2 font-headline text-xl font-semibold text-on-surface">
                                                {featuredProduct.name}
                                            </p>
                                            <p className="mt-2 text-sm text-on-surface-variant">
                                                {featuredProduct.shortDescription}
                                            </p>
                                        </div>
                                    ) : null}
                                    <div className="flex flex-wrap gap-3">
                                        <ButtonLink to={routes.products}>Khám phá sản phẩm</ButtonLink>
                                        <ButtonLink to={routes.story} variant="secondary">
                                            Xem câu chuyện thương hiệu
                                        </ButtonLink>
                                    </div>
                                </div>
                            </div>
                        </SurfaceCard>
                    );
                })}
            </section>
        </div>
    );
}
