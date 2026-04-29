import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bmasldizsbbgvrrdsfek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 2000;
const ORIGINAL_PRICE = 2500;
const BUCKET_NAME = "products-images";
const ADMIN_PASSWORD = "gorosei2025";
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1498814467864264854/BM_MgL_SsTsYWT_5XwD3hnyUwy2o4yFX9z1yHcGFQahhw2rLYWz1OXj_aGuzwYqs1xZQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function useMousePosition() {
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const active = useRef(false);
  
  useEffect(() => {
    const handleMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      active.current = true;
    };
    const handleEnter = () => { active.current = true; };
    const handleLeave = () => { active.current = false; };
    
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseenter", handleEnter);
    document.addEventListener("mouseleave", handleLeave);
    
    let animating = true;
    const loop = () => {
      if (!animating) return;
      pos.current.x = lerp(pos.current.x, target.current.x, 0.12);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.12);
      requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      animating = false;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);
  
  return { pos, active };
}

function useScrollReveal(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  
  return { ref, visible };
}

function useParallax(intensity = 10) {
  const offset = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * intensity;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * intensity;
    };
    
    document.addEventListener("mousemove", handleMove);
    
    let animating = true;
    const loop = () => {
      if (!animating) return;
      offset.current.x = lerp(offset.current.x, target.current.x, 0.12);
      offset.current.y = lerp(offset.current.y, target.current.y, 0.12);
      requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      animating = false;
      document.removeEventListener("mousemove", handleMove);
    };
  }, [intensity]);
  
  return offset;
}

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return scrolled;
}

function useRedGlow() {
  const pos = useRef({ x: 50, y: 50 });
  
  useEffect(() => {
    const handleMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      document.documentElement.style.setProperty('--mx', `${pos.current.x}px`);
      document.documentElement.style.setProperty('--my', `${pos.current.y}px`);
    };
    
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, []);
  
  return pos;
}

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
        console.error("Error:", error);
        setStatus("Error. Try again.");
      } else {
        await fetch(DISCORD_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "🆕 **NEW BROTHERHOOD MEMBER**\n\n📱: " + email.trim() + "\n⏰: " + new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
          })
        });
        
        setSubmitted(true);
        setStatus("You're in!");
      }
    } catch (err) {
      setStatus("Error. Try again.");
    }
  }
  
  if (submitted) {
    return (
      <div style={{ marginTop: 48, padding: 32, border: '1px solid var(--crimson)', display: 'inline-block' }}>
        <p className="font-display" style={{ fontSize: 24 }}>WELCOME TO THE BROTHERHOOD</p>
        <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Check your WhatsApp for confirmation.</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 48 }}>
      <div style={{ display: 'flex', gap: 0, maxWidth: 400, margin: '0 auto', border: '1px solid var(--surface-light)' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="WhatsApp number"
          required
          style={{
            flex: 1,
            padding: '16px 20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button type="submit" className="btn" style={{ border: 'none', borderRadius: 0 }}>
          JOIN
        </button>
      </div>
      {status && (
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--crimson)', marginTop: 16 }}>{status}</p>
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
    
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      
      if (dist < 70) {
        const factor = (70 - dist) / 70;
        setTransform({
          x: (distX / dist) * factor * 10,
          y: (distY / dist) * factor * 10,
        });
      } else {
        setTransform({ x: 0, y: 0 });
      }
    };
    
    const handleLeave = () => {
      setTransform({ x: 0, y: 0 });
    };
    
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
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
    
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((centerY - y) / centerY) * 8;
      const rotateY = ((x - centerX) / centerX) * 8;
      
      setTilt({ x: rotateX, y: rotateY });
      setLight({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    };
    
    const handleLeave = () => {
      setTilt({ x: 0, y: 0 });
    };
    
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);
  
  const name = product?.Name || "UNNAMED";
  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi GOROSEI,\n\nI'd like to order:\n- Product: ${name}\n- Price: KSh ${FIXED_PRICE}\n\nIs it available?`
  )}`;
  
  return (
    <a
      href={product?.id ? `/product/${product.id}` : "#drop"}
      ref={ref}
      className="product-card"
      style={{
        display: 'block',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.5s ease',
      }}
    >
      <div
        className="image-wrapper"
        style={{ '--lx': `${light.x}%`, '--ly': `${light.y}%` }}
      >
        {product?.Image_url ? (
          <img
            src={getImageUrl(product.Image_url)}
            alt={name}
            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', filter: 'none' }}
          />
        ) : (
          <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-display" style={{ fontSize: 48, color: 'var(--text-muted)' }}>{name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-display" style={{ fontSize: 20 }}>{name}</span>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--crimson)', letterSpacing: '0.1em' }}>KSh {FIXED_PRICE}</span>
        </div>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, display: 'block', letterSpacing: '0.2em' }}>ADD TO CART →</span>
      </div>
    </a>
  );
}

function AnimatedSection({ children }) {
  const { ref, visible } = useScrollReveal(0.15);
  
  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''}`}>
      {children}
    </div>
  );
}

function HeroParallaxLayers() {
  const heroRef = useRef(null);
  const imageRef = useRef(null);
  const grainRef = useRef(null);
  const textRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5);
      target.current.y = (e.clientY / window.innerHeight - 0.5);
    };
    
    document.addEventListener("mousemove", handleMove);
    
    let animating = true;
    const loop = () => {
      if (!animating) return;
      
      if (imageRef.current) {
        imageRef.current.style.transform = `translate(${target.current.x * 10}px, ${target.current.y * 10}px)`;
      }
      if (grainRef.current) {
        grainRef.current.style.transform = `translate(${target.current.x * -22}px, ${target.current.y * -22}px)`;
      }
      if (textRef.current) {
        textRef.current.style.transform = `translate(${-target.current.x * 6}px, ${-target.current.y * 6}px)`;
      }
      
      requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      animating = false;
      document.removeEventListener("mousemove", handleMove);
    };
  }, []);
  
  return { heroRef, imageRef, grainRef, textRef };
}

function WordReveal({ text, className = "", splitOn = " " }) {
  const words = text.split(splitOn);
  const { ref, visible } = useScrollReveal(0.15);
  
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className={`reveal-word ${visible ? 'visible' : ''}`}
          style={{ transitionDelay: `${i * 55}ms`, display: 'inline-block', marginRight: splitOn === " " ? '0.3em' : 0 }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

function CustomerPage() {
  const { pos, active } = useMousePosition();
  const scrolled = useNavScroll();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const imageEl = document.querySelector('.hero-image-layer');
    const grainEl = document.querySelector('.hero-grain-layer');
    const textEl = document.querySelector('.hero-text-layer');
    
    if (imageEl && grainEl && textEl) {
      const handleMove = (e) => {
        const x = (e.clientX / window.innerWidth - 0.5);
        const y = (e.clientY / window.innerHeight - 0.5);
        imageEl.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
        grainEl.style.transform = `translate(${-x * 22}px, ${-y * 22}px)`;
        textEl.style.transform = `translate(${-x * 6}px, ${-y * 6}px)`;
      };
      
      document.addEventListener("mousemove", handleMove);
      return () => document.removeEventListener("mousemove", handleMove);
    }
  }, []);
  
  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products for Gorosei")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) console.error("Fetch error:", error);
      const available = (data || []).filter(p => !p.sold);
      setProducts(available);
    } catch (err) {
      console.error("Catch error:", err);
    }
    setLoading(false);
  }
  
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* CUSTOM CURSOR */}
      <div
        className={`cursor-dot ${active.current ? 'active' : ''}`}
        style={{ left: pos.current.x, top: pos.current.y }}
      />
      
      {/* NAV */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: scrolled ? '16px 48px' : '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: scrolled ? 'rgba(8,8,8,0.98)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="GOROSEI" style={{ height: 32 }} />
        </a>
        <div style={{ display: 'flex', gap: 48 }}>
          <a href="#drop" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>SHOP</a>
          <a href="#about" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>ABOUT</a>
          <a href="#contact" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>CONTACT</a>
          <a href="/admin" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>ADMIN</a>
        </div>
      </nav>
      
      {/* SECTION 1: HERO */}
      <section style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Hero Background Image - 100vh visible on load */}
        <div
          className="hero-image-layer"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'url(/hero.png) center/cover no-repeat',
            filter: 'brightness(0.85)',
            objectFit: 'cover',
          }}
        />
        
        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.9) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.95) 0%, transparent 40%)' }} />
        
        {/* Grain layer */}
        <div
          className="hero-grain-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.04,
            pointerEvents: 'none',
          }}
        />
        
        {/* Content */}
        <div
          className="hero-text-layer"
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '0 48px',
            width: '100%',
            maxWidth: 1200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            minHeight: '100vh',
            paddingBottom: 120,
          }}
        >
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>COLLECTION 01 — 2025</span>
          
          <h1 className="font-display" style={{
            fontSize: 'clamp(64px, 9vw, 130px)',
            lineHeight: 0.88,
            marginTop: 24,
          }}>
            YOUR REAL<br />
            SELF STARTS<br />
            <span style={{ color: 'var(--crimson)' }}>HERE.</span>
          </h1>
          
          <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
            <MagneticButton>
              <a href="#drop" className="btn">SHOP THE DROP</a>
            </MagneticButton>
            <a href="#about" className="btn btn-outline">LOOKBOOK</a>
          </div>
        </div>
        
        {/* Scroll indicator right side */}
        <div style={{
          position: 'absolute',
          right: 48,
          top: '50%',
          transform: 'translateY(-50%)',
          writingMode: 'vertical-rl',
        }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>SCROLL ↓</span>
        </div>
      </section>
      
      {/* SECTION 2: ABOUT */}
      <section id="about" className="section section-dark">
        <AnimatedSection>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 48px', position: 'relative' }}>
            {/* Concentric circles decorative */}
            <div className="concentric-circles" />
            
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>• WHO WE ARE</span>
            
            <h2 className="font-display" style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              lineHeight: 1,
              marginTop: 24,
            }}>
              A KENYAN BRAND THAT WILL HAVE YOU FEELING LIKE YOUR <span style={{ color: 'var(--crimson)' }}>REAL SELF.</span>
            </h2>
            
            <p className="font-mono" style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 48,
              lineHeight: 1.7,
              maxWidth: 520,
            }}>
              Born in Nairobi. Worn worldwide. Every piece is made for the person who already knows who they are — they just needed the right uniform.
            </p>
            
            {/* Corner brackets */}
            <div className="corner-brackets" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          </div>
        </AnimatedSection>
      </section>
      
      {/* SECTION 3: FEATURE DROP (Red glow follows cursor) */}
      <section className="section section-red-glow" style={{ minHeight: '80vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* Left - Product image */}
          <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            {products[0]?.Image_url ? (
              <img
                src={getImageUrl(products[0].Image_url)}
                alt={products[0].Name}
                style={{
                  width: '100%',
                  maxWidth: 'none',
                  height: '80vh',
                  objectFit: 'cover',
                  filter: 'none',
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '80vh', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="font-display" style={{ fontSize: 64, color: 'var(--text-muted)' }}>THE DROP</span>
              </div>
            )}
          </div>
          
          {/* Right - Content */}
          <div>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>[01]</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(64px, 9vw, 130px)', lineHeight: 0.88, marginTop: 24 }}>
              THE DROP
            </h2>
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 32, lineHeight: 1.8 }}>
              Limited release. Once they're gone, they're gone.<br />
              Premium quality. Real identity.
            </p>
            <a href="#drop" className="btn btn-ghost" style={{ marginTop: 48 }}>VIEW COLLECTION →</a>
          </div>
        </div>
        
        {/* Dot grid overlay */}
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      </section>
      
      {/* SECTION 4: PRODUCT GRID */}
      <section id="drop" className="section">
        <AnimatedSection>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>02 — PIECES</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(48px, 10vw, 96px)', marginTop: 16 }}>THE DROP</h2>
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
              <ProductCard key={i} product={p} />
            ))}
          </div>
        </AnimatedSection>
      </section>
      
      {/* SECTION 5: FULL-WIDTH PRODUCT STRIP */}
      <section style={{ padding: '80px 0' }}>
        <div className="product-strip">
          {products.slice(0, 4).map((p, i) => (
            <a
              key={i}
              href={p.id ? `/product/${p.id}` : "#drop"}
              className="product-strip-item"
            >
              {p.Image_url ? (
                <img src={getImageUrl(p.Image_url)} alt={p.Name} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="font-display" style={{ fontSize: 32, color: 'var(--text-muted)' }}>{p.Name?.charAt(0) || '?'}</span>
                </div>
              )}
              <div className="info">
                <span className="font-display" style={{ fontSize: 18 }}>{p.Name}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--crimson)', marginLeft: 12 }}>KSh {FIXED_PRICE}</span>
              </div>
            </a>
          ))}
        </div>
      </section>
      
      {/* SECTION 6: LOOKBOOK STATEMENT */}
      <section className="section" style={{ padding: '200px 48px', textAlign: 'center' }}>
        <AnimatedSection>
          <h2 className="font-display" style={{ fontSize: 'clamp(64px, 12vw, 160px)', lineHeight: 0.9 }}>
            GOROSEI<br />WORLDWIDE.
          </h2>
          <div style={{ width: 120, height: 1, background: 'var(--crimson)', margin: '48px auto' }} />
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', lineHeight: 1.8 }}>
            From Nairobi streets to the world.<br />
            Dressed in your real self.
          </p>
        </AnimatedSection>
      </section>
      
      {/* SECTION 7: FINAL CTA */}
      <section id="contact" className="section" style={{ textAlign: 'center', padding: '200px 48px' }}>
        <AnimatedSection>
          <h2 className="font-display" style={{ fontSize: 'clamp(48px, 10vw, 96px)', lineHeight: 1 }}>
            JOIN THE<br />BROTHERHOOD
          </h2>
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 32, maxWidth: 400, margin: '32px auto' }}>
            Be first to know about drops. Exclusive access. Real ones only.
          </p>
          
          <NewsletterForm />
        </AnimatedSection>
      </section>
      
      {/* FOOTER */}
      <footer className="section footer" style={{ minHeight: 'auto', padding: '60px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" alt="GOROSEI" style={{ height: 28 }} />
          </a>
          <div style={{ display: 'flex', gap: 32 }}>
            <a href="https://instagram.com/goroseikenya" target="_blank" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>INSTAGRAM</a>
            <a href="https://tiktok.com/@goroseikenya" target="_blank" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>TIKTOK</a>
            <a href="https://wa.me/254734944512" target="_blank" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>WHATSAPP</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--surface-light)' }}>
          <span className="font-mono" style={{ fontSize: 10, color: '#333' }}>© 2025 GOROSEI — ALL RIGHTS RESERVED</span>
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
  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi GOROSEI,\n\nI'd like to order:\n- Product: ${name}\n- Size: ${selectedSize}\n- Price: KSh ${FIXED_PRICE}\n\nIs it available?`
  )}`;
  
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <a href="/" style={{
        position: 'fixed',
        top: 16,
        left: 24,
        zIndex: 1000,
        padding: '10px 20px',
        backdropFilter: 'blur(10px)',
        fontSize: 11,
        background: 'rgba(0,0,0,0.9)',
      }}>
        <span className="font-mono" style={{ letterSpacing: '0.2em' }}>← BACK</span>
      </a>
      
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingBottom: 200,
      }}>
        {product?.Image_url ? (
          <img
            src={getImageUrl(product.Image_url)}
            alt={name}
            style={{
              maxWidth: '90%',
              maxHeight: '85%',
              objectFit: 'contain',
              transform: `translate(${parallax.current.x}px, ${parallax.current.y}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          />
        ) : (
          <div style={{ fontSize: 80, color: 'var(--surface-light)' }}>{name}</div>
        )}
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '24px',
        background: 'rgba(5,5,5,0.95)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="font-mono" style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--crimson)' }}>NOW VIEWING</p>
            <h1 className="font-display" style={{ fontSize: 32, marginTop: 4 }}>{name}</h1>
            
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${selectedSize === s ? 'var(--crimson)' : 'var(--surface-light)'}`,
                    background: selectedSize === s ? 'var(--crimson)' : 'transparent',
                    color: 'var(--text)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 28, fontWeight: 'bold' }}>KSh {FIXED_PRICE}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'line-through' }}>KSh {ORIGINAL_PRICE}</span>
              <span style={{ fontSize: 9, color: '#ff4444', letterSpacing: '0.1em' }}>SAVE KSh {ORIGINAL_PRICE - FIXED_PRICE}</span>
            </div>
            
            <a href={buyLink} className="btn" style={{ marginTop: 12, padding: '12px 24px', fontSize: 10 }}>ORDER NOW</a>
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
  
  if (route === "/product" && productId) {
    return <ProductPage id={productId} />;
  }
  
  if (route === "/admin") {
    return <AdminPage />;
  }
  
  return <CustomerPage />;
}