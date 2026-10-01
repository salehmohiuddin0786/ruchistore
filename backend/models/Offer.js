const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Offer = sequelize.define(
    "Offer",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      discount_tag: {
        type: DataTypes.STRING, // e.g. "Flat 50% OFF", "Save ₹100"
        allowNull: true,
      },
      coupon_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "offers",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["is_active"] },
      ],
    }
  );

  return Offer;
};
