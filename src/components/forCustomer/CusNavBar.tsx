// Customer navigation bar with cart, profile, and theme toggle
"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image";
import {
    BellIcon,
    HeartIcon,
    ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/nextjs";
import { useCart } from "@/contexts/CartContext";

const CusNavBar = () => {
    const { cartItemsCount } = useCart();
    return (
        <header className="flex items-center justify-between px-6 bg-[#f79256] h-20 border-b border-black/70">
            <Link href="/">
                <Image
                    src="/UniCanteen_L.png"
                    alt="UniCanteen Logo"
                    className="object-cover "
                    width={300}
                    height={5}
                    priority
                />
            </Link>

            {/* Center Nav Links */}
            {/* <nav className="flex-1 flex justify-center">
                <ul className="flex gap-8 items-center text-lg font-medium">
                    
                   
                    
                    <li>
                        <Link href="/customer-home/blog">Blog</Link>
                    </li>
                    <li>
                        <Link href="/customer-home/about">About</Link>
                    </li>
                </ul>
            </nav> */}

            {/* Right Side Icons */}
            <div className="flex items-center gap-6">
                {/* <Link href="/wishlist" className="hover:text-orange-700">
                    <HeartIcon className="w-7 h-7" />
                </Link> */}
                <div className="relative">
                    <Link
                        href="/customer-home/cart"
                        className="hover:text-orange-700"
                    >
                        <ShoppingBagIcon className="w-10 h-10" />
                    </Link>
                    {cartItemsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                            {cartItemsCount > 99 ? '99+' : cartItemsCount}
                        </span>
                    )}
                </div>
                {/* <div className="relative">
                    <BellIcon className="w-7 h-7 hover:text-orange-700" />
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                        9
                    </span>
                </div> */}
                <div>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="signBtn">Sign In</button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="signBtn">Sign Up</button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: {
                                        width: "50px",
                                        height: "50px",
                                    },
                                    userButtonAvatar: {
                                        width: "50px",
                                        height: "50px",
                                    },
                                },
                            }}
                            showName={false}
                        />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
};

export default CusNavBar;