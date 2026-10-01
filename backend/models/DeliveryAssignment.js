const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeliveryAssignment = sequelize.define(
    "DeliveryAssignment",
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
      delivery_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("OFFERED", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"),
        defaultValue: "OFFERED",
      },
      offered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "delivery_assignments",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["order_id", "status"] },
        { fields: ["delivery_partner_id", "status"] },
        { fields: ["expires_at"] },
      ],
    }
  );

  return DeliveryAssignment;
};
