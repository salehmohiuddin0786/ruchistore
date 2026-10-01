const bcrypt = require("bcryptjs");
const { OtpCode } = require("../models");
const { AppError } = require("../middleware/error.middleware");

/**
 * Generate 6-digit OTP
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via configured provider (Console in dev)
 */
const sendOtp = async (phone) => {
  if (!phone || phone.length < 10) {
    throw new AppError("Invalid mobile number", 400, "INVALID_PHONE");
  }

  // Check cooldown: Don't allow new OTP if one was created less than 45 seconds ago
  const recentOtp = await OtpCode.findOne({
    where: { phone, is_used: false },
    order: [["created_at", "DESC"]],
  });

  if (recentOtp && Date.now() - new Date(recentOtp.created_at).getTime() < 45 * 1000) {
    const waitSeconds = Math.ceil((45 * 1000 - (Date.now() - new Date(recentOtp.created_at).getTime())) / 1000);
    throw new AppError(`Please wait ${waitSeconds} seconds before requesting a new OTP`, 429, "OTP_COOLDOWN");
  }

  const rawOtp = generateOtp();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(rawOtp, salt);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  await OtpCode.create({
    phone,
    hashed_otp: hashedOtp,
    expires_at: expiresAt,
    attempts: 0,
    is_used: false,
  });

  // Development delivery logging
  console.log(`\n==============================================`);
  console.log(`📱 [RUCHI STORE DEV SMS]`);
  console.log(`To: ${phone}`);
  console.log(`Your Verification Code is: ${rawOtp}`);
  console.log(`Valid for 5 minutes. Do not share with anyone.`);
  console.log(`==============================================\n`);

  return { success: true, message: "OTP sent successfully" };
};

/**
 * Verify OTP
 */
const verifyOtp = async (phone, rawOtp) => {
  if (!phone || !rawOtp) {
    throw new AppError("Phone and OTP are required", 400, "MISSING_FIELDS");
  }

  const otpRecord = await OtpCode.findOne({
    where: { phone, is_used: false },
    order: [["created_at", "DESC"]],
  });

  if (!otpRecord) {
    throw new AppError("No active OTP found. Please request a new OTP.", 400, "NO_OTP");
  }

  if (new Date() > new Date(otpRecord.expires_at)) {
    throw new AppError("OTP has expired. Please request a new code.", 400, "OTP_EXPIRED");
  }

  if (otpRecord.attempts >= 5) {
    throw new AppError("Maximum verification attempts exceeded. Please request a new OTP.", 429, "MAX_ATTEMPTS");
  }

  const isMatch = await bcrypt.compare(rawOtp.toString(), otpRecord.hashed_otp);

  if (!isMatch) {
    await otpRecord.increment("attempts");
    const remaining = 5 - (otpRecord.attempts + 1);
    throw new AppError(`Invalid OTP. ${remaining} attempts remaining.`, 400, "INVALID_OTP");
  }

  // Mark used
  await otpRecord.update({ is_used: true });
  return true;
};

module.exports = {
  sendOtp,
  verifyOtp,
};
