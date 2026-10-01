const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SupportMessage = sequelize.define(
    "SupportMessage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "support_messages",
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ["ticket_id"] }],
    }
  );

  return SupportMessage;
};
