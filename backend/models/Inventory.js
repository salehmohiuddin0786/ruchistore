const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Inventory = sequelize.define(
    "Inventory",
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
      stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reserved_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      low_stock_threshold: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
    },
    {
      tableName: "inventory",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["product_id", "shop_id"] },
        { fields: ["shop_id"] },
      ],
    }
  );

  return Inventory;
};
