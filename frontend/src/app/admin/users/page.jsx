"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, ShieldCheck } from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/users");
      if (res.data?.success) {
        setUsers(res.data.data?.users || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search)) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Users & Accounts</h1>
          <p className="text-xs text-slate-400">All registered customers, shop owners, and delivery fleet</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-hidden focus:border-indigo-500"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-hidden"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="SHOP_OWNER">SHOP_OWNER</option>
            <option value="DELIVERY_PARTNER">DELIVERY_PARTNER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 p-8 space-y-2 text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold">No users match filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {u.phone || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.email || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.role === "ADMIN"
                          ? "bg-red-950 text-red-400 border border-red-800"
                          : u.role === "SHOP_OWNER"
                          ? "bg-purple-950 text-purple-400 border border-purple-800"
                          : u.role === "DELIVERY_PARTNER"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-indigo-950 text-indigo-400 border border-indigo-800"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
