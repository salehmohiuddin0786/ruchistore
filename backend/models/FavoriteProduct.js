const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FavoriteProduct = sequelize.define(
    "FavoriteProduct",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "favorite_products",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["user_id", "product_id"] },
      ],
    }
  );

  return FavoriteProduct;
};
