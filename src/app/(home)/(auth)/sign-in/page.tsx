"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const router = useRouter();

    useEffect(() => {
        // Use replace to avoid adding an extra history entry
        router.replace("/");
    }, [router]);

    return <div className="p-6 text-gray-600">Redirecting to Home Page…</div>;
}
