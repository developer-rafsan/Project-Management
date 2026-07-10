export default function manifest() {
  return {
    name: "Project Manager",
    short_name: "Project Manager",
    description: "A modern system for managing your projects efficiently.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
      { src: "/logo.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" },
    ],
  }
}
