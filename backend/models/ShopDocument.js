const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ShopDocument = sequelize.define(
    "ShopDocument",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      document_type: {
        type: DataTypes.STRING, // e.g. "FSSAI", "GST", "PAN", "TRADE_LICENSE"
        allowNull: false,
      },
      document_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "VERIFIED", "REJECTED"),
        defaultValue: "PENDING",
      },
      rejection_reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "shop_documents",
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ["shop_id"] }],
    }
  );

  return ShopDocument;
};
