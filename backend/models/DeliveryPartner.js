const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeliveryPartner = sequelize.define(
    "DeliveryPartner",
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
      vehicle_type: {
        type: DataTypes.ENUM("BIKE", "SCOOTER", "BICYCLE", "ELECTRIC_VEHICLE"),
        defaultValue: "BIKE",
      },
      vehicle_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      license_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      aadhar_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "BLOCKED"),
        defaultValue: "PENDING",
      },
      current_lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      current_lng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      total_deliveries: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_earnings: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 5.0,
      },
    },
    {
      tableName: "delivery_partners",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["user_id"] },
        { fields: ["is_online", "status"] },
      ],
    }
  );

  return DeliveryPartner;
};
