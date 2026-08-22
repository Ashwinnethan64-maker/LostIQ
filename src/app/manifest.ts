import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LostIQ — Intelligent Lost & Found",
    short_name: "LostIQ",
    description: "Lost it. Found it. Matched by AI. Intelligent campus lost & found matching platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#090A0F",
    theme_color: "#0B5FFF",
    icons: [
      {
        src: "/brand/favicon/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/favicon/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
