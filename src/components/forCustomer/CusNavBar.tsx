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

const CusNavBar = () => {
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
            <nav className="flex-1 flex justify-center">
                <ul className="flex gap-8 items-center text-lg font-medium">
                    <li>
                        <Link href="/customer-home">Home</Link>
                    </li>
                    <li>
                        <Link href="/customer-home/messages">Messages</Link>
                    </li>
                    <li className="relative group">
                        <button className="flex items-center gap-1 focus:outline-none">
                            Orders <span className="text-xs">▼</span>
                        </button>
                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-white shadow rounded z-10 min-w-[120px]">
                            <Link
                                href="/customer-home/orders/ongoing"
                                className="block px-4 py-2 hover:bg-orange-100"
                            >
                                Ongoing
                            </Link>
                            <Link
                                href="/customer-home/orders/completed"
                                className="block px-4 py-2 hover:bg-orange-100"
                            >
                                Completed
                            </Link>
                        </div>
                    </li>
                    <li>
                        <Link href="/customer-home/blog">Blog</Link>
                    </li>
                    <li>
                        <Link href="/customer-home/about">About</Link>
                    </li>
                </ul>
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center gap-6">
                <Link href="/wishlist" className="hover:text-orange-700">
                    <HeartIcon className="w-7 h-7" />
                </Link>
                <Link
                    href="/customer-home/cart"
                    className="hover:text-orange-700"
                >
                    <ShoppingBagIcon className="w-7 h-7" />
                </Link>
                <div className="relative">
                    <BellIcon className="w-7 h-7 hover:text-orange-700" />
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                        9
                    </span>
                </div>
                <div>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="signBtn">Sign In</button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="signBtn ml-2">Sign Up</button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "h-10 w-10",
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
