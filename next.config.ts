import type { NextConfig } from "next";

const nextConfig: NextConfig = {
        
      allowedDevOrigins: [
        "household-tsunami-differ-administered.trycloudflare.com",
        "localhost:3000",
        "192.168.1.11",
        "*"
      ],

};

export default nextConfig;