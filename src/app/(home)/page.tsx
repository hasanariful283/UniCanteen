"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Star, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";

import { Canteen, FeaturedItem } from "@/types/canteen";


const Home = () => {
    const router = useRouter();

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                const res = await fetch("/api/clerk/role");
                const data = await res.json();
                const role = data.role;
                if (role === "CUSTOMER") router.push("/customer-home");
                else if (role === "CANTEEN_OWNER") router.push("/canteen-home");
                else if (role === "DELIVERY_PERSON")
                    router.push("/delivery-home");
                else if (role === "ADMIN") router.push("/admin-home");
            } catch (error) {
                console.error("Error checking role:", error);
            }
        };
        handleRedirect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dynamic featured items
    const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
    useEffect(() => {
        async function fetchFeatured() {
            const res = await fetch("/api/customer-home/featured-items/");
            const data = await res.json();
            setFeaturedItems(data);
        }
        fetchFeatured();
    }, []);

    // Carousel
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { align: "center", loop: true },
        [
            Autoplay({
                delay: 2500,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
            }),
        ]
    );
    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);
    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    // Static canteens datas
    const canteens: Canteen[] = [
        {
            name: "Olympia Cafe",
            image: "https://i.ibb.co.com/N29Lm2CS/olympia.png",
            location: "North Campus",
            rating: "4.5",
            href: "/customer-home/olympia-cafe",
            isOpen: true,
        },
        {
            name: "Khans Kitchen",
            image: "https://i.ibb.co.com/00kZFSW/khans.png",
            location: "South Campus",
            rating: "4.3",
            href: "/customer-home/khans-kitchen",
            isOpen: true,
        },
        {
            name: "Neptune Cafe",
            image: "https://i.ibb.co.com/zhHLwb0x/neptune.png",
            location: "East Campus",
            rating: "4.4",
            href: "/customer-home/neptune-cafe",
            isOpen: false,
        },
    ];

    return (
        <div className="flex-1 h-full overflow-y-auto">
            <div className="container mx-auto px-4 py-8">

                {/* Hero Section */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Welcome to UniCanteen
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Order from your favorite campus restaurants
                    </p>
                </div>

                {/* Featured Items Carousel */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
                        Featured Items
                    </h2>
                    <div className="relative">
                        <div
                            className="overflow-hidden rounded-xl"
                            ref={emblaRef}
                        >
                            <div className="flex">
                                {featuredItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex-[0_0_100%] min-w-0"
                                    >
                                        <div className="relative h-[425px] rounded-xl overflow-hidden">
                                            <Image
                                                src={
                                                    item.bannerImage ||
                                                    item.food.image ||
                                                    "/images/default.jpg"
                                                }
                                                alt={item.food.name}
                                                fill
                                                className="object-cover"
                                                priority={index === 0}
                                                sizes="100vw"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                                <p className="text-lg font-medium text-gray-200">
                                                    {item.food.shop}
                                                </p>
                                                <h3 className="text-3xl font-bold mt-2">
                                                    {item.food.name}
                                                </h3>
                                                <p className="text-lg mt-2 text-gray-200">
                                                    {item.food.description}
                                                </p>
                                                <p className="text-2xl font-bold mt-3 text-green-400">
                                                    ৳{item.food.price}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Navigation Buttons */}
                        <button
                            onClick={scrollPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>
                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canteens.map((canteen) => (
                        <Link
                            href={canteen.href}
                            key={canteen.name}
                            className="block group"
                        >
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-200 hover:scale-105">
                                <div className="relative h-64 w-full">
                                    <Image
                                        src={canteen.image}
                                        alt={canteen.name}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 768px) 100vw,(max-width: 1200px) 50vw,33vw"
                                    />
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                canteen.isOpen
                                                    ? "bg-green-500 text-white"
                                                    : "bg-red-500 text-white"
                                            }`}
                                        >
                                            {canteen.isOpen ? "Open" : "Closed"}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {canteen.name}
                                        </h3>
                                        <div className="flex items-center">
                                            <Star
                                                size={16}
                                                className="text-yellow-400 mr-1"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {canteen.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                                        <Utensils size={16} className="mr-2" />
                                        <span>{canteen.location}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Developed by @parvezhossainme
        </div> */}
            </div>
        </div>
    );
};

export default Home;
