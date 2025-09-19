import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { RoleType } from "./types/roles";

const publicRoutes = createRouteMatcher(["/", "/sign-in", "/sign-up","/olympia-cafe","/neptune-cafe","/khans-kitchen","/api(.*)"]);
const IsCanteenProtectedRoute = createRouteMatcher(["/canteen(.*)"]);
const IsCustomerProtectedRoute = createRouteMatcher(["/customer(.*)"]);
const IsDeliveryProtectedRoute = createRouteMatcher(["/delivery(.*)"]);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const path = req.nextUrl.pathname;
    const role = sessionClaims?.metadata?.role as RoleType || "CUSTOMER";

    console.log("User Role (middleware):", role);

    // If not signed in and trying to access protected routes, redirect to home
    if (!userId && !publicRoutes(req)) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // If signed in and has role, redirect to appropriate dashboard
    if (userId && path === "/") {
        switch (role) {
            case "DEFAULT":
                return NextResponse.redirect(new URL("/", req.url));
            case "ADMIN":
                return NextResponse.redirect(new URL("/admin-home", req.url));
            case "CUSTOMER":
                return NextResponse.redirect(new URL("/customer-home", req.url));
            case "CANTEEN_OWNER":
                return NextResponse.redirect(new URL("/canteen-home", req.url));
            case "DELIVERY_PERSON":
                return NextResponse.redirect(new URL("/delivery-home", req.url));
            default:
                return NextResponse.next();
        }
    }

    // Protect role-specific routes
    if (isAdminRoute(req) && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    if (IsCanteenProtectedRoute(req) && role !== "CANTEEN_OWNER") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    if (IsCustomerProtectedRoute(req) && role !== "CUSTOMER") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    if (IsDeliveryProtectedRoute(req) && role !== "DELIVERY_PERSON") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
});

// export default clerkMiddleware(() => {
//   return NextResponse.next();
// });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};