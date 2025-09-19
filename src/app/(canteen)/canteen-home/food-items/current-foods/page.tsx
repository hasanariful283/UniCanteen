"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CanteenFood } from "@/types/food";

const FoodItems = () => {
  const [foods, setFoods] = useState<CanteenFood[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-center py-6">Loading foods...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {foods.map((food) => (
        <div
          key={food.canteenId + food.name}
          className="border rounded-2xl shadow-sm p-4 hover:shadow-md transition"
        >
          <div className="relative w-full h-48 mb-4">
            <Image
              src={food.image || "/default-food.jpg"}
              alt={food.name}
              fill
              className="rounded-lg object-cover"
            />
          </div>
          <h3 className="text-lg font-semibold">{food.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{food.description}</p>
          <p className="mt-2 font-bold text-green-600"><span className="text-3xl">৳</span>{food.price}</p>
          <p className="text-sm text-yellow-500">⭐ {food.rating}</p>
          <p
            className={`mt-1 text-sm ${
              food.availability ? "text-green-500" : "text-red-500"
            }`}
          >
            {food.availability ? "Available" : "Out of stock"}
          </p>
        </div>
      ))}
    </div>
  );
};

export default FoodItems;
