const { connectDB } = require("../config/db");
const { sequelize } = require("../models");

const testSync = async () => {
  try {
    await connectDB();
    console.log("Syncing database models...");
    await sequelize.sync({ alter: true });
    console.log("✅ All Sequelize models synced successfully with ruchi_store database!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Model sync failed:", error);
    process.exit(1);
  }
};

testSync();
