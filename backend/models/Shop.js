const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Shop = sequelize.define(
    "Shop",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cover_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Hyderabad",
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Telangana",
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      opening_time: {
        type: DataTypes.STRING,
        defaultValue: "06:00 AM",
      },
      closing_time: {
        type: DataTypes.STRING,
        defaultValue: "11:00 PM",
      },
      delivery_radius: {
        type: DataTypes.FLOAT,
        defaultValue: 10.0, // km
      },
      minimum_order: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      estimated_delivery_time: {
        type: DataTypes.STRING,
        defaultValue: "15-20 min",
      },
      is_open: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "BLOCKED"),
        defaultValue: "PENDING",
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 4.5,
      },
      total_reviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      commission_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 10.0,
      },
      gst_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pan_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "shops",
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        { unique: true, fields: ["slug"] },
        { fields: ["owner_id"] },
        { fields: ["status", "is_open"] },
      ],
    }
  );

  return Shop;
};
