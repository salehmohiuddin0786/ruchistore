const http = require("http");
const app = require("./app");
const { connectDB } = require("./config/db");
const { sequelize } = require("./models");
const { initSocket } = require("./sockets/socketHandler");
const { startAssignmentMonitor } = require("./jobs/assignmentJob");

require("dotenv").config();

// Fail-fast environment validation
const requiredEnv = ["DB_NAME", "JWT_SECRET"];
for (const envKey of requiredEnv) {
  if (!process.env[envKey]) {
    console.error(`❌ Critical Error: Missing required environment variable '${envKey}'`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start background delivery assignment monitor
    startAssignmentMonitor();

    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Ruchi Store API & WebSocket server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
