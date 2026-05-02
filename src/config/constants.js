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
  { src: "/hero1.png", type: "image", durationMs: 5000 },
  { src: "/hero2.png", type: "image", durationMs: 5000 },
  { src: "/hero3.png", type: "image", durationMs: 5000 },
  { src: "/hero4.png", type: "image", durationMs: 5000 },
  { src: "/hero5.png", type: "image", durationMs: 5000 },
  { src: "/hero6.png", type: "image", durationMs: 5000 },
  { src: "/hero7.png", type: "image", durationMs: 5000 },
  { src: "/hero8.jpg", type: "image", durationMs: 5000 },
];
