// Shopping cart page with item management and checkout functionality
"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CartItem } from "@/types/cart-types";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
    const { decrementCartCount, refreshCartCount } = useCart();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    const handleImageError = (foodId: string) => {
        setImageErrors(prev => new Set(prev).add(foodId));
    };

    const getImageSrc = (item: CartItem) => {
        if (imageErrors.has(item.id) || !item.food?.image) {
            return "/default-food.jpg";
        }
        
        // Check if the image URL is valid
        const imageUrl = item.food.image;
        if (!imageUrl || imageUrl === "" || imageUrl.includes("undefined")) {
            return "/default-food.jpg";
        }
        
        return imageUrl;
    };

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
        const currentItem = cartItems.find(item => item.id === cartItemId);
        const wasRemoved = nextQty === 0;
        
        setUpdatingId(cartItemId);
        setCartItems((items) =>
            items
                .map((it) =>
                    it.id === cartItemId ? { ...it, quantity: nextQty } : it
                )
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
            } else {
                // If item was removed (quantity set to 0), update cart count
                if (wasRemoved) {
                    decrementCartCount();
                }
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
            const res = await fetch(
                `/api/cart/remove-item?cartItemId=${cartItemId}`,
                {
                    method: "DELETE",
                }
            );
            if (!res.ok) {
                throw new Error((await res.json()).error || "Failed to remove");
            } else {
                // Update cart count in navbar
                decrementCartCount();
            }
        } catch (e) {
            setCartItems(prev);
        } finally {
            setUpdatingId(null);
        }
    }
    // order creating parvezhossainme
    async function checkout() {
        if (updatingId) return;
        setUpdatingId("checkout");
        try {
            const res = await fetch("/api/orders/create", { method: "POST" });
            if (!res.ok)
                throw new Error((await res.json()).error || "Checkout failed");
            const { order } = await res.json();
            // Clear UI cart
            setCartItems([]);
            // Reset cart count in navbar
            refreshCartCount();
            // Optionally navigate to an order summary page later
            // router.push(`/orders/${order.id}`)
        } catch (e) {
            // noop or show toast
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
                                <div className="w-28 h-28 relative shrink-0 mr-4 mb-4">
                                    <div className="relative w-32 h-32 ">
                                        <div className="relative w-32 h-32">
                                            <Image
                                                src={getImageSrc(item)}
                                                alt={
                                                    item.food?.name ||
                                                    "Food Image"
                                                }
                                                fill
                                                sizes="128px" // size of the image container
                                                className="object-cover rounded-lg"
                                                onError={() => handleImageError(item.id)}
                                                placeholder="blur"
                                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7Dh5+XvqsCpd5Sd03KRFSsmLvGWIXZmkdFjXqQoCKpJAG5+dz2WRmBznGOaMqDqcKQcEY4HaoO8fCfcZ5PW7LeFjHwB8X2OyJ3SsRlzrTF/3lFVBcFFDJYdHmfHXl6U2gDdBXd3fhyp6kV1FJj6fdZg8vKlxOBkTMHhLa5qoAhQc0pT9y24CjbH7cDWKNhWRD7rz9lNZkzq4j+LkJLFT9x6xaF7d5rPR0GXSEdhh5r2LL4LMLhRrLUl/sZM7j46lJemKZsrNt6OPo6HI1BhVvXvRsWxb38N0lPXnvHE2Hqk7C2dq1QhIYsiqOzIGb5rPGm/v6WxJZgMtLqjD/2Q=="
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                                {item.food?.name}
                                            </h2>
                                            {item.food?.canteen?.name && (
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
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
                                                disabled={
                                                    updatingId === item.id
                                                }
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        item.quantity - 1
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                −
                                            </button>
                                            <span className="min-w-8 text-center font-semibold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                aria-label="Increase quantity"
                                                disabled={
                                                    updatingId === item.id
                                                }
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        item.quantity + 1
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                +
                                            </button>
                                        </div>
                                        {/* Right side: line total and delete */}
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">
                                                    ৳{item.food?.price} ×{" "}
                                                    {item.quantity}
                                                </div>
                                                <div className="text-orange-700 font-semibold text-lg">
                                                    ৳
                                                    {(item.food?.price || 0) *
                                                        item.quantity}
                                                </div>
                                            </div>
                                            <button
                                                aria-label="Remove item"
                                                disabled={
                                                    updatingId === item.id
                                                }
                                                onClick={() =>
                                                    removeItem(item.id)
                                                }
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


                    {/* Order Summary */}
                    <div className="mt-6 lg:mt-0 lg:w-80 shrink-0 bg-white rounded-xl shadow-md p-6 sticky top-6 h-fit">
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
                            <span className="text-orange-600">৳{total}</span>
                        </div>
                        <button
                            onClick={checkout}
                            disabled={updatingId === "checkout"}
                            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg text-lg transition"
                        >
                            {updatingId === "checkout"
                                ? "Placing order..."
                                : "Proceed to Checkout"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// export default CartPage;
