import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PAWZO — A warm hug for your pet's whole life",
    short_name: "Pawzo",
    description:
      "Track health, feeding, meds, growth, and memories — and reach an emergency vet fast.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FBF1EC",
    theme_color: "#EC4899",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
