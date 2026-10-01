const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductReview = sequelize.define(
    "ProductReview",
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
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "product_reviews",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["product_id"] },
        { fields: ["user_id"] },
      ],
    }
  );

  return ProductReview;
};
