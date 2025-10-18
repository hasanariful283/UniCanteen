"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import React, { useEffect, useState } from "react";
import Image from "next/image"; // Uncomment if you want to use images
import Link from "next/link";
import { syncDataToDatabase } from "./dbSync";
import { useUser } from "@clerk/nextjs";
import { Star, Utensils } from "lucide-react";
import { Canteen, FeaturedItem } from "@/types/canteen";


const CustomerHome = () => {
    const { user } = useUser();
    useEffect(() => {
        if (!user) return;
        syncDataToDatabase(user).then((res) => {
            console.log(res);
        });
    }, [user]);

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

                {/* welcome part */}
                <div className="text-center mb-5">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Welcome to UniCanteen
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Order from your favorite campus restaurants
                    </p>
                </div>

                {/* Carousel part here */}
                <div className="mb-13">
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
                                            <Image
                                                src={
                                                    item.bannerImage ||
                                                    item.food.image ||
                                                    "/default.jpg"
                                                }
                                                alt={item.food.name}
                                                fill
                                                className="object-cover"
                                                sizes="100vw"
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
                    </div>
                </div>


                {/* Canteens List Section Here */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canteens.map((canteen) => (
                        <Link
                            href={canteen.href}
                            key={canteen.name}
                            className="block group"
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-200 hover:scale-105">
                                <div className="relative h-68 w-full">
                                    <Image
                                        src={canteen.image}
                                        alt={canteen.name}
                                        fill
                                        className="object-cover "
                                        priority
                                        sizes=""
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
            </div>
        </div>
    );
};

export default CustomerHome;
