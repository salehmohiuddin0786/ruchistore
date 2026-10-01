# Ruchi Store 🛒

A full-stack Zepto / Blinkit style Quick Commerce grocery delivery platform.

## 🚀 Features

- **Customer Storefront**:
  - Category & product browsing with fast search.
  - Cart, coupon discounts, real-time address selector, and checkout.
  - Order tracking with live status updates.
- **Shop Owner Portal**:
  - Live order packing, dispatching, and tracking ledger.
  - Inventory & Stock management with live ledger and manual adjustments.
  - Bulk stock updates and product imports via Excel / CSV (no SKU requirement).
  - One-click export of current store inventory and product lists to CSV.
  - Custom coupon and discount voucher management.
- **Delivery Partner Portal**:
  - Real-time order dispatch notifications and acceptance.
  - Step-by-step delivery tracking (Pickup from store -> Out for delivery -> Delivered with OTP).
  - Accurate bill-matched earnings tracker and trip history.
- **Admin Control Center**:
  - Multi-shop and delivery partner onboarding approvals.
  - System-wide inventory, orders, platform statistics, and promotions control.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide React, Axios
- **Backend**: Node.js, Express, Sequelize ORM, MySQL
- **Authentication**: JWT, bcryptjs

## 📦 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your MySQL credentials in .env
npm run seed     # Seeds demo categories, products, users, and coupons
npm run dev      # Runs on port 5001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Runs on http://localhost:3000
```
