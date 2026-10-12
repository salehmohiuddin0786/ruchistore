const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Cart, DeliveryPartner, Shop } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { sendOtp, verifyOtp } = require("../services/smsService");

const generateTokens = (user) => {
  const secret = process.env.JWT_SECRET || "ruchistore_super_secret_jwt_key_2026_xyz";
  const refreshSecret = process.env.JWT_REFRESH_SECRET || "ruchistore_refresh_jwt_key_2026_abc";

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, phone: user.phone },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30m" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    refreshSecret,
    { expiresIn: "7d" }
  );

  return { token, refreshToken };
};

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Send OTP
const requestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    throw new AppError("Mobile phone number is required", 400, "MISSING_PHONE");
  }

  const result = await sendOtp(phone);
  res.json({
    success: true,
    message: "Verification code sent successfully",
    meta: { phone },
  });
});

// Verify OTP & Login / Register
const verifyOtpAndLogin = asyncHandler(async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) {
    throw new AppError("Phone and OTP are required", 400, "MISSING_FIELDS");
  }

  await verifyOtp(phone, otp);

  let [user, created] = await User.findOrCreate({
    where: { phone },
    defaults: {
      phone,
      name: name || `Customer ${phone.slice(-4)}`,
      role: "CUSTOMER",
      is_verified: true,
    },
  });

  if (user.is_blocked) {
    throw new AppError("Your account has been suspended.", 403, "ACCOUNT_BLOCKED");
  }

  if (created) {
    // Initialize customer cart
    await Cart.findOrCreate({ where: { user_id: user.id } });
  }

  const { token, refreshToken } = generateTokens(user);
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: created ? "Account created successfully" : "Logged in successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile_image: user.profile_image,
      },
      token,
      refreshToken,
    },
  });
});

// Email / Password / Username Login (supports admin@store, admin@store.com, or phone number)
const loginWithPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email or username and password are required", 400, "MISSING_CREDENTIALS");
  }

  const rawInput = String(email).trim().toLowerCase();
  const searchVariants = [rawInput];

  // Demo role alias mappings
  if (rawInput === "admin@store" || rawInput === "admin@store.com" || rawInput === "admin") {
    searchVariants.push("admin@store", "admin@ruchistore.com", "admin@store.com");
  } else if (rawInput === "owner@store" || rawInput === "owner@store.com" || rawInput === "owner") {
    searchVariants.push("owner@store", "owner.ruchimart@ruchistore.com", "owner@ruchistore.com");
  } else if (rawInput === "delivery@store" || rawInput === "delivery@store.com" || rawInput === "delivery") {
    searchVariants.push("delivery@store", "delivery1@ruchistore.com", "delivery@ruchistore.com");
  } else if (rawInput === "customer@store" || rawInput === "customer@store.com" || rawInput === "customer") {
    searchVariants.push("customer@store", "customer@ruchistore.com");
  }

  if (!rawInput.includes(".")) {
    searchVariants.push(`${rawInput}.com`);
  } else if (rawInput.endsWith(".com")) {
    searchVariants.push(rawInput.replace(/\.com$/, ""));
  }

  const user = await User.findOne({
    where: {
      [Op.or]: [
        { email: { [Op.in]: searchVariants } },
        { phone: rawInput },
      ],
    },
  });

  if (!user || !user.password) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.is_blocked) {
    throw new AppError("Your account has been suspended.", 403, "ACCOUNT_BLOCKED");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const { token, refreshToken } = generateTokens(user);
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: "Logged in successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile_image: user.profile_image,
      },
      token,
      refreshToken,
    },
  });
});

// Register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = "CUSTOMER" } = req.body;

  if (!name || !phone) {
    throw new AppError("Name and phone number are required", 400, "MISSING_FIELDS");
  }

  // Check phone uniqueness
  const existingPhone = await User.findOne({ where: { phone } });
  if (existingPhone) {
    throw new AppError("An account with this phone number already exists", 400, "PHONE_EXISTS");
  }

  if (email) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new AppError("An account with this email already exists", 400, "EMAIL_EXISTS");
    }
  }

  let hashedPassword = null;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  // Public signup can only create CUSTOMER, or request SHOP_OWNER / DELIVERY_PARTNER with pending status
  const assignedRole = ["SHOP_OWNER", "DELIVERY_PARTNER"].includes(role) ? role : "CUSTOMER";

  const user = await User.create({
    name,
    email: email || null,
    phone,
    password: hashedPassword,
    role: assignedRole,
    is_verified: true,
  });

  if (assignedRole === "CUSTOMER") {
    await Cart.findOrCreate({ where: { user_id: user.id } });
  }

  const { token, refreshToken } = generateTokens(user);
  setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    },
  });
});

// Get Current User Profile
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] },
    include: [
      { model: Shop, as: "ownedShops" },
      { model: DeliveryPartner, as: "deliveryProfile" },
    ],
  });

  res.json({
    success: true,
    data: { user },
  });
});

// Google OAuth / Firebase Login
const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken, email, name, photoURL, phone, uid } = req.body;

  if (!email) {
    throw new AppError("Email is required for Google Sign-In", 400, "MISSING_EMAIL");
  }

  const emailLower = email.toLowerCase().trim();

  // Find user by email or by phone if provided
  let user = await User.findOne({ where: { email: emailLower } });

  if (!user && phone) {
    user = await User.findOne({ where: { phone } });
    if (user && !user.email) {
      user.email = emailLower;
      await user.save();
    }
  }

  let isNewUser = false;
  if (!user) {
    user = await User.create({
      email: emailLower,
      name: name || emailLower.split("@")[0],
      phone: phone || null,
      role: "CUSTOMER",
      is_verified: true,
      profile_image: photoURL || null,
    });
    isNewUser = true;

    // Initialize shopping cart for new customer
    await Cart.findOrCreate({ where: { user_id: user.id } });
  } else {
    // Clean up any legacy placeholder phone
    if (user.phone && user.phone.startsWith("g_")) {
      user.phone = null;
      await user.save();
    }
    // Update profile image if missing
    if (photoURL && !user.profile_image) {
      user.profile_image = photoURL;
      await user.save();
    }
  }

  if (user.is_blocked) {
    throw new AppError("Your account has been suspended.", 403, "ACCOUNT_BLOCKED");
  }

  const needsPhone = !user.phone || user.phone.startsWith("g_");
  const { token, refreshToken } = generateTokens(user);
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: isNewUser ? "Account created and logged in with Google" : "Logged in with Google successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        role: user.role,
        profile_image: user.profile_image,
      },
      token,
      refreshToken,
      needsPhone,
    },
  });
});

// Logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = {
  requestOtp,
  verifyOtpAndLogin,
  loginWithPassword,
  loginWithGoogle,
  register,
  getMe,
  logout,
};
