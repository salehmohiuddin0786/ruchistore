const { Cart, CartItem, Product, Shop, Coupon } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { calculateOrderPricing } = require("../services/pricingService");

// Get active cart with full server calculation
const getCart = asyncHandler(async (req, res) => {
  const { couponCode } = req.query;

  let cart = await Cart.findOne({
    where: { user_id: req.user.id },
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: ["id", "name", "slug", "logo", "is_open", "minimum_order", "estimated_delivery_time"],
      },
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: [
              "id",
              "shop_id",
              "name",
              "slug",
              "image",
              "price",
              "discount_price",
              "unit",
              "unit_value",
              "stock_quantity",
              "reserved_quantity",
              "is_available",
            ],
          },
        ],
      },
    ],
  });

  if (!cart) {
    cart = await Cart.create({ user_id: req.user.id });
    return res.json({
      success: true,
      data: {
        cart: {
          id: cart.id,
          shop: null,
          items: [],
          pricing: calculateOrderPricing([]),
        },
      },
    });
  }

  // Check coupon if provided
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({
      where: { code: couponCode.toUpperCase().trim(), is_active: true },
    });
  }

  // Filter out any deleted or zero-quantity items
  const validItems = (cart.items || []).filter((item) => item.product && item.quantity > 0);

  // Compute server pricing
  const pricing = calculateOrderPricing(validItems, coupon);

  res.json({
    success: true,
    data: {
      cart: {
        id: cart.id,
        shop: cart.shop,
        items: validItems,
        pricing,
      },
    },
  });
});

// Add item to cart (with single shop enforcement)
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, replaceCart = false } = req.body;

  if (!productId) {
    throw new AppError("Product ID is required", 400, "MISSING_PRODUCT_ID");
  }

  const product = await Product.findByPk(productId, {
    include: [{ model: Shop, as: "shop" }],
  });

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  if (!product.is_available) {
    throw new AppError("Product is currently out of stock or unavailable", 400, "PRODUCT_UNAVAILABLE");
  }

  const availableStock = product.stock_quantity - product.reserved_quantity;
  if (availableStock < quantity) {
    throw new AppError(`Only ${Math.max(0, availableStock)} units available in stock`, 400, "INSUFFICIENT_STOCK");
  }

  let [cart] = await Cart.findOrCreate({
    where: { user_id: req.user.id },
  });

  // Check how many items are actually in the cart
  const currentItemCount = await CartItem.count({ where: { cart_id: cart.id } });

  // If cart is currently empty, always accept the new product and set shop_id directly
  if (currentItemCount === 0) {
    if (cart.shop_id !== product.shop_id) {
      await cart.update({ shop_id: product.shop_id });
    }
  } else if (cart.shop_id && cart.shop_id !== product.shop_id) {
    if (!replaceCart) {
      const currentShop = await Shop.findByPk(cart.shop_id, { attributes: ["id", "name"] });
      return res.status(200).json({
        success: false,
        code: "CART_DIFFERENT_SHOP",
        needsConfirmation: true,
        message: `Your cart contains items from '${currentShop?.name || "another shop"}'. Replace cart with items from '${product.shop?.name}'?`,
        data: {
          currentShop,
          newShop: { id: product.shop.id, name: product.shop.name },
        },
      });
    }

    // User confirmed replacing cart: clear old items
    await CartItem.destroy({ where: { cart_id: cart.id } });
    await cart.update({ shop_id: product.shop_id });
  } else if (!cart.shop_id) {
    await cart.update({ shop_id: product.shop_id });
  }

  // Find or create cart item
  let [item, created] = await CartItem.findOrCreate({
    where: { cart_id: cart.id, product_id: product.id },
    defaults: {
      cart_id: cart.id,
      product_id: product.id,
      quantity: Math.max(1, parseInt(quantity, 10)),
    },
  });

  if (!created) {
    const newQty = item.quantity + parseInt(quantity, 10);
    if (availableStock < newQty) {
      throw new AppError(`Cannot add more than ${availableStock} units`, 400, "MAX_STOCK_REACHED");
    }
    await item.update({ quantity: newQty });
  }

  // Re-fetch complete cart
  const updatedCart = await Cart.findByPk(cart.id, {
    include: [
      { model: Shop, as: "shop" },
      {
        model: CartItem,
        as: "items",
        include: [{ model: Product, as: "product" }],
      },
    ],
  });

  const pricing = calculateOrderPricing(updatedCart.items || []);

  res.json({
    success: true,
    message: `Added ${product.name} to cart`,
    data: {
      cart: {
        id: updatedCart.id,
        shop: updatedCart.shop,
        items: updatedCart.items,
        pricing,
      },
    },
  });
});

// Update item quantity
const updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  let item = await CartItem.findByPk(id, {
    include: [
      { model: Cart, as: "cart" },
      { model: Product, as: "product" },
    ],
  });

  // Fallback: check if id was passed as product_id
  if (!item) {
    const userCart = await Cart.findOne({ where: { user_id: req.user.id } });
    if (userCart) {
      item = await CartItem.findOne({
        where: { cart_id: userCart.id, product_id: id },
        include: [
          { model: Cart, as: "cart" },
          { model: Product, as: "product" },
        ],
      });
    }
  }

  if (!item || item.cart.user_id !== req.user.id) {
    throw new AppError("Cart item not found", 404, "ITEM_NOT_FOUND");
  }

  const newQty = parseInt(quantity, 10);

  if (newQty <= 0) {
    await item.destroy();
  } else {
    const availableStock = item.product.stock_quantity - item.product.reserved_quantity;
    if (availableStock < newQty) {
      throw new AppError(`Only ${Math.max(0, availableStock)} units available`, 400, "INSUFFICIENT_STOCK");
    }
    await item.update({ quantity: newQty });
  }

  // If cart is now empty, clear shop_id
  const remainingCount = await CartItem.count({ where: { cart_id: item.cart_id } });
  if (remainingCount === 0) {
    await Cart.update({ shop_id: null }, { where: { id: item.cart_id } });
  }

  const updatedCart = await Cart.findByPk(item.cart_id, {
    include: [
      { model: Shop, as: "shop" },
      {
        model: CartItem,
        as: "items",
        include: [{ model: Product, as: "product" }],
      },
    ],
  });

  const pricing = calculateOrderPricing(updatedCart.items || []);

  res.json({
    success: true,
    message: "Cart updated",
    data: {
      cart: {
        id: updatedCart.id,
        shop: updatedCart.shop,
        items: updatedCart.items,
        pricing,
      },
    },
  });
});

// Remove item
const removeCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let item = await CartItem.findByPk(id, {
    include: [{ model: Cart, as: "cart" }],
  });

  // Fallback: check if id was passed as product_id
  if (!item) {
    const userCart = await Cart.findOne({ where: { user_id: req.user.id } });
    if (userCart) {
      item = await CartItem.findOne({
        where: { cart_id: userCart.id, product_id: id },
        include: [{ model: Cart, as: "cart" }],
      });
    }
  }

  if (!item || item.cart.user_id !== req.user.id) {
    throw new AppError("Cart item not found", 404, "ITEM_NOT_FOUND");
  }

  const cartId = item.cart_id;
  await item.destroy();

  const remainingCount = await CartItem.count({ where: { cart_id: cartId } });
  if (remainingCount === 0) {
    await Cart.update({ shop_id: null }, { where: { id: cartId } });
  }

  res.json({
    success: true,
    message: "Item removed from cart",
  });
});

// Clear cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ where: { user_id: req.user.id } });
  if (cart) {
    await CartItem.destroy({ where: { cart_id: cart.id } });
    await cart.update({ shop_id: null });
  }

  res.json({
    success: true,
    message: "Cart cleared",
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
