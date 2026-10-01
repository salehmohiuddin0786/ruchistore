const { Sequelize } = require("sequelize");
require("dotenv").config();

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || "ruchi_store";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "";

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: Number(dbPort),
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? false : false,
  pool: {
    max: 15,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(` MySQL Connected successfully to ${dbName} at ${dbHost}:${dbPort}`);
  } catch (error) {
    console.error(" MySQL Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
