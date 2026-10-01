export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruchistore.com";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shops`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/offers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/delivery-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cancellation-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let dynamicProducts = [];
  let dynamicCategories = [];
  let dynamicShops = [];

  try {
    const [prodRes, catRes, shopRes] = await Promise.allSettled([
      fetch(`${apiUrl}/products?limit=100`, { next: { revalidate: 3600 } }),
      fetch(`${apiUrl}/categories`, { next: { revalidate: 3600 } }),
      fetch(`${apiUrl}/shops`, { next: { revalidate: 3600 } }),
    ]);

    if (prodRes.status === "fulfilled" && prodRes.value.ok) {
      const pData = await prodRes.value.json();
      const products = pData.data?.products || pData.data || [];
      dynamicProducts = (Array.isArray(products) ? products : []).map((p) => ({
        url: `${baseUrl}/product/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }

    if (catRes.status === "fulfilled" && catRes.value.ok) {
      const cData = await catRes.value.json();
      const categories = cData.data?.categories || cData.data || [];
      dynamicCategories = (Array.isArray(categories) ? categories : []).map((c) => ({
        url: `${baseUrl}/category/${c.slug || c.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }

    if (shopRes.status === "fulfilled" && shopRes.value.ok) {
      const sData = await shopRes.value.json();
      const shops = sData.data?.shops || sData.data || [];
      dynamicShops = (Array.isArray(shops) ? shops : []).map((s) => ({
        url: `${baseUrl}/shop/${s.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("Sitemap dynamic fetch notice:", err);
  }

  return [...staticRoutes, ...dynamicCategories, ...dynamicProducts, ...dynamicShops];
}
