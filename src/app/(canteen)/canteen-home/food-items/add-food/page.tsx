"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FOOD_CATEGORIES = [
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

export default function AddFoodPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      // Get all selected categories as an array
      const categories = formData.getAll("category");

      const foodData = {
        name: formData.get("name"),
        price: parseFloat(formData.get("price") as string),
        description: formData.get("description"),
        image: formData.get("image"),
        rating: 0,
        stocks: parseInt(formData.get("stocks") as string),
        availability: formData.get("availability") === "true",
        category: categories, // array for multi-select
      };

      const response = await fetch("/api/canteen-home/add-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(foodData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      router.push("/canteen-home/food-items/current-foods");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add food item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className=" mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Food Item</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Food Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            placeholder="Enter food name"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-2">
            Price (৳) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            step="0.01"
            min="0"
            required
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            placeholder="Enter food description"
          ></textarea>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image"
            name="image"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label htmlFor="stocks" className="block text-sm font-medium mb-2">
            Initial Stock *
          </label>
          <input
            type="number"
            id="stocks"
            name="stocks"
            min="0"
            defaultValue="10"
            required
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Food Category *
          </label>
          <select
            id="category"
            name="category"
            multiple
            required
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            style={{ height: "160px" }}
          >
            {FOOD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple categories.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Availability</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="availability"
                value="true"
                defaultChecked
                className="form-radio h-4 w-4 text-orange-600"
              />
              <span className="ml-2">Available</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="availability"
                value="false"
                className="form-radio h-4 w-4 text-orange-600"
              />
              <span className="ml-2">Not Available</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
        >
          {loading ? "Adding..." : "Add Food Item"}
        </button>
      </form>
    </div>
  );
}