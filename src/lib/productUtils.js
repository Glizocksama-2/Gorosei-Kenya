import { BUCKET_NAME, HERO_MEDIA, SUPABASE_URL } from "../config/constants.js";
import { supabase } from "./supabase.js";

function getImageUrl(path, width = 800, quality = 80) {
  if (!path) return "";
  if (path.startsWith("http")) {
    if (path.includes("supabase.co/storage")) {
      return `${path}?width=${width}&quality=${quality}&resize=cover`;
    }
    return path;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}?width=${width}&quality=${quality}&resize=cover`;
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
