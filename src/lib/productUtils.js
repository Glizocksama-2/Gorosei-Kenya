import { BUCKET_NAME, HERO_MEDIA, SUPABASE_URL } from "../config/constants.js";
import { supabase } from "./supabase.js";

function getImageUrl(path, width = 800, quality = 80) {
  const value = String(path || "").trim();
  if (!value) return "";

  if (value.startsWith("blob:") || value.startsWith("data:")) return value;

  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      if (url.hostname.includes("supabase.co") && url.pathname.includes("/storage/v1/")) {
        url.pathname = url.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
        url.searchParams.set("width", String(width));
        url.searchParams.set("quality", String(quality));
        url.searchParams.set("resize", "cover");
        return url.toString();
      }
      return value;
    } catch {
      return value;
    }
  }

  if (!SUPABASE_URL) return value;

  const cleanPath = value
    .replace(/^\/+/, "")
    .replace(new RegExp(`^(?:storage/v1/object/public/)?${BUCKET_NAME}/`), "");

  return `${SUPABASE_URL}/storage/v1/render/image/public/${BUCKET_NAME}/${cleanPath}?width=${width}&quality=${quality}&resize=cover`;
}

function getProductImages(product) {
  const gallery = Array.isArray(product?.Image_urls) ? product.Image_urls : [];
  return [...new Set([product?.Image_url, ...gallery].filter(Boolean))];
}

function isMissingGalleryColumn(error) {
  const text = `${error?.message || ""} ${error?.details || ""}`;
  return ["Image_urls", "condition", "fit_notes", "story"].some((column) => text.includes(column));
}

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return digits;
}

async function trackProductEvent(productId, eventType, metadata = {}) {
  if (!productId) return;
  try {
    await supabase.from("product_events").insert({
      product_id: productId,
      event_type: eventType,
      metadata,
    });
  } catch {
    /* analytics should never block shopping */
  }
}

function lerp(a, b, f) {
  return a + (b - a) * f;
}

function isNearbyHeroSlide(index, current) {
  const total = HERO_MEDIA.length;
  return (
    index === current ||
    index === (current + 1) % total ||
    index === (current - 1 + total) % total
  );
}

export {
  getImageUrl,
  getProductImages,
  isMissingGalleryColumn,
  isNearbyHeroSlide,
  lerp,
  normalizePhone,
  trackProductEvent,
};
