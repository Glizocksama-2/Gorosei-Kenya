export const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || "";
export const SUPABASE_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";
export const WHATSAPP_NUMBER = "254734944512";
export const FIXED_PRICE = 2000;
export const BUCKET_NAME = "products-images";
export const PRODUCT_CATEGORIES = ["tshirts", "jackets", "pants", "accessories", "shoes", "socks"];
export const PRODUCT_CONDITIONS = ["new", "excellent", "good", "thrifted", "rare-find"];
export const ORDER_STATUSES = ["new", "contacted", "paid", "delivered", "cancelled"];
export const DISCORD_WEBHOOK = import.meta?.env?.VITE_DISCORD_WEBHOOK || "";
export const HERO_MEDIA = [
  { src: "/hero1.webp", type: "image", durationMs: 5000 },
  { src: "/hero2.webp", type: "image", durationMs: 5000 },
  { src: "/hero3.webp", type: "image", durationMs: 5000 },
  { src: "/hero4.webp", type: "image", durationMs: 5000 },
  { src: "/hero5.webp", type: "image", durationMs: 5000 },
  { src: "/hero6.webp", type: "image", durationMs: 5000 },
  { src: "/hero7.webp", type: "image", durationMs: 5000 },
  { src: "/hero8.jpg", type: "image", durationMs: 5000 },
];
export const LOOKBOOK_MEDIA = [
  { src: "/lookbook-1.webp", title: "Gorosei original graphic tee" },
  { src: "/lookbook-2.webp", title: "Loyalty over everything tee" },
  { src: "/lookbook-3.webp", title: "Angel of Misery tee" },
  { src: "/lookbook-4.webp", title: "Gorosei Worldwide tee" },
  { src: "/lookbook-5.webp", title: "Gorosei gothic collection" },
  { src: "/lookbook-6.webp", title: "Skulled Finger tee" },
];
