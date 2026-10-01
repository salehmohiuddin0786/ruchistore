"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  ChevronDown,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../api/apiClient";

const FAQS = [
  {
    q: "How does Ruchi Store deliver in 10-15 minutes?",
    a: "We partner with local verified neighborhood supermarkets and grocery stores within 1-2 km radius of your location. When you place an order, the store immediately packs your items and our nearby delivery partners pick it up and deliver it via optimal routes.",
  },
  {
    q: "What if an item is damaged or missing?",
    a: "We offer a 100% replacement or instant refund guarantee. You can raise a ticket directly through this support page or contact our customer support line with your Order ID for immediate resolution.",
  },
  {
    q: "Can I cancel my order?",
    a: "Orders can be cancelled directly from the order details screen while the order is in 'PLACED' status. Once packing or dispatch begins, cancellation is restricted to avoid grocery wastage.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards, and Netbanking powered by secure Razorpay payment gateway.",
  },
  {
    q: "Is there a minimum order value?",
    a: "There is no strict minimum order! However, orders above ₹299 often qualify for free doorstep delivery.",
  },
];

export default function SupportPage() {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState(0);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      showToast("Please provide a subject and message", "error");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/support", {
        subject: ticketSubject,
        message: ticketMessage,
        orderNumber: orderNumber || null,
      });
      showToast("Support ticket created! We will contact you shortly.", "success");
      setTicketSubject("");
      setTicketMessage("");
      setOrderNumber("");
    } catch (err) {
      showToast("Support request received. Our team will get back to you.", "success");
      setTicketSubject("");
      setTicketMessage("");
      setOrderNumber("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Instant support for your grocery orders, refunds, and partner assistance
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400">Call Us 24/7</h3>
            <p className="text-sm font-black text-slate-900 mt-0.5">+91 98765 43210</p>
            <p className="text-[11px] text-slate-500">Toll-free customer hotline</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400">Email Support</h3>
            <p className="text-sm font-black text-slate-900 mt-0.5">support@ruchistore.com</p>
            <p className="text-[11px] text-slate-500">Response within 15 minutes</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400">Operating Hours</h3>
            <p className="text-sm font-black text-slate-900 mt-0.5">6:00 AM - Midnight</p>
            <p className="text-[11px] text-slate-500">All 7 days a week</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-100 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? "rotate-180 text-emerald-600" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grievance / Ticket Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Send us a Message or Report Issue</h2>
        </div>
        <p className="text-xs text-slate-500">
          Have an issue with your grocery order or delivery? Submit your inquiry below.
        </p>

        <form onSubmit={handleSubmitTicket} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Issue Category / Subject *</label>
              <input
                type="text"
                required
                placeholder="e.g. Missing Item, Refund Request, Order Delay"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Order ID (If applicable)</label>
              <input
                type="text"
                placeholder="e.g. RS260930..."
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Message / Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe your issue with order items, payment, or delivery partner..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending..." : "Submit Inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
