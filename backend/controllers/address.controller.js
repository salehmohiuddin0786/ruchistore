const { Address, User } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Get all addresses for user
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.findAll({
    where: { user_id: req.user.id },
    order: [
      ["is_default", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  const formatted = addresses.map((a) => {
    const plain = a.toJSON();
    return {
      ...plain,
      isDefault: plain.is_default,
      addressLine1: plain.address_line,
      flat: plain.house_flat,
    };
  });

  res.json({
    success: true,
    data: formatted,
    addresses: formatted,
  });
});

// Add new address
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const name = (req.body.name || user?.name || "Customer").trim();
  const rawPhone = req.body.phone || (user?.phone && !user.phone.startsWith("g_") ? user.phone : "");
  const cleanPhone = String(rawPhone).replace(/\D/g, "");
  const phone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : (cleanPhone || "9999999999");

  // If user profile is missing a phone, link this valid phone number to user
  if (user && (!user.phone || user.phone.startsWith("g_")) && phone.length === 10) {
    try {
      const existingUserWithPhone = await User.findOne({ where: { phone } });
      if (!existingUserWithPhone) {
        user.phone = phone;
        await user.save();
      }
    } catch (e) {
      // Ignore unique collision
    }
  }

  const house_flat = req.body.house_flat || req.body.flat || req.body.houseFlat || "Address";
  const address_line = req.body.address_line || req.body.addressLine1 || req.body.addressLine || "";
  const landmark = req.body.landmark || "";
  const city = req.body.city || "Hyderabad";
  const state = req.body.state || "Telangana";
  const pincode = req.body.pincode || "500081";
  const latitude = req.body.latitude || null;
  const longitude = req.body.longitude || null;
  const type = req.body.type || "HOME";
  const is_default = Boolean(req.body.is_default ?? req.body.isDefault ?? false);
  const delivery_instructions = req.body.delivery_instructions || req.body.deliveryInstructions || "";

  if (!address_line || !pincode) {
    throw new AppError("Please fill street address and pincode", 400, "MISSING_FIELDS");
  }

  // If this is set as default or the user has no existing addresses, make it default
  const existingCount = await Address.count({ where: { user_id: req.user.id } });
  const shouldBeDefault = is_default || existingCount === 0;

  if (shouldBeDefault) {
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  }

  const address = await Address.create({
    user_id: req.user.id,
    name,
    phone,
    house_flat,
    address_line,
    landmark,
    city,
    state,
    pincode,
    latitude,
    longitude,
    type,
    is_default: shouldBeDefault,
    delivery_instructions,
  });

  const plain = address.toJSON();
  const formatted = {
    ...plain,
    isDefault: plain.is_default,
    addressLine1: plain.address_line,
    flat: plain.house_flat,
  };

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    data: formatted,
    address: formatted,
  });
});

// Update address
const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = await Address.findOne({
    where: { id, user_id: req.user.id },
  });

  if (!address) {
    throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
  }

  const {
    name,
    phone,
    house_flat,
    address_line,
    landmark,
    city,
    state,
    pincode,
    latitude,
    longitude,
    type,
    is_default,
    delivery_instructions,
  } = req.body;

  if (is_default) {
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  }

  await address.update({
    name: name !== undefined ? name : address.name,
    phone: phone !== undefined ? phone : address.phone,
    house_flat: house_flat !== undefined ? house_flat : address.house_flat,
    address_line: address_line !== undefined ? address_line : address.address_line,
    landmark: landmark !== undefined ? landmark : address.landmark,
    city: city !== undefined ? city : address.city,
    state: state !== undefined ? state : address.state,
    pincode: pincode !== undefined ? pincode : address.pincode,
    latitude: latitude !== undefined ? latitude : address.latitude,
    longitude: longitude !== undefined ? longitude : address.longitude,
    type: type !== undefined ? type : address.type,
    is_default: is_default !== undefined ? is_default : address.is_default,
    delivery_instructions: delivery_instructions !== undefined ? delivery_instructions : address.delivery_instructions,
  });

  res.json({
    success: true,
    message: "Address updated successfully",
    data: { address },
  });
});

// Set default address
const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = await Address.findOne({
    where: { id, user_id: req.user.id },
  });

  if (!address) {
    throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
  }

  await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  await address.update({ is_default: true });

  res.json({
    success: true,
    message: "Default address updated",
    data: { address },
  });
});

// Delete address (paranoid soft delete)
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = await Address.findOne({
    where: { id, user_id: req.user.id },
  });

  if (!address) {
    throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
  }

  await address.destroy();

  res.json({
    success: true,
    message: "Address deleted successfully",
  });
});

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
