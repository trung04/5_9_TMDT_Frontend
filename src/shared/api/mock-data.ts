import type { Category, Product, Region, Review } from "@/entities/product/model/types";
import type {
    FulfillmentTask,
    InventoryItem,
    PurchaseRequisition,
} from "@/entities/inventory/model/types";
import type { Order } from "@/entities/order/model/types";
import type {
    CustomerRecord,
    RewardSnapshot,
    SupplierPartner,
    UserProfile,
} from "@/entities/user/model/types";
import type { MetricCardData } from "@/shared/types/ui";

export const categories: Category[] = [
    {
        id: "cat-tea-coffee",
        name: "Trà & Cà phê",
        description: "Những mẻ trà, cà phê tuyển chọn từ miền núi và cao nguyên.",
    },
    {
        id: "cat-spice",
        name: "Gia vị",
        description: "Gia vị đặc sản có nguồn gốc rõ ràng và hương vị bản địa.",
    },
    {
        id: "cat-drygoods",
        name: "Đồ khô",
        description: "Gạo, hạt, quả sấy và nguyên liệu gian bếp chất lượng cao.",
    },
    {
        id: "cat-craft",
        name: "Thủ công mỹ nghệ",
        description: "Vật phẩm được chọn lọc để kể câu chuyện vùng miền.",
    },
];

export const regions: Region[] = [
    {
        id: "region-tay-bac",
        name: "Tây Bắc",
        description: "Nơi những đồi trà, mật ong rừng và gia vị núi cao hội tụ.",
    },
    {
        id: "region-tay-nguyen",
        name: "Tây Nguyên",
        description: "Thủ phủ cà phê, macca và nông sản cao nguyên.",
    },
    {
        id: "region-dbscl",
        name: "Miền Tây",
        description: "Vùng lúa gạo, nước mắm, đồ khô và đặc sản sông nước.",
    },
    {
        id: "region-duyen-hai",
        name: "Miền Trung",
        description: "Hương vị mặn mà của biển và nông nghiệp ven đồi.",
    },
];

const defaultShippingNotice = {
    title: "Giao hàng miễn phí",
    description: "Cho đơn hàng trên 1.000.000 VND. Nhận hàng trong 2-3 ngày.",
};

const defaultHeritageCommitments = [
    {
        icon: "eco",
        text: "100% Tự nhiên, không chất bảo quản hay tạo màu.",
    },
    {
        icon: "handshake",
        text: "Trực tiếp từ hộ nông dân và hợp tác xã địa phương.",
    },
    {
        icon: "history_edu",
        text: "Lưu giữ kỹ thuật thủ công truyền thống trong từng lô hàng.",
    },
];

export const products: Product[] = [
    {
        id: "prod-tra-tan-cuong",
        slug: "tra-tan-cuong-thai-nguyen",
        name: "Trà Tân Cương Thái Nguyên",
        detailTitle: "Trà Tân Cương Thái Nguyên - Loại Thượng Hạng",
        subtitle: "Loại thượng hạng, hậu vị ngọt sâu",
        categoryId: "cat-tea-coffee",
        categoryName: "Trà & Cà phê",
        regionId: "region-tay-bac",
        regionName: "Tây Bắc",
        description:
            "Lá trà non được thu hái sớm, sao bằng tay và đóng gói theo lô nhỏ để giữ mùi cốm đặc trưng.",
        shortDescription: "Hương cốm non, vị chát nhẹ và hậu vị ngọt thanh cho buổi trà chiều.",
        price: 450000,
        originalPrice: 560000,
        rating: 4.9,
        reviewCount: 128,
        stockStatus: "in-stock",
        badge: "Thượng Hạng",
        tag: "Thái Nguyên",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuApEI8i5c5-lvSG4Dlzqoz_ycN0juCHIwgJu3FfozzIkOyIxQ9ptojAza2j8UI8hasmu7TOlgionfq-cY3H6PlEL8ywo7Q9ShEQzH3cLKFRf8Dni86n_WyOFH8nGRQG2nzf-wYHGbnmtVeIrVo6FoEtT4R5xELI2ROxWdoUp_rn8TYN8mY9qqAYcT6LXQWlZ1LhaniJBZQAaNAsEJ5jQH2O4pELA7gdA392tj2seqHbnk4X5_jOuW0CE3KuGtJwvRGuED9r7cA_DWY",
        gallery: [
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuApEI8i5c5-lvSG4Dlzqoz_ycN0juCHIwgJu3FfozzIkOyIxQ9ptojAza2j8UI8hasmu7TOlgionfq-cY3H6PlEL8ywo7Q9ShEQzH3cLKFRf8Dni86n_WyOFH8nGRQG2nzf-wYHGbnmtVeIrVo6FoEtT4R5xELI2ROxWdoUp_rn8TYN8mY9qqAYcT6LXQWlZ1LhaniJBZQAaNAsEJ5jQH2O4pELA7gdA392tj2seqHbnk4X5_jOuW0CE3KuGtJwvRGuED9r7cA_DWY",
                alt: "Premium Tan Cuong Tea",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCL7tBoZzcJk6SYYV4n9uL9wF26gyQJtpXK4IdDPE0SUUtb0a3s3itJ39WwmgQxI8-xW3Bnr-11PctCR7ueeTNOESiUvFoMSe987IwKijvUbGaDUM5Z4l-Bel0YlZSzdy9sACwULd_0inGPlb5g4AX0pXKydB3z77dx7e2WhMqpPr-g3ASP3htLMDzE_XA2ZxrT6Y2T1HaJNddLWtj2P8da3bQdUPgRtH5b7c6FMWP6jkDgjLZRHQ6raLmTAyBXJHbt44k5zQVQkG0",
                alt: "Close up dry tea leaves texture",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNwZPa5OUzJXLjq6t3dyG2zkiCXRqp3hZU7nL9Km7f7CCL_elO9i_5gBOt-hZZGTFJS1xNqBZ9Rpkd19KHSJZrO5heCLlxUGPhjJ_gLOmnq5tOQoFlNkwbaW2SVipo50DkHdC6voSTwW_0NJAOwot1brozLmmr48pOwnPNsmka94lBW2DKeTibLufJxmY2NQJc3y-ife7P5SP1v4vo7VzOznwK0Q8q78Q5lEpPhRSfjVZhrmImMJvtvN1LvsrlZtUGzCLudHc22w",
                alt: "Traditional Vietnamese tea pouring ceremony",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAr2XHch98KyNZoGnA_IGZIVZo7iopmHkQL52Kpnkerro2sf85Nzu420RgNRcXOceUs70hCwesuNlZHpW_kQZW3oPajaQFKaUQFNiwjXizZTZKfVLBMsLYI6NT_XroIWF_DTbOygrq12tLs10aDR5J5wXiSXGlmDjdE-RzbWLoYyXfVaKFVURlr6bzxJBXnosK84BV-oHxIVk2cdhHKC9N7O3ySjk-ZolHnGY0r9zWyp6BEspbQpSRZ0eGnXLA8dch_jceeKYEM9AM",
                alt: "Tea plantation hills in Thai Nguyen",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5Tqphbqc4zGwOkNwJ84nCwRCFQwzEyTx3RPEy5eeL0TVyWEpvIlsjU_yDO2WLFcyNUymnNY-XhUxHfuPsurZSUg5bkwUOHB9l8HqN_FIzrSnSISMfJq1K9Yk3FaixQommh6pmceITJtPyqheVPJzFr_PId-4V4eQqIs0YIQ79M4T9KpdUDpTBKQBeLzz1Fd1fHk46CQa0R2TVmn6RY3GJrsTJGS86gYGU4R5jkXZS42rO4lxiUQJzd9yXcpdfKZ7tUOxneoQ_yiQ",
                alt: "Steaming cup of green tea",
            },
        ],
        origin: "Thái Nguyên, Việt Nam",
        weight: "500g",
        shelfLife: "12 tháng",
        certifications: ["OCOP 4 Sao", "VietGAP"],
        shippingNotice: defaultShippingNotice,
        sourcing: {
            title: "Vùng nguyên liệu & Quy trình",
            body: 'Trà Tân Cương của Heritage Harvest được thu hái thủ công tại các đồi chè có độ cao trên 1000m tại Thái Nguyên. Chúng tôi chỉ chọn những búp chè "1 tôm 2 lá" non nhất vào buổi sớm tinh sương để đảm bảo hương vị thanh tao nhất.',
            certificationCards: [
                {
                    icon: "verified",
                    title: "Chứng nhận VietGAP",
                    description:
                        "Đảm bảo quy trình canh tác hữu cơ, không dư lượng thuốc bảo vệ thực vật.",
                },
                {
                    icon: "workspace_premium",
                    title: "OCOP 4 Sao",
                    description:
                        "Sản phẩm tiêu biểu của địa phương, đạt tiêu chuẩn xuất khẩu quốc tế.",
                },
            ],
        },
        heritageCommitments: [
            {
                icon: "eco",
                text: "100% Tự nhiên, không chất bảo quản hay tạo màu.",
            },
            {
                icon: "handshake",
                text: "Trực tiếp từ hộ nông dân Thái Nguyên.",
            },
            {
                icon: "history_edu",
                text: "Lưu giữ phương thức sao chè truyền thống.",
            },
        ],
    },
    {
        id: "prod-arabica",
        slug: "ca-phe-arabica-cau-dat",
        name: "Cà phê Arabica Cầu Đất",
        detailTitle: "Cà phê Arabica Cầu Đất - Rang Mộc",
        subtitle: "Rang mộc, hương hoa và chocolate nhẹ",
        categoryId: "cat-tea-coffee",
        categoryName: "Trà & Cà phê",
        regionId: "region-tay-nguyen",
        regionName: "Tây Nguyên",
        description:
            "Hạt cà phê rang vừa, giữ lại vị chua thanh và hương thơm trong trẻo đặc trưng của Cầu Đất.",
        shortDescription: "Lựa chọn phù hợp cho pour-over và cold brew với hậu vị sạch.",
        price: 250000,
        rating: 4.8,
        reviewCount: 96,
        stockStatus: "in-stock",
        badge: "Đặc sản Đà Lạt",
        tag: "Cầu Đất",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDSY18Y0pt9VoQJ_P711qNJumIYKNBIvCAWZ4zIyZsSAVxoRY3SVTwzOvIR_5xTiEdFJaYvQm8wM7Y-MDZKT8UKChNN-S89uNRgMAUMUIoeYrGidq32shCSv3Z6C-4Jb-OofC0pTkfyfoSD5VA7GHqiz13_oTiQVm2sPQxABzP8nshexcJ0vBLOrQSyQYF6T5L1Oq6lAncWJq9BtyKQlwIyrLXEWegJMs0W0882sywLHO5UHGhPEPIyo7QCgnm0QvlyWaed-txavU",
        gallery: [
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCueNGmwv_jbax_oi-9pOUsMpOgtA-IYe1eabIK7y_CK4WTwUyIHRPBAiH7JAup6-uloufJetLzmoT_j4csw4lzNSN-FEWs3UGnz4d9z7u2wp9skcyGzhmtY3h0PdOLQxLl8qMf8cMCzMBpR_ZWhZxvhfi9kx5ZkaVCu5SJksWKTVy2V6q4qLgk6a9fHFPbY7HUFWL8ojclTv1kzaRMoPBI526RW62GP0r6tO6Gb3yxanpJF8xcma_1fh_TFe2xoryspBr6bUY4_WM",
                alt: "Premium Vietnamese coffee beans in a burlap sack",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDSY18Y0pt9VoQJ_P711qNJumIYKNBIvCAWZ4zIyZsSAVxoRY3SVTwzOvIR_5xTiEdFJaYvQm8wM7Y-MDZKT8UKChNN-S89uNRgMAUMUIoeYrGidq32shCSv3Z6C-4Jb-OofC0pTkfyfoSD5VA7GHqiz13_oTiQVm2sPQxABzP8nshexcJ0vBLOrQSyQYF6T5L1Oq6lAncWJq9BtyKQlwIyrLXEWegJMs0W0882sywLHO5UHGhPEPIyo7QCgnm0QvlyWaed-txavU",
                alt: "Arabica beans from Cầu Đất",
            },
        ],
        origin: "Cầu Đất, Đà Lạt",
        weight: "340g",
        shelfLife: "9 tháng",
        certifications: ["Specialty Grade", "Truy xuất nguồn gốc"],
        shippingNotice: defaultShippingNotice,
        sourcing: {
            title: "Độ cao & Mẻ rang",
            body: "Arabica được thu mua từ những đồi cà phê cao trên 1.500m, rang mộc theo mẻ nhỏ để giữ độ sạch vị và hương hoa đặc trưng.",
            certificationCards: [
                {
                    icon: "coffee",
                    title: "Rang theo mẻ nhỏ",
                    description: "Kiểm soát profile rang cho từng lô hạt để giữ độ ổn định.",
                },
                {
                    icon: "landscape",
                    title: "Độ cao 1.500m",
                    description: "Khí hậu lạnh giúp hạt phát triển hương acid sáng và hậu vị sạch.",
                },
            ],
        },
        heritageCommitments: defaultHeritageCommitments,
    },
    {
        id: "prod-st25",
        slug: "gao-st25-song-hau",
        name: "Gạo ST25 Sông Hậu",
        detailTitle: "Gạo ST25 Sông Hậu - Tuyển Chọn",
        subtitle: "Hạt dài, mềm dẻo, thơm lá dứa",
        categoryId: "cat-drygoods",
        categoryName: "Đồ khô",
        regionId: "region-dbscl",
        regionName: "Miền Tây",
        description:
            "Loại gạo được canh tác theo lô, phù hợp cho bữa cơm gia đình và quy cách quà tặng cao cấp.",
        shortDescription:
            "Cơm mềm, hạt đẹp, phù hợp cho bữa cơm hằng ngày và các món ăn truyền thống.",
        price: 180000,
        rating: 4.9,
        reviewCount: 112,
        stockStatus: "in-stock",
        badge: "Bán chạy",
        tag: "Sóc Trăng",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXARbJdlJ8F7HyasnEA736osCFFBEhb6zthedKoGTDiJtEjHXc4Ydqzy52t_ZdPg6RZfEsFD0ItAwXgk9t8Kw2PnMBi_XQbcZF9q7u3qnwkg5WEh6v6RkKVyuoO0HCWIYGxfOz81VAm0Gp9MOM8A_BIZamsb4UfIUkNkhwR5utNGKDnL6MuO-H9SzYqbA6oRMRNWpPUU0uFVitmuLATpMzxwU5xE0k_5oKSVn6I8vz18Vxm01TZDUdc2D1VqI3iSFk9PCV8_WFsHM",
        gallery: [
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-uqXQYfxqz-icBgYNIbkhEEi1cX3UFS2LdbolyZ2iHSjR6TiXjJvpX5ShChEXeWULe5MEsKtyotdA5i58G8O3XMsYvyu8zJzqb3aU26a2rgR07t_hcOAG0CXIVrLUCuG3VBcmHkqKSuWr-xtfxkztcOSAF-nqMSASGaI1IsRulPqnQfKG-nMA778x4g7Y6nURSD6EaN5J1oxKtRaJ8Dd7ib4zBlXy5p_WrgedtG6GrxstanIuYGlF3WB0aDuKASELUPWYHyPpamY",
                alt: "Gạo Nàng Sen đặc sản",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXARbJdlJ8F7HyasnEA736osCFFBEhb6zthedKoGTDiJtEjHXc4Ydqzy52t_ZdPg6RZfEsFD0ItAwXgk9t8Kw2PnMBi_XQbcZF9q7u3qnwkg5WEh6v6RkKVyuoO0HCWIYGxfOz81VAm0Gp9MOM8A_BIZamsb4UfIUkNkhwR5utNGKDnL6MuO-H9SzYqbA6oRMRNWpPUU0uFVitmuLATpMzxwU5xE0k_5oKSVn6I8vz18Vxm01TZDUdc2D1VqI3iSFk9PCV8_WFsHM",
                alt: "Gạo ST25 Sông Hậu",
            },
        ],
        origin: "Sóc Trăng, Việt Nam",
        weight: "5kg",
        shelfLife: "6 tháng",
        certifications: ["OCOP", "Canh tác chuẩn sạch"],
        shippingNotice: defaultShippingNotice,
        sourcing: {
            title: "Đồng bằng & Tuyển hạt",
            body: "Mỗi vụ lúa được thu hoạch theo lô, xay xát gần ngày đóng gói để giữ hương thơm lá dứa tự nhiên và độ dẻo mềm ổn định.",
            certificationCards: [
                {
                    icon: "grass",
                    title: "Canh tác truy xuất",
                    description: "Theo dõi vùng trồng, ngày thu hoạch và mẻ đóng gói rõ ràng.",
                },
                {
                    icon: "inventory_2",
                    title: "Đóng gói hút ẩm",
                    description: "Giữ hạt khô, thơm và hạn chế gãy vỡ khi vận chuyển đường dài.",
                },
            ],
        },
        heritageCommitments: defaultHeritageCommitments,
    },
    {
        id: "prod-mat-ong",
        slug: "mat-ong-rung-tay-bac",
        name: "Mật ong rừng Tây Bắc",
        detailTitle: "Mật ong rừng Tây Bắc - Nguyên Chất",
        subtitle: "Nguyên chất, sắc vàng hổ phách",
        categoryId: "cat-spice",
        categoryName: "Gia vị",
        regionId: "region-tay-bac",
        regionName: "Tây Bắc",
        description:
            "Mật ong rừng được thu gom theo mùa, giữ lại màu sắc và mùi hoa rừng tự nhiên.",
        shortDescription: "Dùng cho trà nóng, nước chanh mật ong hoặc làm quà tặng thiên nhiên.",
        price: 320000,
        rating: 4.7,
        reviewCount: 68,
        stockStatus: "low-stock",
        badge: "Hữu hạn",
        tag: "Sơn La",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCv2k_8RGESM2ZD-gXIaW6UJCASXFuT4NpabZ9daLOGFiIhIrRMtPVS0GcNsW71X2L51GGxkzW_8FYny4NEkFHs2cmOlBuKHnRbLouGrpOaL3gwMuXzrDA3lfTNhK3sQfEnhRjjtN2SQZMcTZwhIiKkLdwwAlHwLj7ZOuumSDgaj8WLNCFqmqDrkyR6X4IbJ5aZeAb2Tns_uY0FR4GCNiBGWMZ8XD6CZ3KskjbQlcgziLzuiXvNDnFgNYM8yapM8SItBX7kQOE931w",
        gallery: [
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmjjjyinN4JPzPYT4liRk90E-jBhxS01BytG69boB1XaAsu1-N1WgM0euyD6IzACoE64P53KEHliqF-NVOWdSZKNQVVmeNQd4nr191ik-sNVUQLnfE6m21RAUNNDwg6hQR6hfWTYNfSbMzSeZpFZKi5vkU5KK44YcdNOIy8wauNrVknHMJOUhFjl6rssIkfZyyt-ILxA1m3gUUmljshWnJ0zdaAkFv0fdPE1wrUpxajy0cyL_UMop-dUztGrQMLuam7k4GmjEQX4o",
                alt: "Vietnamese honey in glass jars with honeycomb",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCv2k_8RGESM2ZD-gXIaW6UJCASXFuT4NpabZ9daLOGFiIhIrRMtPVS0GcNsW71X2L51GGxkzW_8FYny4NEkFHs2cmOlBuKHnRbLouGrpOaL3gwMuXzrDA3lfTNhK3sQfEnhRjjtN2SQZMcTZwhIiKkLdwwAlHwLj7ZOuumSDgaj8WLNCFqmqDrkyR6X4IbJ5aZeAb2Tns_uY0FR4GCNiBGWMZ8XD6CZ3KskjbQlcgziLzuiXvNDnFgNYM8yapM8SItBX7kQOE931w",
                alt: "Mật ong rừng Tây Bắc",
            },
        ],
        origin: "Sơn La, Việt Nam",
        weight: "750ml",
        shelfLife: "18 tháng",
        certifications: ["Kiểm định vi sinh", "Thu hoạch theo mùa"],
        shippingNotice: defaultShippingNotice,
        sourcing: {
            title: "Mùa hoa & Thu hoạch",
            body: "Mật ong được khai thác theo mùa, lọc thô để giữ hương hoa rừng và màu vàng hổ phách đặc trưng của vùng núi cao Tây Bắc.",
            certificationCards: [
                {
                    icon: "psychiatry",
                    title: "Lọc thô tự nhiên",
                    description: "Giữ lớp phấn hoa và enzyme tự nhiên trong giới hạn an toàn.",
                },
                {
                    icon: "forest",
                    title: "Nguồn hoa rừng",
                    description: "Hương vị thay đổi theo mùa, tạo bản sắc riêng cho từng mẻ mật.",
                },
            ],
        },
        heritageCommitments: defaultHeritageCommitments,
    },
    {
        id: "prod-nuoc-mam",
        slug: "nuoc-mam-phu-quoc-nhi",
        name: "Nước mắm Phú Quốc nhĩ",
        detailTitle: "Nước mắm Phú Quốc nhĩ - Truyền Thống",
        subtitle: "Độ đạm 40N, màu cánh gián",
        categoryId: "cat-spice",
        categoryName: "Gia vị",
        regionId: "region-duyen-hai",
        regionName: "Miền Trung",
        description:
            "Nước mắm truyền thống ủ chượp từ cá cơm, phù hợp để chấm, ướp và tăng hương vị món Việt.",
        shortDescription: "Độ đạm cân bằng, hậu vị sạch, dùng tốt cho bếp gia đình hằng ngày.",
        price: 210000,
        rating: 4.8,
        reviewCount: 84,
        stockStatus: "in-stock",
        badge: "Truyền thống",
        tag: "Phú Quốc",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
        gallery: [
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnLqVZUuec3xCba6Mv43kxRnyK27wN9IVLMz2Vl1sV05deyyCpbx1kjNb7gZ16plhW5W2WhuDXKEOZuIIynuN5pehbyYVaMzaKiwy-m9355Lqbl9O2fyDP1JT8X7GGPYAu4TEkjiftcoGEo03TrwBme8_xB4Hx3dVzIyxquXGMlGcwzBkYb2OAKWdUhauV3MbcsLMtJpwdue9SdNt8C_Fja926GAV3Fr4KQovSTBtedV8Tl6Zef0ilZNs3RWsmh6dAZGI3K_h_M1Y",
                alt: "Artisanal fish sauce in a glass bottle",
            },
            {
                src: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
                alt: "Nước mắm Phú Quốc nhĩ",
            },
        ],
        origin: "Phú Quốc, Việt Nam",
        weight: "500ml",
        shelfLife: "24 tháng",
        certifications: ["Chỉ dẫn địa lý", "Độ đạm 40N"],
        shippingNotice: defaultShippingNotice,
        sourcing: {
            title: "Ủ chượp & Lên nước nhĩ",
            body: "Cá cơm than được ủ chượp truyền thống trong thùng gỗ lớn, cho nước mắm có độ đạm cao, màu cánh gián đẹp và hậu vị sạch.",
            certificationCards: [
                {
                    icon: "water_drop",
                    title: "Nước nhĩ đầu",
                    description: "Chắt lọc từ mẻ đầu tiên để giữ độ đạm và hương vị nguyên bản.",
                },
                {
                    icon: "verified",
                    title: "Chỉ dẫn địa lý",
                    description:
                        "Nguồn gốc vùng biển Phú Quốc được xác nhận theo tiêu chuẩn địa phương.",
                },
            ],
        },
        heritageCommitments: defaultHeritageCommitments,
    },
    {
        id: "prod-hat-macca",
        slug: "hat-macca-tay-nguyen",
        name: "Hạt macca Tây Nguyên",
        detailTitle: "Hạt macca Tây Nguyên - Sấy Nhẹ",
        subtitle: "Sấy nhẹ, giòn béo tự nhiên",
        categoryId: "cat-drygoods",
        categoryName: "Đồ khô",
        regionId: "region-tay-nguyen",
        regionName: "Tây Nguyên",
        description: "Hạt macca tách vỏ theo lô nhỏ, giữ độ giòn và vị béo thanh nhất.",
        shortDescription: "Phù hợp cho snack, quà tặng văn phòng và combo thưởng thức.",
        price: 280000,
        rating: 3.9,
        reviewCount: 58,
        stockStatus: "preorder",
        badge: "Vừa cập bến",
        tag: "Đắk Lắk",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHC_kGuFmmWnYLuodhDa7-uk5olwpEHa8NHGSy6JBE32QpuowMLz2imcYfeBJKMm-B9ZXX_nWREIE_iB54lr3T7s8gw_yy-oG2XfDKS2UYYp0NoE3hi8wa_d106T0MgfX4p9opbTufHy3MlR8KAbhSKT8IoUUgpYlEkLr4rPY67NDl6CLlUFG97e7P6Xa08s7FBcwbbJxMpofIE4vLnT7Oq098WprqfU2vYBlkM8hLk-v67OluCzuJ17Q9jx4n5U7mNikdLdp_rOk",
        gallery: [
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3uT4E9RIiTXN88yPlkXEEUu7F0vOXffFyITMvLsKn0JuCKIvqSX29WNMwTcntACKgZBDZLRviAUDTjhkNi1z_K4r8oggd5gZVY1b85C_JBejOMzojeOGjCE4KVo_moMyvFukXBN16Gx6fmGkXGVUxmdYyJ0k8Ql1JIO40xHcOTMgjeTtb-W34vXyWN6lWgFDvmDRJxdjOalYnoKCPX0RXc5n_9fg42fUJ5jbJ3JOS7HQwJcuk5cUX9kk3N-9dii4BLZ1Z6T9Cwms",
                alt: "Premium Vietnamese cashew nuts on a plate",
            },
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHC_kGuFmmWnYLuodhDa7-uk5olwpEHa8NHGSy6JBE32QpuowMLz2imcYfeBJKMm-B9ZXX_nWREIE_iB54lr3T7s8gw_yy-oG2XfDKS2UYYp0NoE3hi8wa_d106T0MgfX4p9opbTufHy3MlR8KAbhSKT8IoUUgpYlEkLr4rPY67NDl6CLlUFG97e7P6Xa08s7FBcwbbJxMpofIE4vLnT7Oq098WprqfU2vYBlkM8hLk-v67OluCzuJ17Q9jx4n5U7mNikdLdp_rOk",
                alt: "Hạt macca Tây Nguyên",
            },
        ],
        origin: "Đắk Lắk, Việt Nam",
        weight: "250g",
        shelfLife: "10 tháng",
        certifications: ["Sấy nhẹ", "Đóng gói hút khí"],
        shippingNotice: defaultShippingNotice,
        sourcing: {
            title: "Thu hoạch & Tách vỏ",
            body: "Macca được tách nứt và sấy nhẹ để giữ vị bùi béo tự nhiên, phù hợp cho snack cao cấp và quà tặng văn phòng.",
            certificationCards: [
                {
                    icon: "nutrition",
                    title: "Giàu dầu tự nhiên",
                    description: "Giữ độ giòn và vị béo mà không cần tẩm ướp quá mức.",
                },
                {
                    icon: "inventory",
                    title: "Đóng gói theo lô",
                    description: "Kiểm soát độ ẩm từng mẻ trước khi xuất kho.",
                },
            ],
        },
        heritageCommitments: defaultHeritageCommitments,
    },
];

export const reviews: Review[] = [
    {
        id: "rev-1",
        productId: "prod-tra-tan-cuong",
        author: "Nguyễn Hùng",
        rating: 5,
        title: "Hương trà rất sạch",
        body: "Trà rất thơm, nước xanh trong, vị tiền chát hậu ngọt đậm đà. Đóng gói rất kỹ lưỡng và sang trọng, thích hợp làm quà biếu.",
        date: "2026-03-15",
        verified: true,
        media: [
            {
                src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2YpkTa-E3ri2tGexvjkiC3u39tot3_WbG7c7jF9wOOlP4uSR3C8YCM4JPTWBb0FTzwC-4sjFrtbpqEjw_3_kUc3chOaDHE5EQHWwvnsvqjr5jqfrzNRO81I6f-ArpJI6XOVUIVmY7UtTPX6sT_DXf18_rM4YghHG123aihUozKpRjAjV9JBapapSjUjv23z2IqXf8bBcK2Duah04BfJhem3mhdxTHDHWgU4fFR95Pv-PS0T39UVUJ3BmqMdcgFRWE3RqIn96UvsA",
                alt: "Review photo of brewed green tea in a clear glass",
            },
        ],
    },
    {
        id: "rev-2",
        productId: "prod-tra-tan-cuong",
        author: "Phương Mai",
        rating: 5,
        title: "Đúng chất Thái Nguyên",
        body: "Pha lần hai vẫn đậm vị. Mình thích phần note kể câu chuyện nguồn gốc đi kèm sản phẩm.",
        date: "2026-02-27",
        verified: true,
    },
    {
        id: "rev-3",
        productId: "prod-tra-tan-cuong",
        author: "Bảo Anh",
        rating: 4,
        title: "Bao bì đẹp",
        body: "Trà rất ổn, giao nhanh. Nếu có thêm gói dùng thử nhỏ hơn sẽ dễ mua quà tặng hơn.",
        date: "2026-02-05",
        verified: false,
    },
];

export const userProfile: UserProfile = {
    id: "user-minh-nguyen",
    name: "Minh Nguyễn",
    email: "minh.nguyen@example.com",
    phone: "+84 912 345 678",
    address: "12 Trần Hưng Đạo, Quận 1",
    city: "Thành phố Hồ Chí Minh",
    favoriteRegion: "Tây Bắc",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtLUoS1FbVGMnmkAAgIZs1VDFqrWTjsn2oEpUk7f0J1wyjXw05a8rZosMPIhNDiKSOQsDpwB-R_62e5_HWJXtb-Un_YOr5OMT1BHfHgpoGAMfXXtJXyS1E2XaAWzk65igQZvIkJBBicMp1kTmRIXcscweY2VzkzpNgssiJkUlyBXBNDakN5yqV3eyNnivQlJItNJ9-R5e2A3cf1PgEzE7wQhsBa0Q3Z88Ze665G7G-A2Sk0ojZTtletl9bi8dZPwNgmlz-Yqqjzck",
    memberSince: "2023-10-01",
    newsletter: true,
    smsAlerts: false,
    orderEmail: true,
    securityAlerts: true,
    addresses: [
        {
            id: "address-home",
            label: "Nhà riêng",
            recipient: "Minh Nguyễn",
            phone: "+84 912 345 678",
            line1: "12 Trần Hưng Đạo, Quận 1",
            city: "Thành phố Hồ Chí Minh",
            note: "Giao sau 18h nếu có thể.",
            isDefault: true,
        },
    ],
    rewardHistory: [],
};

export const rewardSnapshot: RewardSnapshot = {
    tier: "Ưu đãi Nghệ nhân",
    points: 2450,
    nextTierPoints: 3000,
    perks: [
        "Miễn phí vận chuyển cho mỗi curated box",
        "Ưu tiên tiếp cận các bộ sưu tập theo mùa",
        "Hỗ trợ nhanh cho các đơn hàng thủ công",
    ],
};

export const orders: Order[] = [
    {
        id: "HH-7721",
        customerName: "Minh Nguyễn",
        supplierName: "Hợp tác xã Trà Thái Nguyên",
        date: "2026-03-28",
        total: 12450000,
        paymentStatus: "pending",
        deliveryStatus: "processing",
        shippingTier: "priority",
        address: "12 Trần Hưng Đạo, Quận 1, Thành phố Hồ Chí Minh",
        note: "Gói quà kèm thẻ kể chuyện nguồn gốc",
        items: [
            { productId: "prod-tra-tan-cuong", quantity: 8, unitPrice: 450000 },
            { productId: "prod-mat-ong", quantity: 6, unitPrice: 320000 },
        ],
        timeline: [
            {
                id: "track-7721-1",
                orderId: "HH-7721",
                label: "Đơn hàng đã xác nhận",
                timestamp: "2026-03-28T09:20:00Z",
                completed: true,
            },
            {
                id: "track-7721-2",
                orderId: "HH-7721",
                label: "Đã phân bổ về kho",
                timestamp: "2026-03-29T02:00:00Z",
                completed: true,
            },
            {
                id: "track-7721-3",
                orderId: "HH-7721",
                label: "Đang đóng gói",
                timestamp: "2026-03-29T06:30:00Z",
                completed: true,
            },
            {
                id: "track-7721-4",
                orderId: "HH-7721",
                label: "Đã lên lịch lấy hàng",
                timestamp: "2026-03-30T02:00:00Z",
                completed: false,
            },
        ],
    },
    {
        id: "HH-7698",
        customerName: "Trần Bảo",
        supplierName: "Trạm Arabica Đắk Lắk",
        date: "2026-03-24",
        total: 8900000,
        paymentStatus: "paid",
        deliveryStatus: "in_transit",
        shippingTier: "express",
        address: "Đà Nẵng",
        items: [{ productId: "prod-arabica", quantity: 12, unitPrice: 250000 }],
        timeline: [
            {
                id: "track-7698-1",
                orderId: "HH-7698",
                label: "Đơn hàng đã xác nhận",
                timestamp: "2026-03-24T03:20:00Z",
                completed: true,
            },
            {
                id: "track-7698-2",
                orderId: "HH-7698",
                label: "Đã bàn giao đơn vị vận chuyển",
                timestamp: "2026-03-25T07:10:00Z",
                completed: true,
            },
            {
                id: "track-7698-3",
                orderId: "HH-7698",
                label: "Đang giao đến khách",
                timestamp: "2026-03-26T01:00:00Z",
                completed: false,
            },
        ],
    },
    {
        id: "HH-7650",
        customerName: "Lê Quỳnh",
        supplierName: "Tinh hoa Phú Quốc",
        date: "2026-03-20",
        total: 15200000,
        paymentStatus: "paid",
        deliveryStatus: "delivered",
        shippingTier: "standard",
        address: "Cần Thơ",
        items: [{ productId: "prod-nuoc-mam", quantity: 24, unitPrice: 210000 }],
        timeline: [
            {
                id: "track-7650-1",
                orderId: "HH-7650",
                label: "Đơn hàng đã xác nhận",
                timestamp: "2026-03-20T01:12:00Z",
                completed: true,
            },
            {
                id: "track-7650-2",
                orderId: "HH-7650",
                label: "Đã giao thành công",
                timestamp: "2026-03-23T08:00:00Z",
                completed: true,
            },
        ],
    },
    {
        id: "HH-21012",
        customerName: "Minh Nguyễn",
        supplierName: "Hợp tác xã Trà Thái Nguyên",
        date: "2026-04-01",
        total: 980000,
        paymentStatus: "cod",
        deliveryStatus: "in_transit",
        shippingTier: "standard",
        address: "12 Trần Hưng Đạo, Quận 1, Thành phố Hồ Chí Minh",
        items: [
            { productId: "prod-tra-tan-cuong", quantity: 1, unitPrice: 450000 },
            { productId: "prod-st25", quantity: 2, unitPrice: 180000 },
        ],
        timeline: [
            {
                id: "track-21012-1",
                orderId: "HH-21012",
                label: "Đã đặt hàng",
                timestamp: "2026-04-01T08:10:00Z",
                completed: true,
            },
            {
                id: "track-21012-2",
                orderId: "HH-21012",
                label: "Kho đã đóng gói",
                timestamp: "2026-04-02T04:40:00Z",
                completed: true,
            },
            {
                id: "track-21012-3",
                orderId: "HH-21012",
                label: "Shipper đang giao hàng",
                timestamp: "2026-04-04T01:30:00Z",
                completed: false,
            },
        ],
    },
];

export const suppliers: SupplierPartner[] = [
    {
        id: "sup-thai-nguyen",
        name: "Hợp tác xã Trà Thái Nguyên",
        location: "Thái Nguyên, Việt Nam",
        contactName: "Minh Nguyễn",
        categories: ["Trà cao cấp"],
        partnerTier: "Đối tác bạch kim",
        monthlyRevenue: 142000000,
        responseTime: "Phản hồi trong 3 giờ",
        status: "active",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    },
    {
        id: "sup-phu-quoc",
        name: "Tinh hoa Phú Quốc",
        location: "Phú Quốc, Việt Nam",
        contactName: "Hoàng Anh",
        categories: ["Nước mắm", "Muối biển"],
        partnerTier: "Đối tác vàng",
        monthlyRevenue: 96000000,
        responseTime: "Trong ngày",
        status: "active",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
    },
    {
        id: "sup-dak-lak",
        name: "Trạm Arabica Đắk Lắk",
        location: "Đắk Lắk, Việt Nam",
        contactName: "Bảo Trân",
        categories: ["Cà phê", "Macca"],
        partnerTier: "Đối tác tăng trưởng",
        monthlyRevenue: 88000000,
        responseTime: "Phản hồi trong 6 giờ",
        status: "reviewing",
        image: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=600&q=80",
    },
];

export const customers: CustomerRecord[] = [
    {
        id: "cus-1",
        name: "Minh Nguyễn",
        location: "Thành phố Hồ Chí Minh",
        orders: 12,
        totalSpend: 18600000,
        status: "loyal",
    },
    {
        id: "cus-2",
        name: "Trang Lê",
        location: "Hà Nội",
        orders: 4,
        totalSpend: 5400000,
        status: "new",
    },
    {
        id: "cus-3",
        name: "Bảo Châu",
        location: "Đà Nẵng",
        orders: 8,
        totalSpend: 9100000,
        status: "at-risk",
    },
];

export const inventoryItems: InventoryItem[] = [
    {
        sku: "SKU-TEA-014",
        productId: "prod-tra-tan-cuong",
        supplierId: "sup-thai-nguyen",
        onHand: 84,
        reserved: 12,
        reorderPoint: 60,
        purchasePrice: 280000,
        aisle: "A1-04",
        status: "healthy",
    },
    {
        sku: "SKU-RICE-021",
        productId: "prod-st25",
        supplierId: "sup-phu-quoc",
        onHand: 24,
        reserved: 18,
        reorderPoint: 30,
        purchasePrice: 115000,
        aisle: "B2-03",
        status: "critical",
    },
    {
        sku: "SKU-SAUCE-002",
        productId: "prod-nuoc-mam",
        supplierId: "sup-phu-quoc",
        onHand: 52,
        reserved: 10,
        reorderPoint: 25,
        purchasePrice: 145000,
        aisle: "C4-01",
        status: "healthy",
    },
    {
        sku: "SKU-HONEY-007",
        productId: "prod-mat-ong",
        supplierId: "sup-thai-nguyen",
        onHand: 18,
        reserved: 6,
        reorderPoint: 22,
        purchasePrice: 210000,
        aisle: "D1-08",
        status: "low",
    },
];

export const requisitions: PurchaseRequisition[] = [
    {
        id: "REQ-2401",
        inventorySku: "SKU-RICE-021",
        supplierId: "sup-phu-quoc",
        requestedQty: 80,
        approvedQty: 60,
        etaDays: 5,
        status: "approved",
    },
    {
        id: "REQ-2402",
        inventorySku: "SKU-HONEY-007",
        supplierId: "sup-thai-nguyen",
        requestedQty: 45,
        etaDays: 7,
        status: "submitted",
    },
];

export const fulfillmentTasks: FulfillmentTask[] = [
    {
        id: "FUL-1001",
        orderId: "HH-7721",
        customerName: "Minh Nguyễn",
        shippingTier: "priority",
        status: "packing",
        priority: "rush",
        assignedZone: "Khu C",
        etaLabel: "Lấy hàng lúc 10:30",
    },
    {
        id: "FUL-1002",
        orderId: "HH-7698",
        customerName: "Trần Bảo",
        shippingTier: "express",
        status: "awaiting_pickup",
        priority: "standard",
        assignedZone: "Khu A",
        etaLabel: "Đơn vị vận chuyển đang chờ",
    },
    {
        id: "FUL-1003",
        orderId: "HH-21012",
        customerName: "Minh Nguyễn",
        shippingTier: "standard",
        status: "picking",
        priority: "standard",
        assignedZone: "Khu B",
        etaLabel: "Cần quét lần cuối",
    },
];

export const adminMetrics: MetricCardData[] = [
    {
        id: "metric-sales",
        label: "Doanh thu toàn hệ",
        value: "12,5M VND",
        delta: "+12,5%",
        tone: "primary",
        icon: "payments",
        helperText: "so với tháng trước",
    },
    {
        id: "metric-orders",
        label: "Tổng đơn hàng",
        value: "145",
        delta: "+8,2%",
        tone: "secondary",
        icon: "shopping_bag",
        helperText: "đơn curated trong chu kỳ này",
    },
    {
        id: "metric-users",
        label: "Người dùng hoạt động",
        value: "1,2k",
        delta: "ổn định",
        tone: "tertiary",
        icon: "person_celebrate",
        helperText: "tỷ lệ gắn bó cộng đồng ổn định",
    },
    {
        id: "metric-aov",
        label: "Giá trị đơn trung bình",
        value: "86k VND",
        delta: "+6,4%",
        tone: "success",
        icon: "sell",
        helperText: "mix sản phẩm premium tăng lên",
    },
];
