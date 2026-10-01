const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Address = sequelize.define(
    "Address",
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      house_flat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address_line: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      landmark: {
        type: DataTypes.STRING,
        allowNull: true,
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
      type: {
        type: DataTypes.ENUM("HOME", "WORK", "OTHER"),
        defaultValue: "HOME",
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      delivery_instructions: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "addresses",
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [{ fields: ["user_id"] }],
    }
  );

  return Address;
};
