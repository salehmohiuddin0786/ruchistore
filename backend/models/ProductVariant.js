const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductVariant = sequelize.define(
    "ProductVariant",
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
      name: {
        type: DataTypes.STRING, // e.g. "500g", "1kg", "5kg pack"
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      unit_value: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discount_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      stock_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      reserved_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "product_variants",
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ["product_id"] }],
    }
  );

  return ProductVariant;
};
