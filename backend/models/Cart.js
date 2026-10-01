const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "carts",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["user_id"] },
        { fields: ["shop_id"] },
      ],
    }
  );

  return Cart;
};
