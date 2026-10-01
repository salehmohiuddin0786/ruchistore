"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  Store,
  ShieldCheck,
  Zap,
  Truck,
  RotateCcw,
  Check,
  Package,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import ProductCard from "../../../components/ProductCard";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;

  const { items, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/products/${productId}`);
      if (res.data?.success) {
        const prod = res.data.data?.product || res.data.data;
        setProduct(prod);

        // Load similar products in the same category
        if (res.data.data?.similarProducts && res.data.data.similarProducts.length > 0) {
          setSimilarProducts(res.data.data.similarProducts.filter((p) => p.id !== prod.id).slice(0, 4));
        } else {
          const catId = prod.category_id || prod.categoryId || prod.category?.id;
          if (catId) {
            const simRes = await apiClient.get(`/products?categoryId=${catId}&limit=5`);
            if (simRes.data?.success) {
              setSimilarProducts(
                (simRes.data.data?.products || []).filter((p) => p.id !== prod.id).slice(0, 4)
              );
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load product details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showToast("Please sign in to save items to your wishlist", "info");
      return;
    }
    try {
      if (isWishlisted) {
        await apiClient.delete(`/favorites/${productId}`);
        setIsWishlisted(false);
        showToast("Removed from wishlist", "info");
      } else {
        await apiClient.post("/favorites", { productId });
        setIsWishlisted(true);
        showToast("Added to wishlist!", "success");
      }
    } catch (err) {
      setIsWishlisted(!isWishlisted);
    }
  };

  // Find item quantity in current cart
  const cartItem = (items || []).find(
    (i) =>
      i.productId === Number(productId) ||
      i.productId === productId ||
      i.product_id === Number(productId) ||
      i.product_id === productId ||
      i.product?.id === Number(productId) ||
      i.product?.id === productId
  );
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 rounded-3xl bg-slate-200/60 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-xl bg-slate-200/60 animate-pulse" />
            <div className="h-4 w-1/4 rounded-xl bg-slate-200/60 animate-pulse" />
            <div className="h-24 w-full rounded-2xl bg-slate-200/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500">The product you are looking for is no longer available.</p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          Return to Store
        </Link>
      </div>
    );
  }

  const price = Number(product.price || 0);
  const discountPrice =
    product.discount_price != null
      ? Number(product.discount_price)
      : product.discountPrice != null
      ? Number(product.discountPrice)
      : null;
  const effectivePrice = discountPrice && discountPrice > 0 ? discountPrice : price;
  const discountPercent =
    discountPrice && discountPrice < price
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Product & Breadcrumb JSON-LD Schema for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              image: product.image ? [product.image] : [],
              description:
                product.description ||
                `Buy ${product.name} online with instant 10-15 minute grocery delivery on Ruchi Store.`,
              sku: product.sku || `RS-PROD-${product.id}`,
              offers: {
                "@type": "Offer",
                url: `https://ruchistore.com/product/${product.id}`,
                priceCurrency: "INR",
                price: effectivePrice,
                priceValidUntil: "2027-12-31",
                availability:
                  product.stock_quantity > 0 && product.is_available !== false
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                seller: {
                  "@type": "Organization",
                  name: product.shop?.name || "Ruchi Store",
                },
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "25",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://ruchistore.com",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: product.category?.name || "Groceries",
                  item: `https://ruchistore.com/category/${product.category?.slug || "all"}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: product.name,
                  item: `https://ruchistore.com/product/${product.id}`,
                },
              ],
            },
          ]),
        }}
      />

      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/category/${product.category.slug || product.category.id}`} className="hover:underline">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-800 font-bold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Main Product Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
        {/* Product Image Stage */}
        <div className="relative flex items-center justify-center p-8 bg-slate-50/60 rounded-3xl border border-slate-100 min-h-[350px]">
          {discountPercent > 0 && (
            <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
              {discountPercent}% OFF
            </span>
          )}

          <button
            onClick={handleToggleWishlist}
            className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 shadow-xs transition-colors cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>

          <img
            src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60"}
            alt={product.name}
            className="max-h-80 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Store Badge */}
            {product.shop && (
              <Link
                href={`/shop/${product.shop.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                Sold by {product.shop.name}
              </Link>
            )}

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {product.name}
            </h1>

            {/* Unit */}
            <p className="text-sm font-semibold text-slate-500">
              {product.unit ? `${product.unit_value || product.unitValue || 1} ${product.unit}` : "Per Pack"}
            </p>

            {/* Ratings & Speed */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                {product.rating || "4.8"} (50+ reviews)
              </span>
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <Zap className="w-3.5 h-3.5" /> 10-Minute Delivery
              </span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                ₹{effectivePrice}
              </span>
              {product.discountPrice && product.discountPrice < product.price && (
                <span className="text-lg text-slate-400 line-through font-bold">
                  ₹{product.price}
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium">
                (Inclusive of all taxes)
              </span>
            </div>

            {/* Description */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Product Details
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description ||
                  "Fresh and authentic daily grocery item sourced directly from local verified partners for guaranteed purity and taste."}
              </p>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">100% Quality Assured</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Instant Refund Policy</span>
              </div>
            </div>
          </div>

          {/* Action Button: Add to Cart or Stepper */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
            {quantityInCart === 0 ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => addToCart(product, 1)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Cart • ₹{effectivePrice}
              </motion.button>
            ) : (
              <div className="flex-1 flex items-center justify-between p-2 rounded-2xl bg-emerald-50 border border-emerald-200">
                <button
                  onClick={() => updateQuantity(cartItem?.id || product.id, quantityInCart - 1)}
                  className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center shadow-xs font-bold hover:bg-emerald-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-emerald-950 text-base">
                  {quantityInCart} in Cart (₹{quantityInCart * effectivePrice})
                </span>
                <button
                  onClick={() => updateQuantity(cartItem?.id || product.id, quantityInCart + 1)}
                  className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs font-bold hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Similar Products You Might Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
