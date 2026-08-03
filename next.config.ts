import type { NextConfig } from "next";

const nextConfig: NextConfig = {
        
      allowedDevOrigins: [
        "trek-blink-sister-liver.trycloudflare.com",
        "localhost:3000",
        "192.168.1.11",
        "*"
      ],

};

export default nextConfig;