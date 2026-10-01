const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OtpCode = sequelize.define(
    "OtpCode",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      hashed_otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "otp_codes",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["phone", "is_used"] },
        { fields: ["expires_at"] },
      ],
    }
  );

  return OtpCode;
};
