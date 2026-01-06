// Delivery person navigation bar with order status and profile access
"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image";

// Notification Icon add
import { BellIcon } from "@heroicons/react/24/outline";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/nextjs";

const DeliNavBar = () => {
    return (
        <header className="flex items-center justify-between px-6 bg-[#f79256] h-20 border-b border-black/70">
            <Link href="/">
                <Image
                    src="/UniCanteen_L.png"
                    alt="UniCanteen Logo"
                    className="object-cover h-20"
                    width={300}
                    height={5}
                />
            </Link>

            <nav className="flex items-center">
                {/* Delivery Navigation Links */}
                <ul className="hidden md:flex gap-2 mr-4">
                    <li>
                        <Link
                            href="/delivery-home/active-orders"
                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-amber-200"
                        >
                            Active Orders
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/delivery-home/tracking"
                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-amber-200"
                        >
                            Live Tracking
                        </Link>
                    </li>
                </ul>

                <BellIcon className="text-red-700 mr-4 border rounded-full h-10 w-10 p-1 " />
                <ul className="flex gap-4">
                    <li>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="signBtn">Sign In</button>
                            </SignInButton>
                        </SignedOut>
                    </li>
                    <li>
                        <SignedOut>
                            <SignUpButton mode="modal">
                                <button className="signBtn">Sign Up</button>
                            </SignUpButton>
                        </SignedOut>
                    </li>
                    <li>
                        <SignedIn>
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "h-48 w-48",
                                    },
                                }}
                                showName={true}
                            />
                        </SignedIn>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default DeliNavBar;
