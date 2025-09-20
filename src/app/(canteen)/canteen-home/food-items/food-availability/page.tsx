"use client";
import { changeFoodAvailability } from "@/actions/canteen/canteen.action";
import { Button } from "@/components/ui/button";
import { CanteenFood } from "@/types/food";
import React, { useEffect, useRef, useState } from "react";
import { FoodCategory } from "@prisma/client";
const FOOD_CATEGORIES: FoodCategory[] = [
    "POPULAR",
    "BREAKFAST",
    "LUNCH",
    "DINNER",
    "FAST_FOOD",
    "DESSERT",
    "BEVERAGE",
    "SNACK",
    "RICE_ITEMS",
    "DRINKS",
    "PACKET_ITEMS",
    "OTHERS",
    "MEAT_ITEMS",
];

type FilterType = FoodCategory | "ALL";

const FoodAvailabilityPage = () => {
    const [foods, setFoods] = useState<CanteenFood[]>([]);
    const [loading, setLoading] = useState(true);
    // const [filter, setFilter] = useState<string>("ALL");
    const [filter, setFilter] = useState<FilterType>("ALL");
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const fetchFoods = async () => {
            try {
                const res = await fetch("/api/canteen-home/all-foods/");
                const data: CanteenFood[] = await res.json();
                setFoods(data);
            } catch (err) {
                console.error("Failed to fetch foods:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFoods();
    }, []);

    // Filter foods by selected category
    const filteredFoods =
        filter === "ALL"
            ? foods
            : foods.filter(
                  (food) =>
                      Array.isArray(food.category) &&
                      food.category.includes(filter as FoodCategory)
              );

    return (
        <div className="p-6  mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">
                Food Availability
            </h1>
            <div className="mb-6 flex flex-col md:flex-row items-center gap-4">
                <label htmlFor="category-filter" className="font-medium">
                    Filter by Category:
                </label>
                <select
                    id="category-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                >
                    <option value="ALL">All</option>
                    {FOOD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat.replace(/_/g, " ")}
                        </option>
                    ))}
                </select>
            </div>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4  border-b-4 border-gray-200 mb-4"></div>
                    <p className="text-lg text-gray-500">
                        Loading food items...
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredFoods.map((food) => (
                        <form
                            ref={formRef}
                            key={food.id}
                            action={async () => {
                                await changeFoodAvailability(
                                    food.id,
                                    food.canteenId,
                                    food.availability
                                );
                                const res = await fetch(
                                    "/api/canteen-home/all-foods/"
                                );
                                const updatedFoods: CanteenFood[] =
                                    await res.json();
                                setFoods(updatedFoods);
                            }}
                            className="bg-white shadow-md rounded-xl p-6 flex flex-col gap-3 border hover:shadow-lg transition"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold">
                                    {food.name}
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        food.availability
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {food.availability
                                        ? "Available"
                                        : "Not Available"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 my-2">
                                {Array.isArray(food.category) &&
                                    food.category.map((cat) => (
                                        <span
                                            key={cat}
                                            className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium"
                                        >
                                            {cat.replace(/_/g, " ")}
                                        </span>
                                    ))}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-semibold">Stocks:</span>{" "}
                                {food.stocks}
                            </div>
                            <Button
                                type="submit"
                                className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition"
                            >
                                Toggle Availability
                            </Button>
                        </form>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FoodAvailabilityPage;
