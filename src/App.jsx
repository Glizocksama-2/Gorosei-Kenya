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

function useParallax() {
  const offset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e) => {
      offset.current.x = (e.clientX / window.innerWidth - 0.5) * 15;
      offset.current.y = (e.clientY / window.innerHeight - 0.5) * 15;
    };
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, []);
  return offset;
}

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function useMouseFollow() {
  const pos = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    const handleDown = () => setActive(true);
    const handleUp = () => setActive(false);

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mouseup", handleUp);
    };
  }, []);

  return { pos, active };
}

function useAmbientSound() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (playing) {
      setPlaying(false);
      return;
    }

    // Create subtle ambient drone
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    
    setPlaying(true);
  };

  return [toggle, playing];
}

function AnimatedSection({ children, delay = 0 }) {
  const [ref, visible] = useScrollReveal(0.15);
  
  return (
    <div 
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(60px)',
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function HoverCard({ children, className = "" }) {
  const [ref, visible] = useScrollReveal(0.2);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.98)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
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

const products = [
  { id: "demo-1", Name: "INFERNO", tagline: "Burn Bright", size: "M" },
  { id: "demo-2", Name: "SYMBOLIC", tagline: "Sign of the Times", size: "M" },
  { id: "demo-3", Name: "MINIMAL", tagline: "Less is More", size: "M" },
  { id: "demo-4", Name: "FLAME", tagline: "Eternal Fire", size: "M" },
  { id: "demo-5", Name: "ANGEL", tagline: "Heaven Sent", size: "M" },
  { id: "demo-6", Name: "SHIELD", tagline: "Built to Last", size: "M" },
];

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
        
        :root {
          --bg: #050505;
          --surface: #0a0a0a;
          --surface-light: #141414;
          --crimson: #D11F1F;
          --text: #F5F5F5;
          --text-muted: #666666;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        html { scroll-behavior: smooth; }
        
        body { 
          background: var(--bg); 
          color: var(--text); 
          font-family: 'Space Mono', monospace; 
          overflow-x: hidden;
        }
        
        a { color: inherit; text-decoration: none; }
        
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        .fade-in { opacity: 0; transform: translateY(40px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 18px 48px;
          background: var(--crimson);
          color: var(--text);
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          border: 1px solid var(--crimson);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .btn:hover {
          background: transparent;
          color: var(--crimson);
          box-shadow: 0 0 30px rgba(209, 31, 31, 0.3);
        }
        
        .btn-outline {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--text-muted);
        }
        .btn-outline:hover {
          border-color: var(--text);
          color: var(--bg);
          background: var(--text);
        }
        
        .hover-lift { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .hover-lift:hover { transform: translateY(-8px); }
        
        .glow-text {
          text-shadow: 0 0 60px rgba(209, 31, 31, 0.5);
        }
        
        /* Hover effects */
        .hover-scale { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .hover-scale:hover { transform: scale(1.03); }
        
        .hover-glow { transition: box-shadow 0.4s ease, transform 0.4s ease; }
        .hover-glow:hover { box-shadow: 0 0 40px rgba(209, 31, 31, 0.4); transform: translateY(-4px); }
        
        .hover-brightness { transition: filter 0.3s ease; }
        .hover-brightness:hover { filter: brightness(1.2); }
        
        /* Cursor follower */
        .cursor-dot {
          width: 8px;
          height: 8px;
          background: var(--crimson);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          transition: width 0.2s, height 0.2s, background 0.2s;
        }
        .cursor-dot.active {
          width: 40px;
          height: 40px;
          background: rgba(209, 31, 31, 0.2);
          backdrop-filter: blur(2px);
        }
        
        /* Magnetic button */
        .magnetic {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Smooth scroll */
        html { scroll-behavior: smooth; }
        
        /* Product card 3D */
        .product-card {
          perspective: 1000px;
        }
        .product-card-inner {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
        }
        .product-card:hover .product-card-inner {
          transform: rotateX(2deg) rotateY(-2deg) translateZ(10px);
        }
        
        /* Nav hover */
        .nav-link { position: relative; }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--crimson);
          transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }
        
        /* Reveal animations */
        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        
        /* Feature icons hover */
        .feature-icon {
          transition: transform 0.4s ease, color 0.3s ease;
        }
        .feature-icon:hover { transform: scale(1.2); color: var(--crimson); }
        
        @media (min-width: 768px) {
          .grid-products { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 767px) {
          .grid-products { grid-template-columns: repeat(2, 1fr); }
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--surface-light); }
        ::-webkit-scrollbar-thumb:hover { background: var(--crimson); }
        
        @media (pointer: coarse) {
          .cursor-dot { display: none; }
        }</style>
      
      <Router />
    </>
  );
}

function CustomerPage() {
  const parallax = useParallax();
  const { pos, active } = useMouseFollow();
  const [toggleSound, soundPlaying] = useAmbientSound();
  const [scrolled, setScrolled] = useState(false);
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetchProducts();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function fetchProducts() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false });
      const dbProducts = (data || []).filter(p => !p.sold);
      // Merge demo products with DB products
      const allProducts = [...products, ...dbProducts].slice(0, 6);
      setProducts(allProducts.length > 0 ? allProducts : [
        { id: "demo-1", Name: "INFERNO", tagline: "Burn Bright", size: "M" },
        { id: "demo-2", Name: "SYMBOLIC", tagline: "Sign of the Times", size: "M" },
        { id: "demo-3", Name: "MINIMAL", tagline: "Less is More", size: "M" },
      ]);
    } catch (err) {
      setProducts([
        { id: "demo-1", Name: "INFERNO", tagline: "Burn Bright", size: "M" },
        { id: "demo-2", Name: "SYMBOLIC", tagline: "Sign of the Times", size: "M" },
        { id: "demo-3", Name: "MINIMAL", tagline: "Less is More", size: "M" },
      ]);
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* CURSOR FOLLOWER */}
      <div 
        className={`cursor-dot ${active ? 'active' : ''}`}
        style={{
          left: pos.current.x,
          top: pos.current.y,
        }}
      />
      
      {/* SOUND TOGGLE */}
      <button
        onClick={toggleSound}
        title="Toggle ambient sound"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 48,
          zIndex: 1000,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid var(--surface-light)',
          background: 'rgba(5,5,5,0.8)',
          backdropFilter: 'blur(10px)',
          color: soundPlaying ? 'var(--crimson)' : 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'all 0.3s ease',
        }}
      >
        {soundPlaying ? '♫' : '♪'}
      </button>

      {/* STICKY NAV */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: scrolled ? 'rgba(5,5,5,0.98)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.5s ease',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo.png" alt="GOROSEI" style={{ height: 36 }} />
        </a>
        <div style={{ display: 'flex', gap: 48 }}>
          <a href="#shop" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)', transition: 'color 0.3s' }}>SHOP</a>
          <a href="#story" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)', transition: 'color 0.3s' }}>STORY</a>
          <a href="/admin" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)', transition: 'color 0.3s' }}>ADMIN</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background with glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(209,31,31,0.15) 0%, transparent 60%)',
          transform: `translate(${parallax.current.x}px, ${parallax.current.y}px)`,
          transition: 'transform 0.3s ease-out',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'url(/hero.png) center/cover no-repeat',
          opacity: 0.4,
          filter: 'grayscale(30%) contrast(1.1)',
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 24px',
        }}>
          <h1 className="font-display glow-text" style={{
            fontSize: 'clamp(80px, 20vw, 240px)',
            lineHeight: 0.85,
            letterSpacing: '0.05em',
          }}>
            GOROSEI
          </h1>
          <p className="font-display" style={{
            fontSize: 'clamp(16px, 3vw, 28px)',
            letterSpacing: '0.5em',
            color: 'var(--text-muted)',
            marginTop: 24,
          }}>
            LOYALTY OVER EVERYTHING
          </p>
          <div style={{ marginTop: 64 }}>
            <a href="#shop" className="btn">SHOP THE DROP</a>
          </div>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>SCROLL</span>
          <div style={{ width: 1, height: 40, background: 'var(--crimson)' }} />
        </div>
      </section>

      {/* FEATURES */}
      <AnimatedSection>
        <section style={{ padding: '120px 48px', borderTop: '1px solid var(--surface-light)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 64,
            maxWidth: 1200,
            margin: '0 auto',
          }}>
            {[
              { title: "Premium Heavyweight Cotton", desc: "280GSM quality" },
              { title: "Limited Drop", desc: "Once they're gone" },
              { title: "Worldwide Shipping", desc: "Wherever you are" },
            ].map((feat, i) => (
              <div key={i} className="feature-icon" style={{ textAlign: 'center', padding: 32, border: '1px solid var(--surface-light)', transition: 'all 0.3s ease' }}>
                <h3 className="font-display" style={{ fontSize: 28, color: 'var(--crimson)' }}>0{i + 1}</h3>
                <p className="font-mono" style={{ fontSize: 11, letterSpacing: '0.2em', marginTop: 16 }}>{feat.title.toUpperCase()}</p>
                <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* SHOP SECTION */}
      <AnimatedSection>
        <section id="shop" style={{ padding: '160px 48px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 80 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>01 — THE DROP</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(48px, 10vw, 96px)', marginTop: 16 }}>SHIRTS</h2>
          </div>
          
          <div className="grid-products" style={{ display: 'grid', gap: 48 }}>
            {products.slice(0, 6).map((p, i) => (
              <a 
                href={p.Image_url ? `/product/${p.id}` : "#shop"} 
                key={i} 
                className="hover-lift hover-glow product-card"
                style={{ display: 'block' }}
              >
                <div 
                  className="product-card-inner"
                  style={{
                    aspectRatio: '3/4',
                    background: 'var(--surface)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--surface-light)',
                  }}>
                  {p.Image_url ? (
                    <img 
                      src={getImageUrl(p.Image_url)} 
                      alt={p.Name}
                      className="hover-brightness"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--surface-light)',
                    }}>
                      <span className="font-display" style={{ fontSize: 64, color: 'var(--text-muted)' }}>{p.Name.charAt(0)}</span>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 24,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                  }}>
                    <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--crimson)' }}>{p.tagline || "T-SHIRT"}</p>
                  </div>
                </div>
                <div style={{ paddingTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-display" style={{ fontSize: 24 }}>{p.Name}</span>
                    <span style={{ color: 'var(--crimson)', fontSize: 14 }}>KSh {FIXED_PRICE}</span>
                  </div>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{p.size || 'M'} · HEAVYWEIGHT</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* STORY SECTION */}
      <section id="story" style={{
        padding: '200px 48px',
        position: 'relative',
        textAlign: 'center',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(209,31,31,0.1) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 800, margin: '0 auto' }}>
          <p className="font-display" style={{ fontSize: 'clamp(48px, 12vw, 120px)', lineHeight: 1 }}>
            NOT JUST<br />A BRAND.
          </p>
          <p className="font-display" style={{ fontSize: 'clamp(48px, 12vw, 120px)', lineHeight: 1, color: 'var(--crimson)', marginTop: 16 }}>
            A BROTHERHOOD.
          </p>
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 48, lineHeight: 2 }}>
            We don't chase trends. We build legacy.<br/>
            Every design tells a story. Every piece means something.<br/>
            This is for the ones who know.
          </p>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ padding: '160px 48px', textAlign: 'center' }}>
        <h2 className="font-display" style={{ fontSize: 'clamp(36px, 8vw, 72px)', lineHeight: 1 }}>
          JOIN THE BROTHERHOOD
        </h2>
        <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 24, maxWidth: 400, margin: '24px auto' }}>
          Be the first to know about drops. Exclusive access. Real ones only.
        </p>
        <a href="#shop" className="btn" style={{ marginTop: 48 }}>GET EARLY ACCESS</a>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '80px 48px',
        borderTop: '1px solid var(--surface-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo.png" alt="GOROSEI" style={{ height: 32 }} />
        </a>
        <div style={{ display: 'flex', gap: 32 }}>
          <a href="#" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>INSTAGRAM</a>
          <a href="#" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>TIKTOK</a>
        </div>
      </footer>
    </div>
  );
}

function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("M");
  const parallax = useParallax();

  useEffect(() => { fetchProduct(); }, [id]);

  async function fetchProduct() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").eq("id", id).single();
      setProduct(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="font-mono" style={{ color: 'var(--text-muted)' }}>LOADING...</span>
    </div>
  );
  
  if (!product && !products.find(p => p.id === id)) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: 64 }}>NOT FOUND</h1>
        <a href="/" className="btn" style={{ marginTop: 32 }}>BACK TO SHOP</a>
      </div>
    </div>
  );

  const p = product || products.find(p => p.id === id) || { Name: "GOROSEI SHIRT", size: "M" };
  const sizes = ["S", "M", "L", "XL"];
  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi GOROSEI, I want: ${p.Name} (Size: ${selectedSize}) - KSh ${FIXED_PRICE}`)}`;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <a href="/" style={{
        position: 'fixed',
        top: 24,
        left: 48,
        zIndex: 1000,
        padding: '12px 24px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
      }}>
        <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.2em' }}>← BACK</span>
      </a>

      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {product?.Image_url ? (
          <img 
            src={getImageUrl(product.Image_url)}
            alt={p.Name}
            style={{
              maxWidth: '80%',
              maxHeight: '80%',
              objectFit: 'contain',
              transform: `translate(${parallax.current.x}px, ${parallax.current.y}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          />
        ) : (
          <div className="font-display" style={{ fontSize: 120, color: 'var(--surface-light)' }}>{p.Name}</div>
        )}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '48px',
        background: 'linear-gradient(transparent, var(--bg))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 32 }}>
          <div>
            <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>NOW VIEWING</p>
            <h1 className="font-display" style={{ fontSize: 48, marginTop: 8 }}>{p.Name}</h1>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${selectedSize === s ? 'var(--crimson)' : 'var(--surface-light)'}`,
                    background: selectedSize === s ? 'var(--crimson)' : 'transparent',
                    color: 'var(--text)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 42, fontWeight: 'bold' }}>KSh {FIXED_PRICE}</p>
            <a href={buyLink} className="btn" style={{ marginTop: 24 }}>ORDER NOW →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [url, setUrl] = useState("");
  const [imageMode, setImageMode] = useState("url");
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
      const { error: insertError } = await supabase.from("products for Gorosei").insert({ 
        "Name": name.trim(), 
        "Price": FIXED_PRICE, 
        size, 
        "Image_url": imagePath, 
        sold: false 
      });
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
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false }); 
      setProducts(data || []); 
    } catch (err) { setProducts([]); }
  }
  async function deleteProduct(id) { 
    try {
      await supabase.from("products for Gorosei").delete().eq("id", id); 
      fetchProducts();
    } catch (err) { console.error(err); }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '120px 48px 50px' }}>
      <nav style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-display" style={{ fontSize: 32 }}>ADMIN</span>
        <a href="/" className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>← STORE</a>
      </nav>

      <div style={{ maxWidth: 500 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>ADD PRODUCT</span>
        
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={() => toggleMode("file")} style={{ flex: 1, padding: 16, background: imageMode === "file" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>UPLOAD</button>
          <button onClick={() => toggleMode("url")} style={{ flex: 1, padding: 16, background: imageMode === "url" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>URL</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PRODUCT NAME" style={{ width: '100%', padding: 16, marginTop: 24, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 14 }} />
        
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)' }}>
            <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
          </select>
          {imageMode === "file" ? (
            <label style={{ flex: 1, padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {file ? file.name : "CHOOSE IMAGE"}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          ) : (
            <input value={url} onChange={handleUrlChange} placeholder="IMAGE URL" style={{ flex: 1, padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)' }} />
          )}
        </div>

        {preview && <img src={preview} style={{ width: 100, height: 100, objectFit: 'cover', marginTop: 16 }} />}

        <button onClick={handleAdd} disabled={saving} style={{ width: '100%', padding: 18, background: 'var(--crimson)', border: 'none', color: 'var(--text)', fontSize: 12, fontWeight: 'bold', marginTop: 24, cursor: 'pointer' }}>
          {saving ? "..." : `ADD PRODUCT`}
        </button>
        {status && <p style={{ marginTop: 16, color: status.includes("Error") ? 'var(--crimson)' : 'var(--text)', fontSize: 12 }}>{status}</p>}
      </div>

      <div style={{ marginTop: 64, maxWidth: 500 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>STOCK ({products.length})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          {products.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--surface)', alignItems: 'center' }}>
              {p.Image_url && <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: 60, height: 60, objectFit: 'cover' }} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14 }}>{p.Name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Size: {p.size}</p>
              </div>
              <button onClick={() => deleteProduct(p.id)} style={{ padding: '8px 16px', border: '1px solid var(--crimson)', color: 'var(--crimson)', background: 'none', fontSize: 10, cursor: 'pointer' }}>DEL</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}