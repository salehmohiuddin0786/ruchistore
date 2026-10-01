const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeviceToken = sequelize.define(
    "DeviceToken",
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
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      platform: {
        type: DataTypes.STRING,
        defaultValue: "WEB",
      },
    },
    {
      tableName: "device_tokens",
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ["user_id", "token"] },
      ],
    }
  );

  return DeviceToken;
};
