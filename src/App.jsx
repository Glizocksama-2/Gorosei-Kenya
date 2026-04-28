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

function useMouseTrack() {
  const pos = useRef({ x: 50, y: 50 });
  useEffect(() => {
    const handleMove = (e) => {
      pos.current.x = (e.clientX / window.innerWidth) * 100;
      pos.current.y = (e.clientY / window.innerHeight) * 100;
    };
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, []);
  return pos;
}

function useParallax() {
  const offset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e) => {
      offset.current.x = (e.clientX / window.innerWidth - 0.5) * 20;
      offset.current.y = (e.clientY / window.innerHeight - 0.5) * 20;
    };
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, []);
  return offset;
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
          --bg: #080808;
          --surface: #0f0f0f;
          --surface-light: #1a1a1f;
          --crimson: #CC0000;
          --text: #FFFFFF;
          --text-muted: #888888;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { background: var(--bg); color: var(--text); font-family: 'Space Mono', monospace; overflow-x: hidden; }
        a { color: inherit; text-decoration: none; }
        
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        .dot-grid { background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 30px 30px; }
        
        .section-num { color: var(--text-muted); font-size: 11px; letter-spacing: 0.3em; }
        .section-num.red { color: var(--crimson); }
        
        .btn { border: 1px solid var(--crimson); background: var(--crimson); color: var(--text); padding: 14px 32px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; transition: all 0.15s ease-out; display: inline-block; }
        .btn:hover { background: transparent; color: var(--crimson); }
        .btn-ghost { border: 1px solid var(--text-muted); background: transparent; color: var(--text); }
        .btn-ghost:hover { border-color: var(--text); }
        
        .nav-link { position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 50%; width: 0; height: 1px; background: var(--crimson); transition: width 0.2s ease-out; transform: translateX(-50%); }
        .nav-link:hover::after { width: 100%; }
        
        .product-card { background: var(--surface); transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; overflow: hidden; cursor: pointer; }
        .product-card:hover { transform: scale(1.02); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .product-card:hover .product-img { transform: scale(1.08); }
        
        .product-img { transition: transform 0.3s ease-out; width: 100%; height: 100%; object-fit: cover; }
        
        .reveal { opacity: 0; transform: translateY(20px); transition: all 0.5s ease-out; }
        .reveal.active { opacity: 1; transform: translateY(0); }
        
        /* Product Page - Full screen edge to edge */
        .product-page { position: fixed; inset: 0; background: var(--bg); z-index: 300; overflow-y: auto; }
        .product-hero { width: 100vw; height: 100vh; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .product-hero-img { width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.1s ease-out; }
        
        .product-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px; background: linear-gradient(transparent, rgba(0,0,0,0.9)); }
        
        .size-btn { min-width: 50px; height: 50px; padding: 0 16px; display: flex; alignItems: center; justify-content: center; border: 1px solid var(--surface-light); background: transparent; color: var(--text); font-size: 13px; transition: all 0.15s ease-out; }
        .size-btn:hover { border-color: var(--crimson); }
        .size-btn.selected { background: var(--crimson); border-color: var(--crimson); color: var(--bg); }
        
        .hero-product { position: relative; display: flex; justify-content: center; align-items: center; transition: transform 0.1s ease-out; }
        .hero-product-img { max-height: 65vh; object-fit: contain; transition: transform 0.3s ease-out; }
        .hero-product:hover .hero-product-img { transform: scale(1.03); }
        
        @media (min-width: 768px) {
          .grid-products { grid-template-columns: repeat(3, 1fr); }
          .hero-title { font-size: clamp(64px, 12vw, 120px); }
        }
        @media (max-width: 767px) {
          .grid-products { grid-template-columns: 1fr; }
          .hero-title { font-size: clamp(48px, 10vw, 72px); }
          .product-overlay { padding: 24px; }
        }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
      
      <Router />
    </>
  );
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const parallax = useParallax();
  const mousePos = useMouseTrack();

  useEffect(() => { fetchProducts(); }, []);

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

  console.log("Products:", products);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(10px)' }}>
        <span className="font-display" style={{ fontSize: 32, letterSpacing: '0.15em' }}>GOROSEI</span>
        <div style={{ display: 'flex', gap: 40 }}>
          <a href="#about" className="nav-link font-mono" style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ABOUT</a>
          <a href="#drops" className="nav-link font-mono" style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SHOP</a>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative' }} className="dot-grid">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
          <div>
            <span className="font-mono section-num reveal active" style={{ color: 'var(--crimson)' }}>NEW DROP — 2025</span>
            <h1 className="font-display hero-title reveal active" style={{ fontSize: 'clamp(48px, 10vw, 110px)', lineHeight: 0.95, marginTop: 16 }}>
              STREET<br />WEAR
            </h1>
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginTop: 24, maxWidth: 380 }}>Kenyan streetwear that makes you feel like your real self.</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 40 }} className="reveal active">
              <a href="#drops" className="btn">SHOP NOW</a>
            </div>
          </div>
          
          {/* HERO PRODUCT */}
          <div 
            className="hero-product"
            style={{ transform: `translate(${parallax.current.x}px, ${parallax.current.y}px)` }}
          >
            {loading ? (
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>LOADING...</div>
            ) : products[0]?.Image_url ? (
              <a href={`/product/${products[0].id}`} style={{ display: 'block' }}>
                <img 
                  src={getImageUrl(products[0].Image_url)} 
                  alt={products[0].Name}
                  className="hero-product-img"
                />
                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--crimson)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Tap to view →</div>
              </a>
            ) : (
              <div style={{ width: 500, height: 500, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                ADD PRODUCTS IN ADMIN
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ABOUT */}
      <section id="about" style={{ padding: '120px 40px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span className="font-mono section-num red">ABOUT US</span>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 1, marginTop: 24 }}>
            A KENYAN CLOTHING BRAND FOR THE REAL YOU
          </h2>
          <p className="font-mono" style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.9, marginTop: 32, maxWidth: 600 }}>
            GOROSEI is a Kenyan streetwear brand that puts self-expression first. 
            We create clothes that let you be yourself — bold, authentic, unapologetic. 
            This is streetwear for those who know who they are.
          </p>
        </div>
      </section>

      {/* SHOP */}
      <section id="drops" style={{ padding: '120px 40px' }}>
        <span className="font-mono section-num">[01] SHOP ALL</span>
        
        {loading && <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-muted)' }}>LOADING...</div>}
        
        {!loading && products.length === 0 && (
          <div style={{ padding: 100, textAlign: 'center' }}>
            <p className="font-display" style={{ fontSize: 48 }}>NO PRODUCTS YET</p>
            <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>Add products in /admin</p>
          </div>
        )}
        
        <div className="grid-products" style={{ display: 'grid', gap: 1, marginTop: 40, background: 'var(--surface-light)' }}>
          {products.map((p) => (
            <a href={`/product/${p.id}`} key={p.id} className="product-card" style={{ background: 'var(--surface)', position: 'relative' }}>
              <div style={{ aspectRatio: '1', background: 'var(--surface-light)', position: 'relative', overflow: 'hidden' }}>
                {p.Image_url ? (
                  <img src={getImageUrl(p.Image_url)} alt={p.Name} className="product-img" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>NO IMAGE</div>
                )}
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>{p.Name}</span>
                  <span style={{ color: 'var(--crimson)', fontSize: 14, fontWeight: 'bold' }}>KSh {FIXED_PRICE}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>SIZE: {p.size || 'M'}</span>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--crimson)' }}>VIEW</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer style={{ padding: '60px 40px', borderTop: '1px solid var(--surface-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-display" style={{ fontSize: 28 }}>GOROSEI</span>
          <a href="/admin" className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>ADMIN</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 11 }}>© 2025 GOROSEI KENYA</div>
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

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-muted)' }}>LOADING...</span></div>;
  if (!product) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-muted)' }}>NOT FOUND</span></div>;

  const sizes = ["S", "M", "L", "XL"];
  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi GOROSEI, I want: ${product.Name} (Size: ${selectedSize}) - KSh ${FIXED_PRICE}`)}`;

  return (
    <div className="product-page">
      {/* Close */}
      <a href="/" style={{ position: 'fixed', top: 24, left: 40, zIndex: 400, fontSize: 13, color: 'var(--text)', background: 'rgba(0,0,0,0.5)', padding: '12px 24px', backdropFilter: 'blur(10px)' }} className="font-mono">← BACK</a>
      
      {/* Full screen edge-to-edge image */}
      <div className="product-hero">
        <img 
          src={getImageUrl(product.Image_url)} 
          alt={product.Name} 
          className="product-hero-img"
          style={{ transform: `scale(1.02) translate(${parallax.current.x}px, ${parallax.current.y}px)` }}
        />
      </div>
      
      {/* Info overlay */}
      <div className="product-overlay">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <span className="font-mono section-num red">NOW VIEWING</span>
            <h1 className="font-display" style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1, marginTop: 8 }}>{product.Name}</h1>
            
            {/* Size selector */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {sizes.map((s) => (
                <button 
                  key={s} 
                  onClick={() => setSelectedSize(s)} 
                  className={`size-btn ${selectedSize === s ? 'selected' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 42, fontWeight: 'bold', color: 'var(--text)' }}>KSh {FIXED_PRICE}</p>
            <a href={buyLink} className="btn" style={{ marginTop: 16, display: 'inline-block' }}>ORDER NOW →</a>
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
    const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false }); 
    setProducts(data || []); 
  }
  async function markSold(id) { await supabase.from("products for Gorosei").update({ sold: true }).eq("id", id); fetchProducts(); }
  async function deleteProduct(id) { await supabase.from("products for Gorosei").delete().eq("id", id); fetchProducts(); }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '120px 40px 50px' }}>
      <nav style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between' }}>
        <span className="font-display" style={{ fontSize: 28 }}>ADMIN</span>
        <a href="/" className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>← STORE</a>
      </nav>

      <div style={{ maxWidth: 500 }}>
        <span className="font-mono section-num red">ADD PRODUCT</span>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => toggleMode("file")} style={{ flex: 1, padding: 16, background: imageMode === "file" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>UPLOAD</button>
          <button onClick={() => toggleMode("url")} style={{ flex: 1, padding: 16, background: imageMode === "url" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>URL</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PRODUCT NAME" style={{ width: '100%', padding: 16, marginTop: 15, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 14 }} />
        
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
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

        {preview && <img src={preview} style={{ width: 100, height: 100, objectFit: 'cover', marginTop: 15 }} />}

        <button onClick={handleAdd} disabled={saving} style={{ width: '100%', padding: 18, background: 'var(--crimson)', border: 'none', color: 'var(--text)', fontSize: 12, fontWeight: 'bold', marginTop: 15, cursor: 'pointer' }}>
          {saving ? "..." : `ADD PRODUCT`}
        </button>
        {status && <p style={{ marginTop: 15, color: status.includes("Error") ? 'var(--crimson)' : 'var(--text)', fontSize: 12 }}>{status}</p>}
      </div>

      <div style={{ marginTop: 60, maxWidth: 500 }}>
        <span className="font-mono section-num red">STOCK ({products.length})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {products.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 15, padding: 15, background: 'var(--surface)', alignItems: 'center' }}>
              <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: 60, height: 60, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14 }}>{p.Name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Size: {p.size} — KSh {FIXED_PRICE}</p>
                <span style={{ fontSize: 10, color: p.sold ? 'var(--crimson)' : '#4ade80' }}>{p.sold ? "SOLD" : "AVAILABLE"}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!p.sold && <button onClick={() => markSold(p.id)} style={{ padding: '8px 12px', border: '1px solid #4ade80', color: '#4ade80', background: 'none', fontSize: 10, cursor: 'pointer' }}>SOLD</button>}
                <button onClick={() => deleteProduct(p.id)} style={{ padding: '8px 12px', border: '1px solid var(--crimson)', color: 'var(--crimson)', background: 'none', fontSize: 10, cursor: 'pointer' }}>DEL</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}