const { Product, Inventory, InventoryTransaction } = require("../models");
const { AppError } = require("../middleware/error.middleware");

const getProductId = (item) => {
  return item.productId || item.product_id || (item.product && item.product.id);
};

/**
 * Reserves inventory inside a transaction with row-level locks
 */
const reserveInventory = async (items, orderId, shopId, transaction) => {
  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    const productId = getProductId(item);

    if (!productId) {
      throw new AppError("Invalid product in inventory reservation", 400, "INVALID_PRODUCT_DATA");
    }

    // Lock the product row
    const product = await Product.findByPk(productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product) {
      throw new AppError(`Product #${productId} not found`, 404, "PRODUCT_NOT_FOUND");
    }

    if (!product.is_available) {
      throw new AppError(`Product '${product.name}' is currently unavailable`, 400, "PRODUCT_UNAVAILABLE");
    }

    const availableStock = product.stock_quantity - product.reserved_quantity;
    if (availableStock < qty) {
      throw new AppError(
        `Insufficient stock for '${product.name}'. Available: ${Math.max(0, availableStock)}, requested: ${qty}`,
        400,
        "OUT_OF_STOCK"
      );
    }

    // Update reservation
    await product.increment({ reserved_quantity: qty }, { transaction });

    // Sync Inventory model if present
    const inventory = await Inventory.findOne({
      where: { product_id: productId, shop_id: shopId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (inventory) {
      await inventory.increment({ reserved_quantity: qty }, { transaction });
    }

    // Write audit ledger
    await InventoryTransaction.create(
      {
        product_id: productId,
        shop_id: shopId,
        order_id: orderId,
        type: "RESERVED",
        quantity: qty,
        balance_after: product.stock_quantity - (product.reserved_quantity + qty),
        notes: `Reserved for Order #${orderId}`,
      },
      { transaction }
    );
  }
};

/**
 * Deducts reserved inventory upon successful delivery
 */
const deductInventory = async (items, orderId, shopId, transaction) => {
  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    const productId = getProductId(item);

    const product = await Product.findByPk(productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (product) {
      const newStock = Math.max(0, product.stock_quantity - qty);
      const newReserved = Math.max(0, product.reserved_quantity - qty);
      await product.update(
        {
          stock_quantity: newStock,
          reserved_quantity: newReserved,
        },
        { transaction }
      );

      const inventory = await Inventory.findOne({
        where: { product_id: productId, shop_id: shopId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (inventory) {
        await inventory.update(
          {
            stock_quantity: newStock,
            reserved_quantity: newReserved,
          },
          { transaction }
        );
      }

      await InventoryTransaction.create(
        {
          product_id: productId,
          shop_id: shopId,
          order_id: orderId,
          type: "DEDUCTED",
          quantity: qty,
          balance_after: newStock - newReserved,
          notes: `Deducted on Delivery for Order #${orderId}`,
        },
        { transaction }
      );
    }
  }
};

/**
 * Releases reserved inventory upon order cancellation or rejection
 */
const releaseInventory = async (items, orderId, shopId, transaction) => {
  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    const productId = getProductId(item);

    const product = await Product.findByPk(productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (product) {
      const newReserved = Math.max(0, product.reserved_quantity - qty);
      await product.update({ reserved_quantity: newReserved }, { transaction });

      const inventory = await Inventory.findOne({
        where: { product_id: productId, shop_id: shopId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (inventory) {
        await inventory.update({ reserved_quantity: newReserved }, { transaction });
      }

      await InventoryTransaction.create(
        {
          product_id: productId,
          shop_id: shopId,
          order_id: orderId,
          type: "RELEASED",
          quantity: qty,
          balance_after: product.stock_quantity - newReserved,
          notes: `Released after Cancellation of Order #${orderId}`,
        },
        { transaction }
      );
    }
  }
};

module.exports = {
  reserveInventory,
  deductInventory,
  releaseInventory,
};
