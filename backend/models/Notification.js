const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
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
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        defaultValue: "ORDER", // "ORDER", "PROMOTION", "SYSTEM", "DELIVERY"
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      data_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["user_id", "read"] },
      ],
    }
  );

  return Notification;
};
