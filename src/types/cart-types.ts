export type CartItem = {
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