"use client";
import { useUser } from "@clerk/nextjs";

export const syncDataToDatabase = async (user: any) => {
  if (!user) return;
  // Prepare customer data
  const customerData = {
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress || "",
    name: user.firstName + " " + user.lastName,
    phone: user.phoneNumbers[0]?.phoneNumber || "",
    uiuId: user.publicMetadata?.uiuId || "",
  };
  // Send to API route
  const res = await fetch("/api/customer-home/sync-customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customerData),
  });
  return await res.json();
};

// Customer Model
/*
model Customer {
  userId    String   @id
  uiuId     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  ordersPlaced Order[] @relation("CustomerOrders")
  user         User    @relation(fields: [userId], references: [id])
  cart         Cart?
  canteenReviews CanteenReviews[]
}

model User {
  id        String   @id
  email     String?  @unique
  name      String?
  phone     String? // @unique
  studentId String?
  userRole  RoleType @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  canteens        Canteen[]
  Customer        Customer?
  DeliveryPerson   DeliveryPerson?
}
*/