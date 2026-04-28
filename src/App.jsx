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
  const mousePos = useMouseTrack();

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
          --text-muted: #666666;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { background: var(--bg); color: var(--text); font-family: 'Space Mono', monospace; overflow-x: hidden; }
        a { color: inherit; text-decoration: none; }
        
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        .dot-grid { background-image: radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 24px 24px; }
        
        .section-num { color: var(--text-muted); font-size: 12px; letter-spacing: 0.25em; }
        .section-num.red { color: var(--crimson); }
        
        .btn { border: 1px solid var(--crimson); background: transparent; color: var(--text); padding: 14px 32px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; transition: all 0.15s ease-out; }
        .btn:hover { background: var(--crimson); color: var(--bg); box-shadow: 0 0 24px rgba(204,0,0,0.35); }
        .btn-ghost { border: 1px solid var(--text-muted); color: var(--text-muted); background: transparent; }
        .btn-ghost:hover { border-color: var(--text); color: var(--text); }
        
        .nav-link { position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 50%; width: 0; height: 1px; background: var(--crimson); transition: width 0.15s ease-out; transform: translateX(-50%); }
        .nav-link:hover::after { width: 100%; }
        
        .product-card { background: var(--surface); transition: transform 0.15s ease-out, box-shadow 0.15s ease-out; overflow: hidden; cursor: pointer; }
        .product-card:hover { transform: scale(1.03); box-shadow: 0 0 60px rgba(204,0,0,0.3); }
        .product-card:hover .product-img { transform: scale(1.15); filter: brightness(1) grayscale(0); }
        .product-img { transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.2s ease-out; filter: brightness(0.85) grayscale(0.1); }
        
        .bracket::before { content: ''; position: absolute; width: 30px; height: 30px; border: 1px solid var(--crimson); opacity: 0; transition: opacity 0.15s ease-out; }
        .bracket-tl::before { top: 0; left: 0; border-right: none; border-bottom: none; }
        .bracket-tr::before { top: 0; right: 0; border-left: none; border-bottom: none; }
        .bracket-bl::before { bottom: 0; left: 0; border-right: none; border-top: none; }
        .bracket-br::before { bottom: 0; right: 0; border-left: none; border-top: none; }
        .product-card:hover .bracket::before { opacity: 1; }
        
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.4s ease-out; }
        .reveal.active { opacity: 1; transform: translateY(0); }
        
        .crimson-glow { background: radial-gradient(ellipse at var(--mx, 30%) var(--my, 50%), #CC0000 0%, #1a0000 40%, var(--bg) 70%); }
        
        /* Full screen product page */
        .product-fullscreen { position: fixed; inset: 0; background: var(--bg); z-index: 200; overflow-y: auto; }
        .product-image-container { position: relative; width: 100%; height: 100vh; transition: transform 0.12s ease-out; will-change: transform; }
        .product-image-full { width: 100%; height: 100%; object-fit: contain; filter: brightness(0.7); transition: filter 0.15s ease-out; }
        .product-image-container:hover .product-image-full { filter: brightness(0.9); }
        
        /* Size selector */
        .size-btn { width: 50px; height: 50px; display: flex; alignItems: center; justify-content: center; border: 1px solid var(--surface-light); background: var(--surface); color: var(--text); font-size: 14px; transition: all 0.1s ease-out; }
        .size-btn:hover { border-color: var(--crimson); }
        .size-btn.selected { background: var(--crimson); color: var(--bg); border-color: var(--crimson); }
        
        /* Hero product */
        .hero-product { position: relative; display: flex; justify-content: center; align-items: center; }
        .hero-product-img { max-width: 100%; max-height: 500px; object-fit: contain; transition: transform 0.3s ease-out, filter 0.3s ease-out; }
        .hero-product:hover .hero-product-img { transform: scale(1.05); filter: drop-shadow(0 0 40px rgba(204,0,0,0.5)); }
        
        @media (min-width: 768px) {
          .grid-products { grid-template-columns: repeat(3, 1fr); }
          .hero-title { font-size: clamp(64px, 14vw, 140px); }
        }
        @media (max-width: 767px) {
          .grid-products { grid-template-columns: 1fr; }
          .hero-title { font-size: clamp(48px, 12vw, 80px); }
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
  const mousePos = useMouseTrack();

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false });
      setProducts((data || []).filter(p => !p.sold));
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <span className="font-display" style={{ fontSize: 28, letterSpacing: '0.1em' }}>GOROSEI</span>
        <div style={{ display: 'flex', gap: 40 }}>
          <a href="#drops" className="nav-link font-mono" style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DROPS</a>
          <a href="/admin" className="nav-link font-mono" style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ADMIN</a>
        </div>
      </nav>

      {/* HERO WITH PRODUCT */}
      <header style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 40px 80px', position: 'relative' }} className="dot-grid">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <div>
            <span className="font-mono section-num reveal active">COLLECTION 01 / 2025</span>
            <h1 className="font-display hero-title reveal active" style={{ fontSize: 'clamp(48px, 10vw, 110px)', lineHeight: 0.9, marginTop: 20 }}>
              DRESSED IN<br /><span style={{ color: 'var(--crimson)' }}>SILENCE.</span>
            </h1>
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginTop: 24, maxWidth: 400 }}>Premium tactical wear for the bold.</p>
            <div style={{ display: 'flex', gap: 20, marginTop: 30 }} className="reveal active">
              <a href="#drops" className="btn">SHOP NOW</a>
            </div>
          </div>
          
          {/* HERO PRODUCT - FIRST PRODUCT DISPLAYED */}
          <div className="hero-product" style={{ position: 'relative', minHeight: 500 }}>
            {products[0]?.Image_url ? (
              <a href={`/product/${products[0].id}`} style={{ display: 'block' }}>
                <img 
                  src={getImageUrl(products[0].Image_url)} 
                  alt={products[0].Name}
                  className="hero-product-img"
                  style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }}
                />
                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--crimson)', letterSpacing: '0.25em' }}>VIEW →</div>
              </a>
            ) : (
              <div style={{ width: 400, height: 400, border: '1px dashed var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                NO IMAGE
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CRIMSON SECTION */}
      <section 
        className="crimson-glow"
        style={{ padding: '120px 40px', position: 'relative', minHeight: '80vh', background: `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, #CC0000 0%, #1a0000 50%, var(--bg) 100%)` }}
      >
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, maxWidth: 1400, margin: '0 auto', alignItems: 'center' }}>
          <div>
            {products[0]?.Image_url && (
              <img src={getImageUrl(products[0].Image_url)} alt="Featured" style={{ width: '100%', maxHeight: 600, objectFit: 'contain', filter: 'brightness(0.75) contrast(1.1)' }} />
            )}
          </div>
          <div>
            <span className="font-mono section-num red">[01] THE DROP</span>
            <h3 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 0.95, marginTop: 20 }}>PROTECT<br />YOURSELF</h3>
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 30 }}>Premium tactical wear.</p>
            <a href="#drops" className="btn btn-ghost">EXPLORE →</a>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="drops" style={{ padding: '120px 40px' }}>
        <span className="font-mono section-num">[02] AVAILABLE</span>
        
        {loading && <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-muted)' }}>LOADING...</div>}
        {!loading && products.length === 0 && <div style={{ padding: 100 }}><p className="font-display" style={{ fontSize: 48 }}>NO DROPS</p></div>}
        
        <div className="grid-products" style={{ display: 'grid', gap: 1, marginTop: 40, background: 'var(--surface-light)' }}>
          {products.map((p) => (
            <a href={`/product/${p.id}`} key={p.id} className="product-card" style={{ background: 'var(--surface)', position: 'relative' }}>
              <div style={{ aspectRatio: '1', background: 'var(--surface-light)', position: 'relative', overflow: 'hidden' }}>
                {p.Image_url ? (
                  <img src={getImageUrl(p.Image_url)} alt={p.Name} className="product-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>NO IMAGE</div>
                )}
                <div className="bracket bracket-tl" style={{ position: 'absolute', top: 16, left: 16 }} />
                <div className="bracket bracket-tr" style={{ position: 'absolute', top: 16, right: 16 }} />
                <div className="bracket bracket-bl" style={{ position: 'absolute', bottom: 16, left: 16 }} />
                <div className="bracket bracket-br" style={{ position: 'absolute', bottom: 16, right: 16 }} />
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>{p.Name}</span>
                  <span style={{ color: 'var(--crimson)', fontSize: 12 }}>KSh {FIXED_PRICE}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.size || 'OS'}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--crimson)' }}>VIEW →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer style={{ padding: '60px 40px', borderTop: '1px solid var(--crimson)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="font-display" style={{ fontSize: 24 }}>GOROSEI</span>
          <div style={{ display: 'flex', gap: 30 }}>
            <a href="#" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>INSTAGRAM</a>
            <a href="#" className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>TWITTER</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 10 }}>© 2025 GOROSEI KENYA — ALL RIGHTS RESERVED</div>
      </footer>
    </div>
  );
}

function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("M");
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });

  useEffect(() => { fetchProduct(); }, [id]);

  useEffect(() => {
    function handleMouseMove(e) {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setHoverOffset({ x, y });
    }
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  async function fetchProduct() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").eq("id", id).single();
      setProduct(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-muted)' }}>LOADING...</span></div>;
  if (!product) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-muted)' }}>NOT FOUND</span></div>;

  const sizes = ["S", "M", "L", "XL", "OS"];
  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Gorosei, I want: ${product.Name} (${selectedSize}) - KSh ${FIXED_PRICE}`)}`;

  return (
    <div className="product-fullscreen">
      <a href="/" style={{ position: 'fixed', top: 24, left: 40, zIndex: 300, fontSize: 14, color: 'var(--text)' }} className="font-mono">← BACK</a>
      
      <div 
        className="product-image-container"
        style={{ transform: `translate(${hoverOffset.x}px, ${hoverOffset.y}px)` }}
      >
        <img src={getImageUrl(product.Image_url)} alt={product.Name} className="product-image-full" />
      </div>
      
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '40px', background: 'linear-gradient(transparent, var(--bg))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 1400, margin: '0 auto' }}>
          <div>
            <span className="font-mono section-num red">PRODUCT</span>
            <h1 className="font-display" style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 0.9, marginTop: 10 }}>{product.Name}</h1>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {sizes.map((s) => (
                <button key={s} onClick={() => setSelectedSize(s)} className={`size-btn ${selectedSize === s ? 'selected' : ''}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 36, fontWeight: 'bold', color: 'var(--crimson)' }}>KSh {FIXED_PRICE}</p>
            <a href={buyLink} className="btn" style={{ marginTop: 20, display: 'inline-block' }}>ADD TO CART →</a>
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
        <span className="font-mono section-num red">[01] ADD DROP</span>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => toggleMode("file")} style={{ flex: 1, padding: 16, background: imageMode === "file" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>UPLOAD FILE</button>
          <button onClick={() => toggleMode("url")} style={{ flex: 1, padding: 16, background: imageMode === "url" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>PASTE URL</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PRODUCT NAME" style={{ width: '100%', padding: 16, marginTop: 15, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)', fontSize: 14 }} />
        
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--surface-light)', color: 'var(--text)' }}>
            <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="OS">OS</option>
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

        <button onClick={handleAdd} disabled={saving} style={{ width: '100%', padding: 18, background: 'var(--crimson)', border: 'none', color: 'var(--bg)', fontSize: 12, fontWeight: 'bold', marginTop: 15 }}>
          {saving ? "..." : `ADD (${FIXED_PRICE} KES)`}
        </button>
        {status && <p style={{ marginTop: 15, color: status.includes("Error") ? 'var(--crimson)' : 'var(--text)' }}>{status}</p>}
      </div>

      <div style={{ marginTop: 60, maxWidth: 500 }}>
        <span className="font-mono section-num red">[02] STOCK ({products.length})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {products.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 15, padding: 15, background: 'var(--surface)', alignItems: 'center' }}>
              <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: 50, height: 50, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <p>{p.Name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.size} // {FIXED_PRICE}</p>
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