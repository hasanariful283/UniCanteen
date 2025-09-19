"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

type CartItem = {
    id: string;
    quantity: number;
    food: {
        id: string;
        name: string;
        price: number;
        image?: string;
        description?: string;
        canteen?: {
            id: string;
            name: string;
            canteen_image?: string;
        };
    };
};

export const CartPage = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCart() {
            setLoading(true);
            const res = await fetch("/api/cart/get-cart-items");
            const data = await res.json();
            setCartItems(data.items || []);
            setLoading(false);
        }
        fetchCart();
    }, []);

    const total = cartItems.reduce(
        (sum, item) => sum + (item.food?.price || 0) * item.quantity,
        0
    );

        async function updateQuantity(cartItemId: string, nextQty: number) {
            // optimistic update
            const prev = cartItems;
            setUpdatingId(cartItemId);
            setCartItems((items) =>
                items
                    .map((it) => (it.id === cartItemId ? { ...it, quantity: nextQty } : it))
                    .filter((it) => it.quantity > 0)
            );
            try {
                const res = await fetch("/api/cart/update-quantity", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cartItemId, quantity: nextQty }),
                });
                if (!res.ok) {
                    throw new Error((await res.json()).error || "Failed to update");
                }
            } catch (e) {
                // rollback
                setCartItems(prev);
            } finally {
                setUpdatingId(null);
            }
        }

        async function removeItem(cartItemId: string) {
            const prev = cartItems;
            setUpdatingId(cartItemId);
            setCartItems((items) => items.filter((it) => it.id !== cartItemId));
            try {
                const res = await fetch(`/api/cart/remove-item?cartItemId=${cartItemId}`, {
                    method: "DELETE",
                });
                if (!res.ok) {
                    throw new Error((await res.json()).error || "Failed to remove");
                }
            } catch (e) {
                setCartItems(prev);
            } finally {
                setUpdatingId(null);
            }
        }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Your Cart 🛒
            </h1>

            {loading ? (
                <div className="text-center text-gray-500 py-12">
                    Loading cart...
                </div>
            ) : cartItems.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    Your cart is empty.
                </div>
            ) : (
                <div className="lg:flex lg:gap-8">
                    {/* Cart Items */}
                    <div className="flex-1 space-y-4">
                                                {cartItems.map((item) => (
                            <div
                                key={item.id}
                                                        className="flex gap-4 bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition relative"
                            >
                                <div className="w-28 h-28 relative flex-shrink-0">
                                    <Image
                                        src={
                                            item.food?.image ||
                                            "/default-food.jpg"
                                        }
                                        alt={item.food?.name}
                                        fill
                                        className="object-cover rounded-lg"
                                    />
                                </div>
                                                        <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                                {item.food?.name}
                                            </h2>
                                            {item.food?.canteen?.name && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                                    {item.food.canteen.name.replace(
                                                        /_/g,
                                                        " "
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm line-clamp-2">
                                            {item.food?.description || ""}
                                        </p>
                                    </div>
                                                            <div className="flex items-center justify-between mt-2">
                                                                {/* Quantity controls */}
                                                                <div className="flex items-center gap-3">
                                                                    <button
                                                                        aria-label="Decrease quantity"
                                                                        disabled={updatingId === item.id}
                                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                        className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                                    >
                                                                        −
                                                                    </button>
                                                                    <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                                                                    <button
                                                                        aria-label="Increase quantity"
                                                                        disabled={updatingId === item.id}
                                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                        className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                                {/* Right side: line total and delete */}
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <div className="text-xs text-gray-500">৳{item.food?.price} × {item.quantity}</div>
                                                                        <div className="text-green-600 font-bold text-lg">৳{(item.food?.price || 0) * item.quantity}</div>
                                                                    </div>
                                                                    <button
                                                                        aria-label="Remove item"
                                                                        disabled={updatingId === item.id}
                                                                        onClick={() => removeItem(item.id)}
                                                                        className="text-red-500 hover:text-red-600 text-xl font-bold transition disabled:opacity-50"
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                            </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 lg:mt-0 lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-md p-6 sticky top-6 h-fit">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Order Summary
                        </h2>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">
                                Items ({cartItems.length})
                            </span>
                            <span className="font-semibold text-gray-900">
                                ৳{total}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 my-3"></div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-green-600">৳{total}</span>
                        </div>
                        <button className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg transition">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;