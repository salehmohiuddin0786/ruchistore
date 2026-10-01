const jwt = require("jsonwebtoken");
const { User, Shop, DeliveryPartner } = require("../models");
const { AppError } = require("./error.middleware");

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError("Authentication required. Please log in.", 401, "UNAUTHORIZED"));
    }

    const secret = process.env.JWT_SECRET || "ruchistore_super_secret_jwt_key_2026_xyz";
    const decoded = jwt.verify(token, secret);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError("The user belonging to this token no longer exists.", 401, "USER_NOT_FOUND"));
    }

    if (user.is_blocked) {
      return next(new AppError("Your account has been suspended. Please contact support.", 403, "ACCOUNT_BLOCKED"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const secret = process.env.JWT_SECRET || "ruchistore_super_secret_jwt_key_2026_xyz";
      const decoded = jwt.verify(token, secret);
      const user = await User.findByPk(decoded.id);
      if (user && !user.is_blocked) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user ? req.user.role : "GUEST"}' is not authorized to access this resource`,
          403,
          "FORBIDDEN"
        )
      );
    }
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
};
