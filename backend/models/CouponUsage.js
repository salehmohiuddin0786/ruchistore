const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CouponUsage = sequelize.define(
    "CouponUsage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coupon_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "coupon_usages",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["coupon_id", "user_id"] },
        { fields: ["order_id"] },
      ],
    }
  );

  return CouponUsage;
};
