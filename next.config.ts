import type { NextConfig } from "next";
// all okay phme
const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "i.ibb.co.com",
            },
        ],
    },
};

export default nextConfig;
