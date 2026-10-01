"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);

// Pure Client-side pricing calculation for guest carts
const calculateGuestPricing = (items = []) => {
  let subtotal = 0;
  let mrpTotal = 0;
  let productDiscount = 0;

  for (const item of items) {
    const p = item.product || {};
    const price = parseFloat(p.price || 0);
    const discountPrice =
      p.discount_price !== null && p.discount_price !== undefined && !isNaN(p.discount_price)
        ? parseFloat(p.discount_price)
        : price;
    const qty = Math.max(1, parseInt(item.quantity || 1, 10));

    mrpTotal += price * qty;
    subtotal += discountPrice * qty;
    if (discountPrice < price) {
      productDiscount += (price - discountPrice) * qty;
    }
  }

  const freeDeliveryThreshold = 299;
  const deliveryFee = subtotal >= freeDeliveryThreshold || items.length === 0 ? 0 : 25;
  const taxAmount = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee + taxAmount;

  return {
    subtotal,
    mrpTotal,
    productDiscount,
    couponDiscount: 0,
    deliveryFee,
    taxAmount,
    totalAmount,
    amountNeededForFreeDelivery: Math.max(0, freeDeliveryThreshold - subtotal),
  };
};

const getStoredGuestCart = () => {
  if (typeof window === "undefined") return { items: [], shop: null };
  try {
    const raw = localStorage.getItem("ruchi_guest_cart");
    if (!raw) return { items: [], shop: null };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      shop: parsed?.shop || null,
    };
  } catch (e) {
    return { items: [], shop: null };
  }
};

const setStoredGuestCart = (guestCart) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ruchi_guest_cart", JSON.stringify(guestCart));
  } catch (e) {}
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [replaceDialog, setReplaceDialog] = useState({
    isOpen: false,
    pendingProduct: null,
    pendingQuantity: 1,
    currentShop: null,
    newShop: null,
  });

  const isSyncingGuestRef = useRef(false);

  // Fetch cart from backend or local storage
  const fetchCart = useCallback(
    async (couponCode = appliedCoupon) => {
      if (!isAuthenticated) {
        const guest = getStoredGuestCart();
        if (guest.items.length > 0) {
          setCart({
            id: "guest",
            shop: guest.shop,
            items: guest.items,
            pricing: calculateGuestPricing(guest.items),
          });
        } else {
          setCart(null);
        }
        setLoading(false);
        setInitialLoaded(true);
        return;
      }

      try {
        setLoading(true);
        const res = await apiClient.get(`/cart${couponCode ? `?couponCode=${couponCode}` : ""}`);
        if (res.data?.success && res.data.data?.cart) {
          setCart(res.data.data.cart);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
        setInitialLoaded(true);
      }
    },
    [isAuthenticated, appliedCoupon]
  );

  // Sync guest cart when user logs in
  useEffect(() => {
    const syncGuestItems = async () => {
      if (isAuthenticated && !authLoading && !isSyncingGuestRef.current) {
        const guest = getStoredGuestCart();
        if (guest.items && guest.items.length > 0) {
          isSyncingGuestRef.current = true;
          try {
            for (let i = 0; i < guest.items.length; i++) {
              const item = guest.items[i];
              const prodId = item.product_id || item.product?.id;
              if (prodId) {
                await apiClient.post("/cart/add", {
                  productId: prodId,
                  quantity: item.quantity || 1,
                  replaceCart: i === 0,
                });
              }
            }
            localStorage.removeItem("ruchi_guest_cart");
          } catch (err) {
            console.error("Error syncing guest cart items:", err);
          } finally {
            isSyncingGuestRef.current = false;
          }
        }
        fetchCart();
      } else if (!isAuthenticated && !authLoading) {
        fetchCart();
      }
    };

    syncGuestItems();
  }, [isAuthenticated, authLoading, fetchCart]);

  // Add to Cart
  const addToCart = async (product, quantity = 1, replaceCart = false) => {
    if (!product || !product.id) {
      showToast("Invalid product", "error");
      return { success: false };
    }

    const newShopId = product.shop_id || product.shop?.id;

    // Handle Unauthenticated / Guest Cart
    if (!isAuthenticated) {
      const guest = getStoredGuestCart();
      const currentShopId = guest.shop?.id;

      if (currentShopId && newShopId && currentShopId !== newShopId && guest.items.length > 0) {
        if (!replaceCart) {
          setReplaceDialog({
            isOpen: true,
            pendingProduct: product,
            pendingQuantity: quantity,
            currentShop: guest.shop,
            newShop: product.shop || { id: newShopId, name: "New Store" },
          });
          return { success: false, needsConfirmation: true };
        }
        guest.items = [];
      }

      const existingIndex = guest.items.findIndex(
        (i) => (i.product_id || i.product?.id) === product.id
      );

      let updatedItems;
      if (existingIndex > -1) {
        updatedItems = [...guest.items];
        updatedItems[existingIndex].quantity += quantity;
      } else {
        updatedItems = [
          ...guest.items,
          {
            id: `guest-${product.id}`,
            product_id: product.id,
            quantity: Math.max(1, quantity),
            product,
          },
        ];
      }

      const newGuest = {
        items: updatedItems,
        shop: product.shop || { id: newShopId, name: "Grocery Store" },
      };

      setStoredGuestCart(newGuest);
      setCart({
        id: "guest",
        shop: newGuest.shop,
        items: updatedItems,
        pricing: calculateGuestPricing(updatedItems),
      });

      showToast(`Added ${product.name} to cart`);
      return { success: true };
    }

    // Authenticated User Cart
    try {
      const res = await apiClient.post("/cart/add", {
        productId: product.id,
        quantity,
        replaceCart,
      });

      if (res.data?.needsConfirmation) {
        setReplaceDialog({
          isOpen: true,
          pendingProduct: product,
          pendingQuantity: quantity,
          currentShop: res.data.data.currentShop,
          newShop: res.data.data.newShop,
        });
        return { success: false, needsConfirmation: true };
      }

      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      } else {
        await fetchCart();
      }
      showToast(`Added ${product.name} to cart`);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add item to cart";
      showToast(msg, "error");
      return { success: false, message: msg };
    }
  };

  // Confirm replacing cart from a different shop
  const confirmReplaceCart = async () => {
    if (!replaceDialog.pendingProduct) return;
    await addToCart(replaceDialog.pendingProduct, replaceDialog.pendingQuantity, true);
    setReplaceDialog({
      isOpen: false,
      pendingProduct: null,
      pendingQuantity: 1,
      currentShop: null,
      newShop: null,
    });
  };

  // Cancel replace cart modal
  const cancelReplaceCart = () => {
    setReplaceDialog({
      isOpen: false,
      pendingProduct: null,
      pendingQuantity: 1,
      currentShop: null,
      newShop: null,
    });
  };

  // Update item quantity
  const updateQuantity = async (cartItemId, newQty) => {
    if (!isAuthenticated) {
      const guest = getStoredGuestCart();
      let updatedItems;
      if (newQty <= 0) {
        updatedItems = guest.items.filter(
          (i) => i.id !== cartItemId && i.product_id !== cartItemId && i.product?.id !== cartItemId
        );
        showToast("Item removed from cart", "info");
      } else {
        updatedItems = guest.items.map((i) => {
          if (i.id === cartItemId || i.product_id === cartItemId || i.product?.id === cartItemId) {
            return { ...i, quantity: newQty };
          }
          return i;
        });
      }

      const newGuest = {
        items: updatedItems,
        shop: updatedItems.length > 0 ? guest.shop : null,
      };
      setStoredGuestCart(newGuest);
      setCart({
        id: "guest",
        shop: newGuest.shop,
        items: updatedItems,
        pricing: calculateGuestPricing(updatedItems),
      });
      return;
    }

    try {
      const res = await apiClient.put(`/cart/item/${cartItemId}`, { quantity: newQty });
      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      } else {
        await fetchCart();
      }
      if (newQty <= 0) {
        showToast("Item removed from cart", "info");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Could not update quantity", "error");
    }
  };

  // Remove item completely
  const removeItem = async (cartItemId) => {
    if (!isAuthenticated) {
      const guest = getStoredGuestCart();
      const updatedItems = guest.items.filter(
        (i) => i.id !== cartItemId && i.product_id !== cartItemId && i.product?.id !== cartItemId
      );
      const newGuest = {
        items: updatedItems,
        shop: updatedItems.length > 0 ? guest.shop : null,
      };
      setStoredGuestCart(newGuest);
      setCart({
        id: "guest",
        shop: newGuest.shop,
        items: updatedItems,
        pricing: calculateGuestPricing(updatedItems),
      });
      showToast("Item removed from cart", "info");
      return;
    }

    try {
      await apiClient.delete(`/cart/item/${cartItemId}`);
      await fetchCart();
      showToast("Item removed from cart", "info");
    } catch (error) {
      showToast("Could not remove item", "error");
    }
  };

  // Clear Cart
  const clearCart = async () => {
    setStoredGuestCart({ items: [], shop: null });
    setCart(null);
    setAppliedCoupon("");
    if (isAuthenticated) {
      try {
        await apiClient.delete("/cart/clear");
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  };

  // Apply Coupon
  const applyCouponCode = async (code) => {
    if (!code) return;
    try {
      const res = await apiClient.post("/coupons/validate", {
        code,
        cartAmount: cart?.pricing?.subtotal || 0,
        shopId: cart?.shop?.id,
      });

      if (res.data?.success) {
        setAppliedCoupon(code);
        await fetchCart(code);
        showToast(`Coupon '${code}' applied! Saved ₹${res.data.data.coupon?.discountAmount || 0}`);
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid coupon";
      showToast(msg, "error");
      return { success: false, message: msg };
    }
  };

  // Remove Coupon
  const removeCoupon = async () => {
    setAppliedCoupon("");
    await fetchCart("");
    showToast("Coupon removed", "info");
  };

  const cartItems = cart?.items || [];
  const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const cartTotal = Number(cart?.pricing?.totalAmount || 0);
  const cartSubtotal = Number(cart?.pricing?.subtotal || 0);
  const itemDiscountTotal = Number(cart?.pricing?.productDiscount || 0);
  const couponDiscount = Number(cart?.pricing?.couponDiscount || 0);
  const deliveryFee = cart?.pricing?.deliveryFee !== undefined ? Number(cart.pricing.deliveryFee) : 25;
  const taxAmount = Number(cart?.pricing?.taxAmount || 0);
  const currentShop = cart?.shop || null;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        items: cartItems,
        cartCount,
        cartTotal,
        cartSubtotal,
        itemDiscountTotal,
        couponDiscount,
        deliveryFee,
        taxAmount,
        shop: currentShop,
        currentShop,
        pricing: cart?.pricing,
        loading: loading || authLoading,
        initialLoaded,
        isCartOpen,
        setIsCartOpen,
        fetchCart,
        refreshCart: fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        removeFromCart: removeItem,
        clearCart,
        applyCouponCode,
        applyCoupon: applyCouponCode,
        removeCoupon,
        appliedCoupon,
        couponCode: appliedCoupon,
        replaceDialog,
        confirmReplaceCart,
        cancelReplaceCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
