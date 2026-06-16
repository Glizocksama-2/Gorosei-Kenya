import { useEffect, useRef, useState } from "react";
import { getImageUrl, getProductImages, getProductPrice } from "../lib/productUtils.js";

export default function ProductCard({ product, priority = false }) {
  const ref = useRef(null);
  const [failedImage, setFailedImage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = null;
    let nextTiltX = 0;
    let nextTiltY = 0;
    let nextLightX = 50;
    let nextLightY = 50;

    const render = () => {
      el.style.setProperty("--tilt-x", `${nextTiltX}deg`);
      el.style.setProperty("--tilt-y", `${nextTiltY}deg`);
      el.style.setProperty("--lx", `${nextLightX}%`);
      el.style.setProperty("--ly", `${nextLightY}%`);
      frame = null;
    };

    const schedule = () => {
      if (frame === null) {
        frame = requestAnimationFrame(render);
      }
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      nextTiltX = ((rect.height / 2 - y) / (rect.height / 2)) * 8;
      nextTiltY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
      nextLightX = (x / rect.width) * 100;
      nextLightY = (y / rect.height) * 100;
      schedule();
    };
    const onLeave = () => {
      nextTiltX = 0;
      nextTiltY = 0;
      nextLightX = 50;
      nextLightY = 50;
      schedule();
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  const name = product?.Name || "UNNAMED";
  const price = getProductPrice(product);
  const originalPrice = Number(product?.original_price) || 0;
  const hasDiscount = originalPrice > price;
  const images = getProductImages(product);
  const coverImage = images[selectedImageIndex] || images[0];
  const imageWidth = priority ? 520 : 420;
  const isSold = Boolean(product?.sold);
  const size = product?.size || "ONE SIZE";
  const category = product?.category || "piece";
  const condition = product?.condition ? product.condition.replace("-", " ") : "curated";
  const productUrl = product?.id ? `/product/${product.id}` : "#drop";

  function openProduct() {
    window.location.href = productUrl;
  }

  return (
    <div
      ref={ref}
      role="link"
      tabIndex={0}
      className="product-card"
      onClick={openProduct}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProduct();
        }
      }}
      style={{
        display: "block",
        textDecoration: "none",
        opacity: isSold ? 0.72 : 1,
        cursor: "pointer",
      }}
    >
      <div className="image-wrapper">
        {coverImage && coverImage !== failedImage ? (
          <img
            src={getImageUrl(coverImage, imageWidth, 70, "contain")}
            srcSet={[
              `${getImageUrl(coverImage, 360, 68, "contain")} 360w`,
              `${getImageUrl(coverImage, 520, 70, "contain")} 520w`,
              `${getImageUrl(coverImage, 720, 72, "contain")} 720w`,
            ].join(", ")}
            sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1200px) 33vw, 430px"
            alt={name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onError={() => setFailedImage(coverImage)}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "contain", objectPosition: "center", display: "block", filter: isSold ? "grayscale(1)" : "none" }}
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
          <div
            className="font-mono"
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 8px",
              background: "rgba(0,0,0,0.76)",
              border: "1px solid rgba(255,255,255,0.14)",
              zIndex: 3,
            }}
          >
            {images.slice(0, 4).map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`View ${name} photo ${index + 1}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedImageIndex(index);
                  setFailedImage("");
                }}
                style={{
                  width: selectedImageIndex === index ? 18 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.7)",
                  background: selectedImageIndex === index ? "var(--crimson)" : "rgba(255,255,255,0.2)",
                  padding: 0,
                  cursor: "pointer",
                  transition: "width 0.2s, background 0.2s",
                }}
              />
            ))}
            <span style={{ color: "var(--text)", fontSize: 8, letterSpacing: "0.12em" }}>
              {selectedImageIndex + 1}/{images.length}
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: 20 }}>
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
        <div
          className="font-mono"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginTop: 14 }}
        >
          {[
            ["SIZE", size],
            ["TYPE", category],
            ["COND", condition],
          ].map(([label, value]) => (
            <span
              key={label}
              title={`${label}: ${value}`}
              style={{
                border: "1px solid var(--surface-light)",
                padding: "7px 6px",
                fontSize: 8,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}: {value}
            </span>
          ))}
        </div>
        {hasDiscount && (
          <div className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
            <span style={{ textDecoration: "line-through", marginRight: 8 }}>
              KSh {originalPrice.toLocaleString()}
            </span>
            <span style={{ color: "var(--crimson)" }}>SALE</span>
          </div>
        )}
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            color: isSold ? "var(--text-muted)" : "#fff",
            background: isSold ? "transparent" : "var(--crimson)",
            border: isSold ? "1px solid var(--surface-light)" : "1px solid var(--crimson)",
            marginTop: 14,
            display: "block",
            letterSpacing: "0.18em",
            padding: "11px 12px",
            textAlign: "center",
          }}
        >
          {isSold ? "VIEW ARCHIVE" : "ORDER NOW"}
        </span>
      </div>
    </div>
  );
}

