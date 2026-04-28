import { useEffect, useState } from "react";
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
          --crimson-dark: #8B0000;
          --text: #FFFFFF;
          --text-dim: #999999;
          --dot: rgba(255,255,255,0.03);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Space Mono', monospace;
          overflow-x: hidden;
        }
        
        a { color: inherit; text-decoration: none; }
        
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        /* Dot grid texture */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        /* Corner brackets */
        .bracket { position: relative; }
        .bracket::before, .bracket::after {
          content: ''; position: absolute; width: 20px; height: 20px; border: 1px solid var(--crimson);
        }
        .bracket-tl::before { top: 0; left: 0; border-right: none; border-bottom: none; }
        .bracket-tr::before { top: 0; right: 0; border-left: none; border-bottom: none; }
        .bracket-bl::before { bottom: 0; left: 0; border-right: none; border-top: none; }
        .bracket-br::before { bottom: 0; right: 0; border-left: none; border-top: none; }
        
        /* Section counter */
        .section-num {
          color: var(--crimson);
          font-size: 12px;
          letter-spacing: 0.2em;
        }
        
        /* Buttons */
        .btn-red {
          border: 1px solid var(--crimson);
          background: transparent;
          color: var(--text);
          padding: 14px 28px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-red:hover {
          background: var(--crimson);
          color: var(--bg);
          box-shadow: 0 0 20px rgba(204,0,0,0.4);
        }
        
        /* Product card */
        .card:hover {
          border-color: var(--crimson);
          box-shadow: 0 0 30px rgba(204,0,0,0.2);
        }
        
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade { animation: fadeIn 0.6s ease forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        
        /* Red glow */
        .glow:hover { box-shadow: 0 0 30px rgba(204,0,0,0.3); }
        
        /* Responsive */
        @media (min-width: 768px) {
          .grid-products { grid-template-columns: repeat(3, 1fr); }
          .hero-title { font-size: clamp(60px, 15vw, 140px); }
        }
      `}</style>
      <Router />
    </>
  );
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(8,8,8,0.95)', zIndex: 100, borderBottom: '1px solid #1a1a1f' }}>
        <span className="font-display" style={{ fontSize: 24, letterSpacing: '0.1em' }}>GOROSEI</span>
        <div style={{ display: 'flex', gap: 30 }}>
          <a href="#drops" className="font-mono" style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>DROPS</a>
          <a href="/admin" className="font-mono" style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>ADMIN</a>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 30px 80px', position: 'relative' }} className="dot-grid">
        <span className="font-mono section-num" style={{ marginBottom: 20 }}>[01] DROP 01</span>
        <h1 className="font-display hero-title" style={{ fontSize: 'clamp(50px, 12vw, 120px)', lineHeight: 0.85, marginBottom: 30 }}>
          WEAR THE<br /><span style={{ color: 'var(--crimson)' }}>DARK</span>
        </h1>
        <p className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 12, letterSpacing: '0.2em' }}>
          TACTICAL STREETWEAR // KENYA
        </p>
        
        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 40, right: 30, writingMode: 'vertical-rl' }} className="font-mono" style={{ position: 'absolute', bottom: 40, right: 30, fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-dim)' }}>
          SCROLL ↓
        </div>
      </header>

      {/* ABOUT */}
      <section style={{ padding: '100px 30px', background: 'var(--surface)', position: 'relative' }} className="dot-grid">
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', padding: 60 }} className="bracket bracket-tl bracket-br">
          <span className="font-mono section-num" style={{ marginBottom: 20, display: 'block' }}>• WHO WE ARE</span>
          <h2 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 0.95, marginBottom: 30 }}>
            WE BUILD <span style={{ color: 'var(--crimson)' }}>ARMOR,</span><br />NOT FASHION.
          </h2>
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8, maxWidth: 500 }}>
            Tactical fashion for those who move with intent. No hype. No excuses. 
            Built for the darkness. Designed in Kenya.
          </p>
        </div>
      </section>

      {/* MISSION - Red radial */}
      <section style={{ 
        padding: '100px 30px', 
        background: 'radial-gradient(circle at 30% 50%, #2a0000 0%, #1a0000 40%, #080808 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 60, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {products[0]?.Image_url && (
              <img 
                src={getImageUrl(products[0].Image_url)} 
                alt="Featured" 
                style={{ 
                  maxHeight: 500, 
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'brightness(0.6) contrast(1.2)',
                  mixBlendMode: 'luminosity'
                }} 
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <span className="font-mono section-num" style={{ marginBottom: 20, display: 'block' }}>[02] MISSION</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 0.9, marginBottom: 30 }}>
              PROTECT<br />YOURSELF
            </h2>
            <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 30 }}>
              Premium tactical wear. Engineered for the streets.<br />
              Every piece designed with purpose. Every detail intentional.
            </p>
            <button className="btn-red">EXPLORE COLLECTION →</button>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="drops" style={{ padding: '100px 30px' }}>
        <span className="font-mono section-num" style={{ marginBottom: 40, display: 'block' }}>[03] AVAILABLE</span>
        
        {loading && <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-dim)' }} className="font-mono">LOADING...</div>}
        
        {!loading && products.length === 0 && (
          <div style={{ padding: 100, textAlign: 'center' }}>
            <p className="font-display" style={{ fontSize: 48, color: 'var(--text-dim)' }}>NO DROPS</p>
            <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10 }}>8PM DAILY</p>
          </div>
        )}
        
        <div className="grid-products" style={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(1, 1fr)', background: '#1a1a1f' }}>
          {products.map((p) => (
            <a href={`/product/${p.id}`} key={p.id} style={{ background: 'var(--bg)', padding: 0, display: 'block', textDecoration: 'none', color: 'inherit', transition: 'all 0.3s' }} className="card">
              <div style={{ aspectRatio: '1', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
                {p.Image_url ? (
                  <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7) contrast(1.1)' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>NO IMAGE</div>
                )}
                {/* Corner brackets on hover */}
                <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderLeft: '1px solid var(--crimson)', borderTop: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRight: '1px solid var(--crimson)', borderTop: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderLeft: '1px solid var(--crimson)', borderBottom: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderRight: '1px solid var(--crimson)', borderBottom: '1px solid var(--crimson)', opacity: 0, transition: 'opacity 0.3s' }} />
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>{p.Name}</span>
                  <span style={{ color: 'var(--crimson)', fontSize: 12 }}>KSh {FIXED_PRICE}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{p.size || 'OS'}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--crimson)', letterSpacing: '0.1em' }}>VIEW →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '60px 30px', borderTop: '1px solid var(--crimson)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-display" style={{ fontSize: 18 }}>GOROSEI</span>
          <div style={{ display: 'flex', gap: 30 }}>
            <a href="#" className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)' }}>INSTAGRAM</a>
            <a href="#" className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)' }}>TWITTER</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-dim)', fontSize: 10 }} className="font-mono">
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

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-dim)' }}>LOADING...</span></div>;
  if (!product) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="font-mono" style={{ color: 'var(--text-dim)' }}>NOT FOUND</span></div>;

  const buyLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Gorosei, I want: ${product.Name} (${product.size || 'OS'}) - KSh ${FIXED_PRICE}`)}`;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 30px', borderBottom: '1px solid #1a1a1f' }}>
        <a href="/" className="font-display" style={{ fontSize: 18 }}>← BACK</a>
        <span className="font-display" style={{ fontSize: 18 }}>GOROSEI</span>
      </nav>

      <main style={{ padding: '100px 30px', display: 'grid', gridTemplateColumns: '1fr', gap: 60, maxWidth: 1200, margin: '0 auto' }} className="grid-products">
        <div style={{ aspectRatio: '1', background: 'var(--surface)', position: 'relative' }} className="bracket bracket-tl bracket-br">
          {product.Image_url ? (
            <img src={getImageUrl(product.Image_url)} alt={product.Name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0.8)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>NO IMAGE</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="font-mono section-num" style={{ marginBottom: 20 }}>PRODUCT DETAIL</span>
          <h1 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.9, marginBottom: 10 }}>{product.Name}</h1>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: 40 }}>SIZE: {product.size || 'OS'}</span>
          
          <p style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--crimson)', marginBottom: 30 }}>KSh {FIXED_PRICE}</p>
          
          <a href={buyLink} className="btn-red" style={{ display: 'inline-block', textAlign: 'center' }}>
            ADD TO CART →
          </a>

          <div style={{ marginTop: 60, paddingTop: 30, borderTop: '1px solid #1a1a1f' }}>
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.8 }}>
              Premium tactical construction.<br />
              Limited drop. First come, first served.
            </p>
          </div>
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

  function handleFileChange(e) { 
    const f = e.target.files?.[0]; 
    setFile(f); 
    setPreview(f ? URL.createObjectURL(f) : null); 
    setUrl(""); 
  }
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
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '100px 30px 50px' }}>
      <nav style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-display" style={{ fontSize: 24 }}>ADMIN</span>
        <a href="/" className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>← STORE</a>
      </nav>

      {/* ADD */}
      <div style={{ maxWidth: 500 }}>
        <span className="font-mono section-num" style={{ marginBottom: 20, display: 'block' }}>[01] ADD DROP</span>
        
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={() => toggleMode("file")} style={{ flex: 1, padding: 14, background: imageMode === "file" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>UPLOAD FILE</button>
          <button onClick={() => toggleMode("url")} style={{ flex: 1, padding: 14, background: imageMode === "url" ? 'var(--crimson)' : 'var(--surface)', border: '1px solid var(--crimson)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>PASTE URL</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PRODUCT NAME" style={{ width: '100%', padding: 16, marginBottom: 15, background: 'var(--surface)', border: '1px solid #1a1a1f', color: 'var(--text)', fontSize: 14 }} />
        
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 16, background: 'var(--surface)', border: '1px solid #1a1a1f', color: 'var(--text)', fontSize: 14 }}>
            <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="OS">OS</option>
          </select>
          {imageMode === "file" ? (
            <label style={{ flex: 1, padding: 16, background: 'var(--surface)', border: '1px solid #1a1a1f', color: 'var(--text-dim)', fontSize: 12, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {file ? file.name : "CHOOSE IMAGE"}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          ) : (
            <input value={url} onChange={handleUrlChange} placeholder="IMAGE URL" style={{ flex: 1, padding: 16, background: 'var(--surface)', border: '1px solid #1a1a1f', color: 'var(--text)', fontSize: 12 }} />
          )}
        </div>

        {preview && <img src={preview} style={{ width: 100, height: 100, objectFit: 'cover', marginBottom: 15 }} />}

        <button onClick={handleAdd} disabled={saving} style={{ width: '100%', padding: 18, background: 'var(--crimson)', border: 'none', color: 'var(--bg)', fontSize: 12, fontWeight: 'bold', letterSpacing: '0.2em', cursor: 'pointer' }}>
          {saving ? "..." : `ADD (${FIXED_PRICE} KES)`}
        </button>
        
        {status && <p style={{ marginTop: 15, color: status.includes("Error") ? 'var(--crimson)' : 'var(--text)', fontSize: 12 }}>{status}</p>}
      </div>

      {/* STOCK */}
      <div style={{ marginTop: 60, maxWidth: 500 }}>
        <span className="font-mono section-num" style={{ marginBottom: 20, display: 'block' }}>[02] STOCK ({products.length})</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 15, padding: 15, background: 'var(--surface)', alignItems: 'center' }}>
              <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: 50, height: 50, objectFit: 'cover', background: '#1a1a1f' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13 }}>{p.Name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.size} // {FIXED_PRICE} KES</p>
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