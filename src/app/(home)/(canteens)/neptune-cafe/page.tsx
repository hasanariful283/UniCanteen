"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

type Food = {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  POPULAR: "Popular",
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  FAST_FOOD: "Fast Foods",
  DESSERT: "Dessert",
  BEVERAGE: "Drinks",
  SNACK: "Snacks",
  RICE_ITEMS: "Rice Items",
  DRINKS: "Drinks",
  PACKET_ITEMS: "Packet Items",
  OTHERS: "Others",
  MEAT_ITEMS: "Meat Items",
};

const NeptuneCafe = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  useEffect(() => {
    async function fetchFoods() {
      const res = await fetch("/api/home/neptune-foods");
      const data = await res.json();
      setFoods(data);
      setLoading(false);
    }
    fetchFoods();
  }, []);

  // Group foods by category
  const foodsByCategory: Record<string, Food[]> = {};
  foods.forEach((food) => {
    food.category.forEach((cat) => {
      if (!foodsByCategory[cat]) foodsByCategory[cat] = [];
      foodsByCategory[cat].push(food);
    });
  });

  // Filtered categories for tabs (add ALL at the start)
  const categories = ["ALL", ...Object.keys(foodsByCategory)];

  // Filter foods by search and active category
  const filteredFoods =
    activeCategory === "ALL"
      ? foods.filter(
          (food) =>
            food.name.toLowerCase().includes(search.toLowerCase()) ||
            (food.description &&
              food.description.toLowerCase().includes(search.toLowerCase()))
        )
      : foodsByCategory[activeCategory]?.filter(
          (food) =>
            food.name.toLowerCase().includes(search.toLowerCase()) ||
            (food.description &&
              food.description.toLowerCase().includes(search.toLowerCase()))
        ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search Anything Here"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xl px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg"
        />
      </div>

      {/* Cafe Title */}
      <h1 className="text-4xl font-bold text-center mb-4 font-serif">Neptune Cafe</h1>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full border font-medium transition ${
              activeCategory === cat
                ? "bg-orange-100 text-orange-700 border-orange-400"
                : "bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
            }`}
          >
            {cat === "ALL"
              ? `All (${foods.length})`
              : `${CATEGORY_LABELS[cat] || cat.replace(/_/g, " ")} (${foodsByCategory[cat]?.length || 0})`}
          </button>
        ))}
      </div>

      {/* Food Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-200 mb-4"></div>
          <p className="text-lg text-gray-500">Loading foods...</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No foods found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFoods.map((food) => (
            <div key={food.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border hover:shadow-lg transition">
              <div className="relative w-full h-40 mb-2">
                <Image
                  src={food.image || "/default-food.jpg"}
                  alt={food.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{food.name}</h2>
                <span className="font-bold text-orange-500 text-lg">৳{food.price}</span>
              </div>
              <p className="text-gray-600 text-sm">{food.description}</p>
              <div className="flex flex-wrap gap-2 my-1">
                {food.category.map((cat) => (
                  <span key={cat} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                    {CATEGORY_LABELS[cat] || cat.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NeptuneCafe;