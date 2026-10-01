const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeliveryLocation = sequelize.define(
    "DeliveryLocation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      delivery_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
      },
      accuracy: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      heading: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      speed: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      tableName: "delivery_locations",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["delivery_partner_id"] },
        { fields: ["order_id"] },
      ],
    }
  );

  return DeliveryLocation;
};
