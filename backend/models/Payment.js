const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM("COD", "RAZORPAY", "UPI", "CARD"),
        allowNull: false,
        defaultValue: "COD",
      },
      gateway_name: {
        type: DataTypes.STRING,
        defaultValue: "RAZORPAY",
      },
      gateway_order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gateway_payment_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED", "REFUNDED"),
        defaultValue: "PENDING",
      },
      idempotency_key: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "payments",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["order_id"] },
        { fields: ["gateway_order_id"] },
        { fields: ["status"] },
      ],
    }
  );

  return Payment;
};
