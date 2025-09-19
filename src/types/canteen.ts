export enum CanteenName {
    OLYMPIA_CAFE = "OLYMPIA_CAFE",
    NEPTUNE_CAFE = "NEPTUNE_CAFE",
    KHANS_KITCHEN = "KHANS_KITCHEN"
}

export interface CanteenDetails {
    id: string;
    name: CanteenName;
    canteen_image: string | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    reviews: {
        createdAt: Date;
        updatedAt: Date;
        canteenId: string;
        rating: number;
        comment: string | null;
    }[];
    CanteenFood: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        image: string | null;
        canteenId: string;
        stocks: number;
    }[];
}

export type Food = {
    id: string;
    name: string;
    price: number;
    description?: string;
    image?: string;
    stocks: number;
    availability: boolean;
    category: string[];
    rating?: number;
};

export const CATEGORY_LABELS: Record<string, string> = {
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