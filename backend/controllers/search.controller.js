const { Op } = require("sequelize");
const { Product, Category, Shop } = require("../models");
const { asyncHandler } = require("../middleware/error.middleware");

// Unified Search across Products, Categories, and Shops
const searchAll = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.json({
      success: true,
      data: {
        products: [],
        categories: [],
        shops: [],
        popularSearches: [
          "Milk",
          "Atta",
          "Potato",
          "Tomato",
          "Bread",
          "Eggs",
          "Apple",
          "Oil",
          "Detergent",
          "Tea",
        ],
      },
    });
  }

  const query = q.trim();

  // Search Products
  const products = await Product.findAll({
    where: {
      is_available: true,
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
      ],
    },
    limit: 12,
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: ["id", "name", "slug", "estimated_delivery_time"],
        where: { status: "APPROVED" },
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
  });

  // Search Categories
  const categories = await Category.findAll({
    where: {
      is_active: true,
      name: { [Op.like]: `%${query}%` },
    },
    limit: 6,
  });

  // Search Shops
  const shops = await Shop.findAll({
    where: {
      status: "APPROVED",
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
      ],
    },
    limit: 6,
  });

  res.json({
    success: true,
    data: {
      products,
      categories,
      shops,
      popularSearches: [
        "Milk",
        "Atta",
        "Potato",
        "Tomato",
        "Bread",
        "Eggs",
        "Apple",
        "Oil",
        "Detergent",
        "Tea",
      ],
    },
  });
});

module.exports = {
  searchAll,
};
