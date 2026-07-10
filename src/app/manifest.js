export default function manifest() {
  return {
    name: "Project Manager",
    short_name: "Project Manager",
    description: "A modern system for managing your projects efficiently.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    display_override: ["window-controls-overlay", "standalone"],
    edge_side_panel: { preferred_width: 400 },
    icons: [
      { src: "/logo-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/logo-1024x1024.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" },
    ],
    categories: ["productivity", "business"],
    prefer_related_applications: false,
  }
}
