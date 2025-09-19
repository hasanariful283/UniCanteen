"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import React, { useEffect, useState } from "react";
import Image from "next/image"; // Uncomment if you want to use images
import { syncDataToDatabase } from "./dbSync";
import { useUser } from "@clerk/nextjs";

type FeaturedItem = {
    id: string;
    bannerImage?: string;
    food: {
        name: string;
        price: number;
        description?: string;
        image?: string;
    };
};

const CustomerHome = () => {

    // Sync customer data to DB on mount (if user exists)
    const { user } = useUser();
    useEffect(() => {
        if (!user) return;
        syncDataToDatabase(user).then((res) => {
            // Optionally handle response
            console.log(res);
        });
    }, [user]);

    // Carousel setup
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { align: "center", loop: true },
        [
            Autoplay({
                delay: 2000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
            }),
        ]
    );

    const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);

    useEffect(() => {
        async function fetchFeatured() {
            const res = await fetch("/api/customer-home/featured-items/");
            const data = await res.json();
            setFeaturedItems(data);
        }
        fetchFeatured();
    }, []);

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <div className="flex-1 h-full overflow-y-auto">
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Welcome to UniCanteen
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Order from your favorite campus restaurants
                    </p>
                </div>

                {/* Featured Items Carousel */}
                <div className="mb-12">
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
                                        <div className="relative h-[400px] rounded-xl overflow-hidden">
                                            {/* Uncomment below if you want images and have next/image configured */}
                                            <Image
                                                src={
                                                    item.bannerImage ||
                                                    item.food.image ||
                                                    "/default.jpg"
                                                }
                                                alt={item.food.name}
                                                fill
                                                className="object-cover"
                                                priority={index === 0}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                                <p className="text-lg font-medium text-gray-200">
                                                    {item.food.name}
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
                        {/* Optional carousel navigation buttons */}
                        {/* <button onClick={scrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow">
                Prev
            </button>
            <button onClick={scrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow">
                Next
            </button> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerHome;
