const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] },
  });

  res.json({
    success: true,
    data: { user },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const user = await User.findByPk(req.user.id);

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError("Email is already in use by another account", 400, "EMAIL_EXISTS");
    }
    user.email = email;
  }

  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      throw new AppError("Please enter a valid 10-digit mobile number", 400, "INVALID_PHONE");
    }
    const existing = await User.findOne({ where: { phone: cleanPhone } });
    if (existing && existing.id !== user.id) {
      throw new AppError("Mobile number is already in use by another account", 400, "PHONE_EXISTS");
    }
    user.phone = cleanPhone;
  }

  if (name) user.name = name;
  if (req.file) {
    user.profile_image = `/uploads/documents/${req.file.filename}`;
  }

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
      },
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("Current and new password are required", 400, "MISSING_PASSWORDS");
  }

  const user = await User.findByPk(req.user.id);
  if (!user.password) {
    throw new AppError("Account has no password set (OTP user). Please use reset password.", 400, "NO_PASSWORD_SET");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400, "INCORRECT_PASSWORD");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
