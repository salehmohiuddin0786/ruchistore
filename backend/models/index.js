const { sequelize } = require("../config/db");

/* =========================================================================
 * RUCHI STORE - SEQUELIZE MODELS & ALIAS REGISTRY
 *
 * All models and associations for the quick-commerce platform are unified here.
 * Aliases are strictly unique to eliminate any possibility of collision:
 *
 * User -> Address             : as: 'addresses'
 * Address -> User             : as: 'user'
 * User -> Shop (owner)        : as: 'ownedShops'
 * Shop -> User (owner)        : as: 'owner'
 * User -> Order (customer)    : as: 'orders'
 * Order -> User (customer)    : as: 'customer'
 * User -> DeliveryPartner     : as: 'deliveryProfile'
 * DeliveryPartner -> User     : as: 'user'
 * User -> Cart                : as: 'cart'
 * Cart -> User                : as: 'user'
 * User -> FavoriteShop        : as: 'favoriteShops'
 * User -> FavoriteProduct     : as: 'favoriteProducts'
 * User -> Notification        : as: 'notifications'
 *
 * Shop -> Product             : as: 'products'
 * Product -> Shop             : as: 'shop'
 * Shop -> ShopDocument        : as: 'documents'
 * Shop -> Order               : as: 'orders'
 * Order -> Shop               : as: 'shop'
 * Shop -> Review              : as: 'reviews'
 * Shop -> Coupon              : as: 'coupons'
 *
 * Category -> Product         : as: 'products'
 * Product -> Category         : as: 'category'
 * Product -> ProductVariant   : as: 'variants'
 * Product -> Inventory        : as: 'inventory'
 * Product -> ProductReview    : as: 'reviews'
 * Product -> OrderItem        : as: 'orderItems'
 * Product -> CartItem         : as: 'cartItems'
 *
 * Cart -> Shop                : as: 'shop'
 * Cart -> CartItem            : as: 'items'
 * CartItem -> Cart            : as: 'cart'
 * CartItem -> Product         : as: 'product'
 *
 * Order -> OrderItem          : as: 'items'
 * OrderItem -> Order          : as: 'order'
 * Order -> DeliveryPartner    : as: 'deliveryPartner'
 * DeliveryPartner -> Order    : as: 'assignedOrders'
 * Order -> Address            : as: 'deliveryAddress'
 * Order -> Coupon             : as: 'coupon'
 * Order -> OrderStatusHistory : as: 'statusHistory'
 * Order -> Payment            : as: 'payment'
 * Order -> DeliveryEarning    : as: 'deliveryEarning'
 * Order -> DeliveryAssignment : as: 'assignments'
 *
 * DeliveryPartner -> Assignment: as: 'assignments'
 * Assignment -> DeliveryPartner: as: 'deliveryPartner'
 *
 * Payment -> Refund           : as: 'refunds'
 * SupportTicket -> SupportMsg : as: 'messages'
 * ========================================================================= */

const User = require("./User")(sequelize);
const Address = require("./Address")(sequelize);
const Shop = require("./Shop")(sequelize);
const ShopDocument = require("./ShopDocument")(sequelize);
const Category = require("./Category")(sequelize);
const Product = require("./Product")(sequelize);
const ProductVariant = require("./ProductVariant")(sequelize);
const Inventory = require("./Inventory")(sequelize);
const InventoryTransaction = require("./InventoryTransaction")(sequelize);
const Cart = require("./Cart")(sequelize);
const CartItem = require("./CartItem")(sequelize);
const Order = require("./Order")(sequelize);
const OrderItem = require("./OrderItem")(sequelize);
const OrderStatusHistory = require("./OrderStatusHistory")(sequelize);
const DeliveryPartner = require("./DeliveryPartner")(sequelize);
const DeliveryAssignment = require("./DeliveryAssignment")(sequelize);
const DeliveryLocation = require("./DeliveryLocation")(sequelize);
const DeliveryEarning = require("./DeliveryEarning")(sequelize);
const Coupon = require("./Coupon")(sequelize);
const CouponUsage = require("./CouponUsage")(sequelize);
const Payment = require("./Payment")(sequelize);
const Refund = require("./Refund")(sequelize);
const Review = require("./Review")(sequelize);
const ProductReview = require("./ProductReview")(sequelize);
const FavoriteShop = require("./FavoriteShop")(sequelize);
const FavoriteProduct = require("./FavoriteProduct")(sequelize);
const Notification = require("./Notification")(sequelize);
const DeviceToken = require("./DeviceToken")(sequelize);
const Banner = require("./Banner")(sequelize);
const Offer = require("./Offer")(sequelize);
const SupportTicket = require("./SupportTicket")(sequelize);
const SupportMessage = require("./SupportMessage")(sequelize);
const OtpCode = require("./OtpCode")(sequelize);

/* ================= ASSOCIATIONS DEFINITIONS ================= */
const initAssociations = () => {
  /* ---------- USER ---------- */
  User.hasMany(Address, { foreignKey: "user_id", as: "addresses" });
  Address.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(Shop, { foreignKey: "owner_id", as: "ownedShops" });
  Shop.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

  User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
  Order.belongsTo(User, { foreignKey: "user_id", as: "customer" });

  User.hasOne(DeliveryPartner, { foreignKey: "user_id", as: "deliveryProfile" });
  DeliveryPartner.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasOne(Cart, { foreignKey: "user_id", as: "cart" });
  Cart.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(Review, { foreignKey: "user_id", as: "shopReviews" });
  Review.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(ProductReview, { foreignKey: "user_id", as: "productReviews" });
  ProductReview.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(FavoriteShop, { foreignKey: "user_id", as: "favoriteShops" });
  FavoriteShop.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(FavoriteProduct, { foreignKey: "user_id", as: "favoriteProducts" });
  FavoriteProduct.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
  Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(DeviceToken, { foreignKey: "user_id", as: "deviceTokens" });
  DeviceToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

  /* ---------- SHOP ---------- */
  Shop.hasMany(Product, { foreignKey: "shop_id", as: "products" });
  Product.belongsTo(Shop, { foreignKey: "shop_id", as: "shop" });

  Shop.hasMany(ShopDocument, { foreignKey: "shop_id", as: "documents" });
  ShopDocument.belongsTo(Shop, { foreignKey: "shop_id", as: "shop" });

  Shop.hasMany(Order, { foreignKey: "shop_id", as: "orders" });
  Order.belongsTo(Shop, { foreignKey: "shop_id", as: "shop" });

  Shop.hasMany(Review, { foreignKey: "shop_id", as: "reviews" });
  Review.belongsTo(Shop, { foreignKey: "shop_id", as: "shop" });

  Shop.hasMany(Coupon, { foreignKey: "shop_id", as: "coupons" });
  Coupon.belongsTo(Shop, { foreignKey: "shop_id", as: "shop" });

  Shop.hasMany(FavoriteShop, { foreignKey: "shop_id", as: "favoritedBy" });
  FavoriteShop.belongsTo(Shop, { foreignKey: "shop_id", as: "shop" });

  /* ---------- CATEGORY ---------- */
  Category.hasMany(Product, { foreignKey: "category_id", as: "products" });
  Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });

  /* ---------- PRODUCT ---------- */
  Product.hasMany(ProductVariant, { foreignKey: "product_id", as: "variants" });
  ProductVariant.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  Product.hasOne(Inventory, { foreignKey: "product_id", as: "inventory" });
  Inventory.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  Product.hasMany(InventoryTransaction, { foreignKey: "product_id", as: "inventoryTransactions" });
  InventoryTransaction.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  Product.hasMany(ProductReview, { foreignKey: "product_id", as: "reviews" });
  ProductReview.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  Product.hasMany(OrderItem, { foreignKey: "product_id", as: "orderItems" });
  OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  Product.hasMany(FavoriteProduct, { foreignKey: "product_id", as: "favoritedBy" });
  FavoriteProduct.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  /* ---------- CART ---------- */
  Cart.belongsTo(Shop, { foreignKey: "shop_id", as: "shop" });

  Cart.hasMany(CartItem, { foreignKey: "cart_id", as: "items" });
  CartItem.belongsTo(Cart, { foreignKey: "cart_id", as: "cart" });

  CartItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  Product.hasMany(CartItem, { foreignKey: "product_id", as: "cartItems" });

  /* ---------- ORDER ---------- */
  Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" });
  OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

  Order.belongsTo(DeliveryPartner, { foreignKey: "delivery_partner_id", as: "deliveryPartner" });
  DeliveryPartner.hasMany(Order, { foreignKey: "delivery_partner_id", as: "assignedOrders" });

  Order.belongsTo(Address, { foreignKey: "address_id", as: "deliveryAddress" });
  Order.belongsTo(Coupon, { foreignKey: "coupon_id", as: "coupon" });

  Order.hasMany(OrderStatusHistory, { foreignKey: "order_id", as: "statusHistory" });
  OrderStatusHistory.belongsTo(Order, { foreignKey: "order_id", as: "order" });

  Order.hasOne(Payment, { foreignKey: "order_id", as: "payment" });
  Payment.belongsTo(Order, { foreignKey: "order_id", as: "order" });

  Order.hasOne(DeliveryEarning, { foreignKey: "order_id", as: "deliveryEarning" });
  DeliveryEarning.belongsTo(Order, { foreignKey: "order_id", as: "order" });

  Order.hasMany(DeliveryAssignment, { foreignKey: "order_id", as: "assignments" });
  DeliveryAssignment.belongsTo(Order, { foreignKey: "order_id", as: "order" });

  /* ---------- DELIVERY ASSIGNMENTS & EARNINGS ---------- */
  DeliveryPartner.hasMany(DeliveryAssignment, { foreignKey: "delivery_partner_id", as: "assignments" });
  DeliveryAssignment.belongsTo(DeliveryPartner, { foreignKey: "delivery_partner_id", as: "deliveryPartner" });

  DeliveryPartner.hasMany(DeliveryLocation, { foreignKey: "delivery_partner_id", as: "locationLogs" });
  DeliveryLocation.belongsTo(DeliveryPartner, { foreignKey: "delivery_partner_id", as: "deliveryPartner" });

  DeliveryPartner.hasMany(DeliveryEarning, { foreignKey: "delivery_partner_id", as: "earnings" });
  DeliveryEarning.belongsTo(DeliveryPartner, { foreignKey: "delivery_partner_id", as: "deliveryPartner" });

  /* ---------- COUPONS ---------- */
  Coupon.hasMany(CouponUsage, { foreignKey: "coupon_id", as: "usages" });
  CouponUsage.belongsTo(Coupon, { foreignKey: "coupon_id", as: "coupon" });

  /* ---------- PAYMENTS & REFUNDS ---------- */
  Payment.hasMany(Refund, { foreignKey: "payment_id", as: "refunds" });
  Refund.belongsTo(Payment, { foreignKey: "payment_id", as: "payment" });

  /* ---------- SUPPORT ---------- */
  SupportTicket.hasMany(SupportMessage, { foreignKey: "ticket_id", as: "messages" });
  SupportMessage.belongsTo(SupportTicket, { foreignKey: "ticket_id", as: "ticket" });
  SupportTicket.belongsTo(User, { foreignKey: "user_id", as: "user" });
  SupportTicket.belongsTo(Order, { foreignKey: "order_id", as: "order" });
};

// Initialize associations
initAssociations();

module.exports = {
  sequelize,
  User,
  Address,
  Shop,
  ShopDocument,
  Category,
  Product,
  ProductVariant,
  Inventory,
  InventoryTransaction,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatusHistory,
  DeliveryPartner,
  DeliveryAssignment,
  DeliveryLocation,
  DeliveryEarning,
  Coupon,
  CouponUsage,
  Payment,
  Refund,
  Review,
  ProductReview,
  FavoriteShop,
  FavoriteProduct,
  Notification,
  DeviceToken,
  Banner,
  Offer,
  SupportTicket,
  SupportMessage,
  OtpCode,
};
