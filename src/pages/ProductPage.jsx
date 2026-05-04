import { useCallback, useEffect, useRef, useState } from "react";
import { FIXED_PRICE, WHATSAPP_NUMBER } from "../config/constants.js";
import { useWindowWidth } from "../hooks/index.js";
import { getImageUrl, getProductImages, normalizePhone, trackProductEvent } from "../lib/productUtils.js";
import { supabase } from "../lib/supabase.js";
export default function ProductPage({ id }) {
  const winWidth = useWindowWidth();
  const isMobile = winWidth < 768;
  const imageFrameRef = useRef(null);
  const imageRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [orderDraft, setOrderDraft] = useState({ name: "", phone: "" });
  const [orderStatus, setOrderStatus] = useState("");
  const [ordering, setOrdering] = useState(false);
  const sizes = ["S", "M", "L", "XL"];

  const fetchProduct = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("id", id)
        .single();
      setSelectedImageIndex(0);
      setFailedImages(new Set());
      setProduct(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const task = setTimeout(fetchProduct, 0);
    return () => clearTimeout(task);
  }, [fetchProduct]);

  useEffect(() => {
    trackProductEvent(id, "view");
  }, [id]);

  useEffect(() => {
    const frame = imageFrameRef.current;
    const image = imageRef.current;

    if (!frame || !image || isMobile || !window.matchMedia("(pointer: fine)").matches) {
      if (image) image.style.transform = "none";
      return;
    }

    let current = 0;
    let target = 0;
    let rafId = null;

    const render = () => {
      current += (target - current) * 0.14;
      image.style.transform = `translate3d(0, ${current}px, 0)`;

      if (Math.abs(target - current) > 0.1) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    };

    const schedule = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(render);
      }
    };

    const onMove = (event) => {
      const rect = frame.getBoundingClientRect();
      const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      target = Math.max(-1, Math.min(1, normalizedY)) * -10;
      schedule();
    };

    const onLeave = () => {
      target = 0;
      schedule();
    };

    frame.addEventListener("mousemove", onMove, { passive: true });
    frame.addEventListener("mouseleave", onLeave, { passive: true });

    return () => {
      frame.removeEventListener("mousemove", onMove);
      frame.removeEventListener("mouseleave", onLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
      image.style.transform = "none";
    };
  }, [isMobile, selectedImage]);

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="font-mono" style={{ color: "var(--text-muted)", letterSpacing: "0.3em" }}>
          LOADING...
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <p className="font-display" style={{ fontSize: 48 }}>NOT FOUND</p>
        <a href="/" className="font-mono" style={{ fontSize: 11, color: "var(--crimson)", letterSpacing: "0.2em" }}>
          ← BACK TO STORE
        </a>
      </div>
    );
  }

  const name = product.Name || id?.toUpperCase() || "PRODUCT";
  const price = Number(product.Price) || FIXED_PRICE;
  const originalPrice = Number(product.original_price) || 0;
  const hasDiscount = originalPrice > price;
  const productImages = getProductImages(product);
  const usableProductImages = productImages.filter((image) => !failedImages.has(image));
  const selectedImage = usableProductImages[selectedImageIndex] || usableProductImages[0];
  const isSold = Boolean(product.sold);
  const condition = product.condition ? product.condition.replace("-", " ").toUpperCase() : "";

  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi GOROSEI,\n\nI'd like to order:\n- Product: ${name}\n- Size: ${selectedSize}\n- Price: KSh ${price.toLocaleString()}${orderDraft.name ? `\n- Name: ${orderDraft.name.trim()}` : ""}${orderDraft.phone ? `\n- Phone: ${normalizePhone(orderDraft.phone)}` : ""}\n\nIs it available?`
  )}`;

  async function placeOrder() {
    if (isSold || ordering) return;
    const phone = normalizePhone(orderDraft.phone);
    if (!orderDraft.name.trim() || phone.length < 9) {
      setOrderStatus("Add your name and phone first.");
      return;
    }

    setOrdering(true);
    setOrderStatus("Saving order...");
    try {
      const { error } = await supabase.from("orders").insert({
        product_id: product.id,
        product_name: name,
        customer_name: orderDraft.name.trim(),
        phone,
        selected_size: selectedSize,
        price,
        status: "new",
        source: "product_page",
      });
      if (error) throw error;
      await trackProductEvent(product.id, "whatsapp_order", { selected_size: selectedSize, phone });
      setOrderStatus("Order saved. Opening WhatsApp...");
      window.open(buyLink, "_blank", "noopener,noreferrer");
    } catch {
      await trackProductEvent(product.id, "whatsapp_order_fallback", { selected_size: selectedSize });
      setOrderStatus("Opening WhatsApp. Run the orders SQL to save leads in admin.");
      window.open(buyLink, "_blank", "noopener,noreferrer");
    } finally {
      setOrdering(false);
    }
  }

  const imgStyle = {
    width: "100%",
    aspectRatio: "3/4",
    objectFit: "cover",
    display: "block",
    willChange: isMobile ? "auto" : "transform",
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Back link */}
      <a
        href="/"
        style={{
          position: "fixed",
          top: 16,
          left: 24,
          zIndex: 1000,
          padding: "10px 20px",
          backdropFilter: "blur(10px)",
          background: "rgba(0,0,0,0.85)",
          textDecoration: "none",
          border: "1px solid var(--surface-light)",
        }}
      >
        <span className="font-mono" style={{ letterSpacing: "0.2em", fontSize: 11 }}>← BACK</span>
      </a>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          minHeight: "100vh",
        }}
      >
        {/* Image */}
        <div ref={imageFrameRef} style={{ overflow: "hidden", background: "var(--surface)", position: "relative" }}>
          {selectedImage ? (
            <>
              <img
                ref={imageRef}
                src={getImageUrl(selectedImage, 1200, 90)}
                alt={name}
                onError={() => {
                  setFailedImages((prev) => new Set(prev).add(selectedImage));
                  setSelectedImageIndex(0);
                }}
                style={{ ...imgStyle, filter: isSold ? "grayscale(1)" : "none" }}
              />
              {isSold && (
                <div
                  className="font-display"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    fontSize: isMobile ? 52 : 96,
                    letterSpacing: "0.04em",
                    pointerEvents: "none",
                  }}
                >
                  SOLD
                </div>
              )}
              {usableProductImages.length > 1 && (
                <div
                  style={{
                    position: isMobile ? "static" : "absolute",
                    left: isMobile ? 0 : 24,
                    right: isMobile ? 0 : "auto",
                    bottom: isMobile ? "auto" : 24,
                    display: "flex",
                    gap: 10,
                    padding: isMobile ? "12px 16px" : 0,
                    overflowX: "auto",
                    maxWidth: isMobile ? "100%" : "calc(100% - 48px)",
                  }}
                >
                  {usableProductImages.map((image, index) => (
                    <button
                      key={image}
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`View product photo ${index + 1}`}
                      style={{
                        width: 58,
                        height: 76,
                        flex: "0 0 auto",
                        padding: 0,
                        border: index === selectedImageIndex ? "1px solid var(--crimson)" : "1px solid rgba(255,255,255,0.25)",
                        background: "none",
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={getImageUrl(image, 160, 70)}
                        alt=""
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: isMobile ? "1/1" : "3/4",
                background: "var(--surface-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="font-display" style={{ fontSize: 80, color: "var(--text-muted)" }}>
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div
          style={{
            padding: isMobile ? "80px 24px 60px" : "120px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {product.category && (
            <span
              className="font-mono"
              style={{ fontSize: 10, letterSpacing: "0.3em", color: isSold ? "var(--text-muted)" : "var(--crimson)", marginBottom: 16 }}
            >
              {isSold ? "• SOLD ARCHIVE" : `• ${product.category.toUpperCase()} / ONE OF ONE`}
            </span>
          )}
          <h1 className="font-display" style={{ fontSize: isMobile ? 40 : 64, lineHeight: 0.9, marginBottom: 32 }}>
            {name}
          </h1>

          {(condition || product.fit_notes) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 32,
              }}
            >
              {condition && (
                <div style={{ border: "1px solid var(--surface-light)", padding: 14 }}>
                  <p className="font-mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.16em" }}>CONDITION</p>
                  <p className="font-mono" style={{ fontSize: 11, color: "var(--text)", marginTop: 8 }}>{condition}</p>
                </div>
              )}
              {product.fit_notes && (
                <div style={{ border: "1px solid var(--surface-light)", padding: 14 }}>
                  <p className="font-mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.16em" }}>FIT</p>
                  <p className="font-mono" style={{ fontSize: 11, color: "var(--text)", marginTop: 8 }}>{product.fit_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div style={{ marginBottom: 40 }}>
            <span className="font-display" style={{ fontSize: 32, color: "var(--crimson)" }}>
              KSh {price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span
                className="font-mono"
                style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "line-through", marginLeft: 16 }}
              >
                KSh {originalPrice.toLocaleString()}
              </span>
            )}
            <p
              className="font-mono"
              style={{ fontSize: 11, color: isSold ? "var(--crimson)" : "var(--text-muted)", marginTop: 16, lineHeight: 1.7, letterSpacing: "0.08em" }}
            >
              {isSold
                ? "This piece has been sold. Use it as style reference and check the current drop."
                : "Only one piece available. If it speaks to you, move before it leaves the rack."}
            </p>
          </div>

          {/* Size selector */}
          <div style={{ marginBottom: 40 }}>
            <p className="font-mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 16 }}>
              SIZE
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  disabled={isSold}
                  className="font-mono"
                  style={{
                    width: 52,
                    height: 52,
                    border: selectedSize === s ? "1px solid var(--crimson)" : "1px solid var(--surface-light)",
                    color: selectedSize === s ? "var(--crimson)" : "var(--text-muted)",
                    background: "none",
                    fontSize: 12,
                    cursor: isSold ? "not-allowed" : "pointer",
                    opacity: isSold ? 0.45 : 1,
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!isSold && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input
                value={orderDraft.name}
                onChange={(e) => setOrderDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                style={{
                  padding: 14,
                  background: "var(--surface)",
                  border: "1px solid var(--surface-light)",
                  color: "var(--text)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <input
                value={orderDraft.phone}
                onChange={(e) => setOrderDraft((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone / WhatsApp"
                style={{
                  padding: 14,
                  background: "var(--surface)",
                  border: "1px solid var(--surface-light)",
                  color: "var(--text)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={isSold ? () => { window.location.href = "/#drop"; } : placeOrder}
            disabled={ordering}
            style={{
              display: "block",
              width: "100%",
              padding: "18px 0",
              background: isSold ? "transparent" : "var(--crimson)",
              border: isSold ? "1px solid var(--surface-light)" : "none",
              color: isSold ? "var(--text-muted)" : "#fff",
              textAlign: "center",
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.3em",
              transition: "opacity 0.2s",
              cursor: ordering ? "not-allowed" : "pointer",
              opacity: ordering ? 0.6 : 1,
            }}
          >
            {isSold ? "SOLD OUT / VIEW CURRENT DROP" : ordering ? "SAVING..." : "RESERVE / ORDER ON WHATSAPP"}
          </button>
          {orderStatus && (
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
              {orderStatus}
            </p>
          )}

          {(product.story || product.description) && (
            <p
              className="font-mono"
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 32, lineHeight: 1.8 }}
            >
              {product.story || product.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

