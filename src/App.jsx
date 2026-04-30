import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://bmasldizsbbgvrrdsfek.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 2000;
const ORIGINAL_PRICE = 2500;
const BUCKET_NAME = "products-images";
// FIX: Discord webhook now pulled from env — add VITE_DISCORD_WEBHOOK to .env
const DISCORD_WEBHOOK = import.meta?.env?.VITE_DISCORD_WEBHOOK || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── HELPERS ───────────────────────────────────────────────────────────────
// FIX: Image optimization via Supabase transform API
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

// FIX: Single global mouse tracker — replaces 4 separate rAF loops
function useGlobalMouse() {
  const raw = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const norm = useRef({ x: 0, y: 0 });
  const active = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      raw.current.x = e.clientX;
      raw.current.y = e.clientY;
      norm.current.x = e.clientX / window.innerWidth - 0.5;
      norm.current.y = e.clientY / window.innerHeight - 0.5;
      active.current = true;
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    const onLeave = () => { active.current = false; };
    const onEnter = () => { active.current = true; };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    let running = true;
    const loop = () => {
      if (!running) return;
      smooth.current.x = lerp(smooth.current.x, raw.current.x, 0.12);
      smooth.current.y = lerp(smooth.current.y, raw.current.y, 0.12);
      requestAnimationFrame(loop);
    };
    loop();

    return () => {
      running = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return { raw, smooth, norm, active };
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

function useScrollReveal(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);
  return scrolled;
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────

function AnimatedSection({ children }) {
  const { ref, visible } = useScrollReveal(0.15);
  return (
    <div ref={ref} className={`reveal ${visible ? "visible" : ""}`}>
      {children}
    </div>
  );
}

// FIX: Newsletter form — clarified it collects email (not WhatsApp), 
//      Discord webhook is only called if env var is set
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus("...");
    try {
      const { error } = await supabase
        .from("newsletter")
        .insert({ email: email.trim(), created_at: new Date().toISOString() });

      if (error) {
        setStatus("Error. Try again.");
        return;
      }

      // FIX: Only call Discord webhook if env var is defined
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
        } catch (_) {
          // Webhook failure doesn't break the signup
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
      {/* FIX: placeholder now correctly says "Your email" — input type is email */}
      <div style={{ display: "flex", gap: 0, maxWidth: 400, margin: "0 auto", border: "1px solid var(--surface-light)" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          style={{
            flex: 1,
            padding: "16px 20px",
            background: "transparent",
            border: "none",
            color: "var(--text)",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button type="submit" className="btn" style={{ border: "none", borderRadius: 0 }}>
          JOIN
        </button>
      </div>
      {status && (
        <p className="font-mono" style={{ fontSize: 11, color: "var(--crimson)", marginTop: 16 }}>
          {status}
        </p>
      )}
    </form>
  );
}

function MagneticButton({ children, className = "", style = {} }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 70) {
        const factor = (70 - dist) / 70;
        setTransform({ x: (dx / dist) * factor * 10, y: (dy / dist) * factor * 10 });
      } else {
        setTransform({ x: 0, y: 0 });
      }
    };
    const onLeave = () => setTransform({ x: 0, y: 0 });

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`magnetic ${className}`}
      style={{ ...style, transform: `translate(${transform.x}px, ${transform.y}px)` }}
    >
      {children}
    </div>
  );
}

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

  return (
    <a
      href={product?.id ? `/product/${product.id}` : "#drop"}
      ref={ref}
      className="product-card"
      style={{
        display: "block",
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.5s ease",
      }}
    >
      <div className="image-wrapper" style={{ "--lx": `${light.x}%`, "--ly": `${light.y}%` }}>
        {product?.Image_url ? (
          <img
            src={getImageUrl(product.Image_url, 600, 75)}
            alt={name}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="font-display" style={{ fontSize: 20 }}>{name}</span>
          <span className="font-mono" style={{ fontSize: 12, color: "var(--crimson)", letterSpacing: "0.1em" }}>
            KSh {product?.Price || FIXED_PRICE}
          </span>
        </div>
        {/* FIX: Changed "ADD TO CART" to "ORDER NOW" — no cart exists */}
        <span
          className="font-mono"
          style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, display: "block", letterSpacing: "0.2em" }}
        >
          ORDER NOW →
        </span>
      </div>
    </a>
  );
}

// ─── CUSTOMER PAGE ─────────────────────────────────────────────────────────
function CustomerPage() {
  // FIX: Single mouse tracker used for cursor + parallax + glow
  const mouse = useGlobalMouse();
  const scrolled = useNavScroll();
  const winWidth = useWindowWidth();
  const isMobile = winWidth < 768;

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Drop countdown state
  const [activeDrop, setActiveDrop] = useState(null);
  const [dropLocked, setDropLocked] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const heroMedia = [
    { src: "/hero1.png", type: "image" },
    { src: "/hero2.png", type: "image" },
    { src: "/hero3.png", type: "image" },
    { src: "/hero4.png", type: "image" },
    { src: "/hero5.png", type: "image" },
    { src: "/hero6.png", type: "image" },
    { src: "/hero7.png", type: "image" },
    { src: "/hero8.png", type: "image" },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((p) => (p + 1) % heroMedia.length);
        setIsTransitioning(false);
      }, 600);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // FIX: Hero parallax on the single rAF loop — attaches to DOM elements directly
  useEffect(() => {
    const imageEl = document.querySelector(".hero-image-layer.active-slide");
    const grainEl = document.querySelector(".hero-grain-layer");
    const textEl = document.querySelector(".hero-text-layer");

    let running = true;
    const loop = () => {
      if (!running) return;
      const x = mouse.norm.current.x;
      const y = mouse.norm.current.y;
      if (imageEl) imageEl.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
      if (grainEl) grainEl.style.transform = `translate(${-x * 22}px, ${-y * 22}px)`;
      if (textEl) textEl.style.transform = `translate(${-x * 6}px, ${-y * 6}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("sold", false)
        .order("created_at", { ascending: false });

      const { data: colData } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Fetched products:", data?.length || 0, "error:", error);
      
      if (!error && data?.length) {
        setProducts(data);
      }
if (colData?.length) setCollections(colData);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  }, []);
  
  // Fetch active drop
  const fetchActiveDrop = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("drops")
        .select("*")
        .eq("active", true)
        .single();
      
      if (data) {
        setActiveDrop(data);
        setDropLocked(data.locked);
      } else {
        setActiveDrop(null);
        setDropLocked(false);
      }
    } catch { /* no active drop */ }
  }, []);
  
  // Countdown timer
  const updateCountdown = useCallback(() => {
    if (!activeDrop?.drop_date) return;
    
    const dropTime = new Date(activeDrop.drop_date).getTime();
    const now = Date.now();
    const diff = dropTime - now;
    
    if (diff <= 0) {
      if (dropLocked && activeDrop) {
        setDropLocked(false);
        // Trigger webhook on unlock
        if (DISCORD_WEBHOOK) {
          fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `🔥 DROP LIVE: ${activeDrop.collection_name} is now available!`
            })
          }).catch(() => {});
        }
      }
      setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    
    setCountdown({ days, hours, mins, secs });
  }, [activeDrop, dropLocked]);
  
  // Submit to waitlist
  const submitWaitlist = async () => {
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
  };
  
  useEffect(() => { fetchProducts(); fetchActiveDrop(); }, []);
  
  // Countdown interval
  useEffect(() => {
    if (!activeDrop) return;
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeDrop, updateCountdown]);

  async function switchCollection(id) {
    setActiveCollection(id);
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
    fetchProducts();
  }

  // ── Cursor
  const cursorStyle = {
    position: "fixed",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--crimson)",
    pointerEvents: "none",
    zIndex: 9999,
    transform: "translate(-50%, -50%)",
    left: mouse.smooth.current.x,
    top: mouse.smooth.current.y,
    transition: "opacity 0.3s",
    opacity: mouse.active.current ? 1 : 0,
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* CURSOR — desktop only */}
      {!isMobile && <div className="cursor-dot" style={cursorStyle} />}

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: scrolled ? "16px 48px" : "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: scrolled || menuOpen ? "rgba(8,8,8,0.98)" : "transparent",
          backdropFilter: scrolled || menuOpen ? "blur(20px)" : "none",
          transition: "all 0.4s ease",
          // FIX: Smaller padding on mobile
          ...(isMobile && { padding: scrolled ? "14px 24px" : "20px 24px" }),
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="GOROSEI" style={{ height: 28 }} />
        </a>

        {/* FIX: Desktop nav links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 48 }}>
            {[["#drop", "SHOP"], ["#about", "ABOUT"], ["#contact", "CONTACT"]].map(([href, label]) => (
              <a key={label} href={href} className="nav-link font-mono"
                style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--text-muted)" }}>
                {label}
              </a>
            ))}
          </div>
        )}

        {/* FIX: Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                display: "block",
                width: 24,
                height: 1.5,
                background: "var(--text)",
                transition: "all 0.3s ease",
                transform: menuOpen
                  ? i === 0 ? "rotate(45deg) translate(4.5px, 4.5px)"
                  : i === 2 ? "rotate(-45deg) translate(4.5px, -4.5px)"
                  : "scaleX(0)"
                  : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        )}
      </nav>

      {/* COUNTDOWN BANNER - Show when drop is locked */}
      {dropLocked && activeDrop && (
        <div style={{
          position: "fixed",
          top: scrolled ? 60 : 80,
          left: 0,
          right: 0,
          zIndex: 999,
          background: "var(--crimson)",
          padding: "8px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          fontFamily: "var(--font-mono)",
        }}>
          <span style={{ fontSize: 10, letterSpacing: "0.2em" }}>
            {activeDrop?.collection_name || "DROP"} DROPS IN
          </span>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 700,
            letterSpacing: "0.1em",
            fontVariantNumeric: "tabular-nums",
          }}>
            {String(countdown.days).padStart(2, "0")}D : {String(countdown.hours).padStart(2, "0")}H : {String(countdown.mins).padStart(2, "0")}M : {String(countdown.secs).padStart(2, "0")}S
          </span>
          <a 
            href="#waitlist" 
            style={{ 
              fontSize: 10, 
              letterSpacing: "0.1em",
              color: "white",
              textDecoration: "underline",
            }}
          >
            JOIN WAITLIST
          </a>
        </div>
      )}

      {/* FIX: Mobile nav dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          background: "rgba(8,8,8,0.98)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}>
          {[["#drop", "SHOP"], ["#about", "ABOUT"], ["#contact", "CONTACT"]].map(([href, label]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}
              className="font-display"
              style={{ fontSize: 48, color: "var(--text)", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* Base layer - always visible */}
        {heroMedia[currentSlide]?.type === "video" ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hero-image-layer"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              filter: "brightness(0.85)",
              pointerEvents: "none",
            }}
          >
            <source src={heroMedia[currentSlide].src} type="video/mp4" />
          </video>
        ) : (
          <div
            className="hero-image-layer"
            style={{
              position: "absolute", inset: 0,
              background: `url(${heroMedia[currentSlide]?.src}) center/cover no-repeat`,
              filter: "brightness(0.85)",
              pointerEvents: "none",
            }}
          />
        )}
        
        {/* Transition overlay - pixelated transition effect */}
        {isTransitioning && (
          heroMedia[(currentSlide + 1) % heroMedia.length]?.type === "video" ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="hero-image-layer transition-overlay"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                filter: "brightness(0.85) contrast(1.2)",
                pointerEvents: "none",
                animation: "pixelScan 0.6s steps(8) forwards",
              }}
            >
              <source src={heroMedia[(currentSlide + 1) % heroMedia.length].src} type="video/mp4" />
            </video>
          ) : (
            <div
              className="hero-image-layer transition-overlay"
              style={{
                position: "absolute", inset: 0,
                background: `url(${heroMedia[(currentSlide + 1) % heroMedia.length]?.src}) center/cover no-repeat`,
                filter: "brightness(0.85) contrast(1.2)",
                pointerEvents: "none",
                imageRendering: "pixelated",
                animation: "pixelScan 0.6s steps(8) forwards",
              }}
            />
          )
        )}
        
        {/* Scanline effect for digital feel */}
        <div style={{
          position: "absolute", inset: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          pointerEvents: "none",
          zIndex: 5,
        }} />

        {/* FIX: Slide dots moved to bottom-left so they don't overlap scroll indicator */}
        <div style={{
          position: "absolute",
          bottom: 40,
          left: isMobile ? 24 : 48,
          zIndex: 20,
          display: "flex",
          gap: 12,
        }}>
          {heroMedia.map((item, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                border: "1px solid var(--crimson)",
                background: i === currentSlide ? "var(--crimson)" : "transparent",
                cursor: "pointer", transition: "all 0.3s ease", padding: 0,
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,8,8,0.9) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.95) 0%, transparent 40%)" }} />
        <div className="hero-grain-layer" style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.04, pointerEvents: "none",
        }} />

        <div className="hero-text-layer" style={{
          position: "relative", zIndex: 10,
          padding: isMobile ? "0 24px" : "0 48px",
          width: "100%", maxWidth: 1200,
          display: "flex", flexDirection: "column",
          justifyContent: "flex-end", minHeight: "100vh",
          paddingBottom: 120,
        }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
            FROM THE STREETS OF NAIROBI
          </span>
          <h1 className="font-display" style={{
            fontSize: isMobile ? "clamp(32px, 10vw, 64px)" : "clamp(48px, 7vw, 100px)",
            lineHeight: 0.95, marginTop: 24,
          }}>
            Sometimes all you have to do is put that shit on<br />
            <span style={{ color: "var(--crimson)" }}>and go about your day.</span>
          </h1>
          <div style={{ display: "flex", gap: 16, marginTop: 48, flexWrap: "wrap" }}>
            <MagneticButton>
              <a href="#drop" className="btn">SHOP THE DROP</a>
            </MagneticButton>
            {/* FIX: "LOOKBOOK" renamed to "OUR STORY" — about section has no imagery */}
            <a href="#lookbook" className="btn btn-outline">LOOKBOOK</a>
          </div>
        </div>

        {/* FIX: Scroll indicator moved to right — no longer overlaps dots */}
        {!isMobile && (
          <div style={{
            position: "absolute", right: 48, bottom: 40,
            writingMode: "vertical-rl",
          }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--text-muted)" }}>
              SCROLL ↓
            </span>
          </div>
        )}
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────── */}
      <section id="about" className="section section-dark">
        <AnimatedSection>
          <div style={{
            maxWidth: 1200, margin: "0 auto",
            padding: isMobile ? "80px 24px" : "120px 48px",
            position: "relative",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 48 : 80,
            alignItems: "center",
          }}>
            {/* Founder Image */}
            <div style={{ position: "relative" }}>
              <img 
                src="/founder.png" 
                alt="Brian Mukwe - Founder" 
                style={{ 
                  width: "100%", 
                  maxWidth: 400, 
                  aspectRatio: "3/4", 
                  objectFit: "cover",
                  filter: "grayscale(30%)",
                }} 
              />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top, rgba(8,8,8,0.9), transparent)",
                padding: "40px 24px 24px",
              }}>
                <p className="font-display" style={{ fontSize: 24 }}>BRIAN MUKWE</p>
                <p className="font-mono" style={{ fontSize: 11, color: "var(--crimson)", marginTop: 4 }}>
                  GLIZOCK / GLOCK
                </p>
              </div>
            </div>
            
            {/* About Content */}
            <div style={{ position: "relative" }}>
              <div className="concentric-circles" />
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                • WHO WE ARE
              </span>
              <h2 className="font-display" style={{
                fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(48px, 8vw, 96px)",
                lineHeight: 1, marginTop: 24,
              }}>
                NAIROBI'S<br /><span style={{ color: "var(--crimson)" }}>VISION</span>
              </h2>
              <p className="font-mono" style={{
                fontSize: 14, color: "var(--text-muted)", marginTop: 24,
                letterSpacing: "0.1em",
              }}>
                LUCKY SUMMER 2026
              </p>
              <p className="font-mono" style={{
                fontSize: 13, color: "var(--text-muted)", marginTop: 32,
                lineHeight: 1.8, maxWidth: 480,
              }}>
                I started GOROSEI because I wanted to add more graphical content to the streets of Nairobi. A breath of life in the streets. Tired of all the gloomy and average pieces.
              </p>
              <p className="font-mono" style={{
                fontSize: 13, color: "var(--text-muted)", marginTop: 24,
                lineHeight: 1.8, maxWidth: 480,
              }}>
                When I was a kid I used to get hand-me-downs from my cousin. I was literally a 14yr old kid rocking the meanest skull t-shirt with old timberlands.
              </p>
              <p className="font-display" style={{
                fontSize: isMobile ? 24 : 32, marginTop: 40,
                color: "var(--crimson)",
              }}>
                "simply to put that shit on"
              </p>
              <div className="corner-brackets" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── FEATURE DROP ─────────────────────────────────────────────── */}
      <section className="section section-red-glow" style={{ minHeight: "80vh" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 40 : 80,
          alignItems: "center",
        }}>
          <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
            {products[0]?.Image_url ? (
              <img
                src={getImageUrl(products[0].Image_url, 800, 80)}
                alt={products[0].Name}
                style={{ width: "100%", height: isMobile ? "50vh" : "80vh", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: "100%", height: isMobile ? "50vh" : "80vh",
                background: "var(--surface-light)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="font-display" style={{ fontSize: 48, color: "var(--text-muted)" }}>THE DROP</span>
              </div>
            )}
          </div>
          <div style={{ padding: isMobile ? "0 24px" : 0 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>[01]</span>
            <h2 className="font-display" style={{
              fontSize: isMobile ? "clamp(48px, 12vw, 80px)" : "clamp(64px, 9vw, 130px)",
              lineHeight: 0.88, marginTop: 24,
            }}>
              THE DROP
            </h2>
            <p className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 32, lineHeight: 1.8 }}>
              Limited release. Once they're gone, they're gone.<br />Premium quality. Real identity.
            </p>
            <a href="#drop" className="btn btn-ghost" style={{ marginTop: 48 }}>VIEW COLLECTION →</a>
          </div>
        </div>
        <div className="dot-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      </section>

      {/* ── PRODUCT GRID ──────────────────────────────────────────────── */}
      <section id="drop" className="section">
        <AnimatedSection>
          {/* LOCKED VIEW - Show waitlist instead of products */}
          {dropLocked && activeDrop ? (
            <div style={{ 
              maxWidth: 600, 
              margin: "0 auto", 
              padding: isMobile ? "80px 24px" : "120px 48px",
              textAlign: "center",
            }} id="waitlist">
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                • WAITLIST
              </span>
              <h2 className="font-display" style={{
                fontSize: isMobile ? "clamp(36px, 12vw, 64px)" : "clamp(48px, 10vw, 96px)",
                marginTop: 24,
              }}>
                {activeDrop.collection_name?.toUpperCase() || "DROP"} LOCKED
              </h2>
              <p className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 32, lineHeight: 1.8 }}>
                This collection drops in:<br />
                <span style={{ fontSize: 24, color: "var(--crimson)", fontWeight: 700 }}>
                  {String(countdown.days).padStart(2, "0")}D : {String(countdown.hours).padStart(2, "0")}H : {String(countdown.mins).padStart(2, "0")}M : {String(countdown.secs).padStart(2, "0")}S
                </span>
              </p>
              <p className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 32, lineHeight: 1.8 }}>
                Join the waitlist to get early access when it drops.
              </p>
              
              {waitlistSubmitted ? (
                <div style={{ marginTop: 48, padding: 24, border: "1px solid var(--crimson)" }}>
                  <p className="font-mono" style={{ fontSize: 12, color: "var(--crimson)" }}>
                    ✓ YOU'RE ON THE LIST
                  </p>
                  <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                    We'll notify you when the drop goes live.
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16, maxWidth: 300, margin: "48px auto 0" }}>
                  <input
                    type="tel"
                    placeholder="254XXXXXXXXX"
                    value={waitlistPhone}
                    onChange={(e) => setWaitlistPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: "var(--surface)",
                      border: "1px solid var(--surface-light)",
                      color: "var(--text)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  />
                  <button
                    onClick={submitWaitlist}
                    disabled={waitlistLoading || !waitlistPhone.trim()}
                    style={{
                      width: "100%",
                      padding: "16px",
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
          /* UNLOCKED VIEW - Show products normally */
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "0 24px" : "0 48px" }}>
            <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={showAllDrops} className="font-mono"
                style={{
                  fontSize: 11, letterSpacing: "0.2em",
                  color: activeCollection === null ? "var(--crimson)" : "var(--text-muted)",
                  background: "none", border: "none", cursor: "pointer",
                  paddingBottom: 4,
                  borderBottom: activeCollection === null ? "1px solid var(--crimson)" : "1px solid transparent",
                }}>
                ALL DROPS
              </button>
              {collections.map((c) => (
                <button key={c.id} onClick={() => switchCollection(c.id)} className="font-mono"
                  style={{
                    fontSize: 11, letterSpacing: "0.2em",
                    color: activeCollection === c.id ? "var(--crimson)" : "var(--text-muted)",
                    background: "none", border: "none", cursor: "pointer",
                    paddingBottom: 4,
                    borderBottom: activeCollection === c.id ? "1px solid var(--crimson)" : "1px solid transparent",
                  }}>
                  {c.name?.toUpperCase() || "COLLECTION"}
                </button>
              ))}
            </div>

            <h2 className="font-display" style={{ fontSize: isMobile ? "clamp(36px, 12vw, 64px)" : "clamp(48px, 10vw, 96px)", marginTop: 16 }}>
              {activeCollection === null ? "ALL DROPS" : collections.find((c) => c.id === activeCollection)?.name?.toUpperCase() || "THE DROP"}
            </h2>
          </div>
          )}

          {/* Show products only when NOT locked */}
          {!dropLocked && (
            <div
              className="grid-3"
              style={{
                marginTop: 80, maxWidth: 1400,
                margin: "80px auto 0",
                padding: isMobile ? "0 24px" : "0 48px",
              }}
            >
              {loading ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 100, color: "var(--text-muted)" }}>
                  LOADING...
                </div>
              ) : products.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 100 }}>
                  <p className="font-display" style={{ fontSize: isMobile ? 32 : 48 }}>NO DROPS YET</p>
                  <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
                    Check back soon.
                  </p>
                </div>
              ) : (
                products.map((p, i) => <ProductCard key={p.id || i} product={p} />)
              )}
            </div>
          )}
        </AnimatedSection>
      </section>

      {/* FIX: Product strip REMOVED — was duplicating the grid above with no added value */}

      {/* ── NAIROBI STATEMENT ───────────────────────────────────────── */}
      {/* FIX: Padding cut from 200px to 80px — was dead space */}
      <section className="section" style={{ padding: isMobile ? "80px 24px" : "80px 48px", textAlign: "center" }}>
        <AnimatedSection>
          <h2 className="font-display" style={{
            fontSize: isMobile ? "clamp(48px, 14vw, 80px)" : "clamp(64px, 12vw, 160px)",
            lineHeight: 0.9,
          }}>
            GOROSEI<br />FROM NAIROBI.
          </h2>
          <div style={{ width: 120, height: 1, background: "var(--crimson)", margin: "48px auto" }} />
          <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto", lineHeight: 1.8 }}>
            From the streets of Nairobi.<br />Dressed in your real self.
          </p>
        </AnimatedSection>
      </section>

      {/* ── LOOKBOOK ──────────────────────────────────────────────── */}
      <section id="lookbook" className="section" style={{ padding: isMobile ? "80px 24px" : "120px 48px" }}>
        <AnimatedSection>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              • LOOKBOOK
            </span>
            <h2 className="font-display" style={{
              fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(48px, 8vw, 96px)",
              lineHeight: 1, marginTop: 24,
            }}>
              ON THE STREETS
            </h2>
            <p className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 24, lineHeight: 1.8 }}>
              Real fit checks. Real Nairobi. No studio, no filter.
            </p>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 16,
            marginTop: 48,
          }}>
            {/* Using a few hero images as lookbook shots - replace with actual lifestyle shots when available */}
            {[
              { src: "/hero1.png", alt: "GOROSEI fit check 1" },
              { src: "/hero3.png", alt: "GOROSEI fit check 2" },
              { src: "/hero5.png", alt: "GOROSEI fit check 3" },
            ].map((img, i) => (
              <div key={i} style={{ position: "relative", overflow: "hidden" }}>
                <img
                  src={img.src}
                  alt={img.alt}
                  style={{
                    width: "100%",
                    aspectRatio: "3/4",
                    objectFit: "cover",
                    filter: "grayscale(20%)",
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "24px",
                  background: "linear-gradient(to top, rgba(8,8,8,0.9), transparent)",
                }}>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--crimson)" }}>
                    0{i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section id="contact" className="section" style={{ textAlign: "center", padding: isMobile ? "80px 24px" : "120px 48px" }}>
        <AnimatedSection>
          <h2 className="font-display" style={{ fontSize: isMobile ? "clamp(36px, 10vw, 64px)" : "clamp(48px, 10vw, 96px)", lineHeight: 1 }}>
            JOIN THE<br />BROTHERHOOD
          </h2>
          <p className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 32, maxWidth: 400, margin: "32px auto" }}>
            Be first to know about drops. Exclusive access. Real ones only.
          </p>
          <NewsletterForm />
        </AnimatedSection>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="section footer" style={{ minHeight: "auto", padding: isMobile ? "40px 24px" : "60px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="GOROSEI" style={{ height: 28 }} />
          </a>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <a href="https://instagram.com/goroseikenya" target="_blank" rel="noreferrer"
              className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>INSTAGRAM</a>
            <a href="https://tiktok.com/@goroseikenya" target="_blank" rel="noreferrer"
              className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>TIKTOK</a>
            <a href="https://wa.me/254734944512" target="_blank" rel="noreferrer"
              className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>WHATSAPP</a>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 32, paddingTop: 32, borderTop: "1px solid var(--surface-light)" }}>
          <span className="font-mono" style={{ fontSize: 10, color: "#333" }}>
            © 2025 GOROSEI — ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── PRODUCT PAGE ──────────────────────────────────────────────────────────
function ProductPage({ id }) {
  const mouse = useGlobalMouse();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const sizes = ["S", "M", "L", "XL"];

  useEffect(() => { fetchProduct(); }, [id]);

  async function fetchProduct() {
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("id", id)
        .single();
      setProduct(data);
    } catch { /* silent */ }
    setLoading(false);
  }

  if (loading) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="font-mono" style={{ color: "var(--text-muted)" }}>LOADING...</span>
    </div>
  );

  const name = product?.Name || id?.toUpperCase() || "PRODUCT";
  const price = product?.Price || FIXED_PRICE;

  // FIX: Selected size is now included in the WhatsApp order message
  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi GOROSEI,\n\nI'd like to order:\n- Product: ${name}\n- Size: ${selectedSize}\n- Price: KSh ${price}\n\nIs it available?`
  )}`;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <a href="/" style={{
        position: "fixed", top: 16, left: 24, zIndex: 1000,
        padding: "10px 20px", backdropFilter: "blur(10px)",
        fontSize: 11, background: "rgba(0,0,0,0.9)",
        textDecoration: "none",
      }}>
        <span className="font-mono" style={{ letterSpacing: "0.2em" }}>← BACK</span>
      </a>

      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: 80, paddingBottom: 200,
      }}>
        {product?.Image_url ? (
          <img
            src={getImageUrl(product.Image_url, 1200, 85)}
            alt={name}
            style={{
              maxWidth: "90%", maxHeight: "85%", objectFit: "contain",
              transform: `translate(${mouse.norm.current.x * 15}px, ${mouse.norm.current.y * 15}px)`,
              transition: "transform 0.2s ease-out",
            }}
          />
        ) : (
          <div style={{ fontSize: 80, color: "var(--surface-light)" }}>{name}</div>
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "24px",
        background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--crimson)" }}>NOW VIEWING</p>
            <h1 className="font-display" style={{ fontSize: 32, marginTop: 4 }}>{name}</h1>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {sizes.map((s) => (
                <button key={s} onClick={() => setSelectedSize(s)}
                  style={{
                    width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${selectedSize === s ? "var(--crimson)" : "var(--surface-light)"}`,
                    background: selectedSize === s ? "var(--crimson)" : "transparent",
                    color: "var(--text)", fontSize: 12, cursor: "pointer",
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 28, fontWeight: "bold" }}>KSh {price}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textDecoration: "line-through" }}>KSh {ORIGINAL_PRICE}</span>
              <span style={{ fontSize: 9, color: "#ff4444", letterSpacing: "0.1em" }}>SAVE KSh {ORIGINAL_PRICE - FIXED_PRICE}</span>
            </div>
            {/* FIX: Size included in order — shown in button label */}
            <a href={buyLink} className="btn" style={{ marginTop: 12, padding: "12px 24px", fontSize: 10 }}>
              ORDER SIZE {selectedSize} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ────────────────────────────────────────────────────────────
// FIX: Replaced client-side password with Supabase Auth (signInWithPassword)
//      No more hardcoded password. No more localStorage token bypass.
//      Requires an admin user created in Supabase Dashboard → Authentication → Users.
function AdminPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setSigningIn(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="font-mono" style={{ color: "var(--text-muted)" }}>...</span>
    </div>
  );

  if (!session) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} style={{ maxWidth: 400, width: "100%", padding: 48 }}>
          <h1 className="font-display" style={{ fontSize: 48, textAlign: "center" }}>ADMIN</h1>
          <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 24, textAlign: "center" }}>
            Sign in with your admin account
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{
              width: "100%", padding: 16, marginTop: 24,
              background: "var(--surface)", border: "1px solid var(--surface-light)",
              color: "var(--text)", fontSize: 14, boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{
              width: "100%", padding: 16, marginTop: 12,
              background: "var(--surface)", border: "1px solid var(--surface-light)",
              color: "var(--text)", fontSize: 14, boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ color: "var(--crimson)", marginTop: 16, textAlign: "center", fontSize: 12 }}>{error}</p>
          )}
          <button type="submit" disabled={signingIn} className="btn" style={{ width: "100%", marginTop: 24 }}>
            {signingIn ? "..." : "ENTER"}
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

// Extracted admin dashboard so it doesn't re-render on every auth check
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("collections");
  const [collections, setCollections] = useState([]);
  const [collectionName, setCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", size: "M", price: "2000", url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  
  // Drop management state
  const [drops, setDrops] = useState([]);
  const [activeDropId, setActiveDropId] = useState(null);
  const [newDrop, setNewDrop] = useState({ name: "", collection_name: "", drop_date: "" });
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => { fetchCollections(); fetchDrops(); }, []);

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
      if (error) throw error;
      setNewProduct((prev) => ({ ...prev, url: getImageUrl(data.path) }));
      setStatus("Image uploaded!");
    } catch {
      setStatus("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function fetchCollections() {
    try {
      const { data, error } = await supabase.from("collections").select("*").order("created_at", { ascending: false });
      if (error) {
        setCollections([{ id: "default", name: "DEFAULT DROP", active: true }]);
        setSelectedCollection("default");
        return;
      }
      setCollections(data || []);
      if (data?.length && !selectedCollection) {
        setSelectedCollection(data[0].id);
        fetchProductsForCollection(data[0].id);
      }
    } catch {
      setCollections([{ id: "default", name: "DEFAULT DROP", active: true }]);
    }
  }

  async function fetchProductsForCollection(collectionId) {
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false });
      setProducts(data || []);
    } catch { /* silent */ }
  }
  
  // Drop management
  async function fetchDrops() {
    try {
      const { data } = await supabase.from("drops").select("*").order("created_at", { ascending: false });
      setDrops(data || []);
      const active = data?.find(d => d.active);
      if (active) {
        setActiveDropId(active.id);
        fetchWaitlistCount(active.id);
      }
    } catch { /* silent */ }
  }
  
  async function fetchWaitlistCount(dropId) {
    try {
      const { count } = await supabase.from("waitlist").select("*", { count: true, head: true }).eq("drop_id", dropId);
      setWaitlistCount(count || 0);
    } catch { /* silent */ }
  }
  
  async function createDrop() {
    if (!newDrop.collection_name.trim()) { setStatus("Collection name required"); return; }
    setSaving(true);
    try {
      await supabase.from("drops").insert({ ...newDrop });
      setStatus("Drop created!");
      setNewDrop({ name: "", collection_name: "", drop_date: "" });
      fetchDrops();
    } catch { setStatus("Failed"); }
    setSaving(false);
  }
  
  async function setActiveDrop(dropId) {
    try {
      await supabase.from("drops").update({ active: false }).eq("active", true);
      await supabase.from("drops").update({ active: true }).eq("id", dropId);
      fetchDrops();
      setStatus("Active drop updated!");
    } catch { setStatus("Failed"); }
  }
  
  async function toggleDropLock(dropId, locked) {
    try {
      await supabase.from("drops").update({ locked }).eq("id", dropId);
      fetchDrops();
      setStatus(locked ? "Drop locked!" : "Drop unlocked!");
    } catch { setStatus("Failed"); }
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

  async function addProductToCollection() {
    if (!selectedCollection) { setStatus("Select a collection first"); return; }
    if (!newProduct.name || !newProduct.url) { setStatus("Name and image required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("products for Gorosei").insert({
        Name: newProduct.name.trim(),
        Price: parseInt(newProduct.price) || FIXED_PRICE,
        size: newProduct.size,
        Image_url: newProduct.url,
        collection_id: selectedCollection === "default" ? null : selectedCollection,
        sold: false,
      });
      if (error) { setStatus(`Error: ${error.message}`); return; }
      setStatus("Product added!");
      setNewProduct({ name: "", size: "M", price: "2000", url: "" });
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

  async function deleteCollection(id) {
    if (!confirm("Delete this collection and all its products?")) return;
    await supabase.from("products for Gorosei").delete().eq("collection_id", id);
    await supabase.from("collections").delete().eq("id", id);
    fetchCollections();
  }

  const inputStyle = {
    padding: 16, background: "var(--surface)",
    border: "1px solid var(--surface-light)",
    color: "var(--text)", fontSize: 14,
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "120px 48px 50px" }}>
      <nav style={{ marginBottom: 48, display: "flex", justifyContent: "space-between" }}>
        <span className="font-display" style={{ fontSize: 32 }}>ADMIN</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/" className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>← STORE</a>
          <button onClick={onLogout} className="font-mono"
            style={{ fontSize: 11, color: "var(--crimson)", background: "none", border: "none", cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>
      </nav>

      <div style={{ display: "flex", gap: 24, marginBottom: 48, borderBottom: "1px solid var(--surface-light)", paddingBottom: 16 }}>
        {["collections", "products", "drops"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="font-mono"
            style={{
              fontSize: 11, letterSpacing: "0.2em",
              color: activeTab === tab ? "var(--crimson)" : "var(--text-muted)",
              background: "none", border: "none", cursor: "pointer",
            }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "collections" && (
        <div>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>NEW COLLECTION</span>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <input value={collectionName} onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Collection name (e.g., SUMMER 2025)"
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={createCollection} disabled={saving} className="btn" style={{ padding: "16px 32px" }}>
              CREATE
            </button>
          </div>

          <div style={{ marginTop: 48 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              ALL COLLECTIONS ({collections.length})
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16, marginTop: 24 }}>
              {collections.map((c) => (
                <div key={c.id}
                  style={{
                    padding: 24, background: "var(--surface)", cursor: "pointer",
                    border: selectedCollection === c.id ? "1px solid var(--crimson)" : "1px solid var(--surface-light)",
                  }}
                  onClick={() => { setSelectedCollection(c.id); fetchProductsForCollection(c.id); }}>
                  <p className="font-display" style={{ fontSize: 20 }}>{c.name}</p>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
                    {c.active ? "ACTIVE" : "INACTIVE"}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); deleteCollection(c.id); }}
                    style={{ marginTop: 16, padding: "8px 16px", border: "1px solid var(--crimson)", color: "var(--crimson)", background: "none", fontSize: 10, cursor: "pointer" }}>
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div>
          <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
            <select value={selectedCollection || ""}
              onChange={(e) => { setSelectedCollection(e.target.value); fetchProductsForCollection(e.target.value); }}
              style={{ ...inputStyle, minWidth: 200 }}>
              <option value="">Select collection</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>ADD PRODUCT</span>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Product name" style={{ ...inputStyle, flex: "1 1 200px", minWidth: 200 }} />
            <select value={newProduct.size} onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
              style={inputStyle}>
              {["S", "M", "L", "XL"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <input value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              placeholder="Price" style={{ ...inputStyle, width: 120 }} />
            <label style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              {uploading ? (
                <span className="font-mono" style={{ fontSize: 10 }}>UPLOADING...</span>
              ) : newProduct.url ? (
                <img src={newProduct.url} style={{ width: 40, height: 40, objectFit: "cover" }} alt="preview" />
              ) : (
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>UPLOAD IMAGE</span>
              )}
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
            </label>
          </div>

          <button onClick={addProductToCollection} disabled={saving} className="btn" style={{ marginTop: 24 }}>
            {saving ? "..." : "ADD PRODUCT"}
          </button>
          {status && (
            <p style={{ marginTop: 16, color: status.includes("Error") ? "var(--crimson)" : "var(--text)", fontSize: 12 }}>
              {status}
            </p>
          )}

          {selectedCollection && products.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                PRODUCTS ({products.length})
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
                {products.map((p) => (
                  <div key={p.id} style={{ padding: 16, background: "var(--surface)" }}>
                    {p.Image_url && (
                      <img src={getImageUrl(p.Image_url, 400, 70)} alt={p.Name}
                        style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
                    )}
                    <p style={{ fontSize: 14, marginTop: 12 }}>{p.Name}</p>
                    <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      Size: {p.size} • KSh {p.Price || FIXED_PRICE}
                    </p>
                    <button onClick={() => deleteProduct(p.id)}
                      style={{ marginTop: 12, padding: "8px 16px", border: "1px solid var(--crimson)", color: "var(--crimson)", background: "none", fontSize: 10, cursor: "pointer", width: "100%" }}>
                      DELETE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )}
  
  {activeTab === "drops" && (
    <div>
      <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
        CREATE DROP
      </span>
      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <input value={newDrop.collection_name} onChange={(e) => setNewDrop({ ...newDrop, collection_name: e.target.value })}
          placeholder="Collection name (e.g., Stoic Samurai Edition)" style={{ ...inputStyle, flex: "1 1 250px", minWidth: 250 }} />
        <input type="datetime-local" value={newDrop.drop_date} onChange={(e) => setNewDrop({ ...newDrop, drop_date: e.target.value })}
          style={inputStyle} />
      </div>
      <button onClick={createDrop} disabled={saving} className="btn" style={{ marginTop: 24 }}>
        {saving ? "..." : "CREATE DROP"}
      </button>
      
      {status && (
        <p style={{ marginTop: 16, color: status.includes("Error") ? "var(--crimson)" : "var(--text)", fontSize: 12 }}>
          {status}
        </p>
      )}
      
      <div style={{ marginTop: 48 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
          MANAGE DROPS ({drops.length})
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 24 }}>
          {drops.map((drop) => (
            <div key={drop.id} style={{ padding: 16, background: "var(--surface)", border: drop.active ? "1px solid var(--crimson)" : "1px solid transparent" }}>
              <p style={{ fontSize: 14 }}>{drop.collection_name}</p>
              <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                {drop.drop_date ? new Date(drop.drop_date).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" }) : "No date set"}
              </p>
              <p className="font-mono" style={{ fontSize: 10, color: "var(--crimson)", marginTop: 8 }}>
                {drop.locked ? "🔒 LOCKED" : "🔓 UNLOCKED"} {drop.id === activeDropId && " • ACTIVE"}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => setActiveDropId(drop.id)} disabled={saving}
                  style={{ flex: 1, padding: "8px 12px", background: drop.active ? "var(--surface-light)" : "var(--crimson)", border: "none", color: "var(--text)", fontSize: 10, cursor: "pointer" }}>
                  {drop.active ? "ACTIVE" : "SET ACTIVE"}
                </button>
                <button onClick={() => toggleDropLock(drop.id, !drop.locked)} disabled={saving}
                  style={{ flex: 1, padding: "8px 12px", background: "none", border: "1px solid var(--crimson)", color: "var(--crimson)", fontSize: 10, cursor: "pointer" }}>
                  {drop.locked ? "UNLOCK" : "LOCK"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {waitlistCount > 0 && (
        <div style={{ marginTop: 48, padding: 16, background: "var(--crimson)", textAlign: "center" }}>
          <span className="font-mono" style={{ fontSize: 10 }}>WAITLIST: {waitlistCount} people</span>
        </div>
      )}
    </div>
  );
}

// ─── ROUTER ────────────────────────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState("/");
  const [productId, setProductId] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/product/")) {
      setProductId(path.split("/product/")[1]);
      setRoute("/product");
    } else if (path === "/admin") {
      setRoute("/admin");
    } else {
      setRoute("/");
    }
  }, []);

  if (route === "/product" && productId) return <ProductPage id={productId} />;
  if (route === "/admin") return <AdminPage />;
  return <CustomerPage />;
}