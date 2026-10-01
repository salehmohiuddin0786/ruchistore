const { Review, ProductReview, Order, Product, Shop } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Add product review
const addProductReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, orderId } = req.body;

  if (!productId || !rating) {
    throw new AppError("Product ID and rating (1-5) are required", 400, "MISSING_FIELDS");
  }

  const review = await ProductReview.create({
    user_id: req.user.id,
    product_id: productId,
    order_id: orderId || null,
    rating: parseInt(rating, 10),
    comment,
  });

  // Re-calculate product average rating
  const allReviews = await ProductReview.findAll({ where: { product_id: productId } });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await Product.update(
    {
      rating: Math.round(avgRating * 10) / 10,
      total_reviews: allReviews.length,
    },
    { where: { id: productId } }
  );

  res.status(201).json({
    success: true,
    message: "Thank you for reviewing this product!",
    data: { review },
  });
});

// Add shop review
const addShopReview = asyncHandler(async (req, res) => {
  const { shopId, rating, comment, orderId } = req.body;

  if (!shopId || !rating) {
    throw new AppError("Shop ID and rating (1-5) are required", 400, "MISSING_FIELDS");
  }

  const review = await Review.create({
    user_id: req.user.id,
    shop_id: shopId,
    order_id: orderId || null,
    rating: parseInt(rating, 10),
    comment,
  });

  // Re-calculate shop average rating
  const allReviews = await Review.findAll({ where: { shop_id: shopId } });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await Shop.update(
    {
      rating: Math.round(avgRating * 10) / 10,
      total_reviews: allReviews.length,
    },
    { where: { id: shopId } }
  );

  res.status(201).json({
    success: true,
    message: "Thank you for reviewing this shop!",
    data: { review },
  });
});

module.exports = {
  addProductReview,
  addShopReview,
};
