const { Op } = require("sequelize");
const { Product, Category, Shop, ProductReview, User, ProductVariant } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Get all products with filters & pagination
const getProducts = asyncHandler(async (req, res) => {
  const {
    categoryId,
    category,
    categorySlug,
    shopId,
    isFeatured,
    isBestseller,
    deals,
    search,
    minPrice,
    maxPrice,
    sort,
  } = req.query;

  const page = parseInt(req.query.page || 1, 10);
  const limit = Math.min(50, parseInt(req.query.limit || 20, 10));
  const offset = (page - 1) * limit;

  const whereClause = {
    is_available: true,
  };

  if (categoryId) {
    whereClause.category_id = categoryId;
  } else if (category || categorySlug) {
    const slugVal = categorySlug || category;
    const cat = await Category.findOne({
      where: {
        [Op.or]: [{ slug: slugVal }, { name: slugVal }],
      },
    });
    if (cat) {
      whereClause.category_id = cat.id;
    }
  }

  if (shopId) whereClause.shop_id = shopId;
  if (isFeatured === "true" || isFeatured === true) whereClause.is_featured = true;
  if (isBestseller === "true" || isBestseller === true) whereClause.is_bestseller = true;
  if (deals === "true" || deals === true) whereClause.discount_price = { [Op.gt]: 0 };

  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { unit_value: { [Op.like]: `%${search}%` } },
    ];
  }

  // Sorting
  let order = [["created_at", "DESC"]];
  if (sort === "price_asc") order = [["price", "ASC"]];
  if (sort === "price_desc") order = [["price", "DESC"]];
  if (sort === "rating") order = [["rating", "DESC"]];
  if (sort === "bestseller") order = [["is_bestseller", "DESC"], ["rating", "DESC"]];

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: ["id", "name", "slug", "rating", "estimated_delivery_time", "is_open"],
        where: { status: "APPROVED", is_open: true },
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug", "icon"],
      },
    ],
    limit,
    offset,
    order,
  });

  res.json({
    success: true,
    data: { products },
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Get product by ID or slug
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isNumeric = /^\d+$/.test(id);
  const whereClause = isNumeric ? { id } : { slug: id };

  const product = await Product.findOne({
    where: whereClause,
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: [
          "id",
          "name",
          "slug",
          "logo",
          "rating",
          "total_reviews",
          "estimated_delivery_time",
          "is_open",
          "address",
        ],
        where: { status: "APPROVED" },
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug", "icon"],
      },
      {
        model: ProductVariant,
        as: "variants",
      },
      {
        model: ProductReview,
        as: "reviews",
        limit: 10,
        order: [["created_at", "DESC"]],
        include: [{ model: User, as: "user", attributes: ["id", "name", "profile_image"] }],
      },
    ],
  });

  if (!product) {
    throw new AppError("Product not found or unavailable", 404, "PRODUCT_NOT_FOUND");
  }

  // Similar products in same category
  const similarProducts = await Product.findAll({
    where: {
      category_id: product.category_id,
      id: { [Op.ne]: product.id },
      is_available: true,
    },
    limit: 6,
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: ["id", "name", "slug", "estimated_delivery_time"],
        where: { status: "APPROVED" },
      },
    ],
  });

  res.json({
    success: true,
    data: {
      product,
      similarProducts,
    },
  });
});

module.exports = {
  getProducts,
  getProductById,
};
