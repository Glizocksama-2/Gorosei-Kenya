import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 2000;
const BUCKET_NAME = "products-images";
const PRODUCT_CATEGORIES = ["tshirts", "jackets", "pants", "accessories", "shoes", "socks"];
const DISCORD_WEBHOOK = import.meta?.env?.VITE_DISCORD_WEBHOOK || "";

// Guard: prevent crashing when env vars are missing at build time
const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_KEY || "placeholder-anon-key"
);

// ─── HELPERS ───────────────────────────────────────────────────────────────
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

function lerp(a, b, f) {
  return a + (b - a) * f;
}

// ─── HOOKS ─────────────────────────────────────────────────────────────────

// Single global mouse tracker — avoids 4+ separate rAF loops
function useGlobalMouse() {
  const raw = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const norm = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0, nx: 0, ny: 0 });

  useEffect(() => {
    const onMove = (e) => {
      raw.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const loop = () => {
      smooth.current.x = lerp(smooth.current.x, raw.current.x, 0.08);
      smooth.current.y = lerp(smooth.current.y, raw.current.y, 0.08);
      norm.current.x = (smooth.current.x / window.innerWidth) * 2 - 1;
      norm.current.y = (smooth.current.y / window.innerHeight) * 2 - 1;
      setPos({
        x: smooth.current.x,
        y: smooth.current.y,
        nx: norm.current.x,
        ny: norm.current.y,
      });
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return pos;
}

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

// ─── ANIMATED SECTION ──────────────────────────────────────────────────────
function AnimatedSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── NEWSLETTER FORM ───────────────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) { setStatus("Enter a valid email."); return; }
    setStatus("...");
    try {
      const { error } = await supabase
        .from("newsletter")
        .insert({ email: email.trim(), created_at: new Date().toISOString() });

      if (error) { setStatus("Error. Try again."); return; }

      if (DISCORD_WEBHOOK) {
        try {
          await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content:
                "🆕 **NEW BROTHERHOOD MEMBER**\n\n📧: " +
                email.trim() +
                "\n⏰: " +
                new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" }),
            }),
          });
        } catch {
          // Webhook failure is non-fatal — signup still succeeds
        }
      }

      setSubmitted(true);
      setStatus("You're in!");
    } catch {
      setStatus("Error. Try again.");
    }
  }

  if (submitted) {
    return (
      <div style={{ marginTop: 48, padding: 32, border: "1px solid var(--crimson)", display: "inline-block" }}>
        <p className="font-display" style={{ fontSize: 24 }}>WELCOME TO THE BROTHERHOOD</p>
        <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          We'll reach you via email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 48 }}>
      <div style={{ display: "flex", gap: 0, maxWidth: 480, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          style={{
            flex: "1 1 260px",
            padding: "16px 20px",
            background: "var(--surface)",
            border: "1px solid var(--surface-light)",
            borderRight: "none",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "16px 24px",
            background: "var(--crimson)",
            border: "none",
            color: "#fff",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.2em",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          JOIN
        </button>
      </div>
      {status && (
        <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
          {status}
        </p>
      )}
    </form>
  );
}

// ─── PRODUCT CARD ──────────────────────────────────────────────────────────
function ProductCard({ product }) {
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
      }}
    >
      <div className="image-wrapper" style={{ "--lx": `${light.x}%`, "--ly": `${light.y}%` }}>
        {product?.Image_url ? (
          <img
            src={getImageUrl(product.Image_url, 600, 75)}
            alt={name}
            loading="lazy"
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
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
          ORDER NOW →
        </span>
      </div>
    </a>
  );
}

// ─── CUSTOMER PAGE ─────────────────────────────────────────────────────────
function CustomerPage() {
  const mouse = useGlobalMouse();
  const scrolled = useNavScroll();
  const winWidth = useWindowWidth();
  const isMobile = winWidth < 768;

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Drop state
  const [activeDrop, setActiveDrop] = useState(null);
  const [dropLocked, setDropLocked] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Hero carousel
  const heroMedia = [
    { src: "/hero1.png", type: "image" },
    { src: "/hero-video1.mp4", type: "video" },
    { src: "/hero2.png", type: "image" },
    { src: "/hero3.png", type: "image" },
    { src: "/hero4.png", type: "image" },
    { src: "/hero5.png", type: "image" },
    { src: "/hero6.png", type: "image" },
    { src: "/hero7.png", type: "image" },
    { src: "/hero8.png", type: "image" },
    { src: "/hero9.png", type: "image" },
    { src: "/hero10.png", type: "image" },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % heroMedia.length);
      setIsTransitioning(false);
    }, 400);
  }, [isTransitioning, heroMedia.length]);

  // Auto-advance hero
  useEffect(() => {
    const id = setInterval(nextSlide, 5000);
    return () => clearInterval(id);
  }, [nextSlide]);

  // ── Data fetching — memoized to avoid dep-array infinite loops ────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("sold", false)
        .order("created_at", { ascending: false });
      setProducts(data || []);
    } catch (err) {
      console.error("fetchProducts error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveDrop = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("drops")
        .select("*")
        .eq("active", true)
        .single();
      if (data) {
        setActiveDrop(data);
        setDropLocked(data.locked ?? false);
      } else {
        setActiveDrop(null);
        setDropLocked(false);
      }
    } catch {
      // No active drop — normal state
      setActiveDrop(null);
      setDropLocked(false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const { data: colData } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });
      if (colData?.length) setCollections(colData);
    } catch {
      /* silent */
    }
  }, []);

  // Countdown updater — memoized
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

  // Initial data load — deferred to avoid blocking first paint
  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts();
      fetchActiveDrop();
      fetchCollections();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchProducts, fetchActiveDrop, fetchCollections]);

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
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("collection_id", id)
        .eq("sold", false)
        .order("created_at", { ascending: false });
      setProducts(data || []);
    } catch { /* silent */ }
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
  const filteredProducts =
    categoryFilter === "all"
      ? products
      : products.filter((p) => (p.category || "tshirts") === categoryFilter);

  // ── Cursor ─────────────────────────────────────────────────────────────────
  const cursorStyle = {
    position: "fixed",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--crimson)",
    left: mouse.x - 4,
    top: mouse.y - 4,
    pointerEvents: "none",
    zIndex: 9999,
    transition: "opacity 0.3s",
    opacity: mouse.x === 0 && mouse.y === 0 ? 0 : 1,
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      {/* Custom cursor — desktop only */}
      {!isMobile && <div style={cursorStyle} />}

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
          <div style={{ display: "flex", gap: 40 }}>
            {[["#drop", "THE DROP"], ["#lookbook", "LOOKBOOK"], ["#thrift", "THRIFT"], ["#about", "ABOUT"]].map(
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
            ✕
          </button>
          {[["#drop", "THE DROP"], ["#lookbook", "LOOKBOOK"], ["#thrift", "THRIFT"], ["#about", "ABOUT"]].map(
            ([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="font-display"
                style={{ fontSize: 40, textDecoration: "none", letterSpacing: "0.05em" }}
              >
                {label}
              </a>
            )
          )}
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        style={{ position: "relative", height: "100svh", overflow: "hidden", display: "flex", alignItems: "flex-end" }}
      >
        {/* Slide background */}
        {heroMedia.map((m, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === currentSlide ? (isTransitioning ? 0 : 1) : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            {m.type === "video" ? (
              <video
                src={m.src}
                autoPlay
                muted
                loop
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <img
                src={m.src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
        ))}

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
            NAIROBI STREETWEAR
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: isMobile ? "clamp(56px, 16vw, 80px)" : "clamp(80px, 12vw, 160px)",
              lineHeight: 0.88,
              marginBottom: 32,
            }}
          >
            BUILT
            <br />
            DIFFERENT.
          </h1>
          <a
            href="#drop"
            className="font-mono"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              border: "1px solid var(--crimson)",
              color: "var(--crimson)",
              textDecoration: "none",
              fontSize: 11,
              letterSpacing: "0.3em",
            }}
          >
            SHOP THE DROP
          </a>
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
          {heroMedia.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
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
          {Array(6).fill("GOROSEI KENYA • NAIROBI STREETWEAR • THE DROP IS LIVE • MTUMBA CURATED •").join("  ")}
        </div>
      </div>

      {/* ── DROP / PRODUCTS ───────────────────────────────────────────── */}
      <section id="drop" className="section" style={{ padding: isMobile ? "80px 0 40px" : "120px 0 60px" }}>
        <AnimatedSection>
          {dropLocked ? (
            /* LOCKED VIEW — countdown + waitlist */
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
            /* UNLOCKED VIEW — collection + category filters + product grid */
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
                          View all categories →
                        </button>
                      ) : (
                        "Check back soon."
                      )}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((p, i) => <ProductCard key={p.id || i} product={p} />)
                )}
              </div>
            </>
          )}
        </AnimatedSection>
      </section>

      {/* ── THRIFT ────────────────────────────────────────────────────── */}
      <section id="thrift" className="section" style={{ padding: isMobile ? "80px 24px" : "120px 48px" }}>
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
              Browse thrift categories from tees to shoes. Updated weekly.
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
              BROWSE VIA WHATSAPP →
            </a>
          </div>
        </AnimatedSection>
      </section>

      {/* ── NAIROBI STATEMENT ─────────────────────────────────────────── */}
      <section className="section" style={{ padding: isMobile ? "80px 24px" : "80px 48px", textAlign: "center" }}>
        <AnimatedSection>
          <h2
            className="font-display"
            style={{
              fontSize: isMobile ? "clamp(48px, 14vw, 80px)" : "clamp(64px, 12vw, 160px)",
              lineHeight: 0.9,
            }}
          >
            GOROSEI<br />FROM NAIROBI.
          </h2>
          <div style={{ width: 120, height: 1, background: "var(--crimson)", margin: "48px auto" }} />
          <p
            className="font-mono"
            style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto", lineHeight: 1.8 }}
          >
            From the streets of Nairobi.<br />Dressed in your real self.
          </p>
        </AnimatedSection>
      </section>

      {/* ── LOOKBOOK ──────────────────────────────────────────────────── */}
      <section id="lookbook" className="section" style={{ padding: isMobile ? "80px 24px" : "120px 48px" }}>
        <AnimatedSection>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              • LOOKBOOK
            </span>
            <h2
              className="font-display"
              style={{
                fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(48px, 8vw, 96px)",
                marginTop: 24,
              }}
            >
              THE AESTHETIC
            </h2>
          </div>
        </AnimatedSection>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────── */}
      <section id="about" className="section" style={{ padding: isMobile ? "80px 24px" : "120px 48px" }}>
        <AnimatedSection>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              • THE BROTHERHOOD
            </span>
            <h2
              className="font-display"
              style={{
                fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(48px, 8vw, 96px)",
                marginTop: 24,
                lineHeight: 0.9,
              }}
            >
              WHO WE ARE
            </h2>
            <p
              className="font-mono"
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 32, lineHeight: 2, maxWidth: 560 }}
            >
              Gorosei is Nairobi's premium streetwear collective. We curate the finest
              pieces — original drops and hand-picked thrift — for those who dress with intention.
            </p>
            <NewsletterForm />
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
              NAIROBI, KENYA
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
            © 2026 GOROSEI — ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── PRODUCT PAGE ──────────────────────────────────────────────────────────
function ProductPage({ id }) {
  const mouse = useGlobalMouse();
  const winWidth = useWindowWidth();
  const isMobile = winWidth < 768;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const sizes = ["S", "M", "L", "XL"];

  const fetchProduct = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("id", id)
        .single();
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

  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi GOROSEI,\n\nI'd like to order:\n- Product: ${name}\n- Size: ${selectedSize}\n- Price: KSh ${price.toLocaleString()}\n\nIs it available?`
  )}`;

  // Subtle parallax on desktop
  const imgStyle = {
    width: "100%",
    aspectRatio: "3/4",
    objectFit: "cover",
    display: "block",
    transform: !isMobile ? `translateY(${mouse.ny * -10}px)` : "none",
    transition: "transform 0.1s linear",
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
        <div style={{ overflow: "hidden", background: "var(--surface)" }}>
          {product.Image_url ? (
            <img src={getImageUrl(product.Image_url, 1200, 90)} alt={name} style={imgStyle} />
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
              style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)", marginBottom: 16 }}
            >
              • {product.category.toUpperCase()}
            </span>
          )}
          <h1 className="font-display" style={{ fontSize: isMobile ? 40 : 64, lineHeight: 0.9, marginBottom: 32 }}>
            {name}
          </h1>

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
                  className="font-mono"
                  style={{
                    width: 52,
                    height: 52,
                    border: selectedSize === s ? "1px solid var(--crimson)" : "1px solid var(--surface-light)",
                    color: selectedSize === s ? "var(--crimson)" : "var(--text-muted)",
                    background: "none",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <a
            href={buyLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              padding: "18px 0",
              background: "var(--crimson)",
              color: "#fff",
              textAlign: "center",
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.3em",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            ORDER ON WHATSAPP
          </a>

          {product.description && (
            <p
              className="font-mono"
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 32, lineHeight: 1.8 }}
            >
              {product.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN LOGIN ───────────────────────────────────────────────────────────
function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); }
    else { setAuthed(true); }
    setSigningIn(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthed(false);
  }

  if (!authed) {
    return (
      <div
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <p className="font-display" style={{ fontSize: 32, marginBottom: 40 }}>ADMIN</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{
                width: "100%",
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--surface-light)",
                color: "var(--text)",
                fontSize: 14,
                marginBottom: 12,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{
                width: "100%",
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--surface-light)",
                color: "var(--text)",
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            {error && (
              <p style={{ color: "var(--crimson)", marginTop: 12, fontSize: 12 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={signingIn}
              className="font-mono"
              style={{
                width: "100%",
                marginTop: 24,
                padding: 16,
                background: "var(--crimson)",
                border: "none",
                color: "#fff",
                fontSize: 12,
                letterSpacing: "0.2em",
                cursor: signingIn ? "not-allowed" : "pointer",
              }}
            >
              {signingIn ? "..." : "ENTER"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("collections");
  const [collections, setCollections] = useState([]);
  const [collectionName, setCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "", size: "M", price: "2000", originalPrice: "", category: "tshirts", url: "",
  });
  const [editDrafts, setEditDrafts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // Drop management
  const [drops, setDrops] = useState([]);
  const [newDrop, setNewDrop] = useState({ collection_name: "", drop_date: "" });
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => { fetchCollections(); fetchDrops(); }, []);

  // ── Image upload ────────────────────────────────────────────────────────
  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
      if (error) throw error;
      setNewProduct((prev) => ({ ...prev, url: getImageUrl(data.path) }));
      setStatus("Image uploaded!");
    } catch {
      setStatus("Upload failed. Check storage bucket.");
    } finally {
      setUploading(false);
    }
  }

  // ── Collections ─────────────────────────────────────────────────────────
  async function fetchCollections() {
    const { data } = await supabase.from("collections").select("*").order("created_at", { ascending: false });
    setCollections(data || []);
  }

  async function createCollection() {
    if (!collectionName.trim()) { setStatus("Name required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("collections").insert({ name: collectionName.trim(), active: true });
      if (error) { setStatus(`Error: ${error.message}`); return; }
      setStatus("Collection created!");
      setCollectionName("");
      fetchCollections();
    } finally {
      setSaving(false);
    }
  }

  async function deleteCollection(id) {
    if (!confirm("Delete this collection and all its products?")) return;
    await supabase.from("products for Gorosei").delete().eq("collection_id", id);
    await supabase.from("collections").delete().eq("id", id);
    fetchCollections();
  }

  // ── Products ─────────────────────────────────────────────────────────────
  async function fetchProductsForCollection(colId) {
    if (!colId) return;
    const query = colId === "default"
      ? supabase.from("products for Gorosei").select("*").is("collection_id", null)
      : supabase.from("products for Gorosei").select("*").eq("collection_id", colId);
    const { data } = await query.order("created_at", { ascending: false });
    setProducts(data || []);
  }

  async function addProductToCollection() {
    if (!selectedCollection) { setStatus("Select a collection first"); return; }
    if (!newProduct.name || !newProduct.url) { setStatus("Name and image required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("products for Gorosei").insert({
        Name: newProduct.name.trim(),
        Price: parseInt(newProduct.price) || FIXED_PRICE,
        original_price: newProduct.originalPrice ? parseInt(newProduct.originalPrice) : null,
        category: newProduct.category || "tshirts",
        size: newProduct.size,
        Image_url: newProduct.url,
        collection_id: selectedCollection === "default" ? null : selectedCollection,
        sold: false,
      });
      if (error) { setStatus(`Error: ${error.message}`); return; }
      setStatus("Product added!");
      setNewProduct({ name: "", size: "M", price: "2000", originalPrice: "", category: "tshirts", url: "" });
      fetchProductsForCollection(selectedCollection);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products for Gorosei").delete().eq("id", id);
    fetchProductsForCollection(selectedCollection);
  }

  async function updateProduct(id) {
    const draft = editDrafts[id];
    if (!draft) return;
    const payload = {
      Name: draft.name?.trim() || "UNTITLED",
      Price: parseInt(draft.price) || FIXED_PRICE,
      original_price: draft.originalPrice ? parseInt(draft.originalPrice) : null,
      category: draft.category || "tshirts",
      size: draft.size || "M",
    };
    const { error } = await supabase.from("products for Gorosei").update(payload).eq("id", id);
    if (error) { setStatus(`Error: ${error.message}`); return; }
    setStatus("Product updated!");
    // Clear draft for this product after save
    setEditDrafts((prev) => { const next = { ...prev }; delete next[id]; return next; });
    fetchProductsForCollection(selectedCollection);
  }

  async function toggleSold(id, currentSold) {
    await supabase.from("products for Gorosei").update({ sold: !currentSold }).eq("id", id);
    fetchProductsForCollection(selectedCollection);
  }

  // ── Drops ─────────────────────────────────────────────────────────────────
  async function fetchDrops() {
    const { data } = await supabase.from("drops").select("*").order("created_at", { ascending: false });
    setDrops(data || []);

    // Waitlist count
    const { count } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
    setWaitlistCount(count || 0);
  }

  async function createDrop() {
    if (!newDrop.collection_name.trim() || !newDrop.drop_date) {
      setStatus("Collection name and date required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("drops").insert({
        collection_name: newDrop.collection_name.trim(),
        drop_date: newDrop.drop_date,
        active: false,
        locked: true,
      });
      if (error) { setStatus(`Error: ${error.message}`); return; }
      setStatus("Drop created!");
      setNewDrop({ collection_name: "", drop_date: "" });
      fetchDrops();
    } finally {
      setSaving(false);
    }
  }

  // Persist the active drop to Supabase so storefront countdowns use the same source of truth.
  async function setActiveDrop(id) {
    setSaving(true);
    try {
      // Deactivate all drops first
      await supabase.from("drops").update({ active: false }).neq("id", id);
      // Activate the selected one
      await supabase.from("drops").update({ active: true }).eq("id", id);
      setStatus("Drop activated!");
      fetchDrops();
    } catch {
      setStatus("Failed to activate drop.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDropLock(id, locked) {
    await supabase.from("drops").update({ locked }).eq("id", id);
    fetchDrops();
  }

  async function deleteDrop(id) {
    if (!confirm("Delete this drop?")) return;
    await supabase.from("drops").delete().eq("id", id);
    fetchDrops();
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = {
    padding: 14,
    background: "var(--surface)",
    border: "1px solid var(--surface-light)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  };

  const TABS = [
    { id: "collections", label: "COLLECTIONS" },
    { id: "products", label: "PRODUCTS" },
    { id: "drops", label: "DROPS" },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "100px 32px 80px" }}>
      {/* Top nav */}
      <nav style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="font-display" style={{ fontSize: 28 }}>ADMIN</span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/" className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}>
            ← STORE
          </a>
          <button
            onClick={onLogout}
            className="font-mono"
            style={{ fontSize: 11, color: "var(--crimson)", background: "none", border: "none", cursor: "pointer" }}
          >
            LOGOUT
          </button>
        </div>
      </nav>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 48, borderBottom: "1px solid var(--surface-light)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="font-mono"
            style={{
              padding: "12px 24px",
              fontSize: 11,
              letterSpacing: "0.2em",
              background: "none",
              border: "none",
              borderBottom: activeTab === t.id ? "2px solid var(--crimson)" : "2px solid transparent",
              color: activeTab === t.id ? "var(--crimson)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status message */}
      {status && (
        <div
          style={{
            padding: "12px 20px",
            background: status.toLowerCase().includes("error") || status.toLowerCase().includes("failed")
              ? "rgba(220,38,38,0.1)"
              : "rgba(16,185,129,0.1)",
            border: `1px solid ${status.toLowerCase().includes("error") || status.toLowerCase().includes("failed") ? "var(--crimson)" : "#10b981"}`,
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="font-mono" style={{ fontSize: 12 }}>{status}</span>
          <button
            onClick={() => setStatus("")}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── COLLECTIONS TAB ───────────────────────────────────────────── */}
      {activeTab === "collections" && (
        <div>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
            CREATE COLLECTION
          </span>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <input
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Collection name"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && createCollection()}
            />
            <button
              onClick={createCollection}
              disabled={saving}
              className="font-mono"
              style={{
                padding: "14px 28px",
                background: "var(--crimson)",
                border: "none",
                color: "#fff",
                fontSize: 11,
                letterSpacing: "0.2em",
                cursor: "pointer",
              }}
            >
              {saving ? "..." : "CREATE"}
            </button>
          </div>

          <div style={{ marginTop: 48 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              COLLECTIONS ({collections.length})
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
                marginTop: 24,
              }}
            >
              {collections.map((c) => (
                <div
                  key={c.id}
                  style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--surface-light)" }}
                >
                  <p style={{ fontSize: 14, marginBottom: 8 }}>{c.name}</p>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {c.active ? "ACTIVE" : "INACTIVE"}
                  </p>
                  <button
                    onClick={() => deleteCollection(c.id)}
                    style={{
                      marginTop: 16,
                      padding: "8px 16px",
                      border: "1px solid var(--crimson)",
                      color: "var(--crimson)",
                      background: "none",
                      fontSize: 10,
                      cursor: "pointer",
                      width: "100%",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "products" && (
        <div>
          {/* Collection selector */}
          <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
            <select
              value={selectedCollection || ""}
              onChange={(e) => { setSelectedCollection(e.target.value); fetchProductsForCollection(e.target.value); }}
              style={{ ...inputStyle, minWidth: 200 }}
            >
              <option value="">Select collection</option>
              <option value="default">— Uncollected —</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Add product form */}
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
            ADD PRODUCT
          </span>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <input
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Product name"
              style={{ ...inputStyle, flex: "1 1 200px", minWidth: 180 }}
            />
            <select
              value={newProduct.size}
              onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
              style={inputStyle}
            >
              {["S", "M", "L", "XL"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              style={inputStyle}
            >
              {PRODUCT_CATEGORIES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              placeholder="Price (KSh)"
              style={{ ...inputStyle, width: 120 }}
            />
            <input
              value={newProduct.originalPrice || ""}
              onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
              placeholder="Original price"
              style={{ ...inputStyle, width: 130 }}
            />
            {/* Image upload */}
            <label
              style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              {uploading ? (
                <span className="font-mono" style={{ fontSize: 10 }}>UPLOADING...</span>
              ) : newProduct.url ? (
                <img src={newProduct.url} style={{ width: 40, height: 40, objectFit: "cover" }} alt="preview" />
              ) : (
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>+ IMAGE</span>
              )}
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
            </label>
          </div>

          <button
            onClick={addProductToCollection}
            disabled={saving || uploading}
            className="font-mono"
            style={{
              marginTop: 20,
              padding: "14px 32px",
              background: "var(--crimson)",
              border: "none",
              color: "#fff",
              fontSize: 11,
              letterSpacing: "0.2em",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "SAVING..." : "ADD PRODUCT"}
          </button>

          {/* Product list */}
          {selectedCollection && products.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                PRODUCTS IN COLLECTION ({products.length})
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 16,
                  marginTop: 24,
                }}
              >
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 16,
                      background: "var(--surface)",
                      border: p.sold ? "1px solid #333" : "1px solid var(--surface-light)",
                      opacity: p.sold ? 0.6 : 1,
                    }}
                  >
                    {p.Image_url && (
                      <img
                        src={getImageUrl(p.Image_url, 400, 70)}
                        alt={p.Name}
                        style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                      />
                    )}
                    {/* Editable name */}
                    <input
                      value={editDrafts[p.id]?.name ?? p.Name ?? ""}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), name: e.target.value } }))}
                      style={{ ...inputStyle, width: "100%", marginTop: 12, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    />
                    {/* Price + original price */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                      <input
                        value={editDrafts[p.id]?.price ?? p.Price ?? ""}
                        onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), price: e.target.value } }))}
                        placeholder="Price"
                        style={{ ...inputStyle, width: "100%", padding: 10, fontSize: 12, boxSizing: "border-box" }}
                      />
                      <input
                        value={editDrafts[p.id]?.originalPrice ?? p.original_price ?? ""}
                        onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), originalPrice: e.target.value } }))}
                        placeholder="Original"
                        style={{ ...inputStyle, width: "100%", padding: 10, fontSize: 12, boxSizing: "border-box" }}
                      />
                    </div>
                    {/* Category */}
                    <select
                      value={editDrafts[p.id]?.category ?? p.category ?? "tshirts"}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), category: e.target.value } }))}
                      style={{ ...inputStyle, width: "100%", marginTop: 8, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    >
                      {PRODUCT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {/* Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => toggleSold(p.id, p.sold)}
                        className="font-mono"
                        style={{
                          padding: "8px 0",
                          border: "1px solid var(--surface-light)",
                          color: p.sold ? "var(--crimson)" : "var(--text-muted)",
                          background: "none",
                          fontSize: 9,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {p.sold ? "MARK AVAILABLE" : "MARK SOLD"}
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="font-mono"
                        style={{
                          padding: "8px 0",
                          border: "1px solid var(--crimson)",
                          color: "var(--crimson)",
                          background: "none",
                          fontSize: 9,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                    <button
                      onClick={() => updateProduct(p.id)}
                      className="font-mono"
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "10px 0",
                        border: "1px solid var(--surface-light)",
                        color: "var(--text)",
                        background: editDrafts[p.id] ? "var(--crimson)" : "transparent",
                        fontSize: 9,
                        cursor: "pointer",
                        letterSpacing: "0.15em",
                        transition: "background 0.2s",
                      }}
                    >
                      {editDrafts[p.id] ? "SAVE CHANGES ●" : "SAVE"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCollection && products.length === 0 && (
            <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 40 }}>
              No products in this collection yet.
            </p>
          )}
        </div>
      )}

      {/* ── DROPS TAB ────────────────────────────────────────────────── */}
      {activeTab === "drops" && (
        <div>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
            CREATE DROP
          </span>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <input
              value={newDrop.collection_name}
              onChange={(e) => setNewDrop({ ...newDrop, collection_name: e.target.value })}
              placeholder="Collection name (e.g., Stoic Samurai Edition)"
              style={{ ...inputStyle, flex: "1 1 250px", minWidth: 220 }}
            />
            <input
              type="datetime-local"
              value={newDrop.drop_date}
              onChange={(e) => setNewDrop({ ...newDrop, drop_date: e.target.value })}
              style={inputStyle}
            />
          </div>
          <button
            onClick={createDrop}
            disabled={saving}
            className="font-mono"
            style={{
              marginTop: 20,
              padding: "14px 32px",
              background: "var(--crimson)",
              border: "none",
              color: "#fff",
              fontSize: 11,
              letterSpacing: "0.2em",
              cursor: "pointer",
            }}
          >
            {saving ? "..." : "CREATE DROP"}
          </button>

          {/* Drop cards */}
          <div style={{ marginTop: 56 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              MANAGE DROPS ({drops.length})
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
                marginTop: 24,
              }}
            >
              {drops.map((drop) => (
                <div
                  key={drop.id}
                  style={{
                    padding: 20,
                    background: "var(--surface)",
                    border: drop.active ? "1px solid var(--crimson)" : "1px solid var(--surface-light)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <p style={{ fontSize: 14 }}>{drop.collection_name}</p>
                    {drop.active && (
                      <span
                        className="font-mono"
                        style={{ fontSize: 9, background: "var(--crimson)", color: "#fff", padding: "3px 8px", letterSpacing: "0.1em" }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
                    {drop.drop_date
                      ? new Date(drop.drop_date).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
                      : "No date set"}
                  </p>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                    {drop.locked ? "🔒 LOCKED" : "🔓 UNLOCKED"}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    {/* FIX: was setActiveDrop (undefined in old code) — now persists to Supabase */}
                    <button
                      onClick={() => setActiveDrop(drop.id)}
                      disabled={saving || drop.active}
                      className="font-mono"
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        background: drop.active ? "var(--surface-light)" : "var(--crimson)",
                        border: "none",
                        color: drop.active ? "var(--text-muted)" : "#fff",
                        fontSize: 9,
                        cursor: drop.active ? "default" : "pointer",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {drop.active ? "ACTIVE" : "SET ACTIVE"}
                    </button>
                    <button
                      onClick={() => toggleDropLock(drop.id, !drop.locked)}
                      disabled={saving}
                      className="font-mono"
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        background: "none",
                        border: "1px solid var(--crimson)",
                        color: "var(--crimson)",
                        fontSize: 9,
                        cursor: "pointer",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {drop.locked ? "UNLOCK" : "LOCK"}
                    </button>
                  </div>
                  <button
                    onClick={() => deleteDrop(drop.id)}
                    className="font-mono"
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "9px 0",
                      border: "1px solid #333",
                      color: "#555",
                      background: "none",
                      fontSize: 9,
                      cursor: "pointer",
                      letterSpacing: "0.15em",
                    }}
                  >
                    DELETE DROP
                  </button>
                </div>
              ))}
            </div>
          </div>

          {waitlistCount > 0 && (
            <div style={{ marginTop: 48, padding: 20, background: "var(--surface)", border: "1px solid var(--crimson)" }}>
              <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>
                👥 WAITLIST: {waitlistCount} {waitlistCount === 1 ? "person" : "people"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ROUTER ────────────────────────────────────────────────────────────────
// Synchronous route detection — safe for Vite SPA (no SSR)
export default function App() {
  const path = window.location.pathname;
  const route = path.startsWith("/product/") ? "/product" : path === "/admin" ? "/admin" : "/";
  const productId = path.startsWith("/product/") ? path.split("/product/")[1] : null;

  if (route === "/product" && productId) return <ProductPage id={productId} />;
  if (route === "/admin") return <AdminPage />;
  return <CustomerPage />;
}
