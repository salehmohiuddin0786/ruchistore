"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function ReplaceCartModal() {
  const { replaceDialog, confirmReplaceCart, cancelReplaceCart } = useCart();

  if (!replaceDialog.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={cancelReplaceCart}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 z-10"
        >
          <button
            onClick={cancelReplaceCart}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 text-amber-600 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Replace items in cart?</h3>
          </div>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your cart already contains groceries from{" "}
            <strong className="text-slate-900">{replaceDialog.currentShop?.name || "another shop"}</strong>.
            A quick-commerce order can only be placed from one shop at a time.
            <br />
            <br />
            Would you like to clear your current cart and add items from{" "}
            <strong className="text-emerald-700">{replaceDialog.newShop?.name || "this shop"}</strong>?
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={cancelReplaceCart}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Keep Current Cart
            </button>
            <button
              onClick={confirmReplaceCart}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-colors"
            >
              Yes, Replace Cart
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
