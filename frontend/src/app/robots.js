export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruchistore.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/categories",
          "/category",
          "/category/*",
          "/product",
          "/product/*",
          "/shops",
          "/shop",
          "/shop/*",
          "/offers",
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms-and-conditions",
          "/refund-policy",
          "/cancellation-policy",
          "/delivery-policy",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/shop-owner",
          "/shop-owner/*",
          "/delivery",
          "/delivery/*",
          "/cart",
          "/checkout",
          "/orders",
          "/orders/*",
          "/order-success",
          "/order-success/*",
          "/profile",
          "/addresses",
          "/favorites",
          "/notifications",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
