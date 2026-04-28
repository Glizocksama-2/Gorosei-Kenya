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
        // Send Discord notification
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
          placeholder="Enter your WhatsApp number"
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
    console.log("Fetching products...");
    try {
      const { data, error } = await supabase
        .from("products for Gorosei")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Fetch error:", error);
      }
      console.log("Products data:", data);
      const available = (data || []).filter(p => !p.sold);
      console.log("Available products:", available);
      setProducts(available);
    } catch (err) {
      console.error("Catch error:", err);
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
          <a href="#drop" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>SHOP</a>
          <a href="#about" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>ABOUT</a>
          <a href="#contact" className="nav-link font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>CONTACT</a>
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
            ) : (products.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100 }}>
                <p className="font-display" style={{ fontSize: 48 }}>NO PRODUCTS YET</p>
                <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>Add products in /admin</p>
              </div>
            ) : products.map((p, i) => (
              <a 
                href={p.id ? `/product/${p.id}` : "#drop"} 
                key={i}
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
                <div style={{ padding: 24, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--crimson)', color: 'var(--text)', padding: '4px 8px', fontSize: 9, letterSpacing: '0.1em' }}>LOW STOCK</div>
                  <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--crimson)' }}>{p.size || 'T-SHIRT'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                    <span className="font-display" style={{ fontSize: 24 }}>{p.Name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--crimson)', fontSize: 14 }}>KSh {FIXED_PRICE}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 8 }}>KSh {ORIGINAL_PRICE}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </AnimatedSection>
      </Section>

      {/* 3. IDENTITY SECTION */}
      <section id="about" style={{
        minHeight: '100vh',
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
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>04 — OUR STORY</span>
            
            <h2 className="font-display" style={{ fontSize: 'clamp(32px, 8vw, 80px)', lineHeight: 1, marginTop: 24 }}>
              NOT JUST<br />A BRAND.
            </h2>
            <h2 className="font-display" style={{ fontSize: 'clamp(32px, 8vw, 80px)', lineHeight: 1, color: 'var(--crimson)', marginTop: 16 }}>
              A BROTHERHOOD.
            </h2>
            
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 48, lineHeight: 2 }}>
              Born in Nairobi. Built for the bold.<br />
              GOROSEI means "elder" in Japanese — but we're not your grandparents' fashion.<br />
              We're the new generation. Streetwear with substance.
            </p>
            
            <div style={{ marginTop: 64, display: 'grid', gap: 48, textAlign: 'left', maxWidth: 600, margin: '64px auto 0' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: 24, color: 'var(--crimson)' }}>OUR MISSION</h3>
                <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.8 }}>
                  To create streetwear that speaks. Not just threads — identity. 
                  We're here for those who dress with intent, not just for comfort.
                </p>
              </div>
              
              <div>
                <h3 className="font-display" style={{ fontSize: 24, color: 'var(--crimson)' }}>OUR CRAFT</h3>
                <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.8 }}>
                  280GSM heavyweight cotton. Premium quality that lasts.
                  Limited drops — when they're gone, they're gone.
                  No restocks. No compromises.
                </p>
              </div>
              
              <div>
                <h3 className="font-display" style={{ fontSize: 24, color: 'var(--crimson)' }}>JOIN THE MOVEMENT</h3>
                <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.8 }}>
                  Follow @goroseikenya on Instagram. Join the brotherhood.
                  Be first to know about drops. This is for the ones who know.
                </p>
              </div>
            </div>
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
              {products[0]?.Image_url ? (
                <img 
                  src={getImageUrl(products[0].Image_url)}
                  alt={products[0].Name}
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="font-display" style={{ fontSize: 64, color: 'var(--text-muted)' }}>{products[0]?.Name?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            <div>
              <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>FEATURED</p>
              <h3 className="font-display" style={{ fontSize: 48, marginTop: 16 }}>{products[0]?.Name || "INFERNO"}</h3>
              <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.8 }}>
                Built for presence. Worn with intent.<br />
                Premium heavyweight cotton.<br />
                Limited release.
              </p>
              <a href={products[0]?.id ? `/product/${products[0].id}` : "#drop"} className="btn btn-outline" style={{ marginTop: 40 }}>VIEW PRODUCT</a>
            </div>
          </div>
        </AnimatedSection>
      </Section>

      {/* 6. BRAND VALUES */}
      <Section id="story">
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

      {/* INSTAGRAM FEED */}
      <Section>
        <AnimatedSection>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--crimson)' }}>03 — FOLLOW US</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(48px, 10vw, 96px)', marginTop: 16 }}>@GOROSEIKENYA</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48, maxWidth: 800, margin: '48px auto' }}>
            {[
              { type: "POST", label: "NEW DROP", color: "var(--crimson)" },
              { type: "POST", label: "STREETWEAR", color: "var(--text)" },
              { type: "POST", label: "BROTHERHOOD", color: "var(--crimson)" }
            ].map((post, i) => (
              <a 
                key={i}
                href="https://instagram.com/goroseikenya" 
                target="_blank"
                className="hover-scale"
                style={{ 
                  aspectRatio: '1', 
                  background: 'var(--surface)', 
                  border: '1px solid var(--surface-light)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  cursor: 'pointer',
                }}
              >
                <span className="font-display" style={{ fontSize: 32, color: post.color }}>{post.type}</span>
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.2em' }}>VIEW ON →</span>
              </a>
            ))}
          </div>
          
          <a 
            href="https://instagram.com/goroseikenya" 
            target="_blank"
            className="btn btn-outline"
            style={{ marginTop: 24 }}
          >
            FOLLOW ON INSTAGRAM
          </a>
        </AnimatedSection>
      </Section>

      {/* 7. FINAL CTA */}
      <section id="contact" style={{ padding: '200px 48px', textAlign: 'center' }}>
        <AnimatedSection>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px, 8vw, 80px)', lineHeight: 1 }}>
            JOIN THE<br />BROTHERHOOD
          </h2>
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 32, maxWidth: 400, margin: '32px auto' }}>
            Be first to know about drops. Exclusive access. Real ones only.
          </p>
          
          {/* Newsletter Form */}
          <NewsletterForm />
        </AnimatedSection>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '60px 48px',
        borderTop: '1px solid var(--surface-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 24,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="GOROSEI" style={{ height: 28 }} />
        </a>
        <div style={{ display: 'flex', gap: 32 }}>
          <a href="https://instagram.com/goroseikenya" target="_blank" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>INSTAGRAM</a>
          <a href="https://tiktok.com/@goroseikenya" target="_blank" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>TIKTOK</a>
          <a href="https://wa.me/254734944512" target="_blank" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>WHATSAPP</a>
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
        top: 16,
        left: 24,
        zIndex: 1000,
        padding: '10px 20px',
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(10px)',
        fontSize: 11,
      }}>
        <span className="font-mono" style={{ letterSpacing: '0.2em' }}>← BACK</span>
      </a>

      {/* Full screen product - image takes priority */}
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

      {/* Product info - sticky bottom, smaller on mobile */}
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