const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FavoriteShop = sequelize.define(
    "FavoriteShop",
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
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "favorite_shops",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["user_id", "shop_id"] },
      ],
    }
  );

  return FavoriteShop;
};
