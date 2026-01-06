// Food item type definitions for canteen menu
/*
model CanteenFood {
  canteenId   String   @id
  name        String
  price       Float
  image       String?
  rating      Float
  description String?
  availability Boolean @default(true)
  stocks      Int      @default(10)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  canteen Canteen @relation(fields: [canteenId], references: [id])
}
*/

import { FoodCategory } from "@/generated/client";

export interface CanteenFood {
  id: string;
  canteenId: string;
  name: string;
  price: number;
  image?: string;
  rating: number;
  description?: string;
  category: FoodCategory[];
  availability: boolean;
  stocks: number;
  createdAt: Date;
  updatedAt: Date;
}
