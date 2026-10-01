const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeliveryEarning = sequelize.define(
    "DeliveryEarning",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      delivery_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      delivery_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 40.0,
      },
      tip_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      bonus_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      total_earning: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payout_status: {
        type: DataTypes.ENUM("PENDING", "PROCESSED", "PAID"),
        defaultValue: "PENDING",
      },
    },
    {
      tableName: "delivery_earnings",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["delivery_partner_id"] },
        { fields: ["order_id"] },
      ],
    }
  );

  return DeliveryEarning;
};
