"use client";
import React, { useEffect, useState } from "react";

type Voucher = {
    id: string;
    customerId: string;
    discount: number; // 0.1 => 10%
    usageLimit: number | null;
    usedCount: number;
    createdAt: string;
};

type VoucherResponse = {
    numOfOrder: number;
    voucher: Voucher | null;
    error?: string;
};

export default function VoucherPage() {
    const [data, setData] = useState<VoucherResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function fetchVoucher() {
            try {
                setLoading(true);
                const res = await fetch("/api/customer-home/vouchers", {
                    cache: "no-store",
                });
                const json = (await res.json()) as VoucherResponse;
                if (!res.ok)
                    throw new Error(json?.error || "Failed to fetch voucher");
                if (mounted) setData(json);
            } catch (e) {
                if (mounted)
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Failed to fetch voucher"
                    );
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchVoucher();
        return () => {
            mounted = false;
        };
    }, []);

    const content = (() => {
        if (loading)
            return <div className="text-gray-600">Loading voucher…</div>;
        if (error) return <div className="text-red-600">{error}</div>;
        if (!data) return <div className="text-gray-600">No data.</div>;

        const orders = data.numOfOrder;
        const v = data.voucher;
        if (!v) {
            return (
                <div className="rounded-lg border p-4 bg-orange-400">
                    <h2 className="text-lg font-semibold mb-1">
                        No Voucher Yet
                    </h2>
                    <p className="text-sm text-black-600">
                        You have placed {orders} orders.
                    </p>
                    <p className="text-sm text-black-600 mt-1">
                        Place more orders to unlock vouchers:
                    </p>
                    <ul className="list-disc list-inside text-sm text-black-600 mt-1">
                        <li>More than 5 orders: 10% off</li>
                        <li>More than 10 orders: 20% off</li>
                    </ul>
                </div>
            );
        }

        const percent = Math.round(v.discount);
        const remaining =
            v.usageLimit == null
                ? Infinity
                : Math.max(v.usageLimit - v.usedCount, 0);
        return (
            <div className="rounded-lg border p-4 bg-white">
                <h2 className="text-lg font-semibold mb-2">Your Voucher</h2>
                <div className="text-2xl font-bold text-green-600">
                    {percent}% OFF
                </div>
                <div className="mt-2 text-sm text-gray-700">
                    Orders placed: {orders}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                    Uses remaining:{" "}
                    {v.usageLimit == null ? "Unlimited" : remaining}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                    Issued: {new Date(v.createdAt).toLocaleString()}
                </div>
                <p className="mt-3 text-sm text-gray-600">
                    Tip: Your voucher is applied automatically at checkout when
                    eligible.
                </p>
            </div>
        );
    })();

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-4xl font-bold mb-4 hover:bg-orange-500">Voucher</h1>
            {content}
        </div>
    );
}
