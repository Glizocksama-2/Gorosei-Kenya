import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bmasldizsbbgvrrdsfek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 1500;
const BUCKET_NAME = "products-images";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

// Cursor hook with lerp smoothing
function useCursor() {
  const cursorRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };

    const animate = () => {
      smooth.current.x += (pos.current.x - smooth.current.x) * 0.12;
      smooth.current.y += (pos.current.y - smooth.current.y) * 0.12;
      
      if (cursor) {
        cursor.style.left = smooth.current.x + "px";
        cursor.style.top = smooth.current.y + "px";
      }
      requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMove);
    animate();

    return () => document.removeEventListener("mousemove", handleMove);
  }, []);

  return cursorRef;
}

// Magnetic button hook
function useMagnetic(ref, strength = 8) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      
      if (dist < 60) {
        const moveX = (distX / dist) * strength;
        const moveY = (distY / dist) * strength;
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
      } else {
        el.style.transform = "translate(0, 0)";
      }
    };

    const handleLeave = () => {
      el.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      el.style.transform = "translate(0, 0)";
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref, strength]);
}

// 3D tilt hook for product cards
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -8;
      const rotateY = (x - centerX) / centerX * 8;
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleLeave = () => {
      el.style.transition = "transform 0.5s ease";
      el.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref]);
}

// Intersection Observer for scroll reveals
function useReveal(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("revealed");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

function Router() {
  const path = window.location.pathname.toLowerCase();
  if (path === "/admin" || path === "/admin.html") return <AdminPage />;
  if (path.startsWith("/product/")) {
    const id = path.replace("/product/", "").replace("/", "");
    return <ProductPage id={id} />;
  }
  return <CustomerPage />;
}

export default function App() {
  const cursorRef = useCursor();
  const isTouch = "ontouchstart" in window;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
        
        :root {
          --bg: #080808;
          --surface: #0f0f0f;
          --surface-light: #1a1a1f;
          --crimson: #CC0000;
          --crimson-dark: #8B0000;
          --text: #FFFFFF;
          --text-muted: #666666;
          --dot: rgba(255,255,255,0.025);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; cursor: none !important; }
        
        html, body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Space Mono', monospace;
          overflow-x: hidden;
        }
        
        a { color: inherit; text-decoration: none; cursor: none !important; }
        
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        /* Dot grid */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        
        /* Custom cursor */
        .custom-cursor {
          position: fixed;
          width: 12px;
          height: 12px;
          border: 1px solid var(--text);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transform: translate(-50%, -50%);
          transition: width 0.2s, height 0.2s, background 0.2s;
          mix-blend-mode: difference;
        }
        .custom-cursor.active {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.1);
          border-color: var(--crimson);
        }
        
        /* Section counter */
        .section-num {
          color: var(--text-muted);
          font-size: 12px;
          letter-spacing: 0.25em;
        }
        .section-num.red { color: var(--crimson); }
        
        /* Buttons */
        .btn {
          border: 1px solid var(--crimson);
          background: transparent;
          color: var(--text);
          padding: 14px 32px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: none !important;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .btn:hover, .btn:active {
          background: var(--crimson);
          color: var(--bg);
          box-shadow: 0 0 24px rgba(204,0,0,0.35);
        }
        .btn-ghost {
          border: 1px solid var(--text-muted);
          color: var(--text-muted);
          background: transparent;
        }
        .btn-ghost:hover, .btn-ghost:active {
          border-color: var(--text);
          color: var(--text);
          background: transparent;
        }
        
        /* Reveal animations */
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        
        .word-reveal {
          display: inline-block;
          overflow: hidden;
        }
        .word-reveal span {
          display: block;
          transform: translateY(100%);
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .revealed .word-reveal span {
          transform: translateY(0);
        }
        
        /* Corner brackets */
        .bracket { position: relative; }
        .bracket::before {
          content: '';
          position: absolute;
          width: 30px;
          height: 30px;
          border: 1px solid var(--crimson);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .bracket-tl::before { top: 0; left: 0; border-right: none; border-bottom: none; }
        .bracket-tr::before { top: 0; right: 0; border-left: none; border-bottom: none; }
        .bracket-bl::before { bottom: 0; left: 0; border-right: none; border-top: none; }
        .bracket-br::before { bottom: 0; right: 0; border-left: none; border-top: none; }
        .bracket:hover::before { opacity: 1; }
        
        /* Product card */
        .product-card {
          background: var(--surface);
          transition: transform 0.5s ease, box-shadow 0.3s;
          transform-style: preserve-3d;
        }
        .product-card:hover {
          box-shadow: inset 0 0 0 1px var(--crimson), 0 0 30px rgba(204,0,0,0.15);
        }
        
        /* Specular highlight */
        .specular {
          position: absolute;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
          transform: translate(-50%, -50%);
        }
        .product-card:hover .specular { opacity: 1; }
        
        /* Nav underline */
        .nav-link { position: relative; }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          width: 0;
          height: 1px;
          background: var(--crimson);
          transform: translateX(-50%);
          transition: width 0.3s, transform 0.3s;
          transform-origin: center;
        }
        .nav-link:hover::after { width: 100%; }
        
        /* Crimson section glow tracking */
        .crimson-glow {
          background: radial-gradient(ellipse at var(--mouse-x, 30%) var(--mouse-y, 50%), #CC0000 0%, #1a0000 40%, #080808 70%);
        }
        
        /* Lookbook strip */
        .lookbook-strip {
          display: flex;
          gap: 2px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .lookbook-strip::-webkit-scrollbar { display: none; }
        
        /* Responsive */
        @media (min-width: 768px) {
          .grid-products { grid-template-columns: repeat(3, 1fr); }
          .hero-title { font-size: clamp(64px, 14vw, 140px); }
        }
        @media (max-width: 767px) {
          .custom-cursor { display: none; }
          .grid-products { grid-template-columns: 1fr; }
          .hero-title { font-size: clamp(48px, 12vw, 80px); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      
      {/* Custom cursor */}
      {!isTouch && <div ref={cursorRef} className="custom-cursor" />}
      
      <Router />
    </>
  );
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 30, y: 50 });

  useEffect(() => { 
    fetchProducts(); 
    handleMouseMove();
  }, []);

  async function fetchProducts() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false });
      setProducts((data || []).filter(p => !p.sold));
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const handleMouseMove = () => {
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    });
  };

  const revealRefs = useRef([]);
  useEffect(() => {
    revealRefs.current.forEach((ref, i) => {
      if (ref) {
        setTimeout(() => ref.classList.add("revealed"), i * 200);
      }
    });
  }, []);

  const magnetRefs = useRef([]);
  magnetRefs.current.forEach(useMagnetic);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <span className="font-display" style={{ fontSize: 28, letterSpacing: '0.1em' }}>GOROSEI</span>
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <a href="#about" className="nav-link font-mono" style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ABOUT</a>
          <a href="#drops" className="nav-link font-mono" style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DROPS</a>
          <a href="/admin" className="nav-link font-mono" style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ADMIN</a>
        </div>
      </nav>

      {/* HERO */}
      <header ref={heroRef} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 40px 80px', position: 'relative' }} className="dot-grid">
        <div ref={(el) => el && (el.style.transform = `translate(${mousePos.x * 0.06 - 3}px, 0)`)} style={{ position: 'absolute', right: '5%', top: '20%', width: '50%', height: '70%', opacity: 0.3, filter: 'brightness(0.4)' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--surface))' }} />
        </div>
        
        <div className="reveal" ref={(el) => revealRefs.current[0] = el}>
          <span className="font-mono section-num">COLLECTION 01 / 2025</span>
        </div>
        
        <h1 className="font-display hero-title" style={{ fontSize: 'clamp(48px, 12vw, 130px)', lineHeight: 0.9, marginTop: 20, marginBottom: 30 }}>
          <span className="word-reveal"><span>DRESSED IN</span></span><br />
          <span className="word-reveal"><span style={{ color: 'var(--crimson)' }}>SILENCE.</span></span>
        </h1>
        
        <div className="reveal" ref={(el) => revealRefs.current[1] = el} style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          <a href="#drops" className="btn">SHOP NOW</a>
          <a href="#lookbook" className="btn btn-ghost">LOOKBOOK</a>
        </div>
      </header>

      {/* ABOUT */}
      <section id="about" style={{ padding: '120px 40px', background: 'var(--surface)', position: 'relative' }} className="dot-grid">
        <div className="reveal" ref={(el) => revealRefs.current[2] = el} style={{ maxWidth: 900, margin: '0 auto', position: 'relative', padding: 80, border: '1px solid transparent' }} className="bracket bracket-tl bracket-br">
          <span className="font-mono section-num red">• WHO WE ARE</span>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, marginTop: 30 }}>
            FASHION BUILT FOR <span style={{ color: 'var(--crimson)' }}>SHADOWS.</span>
          </h2>
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 520, marginTop: 30 }}>
            Clothing for those who dress with intention. We choose dark because it's deliberate — not because it's a trend. Built for the shadows. Designed in silence.
          </p>
        </div>
      </section>

      {/* CRIMSON FEATURE */}
      <section 
        className="crimson-glow" 
        style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden', minHeight: '80vh' }}
        style={{ background: `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, #CC0000 0%, #1a0000 50%, var(--bg) 100%)` }}
      >
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, maxWidth: 1400, margin: '0 auto', alignItems: 'center' }}>
          <div className="reveal" ref={(el) => revealRefs.current[3] = el} style={{ position: 'relative' }}>
            {products[0]?.Image_url && (
              <img 
                src={getImageUrl(products[0].Image_url)} 
                alt="Featured" 
                style={{ width: '100%', maxHeight: 600, objectFit: 'contain', filter: 'brightness(0.3) contrast(1.2)', mixBlendMode: 'luminosity' }} 
              />
            )}
          </div>
          
          <div className="reveal" ref={(el) => revealRefs.current[4] = el}>
            <span className="font-mono section-num red">[01] THE DROP</span>
            <h3 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 0.95, marginTop: 20, marginBottom: 30 }}>
              PROTECT<br />YOURSELF
            </h3>
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 30 }}>
              Premium tactical wear. Engineered for the streets. Every piece designed with purpose.
            </p>
            <a href="#drops" className="btn btn-ghost">EXPLORE →</a>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="drops" style={{ padding: '120px 40px' }}>
        <span className="font-mono section-num reveal">[02] AVAILABLE</span>
        
        {loading && <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-muted)' }}>LOADING...</div>}
        
        {!loading && products.length === 0 && (
          <div style={{ padding: 100, textAlign: 'center' }}>
            <p className="font-display" style={{ fontSize: 48 }}>NO DROPS</p>
            <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>8PM DAILY</p>
          </div>
        )}
        
        <div className="grid-products" style={{ display: 'grid', gap: 1, marginTop: 40, background: 'var(--surface-light)' }}>
          {products.map((p, i) => (
            <a href={`/product/${p.id}`} key={p.id} className="product-card" style={{ background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1', background: 'var(--surface-light)', position: 'relative' }}>
                {p.Image_url ? (
                  <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) contrast(1.1)' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>NO IMAGE</div>
                )}
                {/* Bracket overlays */}
                <div style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderLeft: '1px solid var(--crimson)', borderTop: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRight: '1px solid var(--crimson)', borderTop: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16, width: 24, height: 24, borderLeft: '1px solid var(--crimson)', borderBottom: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderRight: '1px solid var(--crimson)', borderBottom: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
                {/* Specular highlight */}
                <div className="specular" />
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>{p.Name}</span>
                  <span style={{ color: 'var(--crimson)', fontSize: 12 }}>KSh {FIXED_PRICE}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{p.size || 'OS'}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--crimson)', letterSpacing: '0.1em' }}>VIEW →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* LOOKBOOK */}
      <section id="lookbook" style={{ padding: '80px 0' }}>
        <span className="font-mono section-num" style={{ padding: '0 40px' }}>[03] LOOKBOOK</span>
        <div className="lookbook-strip" style={{ marginTop: 40 }}>
          {[1,2,3,4].map((_, i) => (
            <div key={i} style={{ minWidth: '60vw', height: '60vh', background: 'var(--surface)', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>LOOK 0{i+1}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '60px 40px', borderTop: '1px solid var(--crimson)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-display" style={{ fontSize: 24 }}>GOROSEI</span>
          <div style={{ display: 'flex', gap: 30 }}>
            <a href="#" className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>INSTAGRAM</a>
            <a href="#" className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>TWITTER</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 10 }} className="font-mono">
          © 2025 GOROSEI KENYA — ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  );
}

function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProduct(); }, [id]);

  async function fetchProduct() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").eq("id", id).single();
      setProduct(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-muted)' }}>LOADING...</span></div>;
  if (!product) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-muted)' }}>NOT FOUND</span></div>;

  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Gorosei, I want: ${product.Name} (${product.size || 'OS'}) - KSh ${FIXED_PRICE}`)}`;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 40px', borderBottom: '1px solid var(--surface-light)' }}>
        <a href="/" className="font-display" style={{ fontSize: 20 }}>← BACK</a>
        <span className="font-display" style={{ fontSize: 20 }}>GOROSEI</span>
      </nav>

      <main style={{ padding: '120px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, maxWidth: 1400, margin: '0 auto', alignItems: 'center' }}>
        <div style={{ aspectRatio: '1', background: 'var(--surface)', position: 'relative' }} className="bracket bracket-tl bracket-br">
          {product.Image_url ? (
            <img src={getImageUrl(product.Image_url)} alt={product.Name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0.6)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>NO IMAGE</div>
          )}
        </div>

        <div>
          <span className="font-mono section-num red">PRODUCT DETAIL</span>
          <h1 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.9, marginTop: 20 }}>{product.Name}</h1>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.25em', display: 'block', marginTop: 10 }}>SIZE: {product.size || 'OS'}</span>
          
          <p style={{ fontSize: 36, fontWeight: 'bold', color: 'var(--crimson)', marginTop: 40 }}>KSh {FIXED_PRICE}</p>
          
          <a href={buyLink} className="btn" style={{ display: 'inline-block', marginTop: 30 }}>ADD TO CART →</a>
        </div>
      </main>
    </div>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [url, setUrl] = useState("");
  const [imageMode, setImageMode] = useState("file");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  function handleFileChange(e) { const f = e.target.files?.[0]; setFile(f); setPreview(f ? URL.createObjectURL(f) : null); setUrl(""); }
  function handleUrlChange(e) { setUrl(e.target.value); setFile(null); setPreview(null); }
  function toggleMode(mode) { setImageMode(mode); setFile(null); setPreview(null); setUrl(""); }

  async function handleAdd() {
    if (!name) { setStatus("Name required"); return; }
    if (imageMode === "url" && !url) { setStatus("URL required"); return; }
    if (imageMode === "file" && !file) { setStatus("File required"); return; }
    setSaving(true);
    setStatus(imageMode === "url" ? "Saving..." : "Uploading...");
    try {
      let imagePath;
      if (imageMode === "url") {
        imagePath = url.trim();
      } else {
        const fileName = `img_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { data, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
        if (uploadError) throw uploadError;
        imagePath = data.path;
      }
      const { error: insertError } = await supabase.from("products for Gorosei").insert({ Name: name.trim(), Price: FIXED_PRICE, size, Image_url: imagePath, sold: false });
      if (insertError) throw insertError;
      setStatus("Done!");
      setName(""); setFile(null); setPreview(null); setUrl("");
      fetchProducts();
    } catch (err) { 
      console.error("Error:", err);
      setStatus("Error: " + (err.message || JSON.stringify(err))); 
    }
    finally { setSaving(false); }
  }

  async function fetchProducts() { 
    const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false }); 
    setProducts(data || []); 
  }
  async function markSold(id) { await supabase.from("products for Gorosei").update({ sold: true }).eq("id", id); fetchProducts(); }
  async function deleteProduct(id) { await supabase.from("products for Gorosei").delete().eq("id", id); fetchProducts(); }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '120px 40px 50px' }}>
      <nav style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-display" style={{ fontSize: 28 }}>ADMIN</span>
        <a href="/" className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>← STORE</a>
      </nav>

      <div style={{ maxWidth: 500 }}>
        <span className="font-mono section-num red">[01] ADD DROP</span>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 20, marginBottom: 20 }}>
          <button onClick={() => toggleMode("file")} style={{ flex: 1, padding: 16, background: imageMode === "file" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>UPLOAD FILE</button>
          <button onClick={() => toggleMode("url")} style={{ flex: 1, padding: 16, background: imageMode === "url" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>PASTE URL</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PRODUCT NAME" style={{ width: '100%', padding: 16, marginBottom: 15, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 14 }} />
        
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 14 }}>
            <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="OS">OS</option>
          </select>
          {imageMode === "file" ? (
            <label style={{ flex: 1, padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {file ? file.name : "CHOOSE IMAGE"}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          ) : (
            <input value={url} onChange={handleUrlChange} placeholder="IMAGE URL" style={{ flex: 1, padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 12 }} />
          )}
        </div>

        {preview && <img src={preview} style={{ width: 100, height: 100, objectFit: 'cover', marginBottom: 15 }} />}

        <button onClick={handleAdd} disabled={saving} style={{ width: '100%', padding: 18, background: 'var(--crimson)', border: 'none', color: 'var(--bg)', fontSize: 12, fontWeight: 'bold', letterSpacing: '0.2em', cursor: 'pointer' }}>
          {saving ? "..." : `ADD (${FIXED_PRICE} KES)`}
        </button>
        
        {status && <p style={{ marginTop: 15, color: status.includes("Error") ? 'var(--crimson)' : 'var(--text)', fontSize: 12 }}>{status}</p>}
      </div>

      <div style={{ marginTop: 60, maxWidth: 500 }}>
        <span className="font-mono section-num red">[02] STOCK ({products.length})</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {products.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 15, padding: 15, background: 'var(--surface)', alignItems: 'center' }}>
              <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: 50, height: 50, objectFit: 'cover', background: 'var(--surface-light)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13 }}>{p.Name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.size} // {FIXED_PRICE} KES</p>
                <span style={{ fontSize: 10, color: p.sold ? 'var(--crimson)' : '#4ade80' }}>{p.sold ? "SOLD" : "AVAIL"}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!p.sold && <button onClick={() => markSold(p.id)} style={{ border: '1px solid #4ade80', color: '#4ade80', background: 'none', padding: '8px 12px', fontSize: 10 }}>SOLD</button>}
                <button onClick={() => deleteProduct(p.id)} style={{ border: '1px solid var(--crimson)', color: 'var(--crimson)', background: 'none', padding: '8px 12px', fontSize: 10 }}>DEL</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}