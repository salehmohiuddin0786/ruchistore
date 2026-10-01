const { FavoriteProduct, FavoriteShop, Product, Shop } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Get customer wishlist / favorites
const getFavorites = asyncHandler(async (req, res) => {
  const favoriteProducts = await FavoriteProduct.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: Product,
        as: "product",
        include: [{ model: Shop, as: "shop", attributes: ["id", "name", "slug"] }],
      },
    ],
  });

  const favoriteShops = await FavoriteShop.findAll({
    where: { user_id: req.user.id },
    include: [{ model: Shop, as: "shop" }],
  });

  res.json({
    success: true,
    data: {
      favoriteProducts: favoriteProducts.map((f) => f.product).filter(Boolean),
      favoriteShops: favoriteShops.map((f) => f.shop).filter(Boolean),
    },
  });
});

// Toggle Favorite Product
const toggleFavoriteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new AppError("Product ID is required", 400, "MISSING_PRODUCT_ID");

  const existing = await FavoriteProduct.findOne({
    where: { user_id: req.user.id, product_id: productId },
  });

  if (existing) {
    await existing.destroy();
    return res.json({ success: true, message: "Removed from favorites", isFavorite: false });
  }

  await FavoriteProduct.create({ user_id: req.user.id, product_id: productId });
  res.json({ success: true, message: "Added to favorites", isFavorite: true });
});

// Toggle Favorite Shop
const toggleFavoriteShop = asyncHandler(async (req, res) => {
  const { shopId } = req.body;
  if (!shopId) throw new AppError("Shop ID is required", 400, "MISSING_SHOP_ID");

  const existing = await FavoriteShop.findOne({
    where: { user_id: req.user.id, shop_id: shopId },
  });

  if (existing) {
    await existing.destroy();
    return res.json({ success: true, message: "Removed from favorite shops", isFavorite: false });
  }

  await FavoriteShop.create({ user_id: req.user.id, shop_id: shopId });
  res.json({ success: true, message: "Added to favorite shops", isFavorite: true });
});

module.exports = {
  getFavorites,
  toggleFavoriteProduct,
  toggleFavoriteShop,
};
