const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const InventoryTransaction = sequelize.define(
    "InventoryTransaction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("RESERVED", "DEDUCTED", "RELEASED", "RESTOCKED", "ADJUSTED"),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      balance_after: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "inventory_transactions",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["product_id"] },
        { fields: ["order_id"] },
        { fields: ["shop_id"] },
      ],
    }
  );

  return InventoryTransaction;
};
