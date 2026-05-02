import { useEffect, useRef, useState } from "react";
import { FIXED_PRICE } from "../config/constants.js";
import { getImageUrl, getProductImages } from "../lib/productUtils.js";

export default function ProductCard({ product }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTilt({
        x: ((rect.height / 2 - y) / (rect.height / 2)) * 8,
        y: ((x - rect.width / 2) / (rect.width / 2)) * 8,
      });
      setLight({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const name = product?.Name || "UNNAMED";
  const price = Number(product?.Price) || FIXED_PRICE;
  const originalPrice = Number(product?.original_price) || 0;
  const hasDiscount = originalPrice > price;
  const images = getProductImages(product);
  const coverImage = images[0];
  const isSold = Boolean(product?.sold);

  return (
    <a
      href={product?.id ? `/product/${product.id}` : "#drop"}
      ref={ref}
      className="product-card"
      style={{
        display: "block",
        textDecoration: "none",
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.5s ease",
        opacity: isSold ? 0.72 : 1,
      }}
    >
      <div className="image-wrapper" style={{ "--lx": `${light.x}%`, "--ly": `${light.y}%` }}>
        {coverImage ? (
          <img
            src={getImageUrl(coverImage, 600, 75)}
            alt={name}
            loading="lazy"
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block", filter: isSold ? "grayscale(1)" : "none" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "3/4",
              background: "var(--surface-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="font-display" style={{ fontSize: 48, color: "var(--text-muted)" }}>
              {name.charAt(0)}
            </span>
          </div>
        )}
        <span
          className="font-mono"
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            padding: "7px 9px",
            background: isSold ? "rgba(255,255,255,0.92)" : "var(--crimson)",
            color: isSold ? "#070707" : "#fff",
            fontSize: 9,
            letterSpacing: "0.12em",
            zIndex: 2,
          }}
        >
          {isSold ? "SOLD" : "ONE OF ONE"}
        </span>
        {images.length > 1 && (
          <span
            className="font-mono"
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              padding: "6px 8px",
              background: "rgba(0,0,0,0.72)",
              color: "var(--text)",
              fontSize: 9,
              letterSpacing: "0.12em",
            }}
          >
            {images.length} PHOTOS
          </span>
        )}
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span className="font-display" style={{ fontSize: 18, lineHeight: 1.2 }}>{name}</span>
          <span
            className="font-mono"
            style={{ fontSize: 12, color: "var(--crimson)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}
          >
            KSh {price.toLocaleString()}
          </span>
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 9,
            color: isSold ? "var(--crimson)" : "var(--text-muted)",
            marginTop: 8,
            letterSpacing: "0.12em",
          }}
        >
          {isSold ? "THIS PIECE HAS LEFT THE RACK" : "ONLY ONE AVAILABLE"}
        </div>
        {hasDiscount && (
          <div className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
            <span style={{ textDecoration: "line-through", marginRight: 8 }}>
              KSh {originalPrice.toLocaleString()}
            </span>
            <span style={{ color: "var(--crimson)" }}>SALE</span>
          </div>
        )}
        {product?.category && (
          <div
            className="font-mono"
            style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.15em" }}
          >
            {product.category}
          </div>
        )}
        <span
          className="font-mono"
          style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 10, display: "block", letterSpacing: "0.2em" }}
        >
          {isSold ? "VIEW ARCHIVE →" : "ORDER NOW →"}
        </span>
      </div>
    </a>
  );
}

