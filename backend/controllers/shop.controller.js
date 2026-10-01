const { Op } = require("sequelize");
const { Shop, Product, Category, Review, User } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { calculateDistance } = require("../services/deliveryAssignment.service");

// Get all approved shops with distance calculation
const getShops = asyncHandler(async (req, res) => {
  const { userLat, userLng, search, isOpen } = req.query;
  const page = parseInt(req.query.page || 1, 10);
  const limit = Math.min(50, parseInt(req.query.limit || 20, 10));
  const offset = (page - 1) * limit;

  const whereClause = {
    status: "APPROVED",
  };

  if (isOpen === "true") {
    whereClause.is_open = true;
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { city: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows: shops } = await Shop.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [
      ["is_open", "DESC"],
      ["rating", "DESC"],
    ],
  });

  const clientLat = userLat ? parseFloat(userLat) : 17.4485;
  const clientLng = userLng ? parseFloat(userLng) : 78.3908;

  const enrichedShops = shops.map((shop) => {
    const shopLat = parseFloat(shop.latitude || 17.4485);
    const shopLng = parseFloat(shop.longitude || 78.3908);
    const distanceKm = calculateDistance(clientLat, clientLng, shopLat, shopLng);

    return {
      ...shop.toJSON(),
      distance: `${distanceKm.toFixed(1)} km`,
      distanceRaw: distanceKm,
    };
  });

  // Sort by distance if user location provided
  if (userLat && userLng) {
    enrichedShops.sort((a, b) => a.distanceRaw - b.distanceRaw);
  }

  res.json({
    success: true,
    data: { shops: enrichedShops },
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Get shop details by ID or slug with categories & products
const getShopById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isNumeric = /^\d+$/.test(id);
  const whereClause = isNumeric ? { id } : { slug: id };
  whereClause.status = "APPROVED";

  const shop = await Shop.findOne({
    where: whereClause,
    include: [
      {
        model: Product,
        as: "products",
        where: { is_available: true },
        required: false,
        include: [{ model: Category, as: "category" }],
      },
      {
        model: Review,
        as: "reviews",
        limit: 5,
        order: [["created_at", "DESC"]],
        include: [{ model: User, as: "user", attributes: ["id", "name", "profile_image"] }],
      },
    ],
  });

  if (!shop) {
    throw new AppError("Shop not found or not approved", 404, "SHOP_NOT_FOUND");
  }

  // Extract unique categories available in this shop
  const categoriesMap = new Map();
  if (shop.products) {
    shop.products.forEach((p) => {
      if (p.category) {
        categoriesMap.set(p.category.id, p.category);
      }
    });
  }

  res.json({
    success: true,
    data: {
      shop,
      categories: Array.from(categoriesMap.values()),
    },
  });
});

module.exports = {
  getShops,
  getShopById,
};
