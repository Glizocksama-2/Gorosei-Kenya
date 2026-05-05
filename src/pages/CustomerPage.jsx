import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { FIT_CHECK_MEDIA, HERO_MEDIA, LOOKBOOK_MEDIA, PRODUCT_CATEGORIES, WHATSAPP_NUMBER } from "../config/constants.js";
import AnimatedSection from "../components/AnimatedSection.jsx";
import DesktopCursor from "../components/DesktopCursor.jsx";
import NewsletterForm from "../components/NewsletterForm.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useNavScroll, useWindowWidth } from "../hooks/index.js";
import { isNearbyHeroSlide } from "../lib/productUtils.js";
import { supabase } from "../lib/supabase.js";

const PRODUCT_CARD_COLUMNS = "id, Name, Price, original_price, category, size, sold, condition, Image_url, Image_urls";
const ACTIVE_DROP_COLUMNS = "id, active, locked, drop_date, collection_name";
const COLLECTION_COLUMNS = "id, name";

export default function CustomerPage() {
  const scrolled = useNavScroll();
  const winWidth = useWindowWidth();
  const isMobile = winWidth < 768;

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeError, setStoreError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Drop state
  const [activeDrop, setActiveDrop] = useState(null);
  const [dropLocked, setDropLocked] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedHeroMedia, setLoadedHeroMedia] = useState(() => ({ [HERO_MEDIA[0].src]: true }));

  const applyDropState = useCallback((data) => {
    if (data) {
      setActiveDrop(data);
      setDropLocked(data.locked ?? false);
      return;
    }

    setActiveDrop(null);
    setDropLocked(false);
  }, []);

  const markHeroLoaded = useCallback((src) => {
    setLoadedHeroMedia((loaded) => loaded[src] ? loaded : { ...loaded, [src]: true });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_MEDIA.length);
  }, []);

  // Auto-advance hero
  useEffect(() => {
    const activeMedia = HERO_MEDIA[currentSlide];
    const id = setTimeout(nextSlide, activeMedia.durationMs || 5000);
    return () => clearTimeout(id);
  }, [currentSlide, nextSlide]);

  // Warm the next image in the carousel without forcing every hero asset onto first paint.
  useEffect(() => {
    const nextMedia = HERO_MEDIA[(currentSlide + 1) % HERO_MEDIA.length];
    if (nextMedia.type !== "image" || loadedHeroMedia[nextMedia.src]) return;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => markHeroLoaded(nextMedia.src);
    img.src = nextMedia.src;
  }, [currentSlide, loadedHeroMedia, markHeroLoaded]);

  // ── Data fetching - memoized to avoid dep-array infinite loops ────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select(PRODUCT_CARD_COLUMNS)
        .order("sold", { ascending: true })
        .order("created_at", { ascending: false });
      setProducts(data || []);
      setStoreError("");
    } catch (err) {
      console.error("fetchProducts error:", err);
      setProducts([]);
      setStoreError("We could not load the drop. Refresh the page or check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const { data: colData } = await supabase
        .from("collections")
        .select(COLLECTION_COLUMNS)
        .order("created_at", { ascending: false });
      startTransition(() => {
        setCollections(colData || []);
      });
    } catch {
      /* silent */
    }
  }, []);

  // Countdown updater - memoized
  const updateCountdown = useCallback(() => {
    if (!activeDrop?.drop_date) return;
    const diff = new Date(activeDrop.drop_date).getTime() - Date.now();
    if (diff <= 0) {
      setDropLocked(false);
      setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
      return;
    }
    setCountdown({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      secs: Math.floor((diff % (1000 * 60)) / 1000),
    });
  }, [activeDrop]);

  // Initial data load
  useEffect(() => {
    let cancelled = false;
    let deferredCollectionsId = null;

    const loadInitialStorefront = async () => {
      setLoading(true);

      const [productsResult, dropResult] = await Promise.allSettled([
        supabase
          .from("products for Gorosei")
          .select(PRODUCT_CARD_COLUMNS)
          .order("sold", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("drops")
          .select(ACTIVE_DROP_COLUMNS)
          .eq("active", true)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (productsResult.status === "fulfilled") {
        setProducts(productsResult.value.data || []);
        setStoreError("");
      } else {
        console.error("fetchProducts error:", productsResult.reason);
        setProducts([]);
        setStoreError("We could not load the drop. Refresh the page or check your connection.");
      }

      if (dropResult.status === "fulfilled") {
        applyDropState(dropResult.value.data);
      } else {
        applyDropState(null);
      }

      setLoading(false);

      const loadCollections = () => {
        if (!cancelled) {
          fetchCollections();
        }
      };

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        deferredCollectionsId = window.requestIdleCallback(loadCollections, { timeout: 1200 });
      } else {
        deferredCollectionsId = window.setTimeout(loadCollections, 250);
      }
    };

    loadInitialStorefront();

    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && "cancelIdleCallback" in window && typeof deferredCollectionsId === "number") {
        window.cancelIdleCallback(deferredCollectionsId);
      } else if (deferredCollectionsId !== null) {
        clearTimeout(deferredCollectionsId);
      }
    };
  }, [applyDropState, fetchCollections]);

  // Countdown interval
  useEffect(() => {
    if (!activeDrop) return;
    const t = setTimeout(updateCountdown, 0);
    const id = setInterval(updateCountdown, 1000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [activeDrop, updateCountdown]);

  async function switchCollection(id) {
    setActiveCollection(id);
    setCategoryFilter("all");
    setLoading(true);
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select(PRODUCT_CARD_COLUMNS)
        .eq("collection_id", id)
        .order("sold", { ascending: true })
        .order("created_at", { ascending: false });
      setProducts(data || []);
      setStoreError("");
    } catch {
      setProducts([]);
      setStoreError("We could not load this collection. Refresh the page or check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function showAllDrops() {
    setActiveCollection(null);
    setCategoryFilter("all");
    fetchProducts();
  }

  async function submitWaitlist() {
    if (!waitlistPhone.trim()) return;
    setWaitlistLoading(true);
    try {
      const phone = waitlistPhone.replace(/[^0-9]/g, "");
      await supabase.from("waitlist").insert({ phone, drop_id: activeDrop?.id });
      setWaitlistSubmitted(true);
    } catch (err) {
      console.error("Waitlist error:", err);
    }
    setWaitlistLoading(false);
  }

  // Filtered products
  const filteredProducts = useMemo(
    () => (
      categoryFilter === "all"
        ? products
        : products.filter((p) => (p.category || "tshirts") === categoryFilter)
    ),
    [categoryFilter, products]
  );
  const latestProducts = useMemo(() => products.filter((p) => !p.sold).slice(0, 6), [products]);

  // ── Cursor ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      {!isMobile && <DesktopCursor />}

      {/* ── NAV ───────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: isMobile ? "16px 24px" : "20px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(0,0,0,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          transition: "background 0.4s, backdrop-filter 0.4s",
          borderBottom: scrolled ? "1px solid var(--surface-light)" : "none",
        }}
      >
        <a
          href="/"
          className="font-display"
          style={{ fontSize: isMobile ? 22 : 28, textDecoration: "none", letterSpacing: "0.05em" }}
        >
          GOROSEI
        </a>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {[["#drop", "SHOP ALL"], ["#fit-check", "FIT CHECK"], ["#lookbook", "ORIGINALS"], ["#thrift", "THRIFT"], ["#about", "ABOUT"]].map(
              ([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="font-mono"
                  style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--text-muted)", textDecoration: "none" }}
                >
                  {label}
                </a>
              )
            )}
            <a
              href="/admin"
              className="font-mono"
              aria-label="Open admin dashboard"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--text)",
                textDecoration: "none",
                border: "1px solid var(--crimson)",
                padding: "9px 12px",
                lineHeight: 1,
              }}
            >
              ADMIN
            </a>
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            aria-label="Menu"
          >
            <div style={{ width: 24, height: 1, background: "var(--text)", marginBottom: 6 }} />
            <div style={{ width: 16, height: 1, background: "var(--text)" }} />
          </button>
        )}
      </nav>

      {/* Mobile menu overlay */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.97)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "var(--text)", fontSize: 24, cursor: "pointer" }}
          >
            X
          </button>
          {[["#drop", "SHOP ALL"], ["#fit-check", "FIT CHECK"], ["#drop", "JACKETS"], ["#drop", "TEES"], ["#lookbook", "ORIGINALS"], ["#about", "ABOUT"]].map(
            ([href, label]) => (
              <a
                key={`${href}-${label}`}
                href={href}
                onClick={() => {
                  if (label === "JACKETS") setCategoryFilter("jackets");
                  if (label === "TEES") setCategoryFilter("tshirts");
                  setMenuOpen(false);
                }}
                className="font-display"
                style={{ fontSize: 36, textDecoration: "none", letterSpacing: "0.05em" }}
              >
                {label}
              </a>
            )
          )}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi GOROSEI, I want to order from the current drop.")}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textDecoration: "none",
              color: "#fff",
              background: "var(--crimson)",
              padding: "14px 18px",
            }}
          >
            ORDER ON WHATSAPP
          </a>
          <a
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="font-mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.25em",
              textDecoration: "none",
              color: "var(--text)",
              border: "1px solid var(--crimson)",
              padding: "14px 18px",
            }}
          >
            ADMIN
          </a>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      {isMobile && !menuOpen && (
        <a
          href="#drop"
          className="font-mono"
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 14,
            zIndex: 950,
            display: scrolled ? "block" : "none",
            padding: "13px 18px",
            background: "var(--crimson)",
            color: "#fff",
            textAlign: "center",
            fontSize: 11,
            letterSpacing: "0.2em",
            boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
          }}
        >
          SHOP CURRENT DROP
        </a>
      )}

      <section
        style={{ position: "relative", height: "100svh", overflow: "hidden", display: "flex", alignItems: "flex-end" }}
      >
        {/* Slide background */}
        {HERO_MEDIA.map((m, i) => {
          if (!isNearbyHeroSlide(i, currentSlide)) return null;

          const isActive = i === currentSlide;
          const isLoaded = loadedHeroMedia[m.src];

          return (
            <div
              key={m.src}
              style={{
                position: "absolute",
                inset: 0,
                opacity: isActive ? 1 : 0,
                transform: isActive ? "scale(1)" : "scale(1.02)",
                transition: "opacity 900ms ease, transform 6500ms ease",
                willChange: isActive ? "opacity, transform" : "auto",
                background: "#060606",
                backgroundImage: m.poster ? `url(${m.poster})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {m.type === "video" ? (
                <video
                  src={m.src}
                  poster={m.poster}
                  autoPlay={isActive}
                  muted
                  loop
                  playsInline
                  preload={isActive ? "auto" : "metadata"}
                  onCanPlay={() => markHeroLoaded(m.src)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: isLoaded || isActive ? 1 : 0,
                    transition: "opacity 500ms ease",
                  }}
                />
              ) : (
                <img
                  src={m.src}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "low"}
                  decoding="async"
                  onLoad={() => markHeroLoaded(m.src)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: isLoaded ? 1 : 0,
                    transition: "opacity 500ms ease",
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "0 24px 48px" : "0 48px 80px",
            width: "100%",
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: "0.4em", color: "var(--crimson)", marginBottom: 16 }}
          >
            LUCK SUMMER / 2026
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: isMobile ? "clamp(56px, 16vw, 80px)" : "clamp(80px, 12vw, 160px)",
              lineHeight: 0.88,
              marginBottom: 24,
            }}
          >
            THRIFT OR GET
            <br />
            AN ORIGINAL PIECE.
          </h1>
          <p
            className="font-mono"
            style={{
              fontSize: isMobile ? 11 : 13,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.8,
              maxWidth: 520,
              marginBottom: 32,
            }}
          >
            Sometimes all you have to do is put that sh!t on and go on about your day.
            One-off thrift jackets, graphic tees, and original Gorosei pieces from Nairobi.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="#drop"
              className="font-mono"
              style={{
                display: "inline-block",
                padding: "15px 28px",
                border: "1px solid var(--crimson)",
                background: "var(--crimson)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 11,
                letterSpacing: "0.24em",
              }}
            >
              SHOP THE DROP
            </a>
            <a
              href="#drop"
              onClick={() => setCategoryFilter("jackets")}
              className="font-mono"
              style={{
                display: "inline-block",
                padding: "15px 22px",
                border: "1px solid rgba(255,255,255,0.35)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 11,
                letterSpacing: "0.2em",
                background: "rgba(0,0,0,0.42)",
              }}
            >
              VIEW JACKETS
            </a>
          </div>
        </div>

        {/* Slide indicators */}
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? 24 : 40,
            right: isMobile ? 24 : 48,
            display: "flex",
            gap: 8,
          }}
        >
          {HERO_MEDIA.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Show hero slide ${i + 1}`}
              style={{
                width: i === currentSlide ? 24 : 8,
                height: 2,
                background: i === currentSlide ? "var(--crimson)" : "rgba(255,255,255,0.3)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s, background 0.3s",
              }}
            />
          ))}
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--crimson)",
          padding: "12px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div
          className="font-mono"
          style={{
            display: "inline-block",
            animation: "marquee 20s linear infinite",
            fontSize: 10,
            letterSpacing: "0.3em",
          }}
        >
          {Array(6).fill("GOROSEI KENYA • FROM THE STREETS OF NAIROBI • SIMPLY PUT THAT SHIT ON • LUCK SUMMER 2026 •").join("  ")}
        </div>
      </div>

      {/* ── DROP / PRODUCTS ───────────────────────────────────────────── */}
      <section
        aria-label="Store trust points"
        style={{
          borderBottom: "1px solid var(--surface-light)",
          background: "#090909",
          padding: isMobile ? "18px 24px" : "20px 48px",
        }}
      >
        <div
          className="font-mono"
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
            gap: isMobile ? 10 : 16,
            fontSize: isMobile ? 9 : 10,
            letterSpacing: "0.14em",
            color: "var(--text-muted)",
          }}
        >
          {["Nairobi based", "WhatsApp ordering", "One-of-one pieces", "Delivery available"].map((item) => (
            <span key={item} style={{ borderLeft: "1px solid var(--crimson)", paddingLeft: 10 }}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: isMobile ? "52px 24px 24px" : "72px 48px 32px",
          borderBottom: "1px solid var(--surface-light)",
        }}
      >
        <AnimatedSection>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                  - LATEST DROP
                </span>
                <h2
                  className="font-display"
                  style={{
                    fontSize: isMobile ? "clamp(36px, 12vw, 58px)" : "clamp(48px, 7vw, 82px)",
                    marginTop: 14,
                    lineHeight: 0.9,
                  }}
                >
                  NEW ON THE RACK
                </h2>
              </div>
              <a
                href="#drop"
                className="font-mono"
                style={{
                  color: "var(--crimson)",
                  border: "1px solid var(--crimson)",
                  padding: "12px 16px",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                }}
              >
                VIEW ALL
              </a>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: isMobile ? 16 : 22,
                marginTop: 32,
              }}
            >
              {loading
                ? Array.from({ length: isMobile ? 2 : 3 }).map((_, i) => (
                    <div key={i} style={{ aspectRatio: "3/4", background: "var(--surface)" }} />
                  ))
                : latestProducts.length > 0
                  ? latestProducts.slice(0, isMobile ? 3 : 6).map((p, i) => <ProductCard key={p.id || i} product={p} priority={i < (isMobile ? 2 : 3)} />)
                  : (
                      <div style={{ gridColumn: "1/-1", border: "1px solid var(--surface-light)", padding: 24 }}>
                        <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>
                          {storeError || "No available pieces in the latest drop yet."}
                        </p>
                        <button
                          onClick={showAllDrops}
                          className="font-mono"
                          style={{ marginTop: 14, color: "var(--crimson)", fontSize: 10, letterSpacing: "0.18em" }}
                        >
                          REFRESH DROP
                        </button>
                      </div>
                    )}
            </div>
          </div>
        </AnimatedSection>
      </section>

      <section
        id="fit-check"
        className="section"
        style={{
          padding: isMobile ? "64px 0" : "84px 48px",
          borderBottom: "1px solid var(--surface-light)",
          contentVisibility: "auto",
          containIntrinsicSize: "900px",
        }}
      >
        <AnimatedSection>
          <div style={{ maxWidth: 1300, margin: "0 auto", padding: isMobile ? "0 0 0 24px" : 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.82fr 1.18fr", gap: isMobile ? 32 : 56, alignItems: "end" }}>
              <div style={{ paddingRight: isMobile ? 24 : 0 }}>
                <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                  - FIT CHECK
                </span>
                <h2
                  className="font-display"
                  style={{
                    fontSize: isMobile ? "clamp(44px, 13vw, 72px)" : "clamp(64px, 9vw, 116px)",
                    marginTop: 18,
                    lineHeight: 0.86,
                  }}
                >
                  SEEN ON BODY
                </h2>
                <p
                  className="font-mono"
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 12,
                    lineHeight: 1.9,
                    marginTop: 24,
                    maxWidth: 440,
                    textTransform: "none",
                  }}
                >
                  Real pieces, real proportions. A quick look at how Gorosei sits when it leaves the hanger.
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridAutoFlow: isMobile ? "column" : "row",
                  gridAutoColumns: isMobile ? "72%" : "auto",
                  gridTemplateColumns: isMobile ? "none" : "repeat(4, minmax(0, 1fr))",
                  gap: isMobile ? 10 : 12,
                  alignItems: "end",
                  overflowX: isMobile ? "auto" : "visible",
                  paddingRight: isMobile ? 24 : 0,
                  scrollSnapType: isMobile ? "x mandatory" : "none",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                }}
              >
                {FIT_CHECK_MEDIA.map((item, index) => (
                  <figure
                    key={item.src}
                    style={{
                      margin: 0,
                      border: "1px solid var(--surface-light)",
                      background: "var(--surface)",
                      overflow: "hidden",
                      scrollSnapAlign: isMobile ? "start" : "none",
                    }}
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      loading="lazy"
                      fetchPriority="auto"
                      decoding="async"
                      style={{
                        width: "100%",
                        aspectRatio: "3 / 4",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                      }}
                    />
                    <figcaption
                      className="font-mono"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: isMobile ? "10px 11px" : "12px 14px",
                        color: "var(--text-muted)",
                        fontSize: 8,
                        letterSpacing: "0.14em",
                        borderTop: "1px solid var(--surface-light)",
                      }}
                    >
                      <span>FIT {String(index + 1).padStart(2, "0")}</span>
                      <span>NAIROBI</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <section id="drop" className="section" style={{ padding: isMobile ? "56px 0 40px" : "84px 0 60px" }}>
        <AnimatedSection>
          {dropLocked ? (
            /* LOCKED VIEW - countdown + waitlist */
            <div style={{ padding: isMobile ? "0 24px" : "0 48px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                • COMING SOON
              </span>
              <h2
                className="font-display"
                style={{ fontSize: isMobile ? 48 : 80, marginTop: 16, lineHeight: 0.9 }}
              >
                {activeDrop?.collection_name?.toUpperCase() || "THE DROP"}
              </h2>
              {/* Countdown */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: isMobile ? 16 : 32,
                  marginTop: 48,
                  flexWrap: "wrap",
                }}
              >
                {[["DAYS", countdown.days], ["HRS", countdown.hours], ["MIN", countdown.mins], ["SEC", countdown.secs]].map(
                  ([label, val]) => (
                    <div key={label} style={{ textAlign: "center", minWidth: 64 }}>
                      <div className="font-display" style={{ fontSize: isMobile ? 48 : 72 }}>
                        {String(val).padStart(2, "0")}
                      </div>
                      <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--text-muted)" }}>
                        {label}
                      </div>
                    </div>
                  )
                )}
              </div>
              {/* Waitlist */}
              {waitlistSubmitted ? (
                <p className="font-mono" style={{ fontSize: 12, color: "var(--crimson)", marginTop: 40 }}>
                  YOU'RE ON THE LIST. WE'LL NOTIFY YOU.
                </p>
              ) : (
                <div style={{ marginTop: 40 }}>
                  <input
                    type="tel"
                    value={waitlistPhone}
                    onChange={(e) => setWaitlistPhone(e.target.value)}
                    placeholder="Phone number (07xx...)"
                    style={{
                      width: "100%",
                      padding: 16,
                      background: "var(--surface)",
                      border: "1px solid var(--surface-light)",
                      color: "var(--text)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      marginBottom: 12,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={submitWaitlist}
                    disabled={waitlistLoading || !waitlistPhone.trim()}
                    style={{
                      width: "100%",
                      padding: 16,
                      background: waitlistLoading ? "var(--surface-light)" : "var(--crimson)",
                      border: "none",
                      color: "var(--text)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      letterSpacing: "0.2em",
                      cursor: waitlistLoading ? "not-allowed" : "pointer",
                      opacity: waitlistLoading ? 0.5 : 1,
                    }}
                  >
                    {waitlistLoading ? "JOINING..." : "JOIN WAITLIST"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* UNLOCKED VIEW - collection + category filters + product grid */
            <>
              <div style={{ padding: isMobile ? "0 24px" : "0 48px", maxWidth: 1400, margin: "0 auto" }}>
                {/* Collection tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: isMobile ? 16 : 24,
                    marginBottom: 16,
                    flexWrap: "wrap",
                    alignItems: "center",
                    borderBottom: "1px solid var(--surface-light)",
                    paddingBottom: 16,
                  }}
                >
                  <button
                    onClick={showAllDrops}
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      color: activeCollection === null ? "var(--crimson)" : "var(--text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      paddingBottom: 4,
                      borderBottom: activeCollection === null ? "1px solid var(--crimson)" : "1px solid transparent",
                    }}
                  >
                    ALL DROPS
                  </button>
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => switchCollection(c.id)}
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        color: activeCollection === c.id ? "var(--crimson)" : "var(--text-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        paddingBottom: 4,
                        borderBottom: activeCollection === c.id ? "1px solid var(--crimson)" : "1px solid transparent",
                      }}
                    >
                      {c.name?.toUpperCase() || "COLLECTION"}
                    </button>
                  ))}
                </div>

                {/* Category chips */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                  {["all", ...PRODUCT_CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: categoryFilter === cat ? "#fff" : "var(--text-muted)",
                        background: categoryFilter === cat ? "var(--crimson)" : "transparent",
                        border: "1px solid var(--surface-light)",
                        padding: "8px 14px",
                        cursor: "pointer",
                        transition: "background 0.2s, color 0.2s",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <h2
                  className="font-display"
                  style={{
                    fontSize: isMobile ? "clamp(36px, 12vw, 64px)" : "clamp(48px, 8vw, 96px)",
                    marginBottom: 40,
                  }}
                >
                  {activeCollection === null
                    ? "ALL DROPS"
                    : collections.find((c) => c.id === activeCollection)?.name?.toUpperCase() || "THE DROP"}
                </h2>
              </div>

              {/* Product grid */}
              <div
                className="grid-3"
                style={{
                  maxWidth: 1400,
                  margin: "0 auto",
                  padding: isMobile ? "0 24px" : "0 48px",
                }}
              >
                {loading ? (
                  /* Loading skeleton */
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "3/4",
                        background: "var(--surface)",
                        animation: "pulse 1.5s ease-in-out infinite",
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))
                ) : storeError ? (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: isMobile ? "56px 0" : "80px 0" }}>
                    <p className="font-display" style={{ fontSize: isMobile ? 32 : 48 }}>
                      DROP DIDN'T LOAD
                    </p>
                    <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", margin: "16px auto 0", maxWidth: 420, lineHeight: 1.8 }}>
                      {storeError}
                    </p>
                    <button
                      onClick={showAllDrops}
                      className="font-mono"
                      style={{
                        marginTop: 24,
                        padding: "12px 18px",
                        border: "1px solid var(--crimson)",
                        color: "var(--crimson)",
                        background: "none",
                        fontSize: 11,
                        letterSpacing: "0.18em",
                      }}
                    >
                      RETRY
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 0" }}>
                    <p className="font-display" style={{ fontSize: isMobile ? 32 : 48 }}>
                      {categoryFilter !== "all" ? `NO ${categoryFilter.toUpperCase()} YET` : "NO DROPS YET"}
                    </p>
                    <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
                      {categoryFilter !== "all" ? (
                        <button
                          onClick={() => setCategoryFilter("all")}
                          style={{ background: "none", border: "none", color: "var(--crimson)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12 }}
                        >
                          View all categories
                        </button>
                      ) : (
                        "Check back soon."
                      )}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((p, i) => <ProductCard key={p.id || i} product={p} priority={i < (isMobile ? 2 : 3)} />)
                )}
              </div>
            </>
          )}
        </AnimatedSection>
      </section>

      {/* ── THRIFT ────────────────────────────────────────────────────── */}
      <section id="thrift" className="section" style={{ padding: isMobile ? "64px 24px" : "104px 48px" }}>
        <AnimatedSection>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              • THRIFT PIECES
            </span>
            <h2
              className="font-display"
              style={{
                fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(48px, 8vw, 96px)",
                marginTop: 24,
                lineHeight: 0.9,
              }}
            >
              CURATED<br />MTUMBA ESSENTIALS
            </h2>
            <p className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 24, lineHeight: 1.8 }}>
              Gothic vintage, anime energy, skull pieces, and graphic tees with actual life in them.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi GOROSEI, I'm interested in thrift pieces. What do you have available?")}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono"
              style={{
                display: "inline-block",
                marginTop: 32,
                padding: "14px 32px",
                border: "1px solid var(--crimson)",
                color: "var(--crimson)",
                textDecoration: "none",
                fontSize: 11,
                letterSpacing: "0.2em",
              }}
            >
              BROWSE VIA WHATSAPP
            </a>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
                gap: isMobile ? 8 : 14,
                marginTop: isMobile ? 44 : 56,
              }}
            >
              {LOOKBOOK_MEDIA.slice(0, 4).map((item, index) => (
                <img
                  key={item.src}
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    aspectRatio: index % 2 === 0 ? "3 / 4" : "4 / 5",
                    objectFit: "cover",
                    display: "block",
                    border: "1px solid var(--surface-light)",
                    background: "var(--surface)",
                  }}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── NAIROBI STATEMENT ─────────────────────────────────────────── */}
      <section className="section" style={{ padding: isMobile ? "64px 24px" : "80px 48px", textAlign: "center" }}>
        <AnimatedSection>
          <h2
            className="font-display"
            style={{
              fontSize: isMobile ? "clamp(48px, 14vw, 80px)" : "clamp(64px, 12vw, 160px)",
              lineHeight: 0.9,
            }}
          >
            A BREATH<br />OF LIFE.
          </h2>
          <div style={{ width: 120, height: 1, background: "var(--crimson)", margin: "48px auto" }} />
          <p
            className="font-mono"
            style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto", lineHeight: 1.8 }}
          >
            From the streets of Nairobi. For anyone tired of gloomy, average pieces.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
              gap: isMobile ? 10 : 16,
              maxWidth: 1120,
              margin: isMobile ? "44px auto 0" : "56px auto 0",
              textAlign: "left",
            }}
          >
            {[LOOKBOOK_MEDIA[4], LOOKBOOK_MEDIA[5]].map((item, index) => (
              <img
                key={item.src}
                src={item.src}
                alt={item.title}
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  aspectRatio: isMobile ? "4 / 3" : index === 0 ? "16 / 10" : "4 / 5",
                  objectFit: "cover",
                  display: "block",
                  border: "1px solid var(--surface-light)",
                  background: "var(--surface)",
                }}
              />
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── LOOKBOOK ──────────────────────────────────────────────────── */}
      <section id="lookbook" className="section" style={{ padding: isMobile ? "64px 24px" : "104px 48px" }}>
        <AnimatedSection>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              • GOROSEI ORIGINALS
            </span>
            <h2
              className="font-display"
              style={{
                fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(48px, 8vw, 96px)",
                marginTop: 24,
              }}
            >
              ORIGINAL GRAPHICS<br />FOR THE STREETS
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))",
                gap: isMobile ? 8 : 12,
                marginTop: isMobile ? 36 : 48,
              }}
            >
              {LOOKBOOK_MEDIA.map((item, index) => (
                <img
                  key={item.src}
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    aspectRatio: index % 3 === 0 ? "3 / 4" : "1 / 1",
                    objectFit: "cover",
                    display: "block",
                    border: "1px solid var(--surface-light)",
                    background: "var(--surface)",
                  }}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────── */}
      <section id="about" className="section" style={{ padding: isMobile ? "64px 24px 88px" : "104px 48px" }}>
        <AnimatedSection>
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.95fr) minmax(360px, 1.05fr)",
              gap: isMobile ? 40 : 72,
              alignItems: "center",
            }}
          >
            <figure
              style={{
                margin: 0,
                border: "1px solid var(--surface-light)",
                background: "var(--surface)",
                overflow: "hidden",
                order: isMobile ? 2 : 1,
              }}
            >
              <img
                src="/founder.webp"
                alt="Brian Mukwe, founder and creative director of Gorosei Kenya"
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  aspectRatio: "1672 / 941",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <figcaption
                className="font-mono"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: isMobile ? "12px 14px" : "14px 18px",
                  fontSize: 9,
                  color: "var(--text-muted)",
                  letterSpacing: "0.16em",
                  borderTop: "1px solid var(--surface-light)",
                }}
              >
                <span>FOUNDER / VISIONARY</span>
                <span>NAIROBI</span>
              </figcaption>
            </figure>
            <div style={{ order: isMobile ? 1 : 2 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              • FOUNDER NOTE
            </span>
            <h2
              className="font-display"
              style={{
                fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(42px, 5vw, 64px)",
                marginTop: 24,
                lineHeight: 0.9,
                maxWidth: "100%",
              }}
            >
              BRIAN MUKWE
            </h2>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--crimson)", marginTop: 14, letterSpacing: "0.18em" }}>
              GLIZOCK / GLOCK
            </p>
            <p
              className="font-mono"
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 32, lineHeight: 2, maxWidth: 620, textTransform: "none" }}
            >
              I make music and stream games, with a real passion for gothic vintage pieces and anime.
              Gorosei is where I bring you my vision: more graphic content on the streets of Nairobi.
            </p>
            <p
              className="font-mono"
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 20, lineHeight: 2, maxWidth: 620, textTransform: "none" }}
            >
              When I was a kid, I used to get hand-me-downs from my cool-ass cousin. He printed his own
              T-shirts and gave them life, mostly skull pieces. He still does. That spirit is the root.
            </p>
              <p
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: "var(--text)",
                  marginTop: 28,
                  lineHeight: 1.9,
                  maxWidth: 520,
                  overflowWrap: "anywhere",
                }}
              >
              Nairobi, Luck Summer. 2026. Mission: simply put that shit on.
            </p>
            <NewsletterForm />
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer
        style={{
          padding: isMobile ? "60px 24px 40px" : "80px 48px 48px",
          borderTop: "1px solid var(--surface-light)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 32,
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          <div>
            <span className="font-display" style={{ fontSize: 28 }}>GOROSEI</span>
            <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
              NAIROBI, LUCK SUMMER
            </p>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <a
              href="https://instagram.com/goroseikenya"
              target="_blank"
              rel="noreferrer"
              className="font-mono"
              style={{ fontSize: 10, color: "var(--text-muted)", textDecoration: "none" }}
            >
              INSTAGRAM
            </a>
            <a
              href="https://tiktok.com/@goroseikenya"
              target="_blank"
              rel="noreferrer"
              className="font-mono"
              style={{ fontSize: 10, color: "var(--text-muted)", textDecoration: "none" }}
            >
              TIKTOK
            </a>
            <a
              href="https://wa.me/254734944512"
              target="_blank"
              rel="noreferrer"
              className="font-mono"
              style={{ fontSize: 10, color: "var(--text-muted)", textDecoration: "none" }}
            >
              WHATSAPP
            </a>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 48,
            paddingTop: 32,
            borderTop: "1px solid var(--surface-light)",
            maxWidth: 1400,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <span className="font-mono" style={{ fontSize: 10, color: "#333" }}>
            (c) 2026 GOROSEI - ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>
    </div>
  );
}

