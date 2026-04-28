import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bmasldizsbbgvrrdsfek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 1500;
const BUCKET_NAME = "products-images";
const ADMIN_PASSWORD = "gorosei2025";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

function useParallax(intensity = 10) {
  const offset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e) => {
      offset.current.x = (e.clientX / window.innerWidth - 0.5) * intensity;
      offset.current.y = (e.clientY / window.innerHeight - 0.5) * intensity;
    };
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, [intensity]);
  return offset;
}

function useScrollReveal(threshold = 0.3) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, visible]);

  return [ref, visible];
}

function AnimatedSection({ children, className = "", delay = 0 }) {
  const [ref, visible] = useScrollReveal(0.25);

  return (
    <div
      ref={ref}
      className={`fade-section ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.3s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function Section({ id, children, className = "" }) {
  const [ref, visible] = useScrollReveal(0.25);

  return (
    <section
      id={id}
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.3s ease-out',
      }}
    >
      {children}
    </section>
  );
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

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return scrolled;
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
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
        
        :root {
          --bg: #030303;
          --surface: #080808;
          --surface-light: #111111;
          --crimson: #CC0000;
          --text: #FAFAFA;
          --text-muted: #666666;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: 'Space Mono', monospace; overflow-x: hidden; }
        a { color: inherit; text-decoration: none; }
        
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        /* Buttons - snappy */
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
          transition: all 0.2s ease-out;
          cursor: pointer;
        }
        .btn:hover {
          background: transparent;
          color: var(--crimson);
          box-shadow: 0 0 30px rgba(204, 0, 0, 0.4);
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
        
        /* Navigation */
        .nav-link { position: relative; }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--crimson);
          transition: width 0.2s ease-out;
        }
        .nav-link:hover::after { width: 100%; }
        
        /* Hover Effects - snappy */
        .hover-lift { transition: transform 0.25s ease-out, box-shadow 0.25s ease-out; }
        .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
        
        .hover-scale { transition: transform 0.2s ease-out; }
        .hover-scale:hover { transform: scale(1.03); }
        
        .hover-glow { transition: box-shadow 0.25s ease-out; }
        .hover-glow:hover { box-shadow: 0 0 30px rgba(204, 0, 0, 0.3); }
        
        /* Product Card */
        .product-card {
          background: var(--surface);
          border: 1px solid var(--surface-light);
          transition: transform 0.25s ease-out, box-shadow 0.25s ease-out, border-color 0.25s ease-out;
          overflow: hidden;
        }
        .product-card:hover {
          border-color: var(--crimson);
          transform: translateY(-6px);
        }
        .product-card .image-container {
          aspect-ratio: 3/4;
          overflow: hidden;
          position: relative;
        }
        .product-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease-out;
        }
        .product-card:hover img { transform: scale(1.05); }
        
        /* Cursor - snappy */
        .cursor-dot {
          width: 8px;
          height: 8px;
          background: var(--crimson);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          transition: width 0.15s, height 0.15s, background 0.15s;
        }
        .cursor-dot.active {
          width: 24px;
          height: 24px;
          background: rgba(204, 0, 0, 0.2);
        }
        
        /* Hero Animations - instant */
        .hero-bg { transition: transform 0.15s ease-out; }
        
        .hero-title {
          animation: fadeUp 0.4s ease-out forwards;
          animation-delay: 0.1s;
          opacity: 0;
        }
        
        .hero-subtitle {
          animation: fadeUp 0.4s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .hero-cta {
          animation: fadeUp 0.4s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Scroll indicator */
        .scroll-indicator { animation: bounce 1.2s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        
        /* Section spacing */
        section { padding: 120px 48px; }
        
        /* Scroll reveal - minimal */
        .fade-section { will-change: opacity, transform; }
        
        @media (min-width: 1024px) {
          .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; }
          .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 64px; align-items: center; }
        }
        
        @media (max-width: 1023px) {
          .grid-3 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }
          .grid-2 { display: grid; gap: 48px; }
          section { padding: 100px 24px; }
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--surface-light); }
        
        @media (pointer: coarse) {
          .cursor-dot { display: none; }
        }
      `}</style>
      
      <Router />
    </>
  );
}

function CustomerPage() {
  const parallax = useParallax(8);
  const { pos, active } = useMouseFollow();
  const scrolled = useNavScroll();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products for Gorosei")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Fetch error:", error);
      }
      setProducts((data || []).filter(p => !p.sold));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* CURSOR */}
      <div
        className={`cursor-dot ${active ? 'active' : ''}`}
        style={{ left: pos.current.x, top: pos.current.y }}
      />

      {/* NAV */}
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
        background: scrolled ? 'rgba(3,3,3,0.98)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="GOROSEI" style={{ height: 32 }} />
        </a>
        <div style={{ display: 'flex', gap: 48 }}>
          <a href="#drop" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>DROP</a>
          <a href="#values" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>VALUES</a>
          <a href="/admin" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>ADMIN</a>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background */}
        <div className="hero-bg" style={{
          position: 'absolute',
          inset: 0,
          background: 'url(/hero.png) center/cover no-repeat',
          filter: 'brightness(0.4) grayscale(20%)',
          transform: `translate(${parallax.current.x}px, ${parallax.current.y}px)`,
        }} />
        
        {/* Red glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(204,0,0,0.15) 0%, transparent 60%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px' }}>
          <h1 className="font-display hero-title" style={{
            fontSize: 'clamp(72px, 18vw, 200px)',
            letterSpacing: '0.02em',
            lineHeight: 0.9,
          }}>
            GOROSEI
          </h1>
          <p className="font-mono hero-subtitle" style={{
            fontSize: 'clamp(12px, 2vw, 16px)',
            letterSpacing: '0.5em',
            color: 'var(--text-muted)',
            marginTop: 24,
          }}>
            LOYALTY OVER EVERYTHING
          </p>
          <div className="hero-cta" style={{ marginTop: 64 }}>
            <a href="#drop" className="btn">SHOP THE DROP</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator" style={{
          position: 'absolute',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>SCROLL</span>
          <div style={{ width: 1, height: 30, background: 'var(--crimson)' }} />
        </div>
      </section>

      {/* 2. PRODUCT DROP */}
      <Section id="drop">
        <AnimatedSection>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>01 — THE DROP</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(48px, 10vw, 96px)', marginTop: 16 }}>PIECES</h2>
          </div>
          
          <div className="grid-3" style={{ marginTop: 80, maxWidth: 1400, margin: '80px auto 0' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}>LOADING...</div>
            ) : products.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100 }}>
                <p className="font-display" style={{ fontSize: 48 }}>NO PRODUCTS YET</p>
                <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>Add products in /admin</p>
              </div>
            ) : products.map((p, i) => (
              <a 
                href={p.id ? `/product/${p.id}` : "#drop"} 
                key={p.id || i}
                className="product-card hover-lift hover-glow"
                style={{ display: 'block', cursor: 'pointer' }}
              >
                <div className="image-container">
                  {p.Image_url ? (
                    <img 
                      src={getImageUrl(p.Image_url)} 
                      alt={p.Name}
                      className="hover-scale"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="font-display" style={{ fontSize: 48, color: 'var(--text-muted)' }}>{p.Name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: 24 }}>
                  <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--crimson)' }}>{p.size || 'T-SHIRT'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                    <span className="font-display" style={{ fontSize: 24 }}>{p.Name}</span>
                    <span style={{ color: 'var(--crimson)', fontSize: 14 }}>KSh {FIXED_PRICE}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </AnimatedSection>
      </Section>

      {/* 3. IDENTITY SECTION */}
      <section style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(204,0,0,0.08) 0%, transparent 50%)',
        }} />
        
        <AnimatedSection>
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(40px, 10vw, 120px)', lineHeight: 1 }}>
              NOT JUST<br />A BRAND.
            </h2>
            <h2 className="font-display" style={{ fontSize: 'clamp(40px, 10vw, 120px)', lineHeight: 1, color: 'var(--crimson)', marginTop: 24 }}>
              A BROTHERHOOD.
            </h2>
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 48, lineHeight: 2 }}>
              We don't chase trends. We build legacy.<br />
              Every design tells a story. Every piece means something.<br />
              This is for the ones who know.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* 4. FEATURED PIECES */}
      <Section>
        <AnimatedSection>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>02 — FEATURED</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(48px, 10vw, 96px)', marginTop: 16 }}>FOCUS</h2>
          </div>

          <div className="grid-2" style={{ marginTop: 80, maxWidth: 1200, margin: '80px auto 0' }}>
            {/* Featured 1 */}
            <div className="hover-scale" style={{ position: 'relative', overflow: 'hidden' }}>
              <img 
                src="/hero.png" 
                alt="Featured"
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', filter: 'brightness(0.8)' }}
              />
            </div>
            <div>
              <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>FEATURED</p>
              <h3 className="font-display" style={{ fontSize: 48, marginTop: 16 }}>INFERNO</h3>
              <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.8 }}>
                Built for presence. Worn with intent.<br />
                Premium heavyweight cotton.<br />
                Limited release.
              </p>
              <a href="#" className="btn btn-outline" style={{ marginTop: 40 }}>VIEW PRODUCT</a>
            </div>
          </div>
        </AnimatedSection>
      </Section>

      {/* 6. BRAND VALUES */}
      <Section id="values">
        <AnimatedSection>
          <section style={{ padding: '120px 48px', borderTop: '1px solid var(--surface-light)', borderBottom: '1px solid var(--surface-light)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 64, maxWidth: 1200, margin: '0 auto' }}>
              {[
                { title: "Premium Quality", desc: "280GSM heavyweight cotton" },
                { title: "Limited Drop", desc: "Once they're gone, they're gone" },
                { title: "Worldwide Shipping", desc: "Wherever you are" },
              ].map((item, i) => (
                <div key={i} className="hover-scale" style={{ textAlign: 'center', padding: 32 }}>
                  <h3 className="font-display" style={{ fontSize: 24, color: 'var(--crimson)' }}>0{i + 1}</h3>
                  <p className="font-mono" style={{ fontSize: 11, letterSpacing: '0.2em', marginTop: 16 }}>{item.title.toUpperCase()}</p>
                  <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>
      </Section>

      {/* 7. FINAL CTA */}
      <section style={{ padding: '200px 48px', textAlign: 'center' }}>
        <AnimatedSection>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px, 8vw, 80px)', lineHeight: 1 }}>
            JOIN THE<br />BROTHERHOOD
          </h2>
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 32, maxWidth: 400, margin: '32px auto' }}>
            Be first to know about drops. Exclusive access. Real ones only.
          </p>
          <a href="#drop" className="btn" style={{ marginTop: 48 }}>GET EARLY ACCESS</a>
        </AnimatedSection>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '60px 48px',
        borderTop: '1px solid var(--surface-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="GOROSEI" style={{ height: 28 }} />
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
  const parallax = useParallax(15);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const sizes = ["S", "M", "L", "XL"];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").eq("id", id).single();
      setProduct(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="font-mono" style={{ color: 'var(--text-muted)' }}>LOADING...</span>
    </div>
  );

  const name = product?.Name || id.toUpperCase();
  const size = product?.size || selectedSize;
  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi GOROSEI,\n\nI'd like to order:\n- Product: ${name}\n- Size: ${selectedSize}\n- Price: KSh ${FIXED_PRICE}\n\nIs it available?`
  )}`;

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

      {/* Full screen product */}
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
            alt={name}
            style={{
              maxWidth: '70%',
              maxHeight: '70%',
              objectFit: 'contain',
              transform: `translate(${parallax.current.x}px, ${parallax.current.y}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          />
        ) : (
          <div style={{ fontSize: 120, color: 'var(--surface-light)' }}>{name}</div>
        )}
      </div>

      {/* Product info */}
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
            <h1 className="font-display" style={{ fontSize: 48, marginTop: 8 }}>{name}</h1>
            
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
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  }

  if (!authenticated) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 400, padding: 48 }}>
          <h1 className="font-display" style={{ fontSize: 48, textAlign: 'center' }}>ADMIN</h1>
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24, textAlign: 'center' }}>Enter password to access</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            style={{ width: '100%', padding: 16, marginTop: 24, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 14, textAlign: 'center' }}
          />
          {error && <p style={{ color: 'var(--crimson)', marginTop: 16, textAlign: 'center', fontSize: 12 }}>{error}</p>}
          <button onClick={handleLogin} className="btn" style={{ width: '100%', marginTop: 24 }}>ENTER</button>
        </div>
      </div>
    );
  }

  const [name, setName] = useState("");
  const [size, setSize] = useState("M");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  async function handleAdd() {
    if (!name || !url) { setStatus("Name and URL required"); return; }
    setSaving(true);
    setStatus("Saving...");
    try {
      const { error } = await supabase.from("products for Gorosei").insert({ 
        "Name": name.trim(), 
        "Price": FIXED_PRICE, 
        size, 
        "Image_url": url.trim(), 
        sold: false 
      });
      if (error) throw error;
      setStatus("Done!");
      setName(""); setUrl("");
      fetchProducts();
    } catch (err) { 
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
      <nav style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between' }}>
        <span className="font-display" style={{ fontSize: 32 }}>ADMIN</span>
        <a href="/" className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>← STORE</a>
      </nav>

      <div style={{ maxWidth: 500 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>ADD PRODUCT</span>
        
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PRODUCT NAME" style={{ width: '100%', padding: 16, marginTop: 24, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 14 }} />
        
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)' }}>
            <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
          </select>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="IMAGE URL" style={{ flex: 1, padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)' }} />
        </div>

        <button onClick={handleAdd} disabled={saving} className="btn" style={{ width: '100%', marginTop: 24 }}>
          {saving ? "..." : "ADD PRODUCT"}
        </button>
        {status && <p style={{ marginTop: 16, color: status.includes("Error") ? 'var(--crimson)' : 'var(--text)', fontSize: 12 }}>{status}</p>}
      </div>

      <div style={{ marginTop: 64, maxWidth: 500 }}>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>STOCK ({products.length})</span>
        <div style={{ marginTop: 24 }}>
          {products.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--surface)', alignItems: 'center', marginTop: 12 }}>
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