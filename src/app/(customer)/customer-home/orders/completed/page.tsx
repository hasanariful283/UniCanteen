"use client";
import React, { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  food: { id: string; name: string; price: number; image?: string };
  canteen: { id: string; name: string };
};

type Order = {
  id: string;
  status: "DELIVERED" | "CANCELLED" | "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERING";
  totalPrice: number;
  createdAt: string;
  deliveryAt?: string | null;
  foodItems: OrderItem[];
};

const statusStyles: Record<Order["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-orange-100 text-orange-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  DELIVERING: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function CompletedOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/orders/completed", { cache: "no-store" });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load orders");
        const data = await res.json();
        if (mounted) setOrders(data.orders || []);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading completed orders...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (orders.length === 0) return <div className="p-6 text-gray-600">No completed orders yet.</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Completed Orders</h1>
      {orders.map((order) => {
        const created = new Date(order.createdAt);
        const itemsByCanteen = order.foodItems.reduce<Record<string, OrderItem[]>>((acc, item) => {
          const key = item.canteen?.name || "Unknown";
          (acc[key] ||= []).push(item);
          return acc;
        }, {});
        return (
          <div key={order.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-gray-500">Order ID: {order.id.slice(0, 8)}</span>
                <span className="text-sm text-gray-500">
                  Placed {created.toLocaleDateString()} {created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="text-right">
                <div className="text-gray-600 text-sm">Total</div>
                <div className="text-green-600 font-bold text-lg">৳{order.totalPrice}</div>
              </div>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {Object.entries(itemsByCanteen).map(([canteenName, items]) => (
                <div key={canteenName} className="border rounded-lg p-3">
                  <div className="font-semibold mb-2">{canteenName.replace(/_/g, " ")}</div>
                  <ul className="space-y-2">
                    {items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between text-sm">
                        <div className="truncate">
                          <span className="font-medium">{it.food.name}</span>
                          <span className="text-gray-500"> × {it.quantity}</span>
                        </div>
                        <div className="text-gray-700">৳{it.food.price * it.quantity}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
