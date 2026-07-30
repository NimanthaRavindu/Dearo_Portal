import type { NextConfig } from "next";

const nextConfig: NextConfig = {
        
      allowedDevOrigins: [
        "politics-occasion-visitor-counsel.trycloudflare.com",
        "localhost:3000",
        "192.168.1.11",
        "*"
      ],

};

export default nextConfig;