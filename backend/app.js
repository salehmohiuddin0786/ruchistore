const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const { apiLimiter } = require("./middleware/rateLimit.middleware");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

/*
|--------------------------------------------------------------------------
| Security & Global Middlewares
|--------------------------------------------------------------------------
*/

// Helmet with relaxed resource policy for images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "https://ruchistore.in",
      "https://ruchistore.com",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Static uploads serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Global API rate limiting
app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/addresses", require("./routes/address.routes"));

app.use("/api/shops", require("./routes/shop.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/search", require("./routes/search.routes"));

app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/coupons", require("./routes/coupon.routes"));

app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/payments", require("./routes/payment.routes"));

app.use("/api/delivery", require("./routes/delivery.routes"));
app.use("/api/shop-owner", require("./routes/shopOwner.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

app.use("/api/reviews", require("./routes/reviews.routes"));
app.use("/api/favorites", require("./routes/favorites.routes"));
app.use("/api/notifications", require("./routes/notifications.routes"));
app.use("/api/support", require("./routes/support.routes"));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Ruchi Store Quick-Commerce API is running",
    version: "2.0.0",
    database: "MySQL (XAMPP)",
  });
});

/*
|--------------------------------------------------------------------------
| 404 & Global Error Handler
|--------------------------------------------------------------------------
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found`,
    code: "NOT_FOUND",
  });
});

app.use(errorHandler);

module.exports = app;
