const { Category, Product, Shop } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Get all active categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { is_active: true },
    order: [["display_order", "ASC"]],
  });

  res.json({
    success: true,
    data: { categories },
  });
});

// Get category by slug with products
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page || 1, 10);
  const limit = Math.min(50, parseInt(req.query.limit || 20, 10));
  const offset = (page - 1) * limit;

  const category = await Category.findOne({
    where: { slug, is_active: true },
  });

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where: {
      category_id: category.id,
      is_available: true,
    },
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: ["id", "name", "slug", "rating", "estimated_delivery_time", "is_open"],
      },
    ],
    limit,
    offset,
    order: [
      ["is_bestseller", "DESC"],
      ["is_featured", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  res.json({
    success: true,
    data: {
      category,
      products,
    },
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
};
