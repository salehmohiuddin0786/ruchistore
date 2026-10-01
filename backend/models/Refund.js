const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Refund = sequelize.define(
    "Refund",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gateway_refund_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "PROCESSED", "FAILED"),
        defaultValue: "PENDING",
      },
      processed_by_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "refunds",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["order_id"] },
        { fields: ["payment_id"] },
      ],
    }
  );

  return Refund;
};
