const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OrderStatusHistory = sequelize.define(
    "OrderStatusHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      changed_by_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      note: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "order_status_history",
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ["order_id"] }],
    }
  );

  return OrderStatusHistory;
};
