const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      recipient_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      recipient_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_for_other: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      delivery_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      address_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      coupon_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      delivery_fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      tax: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM("COD", "RAZORPAY", "UPI", "CARD"),
        defaultValue: "COD",
      },
      payment_status: {
        type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"),
        defaultValue: "PENDING",
      },
      order_status: {
        type: DataTypes.ENUM(
          "PLACED",
          "CONFIRMED",
          "PACKING",
          "READY_FOR_PICKUP",
          "ASSIGNED",
          "PICKED_UP",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
          "REFUNDED"
        ),
        defaultValue: "PLACED",
      },
      delivery_lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      delivery_lng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      otp_for_delivery: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      cancellation_reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      packed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ready_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      picked_up_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["order_number"] },
        { fields: ["user_id", "created_at"] },
        { fields: ["shop_id", "order_status"] },
        { fields: ["delivery_partner_id"] },
      ],
    }
  );

  return Order;
};
