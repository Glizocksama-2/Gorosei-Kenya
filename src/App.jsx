import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const WHATSAPP_NUMBER = "254734944512";

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

export default function App() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return (
      <div className="error-page">
        <h1>Missing Environment Variables</h1>
        <p>Add these in Vercel → Settings → Environment Variables:</p>
        <pre>{`VITE_SUPABASE_URL=https://bmasldizsbbgvrrdsfek.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_KEY
VITE_BACKEND_URL=https://YOUR_BACKEND_URL`}</pre>
      </div>
    );
  }

  const path = window.location.pathname.toLowerCase();
  if (path === "/admin" || path === "/admin.html") {
    return <AdminPage />;
  }
  return <CustomerPage />;
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);

  async function fetchProducts() {
    try {
      const { data } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("sold", false)
        .order("created_at", { ascending: false });
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function createWhatsAppLink(product) {
    const image = product.mockup_url || product.Image_url;
    const message = encodeURIComponent(
      `Hi Gorosei Kenya, I want this:\n\nName: ${product.Name}\nPrice: KSh ${product.Price}\nSize: ${product.size || 'M'}\nDelivery Location: `
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-brand">
          <span className="brand-name">GOROSEI</span>
          <span className="brand-tagline">Streetwear</span>
        </div>
        <a href="#drops" className="nav-link">DROPS</a>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            GOROSEI<span className="accent">.</span>KENYA
          </h1>
          <p className="hero-subtitle">Premium streetwear. Curated. Limited.</p>
        </div>
        <div className="hero-decoration">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
      </header>

      <main className="main" id="drops">
        <div className="section-header">
          <h2 className="section-title">DROPS</h2>
          <span className="section-count">{products.length} items</span>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="empty">
            <p>No drops available.</p>
            <p className="empty-sub">New drops daily at 8PM.</p>
          </div>
        )}

        <div className="grid">
          {products.map((product) => (
            <article key={product.id} className="card">
              <div className="card-image" onClick={() => setSelectedImg(product)}>
                <img
                  src={product.mockup_url || product.Image_url}
                  alt={product.Name}
                  loading="lazy"
                />
                <div className="card-badge">1 OF 1</div>
              </div>
              <div className="card-info">
                <h3 className="card-name">{product.Name}</h3>
                <div className="card-footer">
                  <span className="card-price">KSh {product.Price}</span>
                  <a
                    href={createWhatsAppLink(product)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-btn"
                  >
                    ORDER
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>GOROSEI KENYA © 2026</p>
        <p className="footer-sub">WhatsApp: {WHATSAPP_NUMBER}</p>
      </footer>

      {selectedImg && (
        <div className="modal" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg.mockup_url || selectedImg.Image_url} alt={selectedImg.Name} />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #050505;
          color: white;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          position: sticky;
          top: 0;
          background: rgba(5, 5, 5, 0.9);
          backdrop-filter: blur(10px);
          z-index: 100;
        }

        .nav-brand {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .brand-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .brand-tagline {
          font-size: 11px;
          color: #666;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .nav-link {
          font-size: 12px;
          letter-spacing: 2px;
          color: #888;
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: white;
        }

        .hero {
          padding: 80px 32px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #111;
        }

        .hero-title {
          font-size: clamp(32px, 8vw, 72px);
          font-weight: 700;
          letter-spacing: -2px;
          line-height: 1;
        }

        .accent {
          color: #FFD700;
        }

        .hero-subtitle {
          font-size: 14px;
          color: #666;
          margin-top: 16px;
          letter-spacing: 1px;
        }

        .hero-decoration {
          display: flex;
          gap: 8px;
        }

        .hero-decoration .line {
          width: 2px;
          height: 60px;
          background: #222;
        }

        .hero-decoration .line:nth-child(2) {
          height: 40px;
        }

        .main {
          padding: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid #111;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 3px;
          color: #666;
        }

        .section-count {
          font-size: 12px;
          color: #444;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (min-width: 768px) {
          .grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
          }
        }

        .card {
          background: #0a0a0a;
          overflow: hidden;
        }

        .card-image {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          cursor: pointer;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .card-image:hover img {
          transform: scale(1.05);
        }

        .card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #FFD700;
          color: #000;
          font-size: 9px;
          font-weight: 700;
          padding: 4px 8px;
          letter-spacing: 1px;
        }

        .card-info {
          padding: 16px;
        }

        .card-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-price {
          font-size: 16px;
          font-weight: 700;
          color: #FFD700;
        }

        .card-btn {
          background: #1a1a1a;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 10px 16px;
          letter-spacing: 1px;
          text-decoration: none;
          transition: background 0.2s;
        }

        .card-btn:hover {
          background: #FFD700;
          color: #000;
        }

        .loading {
          display: flex;
          justify-content: center;
          padding: 80px 0;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #222;
          border-top-color: #FFD700;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty {
          text-align: center;
          padding: 80px 0;
          color: #444;
        }

        .empty-sub {
          font-size: 12px;
          margin-top: 8px;
          color: #333;
        }

        .footer {
          text-align: center;
          padding: 48px 32px;
          border-top: 1px solid #111;
          margin-top: 48px;
        }

        .footer p {
          font-size: 12px;
          letter-spacing: 2px;
        }

        .footer-sub {
          font-size: 11px;
          color: #444;
          margin-top: 8px;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          cursor: pointer;
          padding: 32px;
        }

        .modal img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
        }

        .error-page {
          background: #050505;
          color: white;
          min-height: 100vh;
          padding: 40px;
          font-family: system-ui;
        }

        .error-page h1 {
          font-size: 24px;
          margin-bottom: 16px;
        }

        .error-page p {
          color: #666;
          margin-bottom: 16px;
        }

        .error-page pre {
          background: #0a0a0a;
          padding: 16px;
          font-size: 12px;
          overflow: auto;
        }
      `}</style>
    </>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("M");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!name || !price || !file) {
      setStatus("Fill all fields");
      return;
    }

    try {
      setLoading(true);
      setStatus("Uploading image...");

      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("products for Gorosei")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products for Gorosei").getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      setStatus("Generating AI mockup...");
      let mockupUrl = imageUrl;
      try {
        const res = await fetch(`${BACKEND_URL}/generate-mockup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl })
        });
        const result = await res.json();
        if (res.ok && result.image) {
          mockupUrl = result.image;
        }
      } catch (mockupErr) {
        console.warn("Mockup error:", mockupErr);
      }

      setStatus("Saving...");
      await supabase.from("products for Gorosei").insert({
        "Name": name,
        "Price": price,
        "size": size,
        "Image_url": imageUrl,
        "mockup_url": mockupUrl,
        "sold": false
      });

      setStatus("Done!");
      setName("");
      setPrice("");
      setFile(null);
      fetchProducts();
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from("products for Gorosei")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  }

  async function markSold(id) {
    await supabase.from("products for Gorosei").update({ sold: true }).eq("id", id);
    fetchProducts();
  }

  async function deleteProduct(id) {
    await supabase.from("products for Gorosei").delete().eq("id", id);
    fetchProducts();
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="nav-brand">
          <span className="brand-name">GOROSEI</span>
          <span className="brand-tagline">Admin</span>
        </div>
        <a href="/" className="nav-link">View Store</a>
      </nav>

      <main className="admin-main">
        <section className="admin-section">
          <h2 className="admin-title">ADD NEW DROP</h2>
          <form onSubmit={handleUpload} className="admin-form">
            <div className="form-row">
              <input
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                placeholder="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Processing..." : "ADD DROP"}
            </button>
            {status && <p className="status">{status}</p>}
          </form>
        </section>

        <section className="admin-section">
          <h2 className="admin-title">EXISTING ({products.length})</h2>
          <div className="product-list">
            {products.map((p) => (
              <div key={p.id} className="product-item">
                <img src={p.mockup_url || p.Image_url} alt={p.Name} />
                <div className="product-details">
                  <p className="product-name">{p.Name}</p>
                  <p className="product-meta">KSh {p.Price} • {p.size}</p>
                  <span className={p.sold ? "sold-tag" : "avail-tag"}>
                    {p.sold ? "SOLD" : "AVAIL"}
                  </span>
                </div>
                <div className="product-actions">
                  {!p.sold && (
                    <button onClick={() => markSold(p.id)} className="action-btn sold">
                      Sold
                    </button>
                  )}
                  <button onClick={() => deleteProduct(p.id)} className="action-btn delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #050505; color: white; font-family: 'Space Grotesk', system-ui; min-height: 100vh; }

        .nav { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; border-bottom: 1px solid #111; }
        .nav-brand { display: flex; align-items: baseline; gap: 12px; }
        .brand-name { font-size: 18px; font-weight: 700; letter-spacing: 4px; }
        .brand-tagline { font-size: 11px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
        .nav-link { font-size: 12px; letter-spacing: 2px; color: #FFD700; text-decoration: none; }

        .admin-main { padding: 32px; max-width: 800px; }
        .admin-section { margin-bottom: 48px; }
        .admin-title { font-size: 12px; font-weight: 600; letter-spacing: 2px; color: #666; margin-bottom: 20px; }

        .admin-form { display: flex; flex-direction: column; gap: 12px; }
        .form-row { display: grid; grid-template-columns: 1fr 100px 80px; gap: 8px; }
        
        input, select {
          background: #0a0a0a; border: 1px solid #222; color: white; padding: 14px; font-size: 14px; font-family: inherit;
        }
        input::placeholder { color: #444; }
        
        .submit-btn {
          background: #FFD700; color: #000; font-weight: 600; padding: 16px; font-size: 14px; border: none; cursor: pointer; letter-spacing: 1px;
        }
        .submit-btn:hover { opacity: 0.9; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .status { color: #FFD700; font-size: 13px; margin-top: 8px; }

        .product-list { display: flex; flex-direction: column; gap: 8px; }
        .product-item { display: flex; gap: 12px; background: #0a0a0a; padding: 12px; align-items: center; }
        .product-item img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
        .product-details { flex: 1; }
        .product-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .product-meta { font-size: 12px; color: #666; }
        .avail-tag { font-size: 10px; color: #22c55e; letter-spacing: 1px; }
        .sold-tag { font-size: 10px; color: #ef4444; letter-spacing: 1px; }
        
        .product-actions { display: flex; gap: 8px; }
        .action-btn { background: #1a1a1a; color: white; border: none; padding: 8px 12px; font-size: 11px; cursor: pointer; }
        .action-btn.sold { color: #22c55e; }
        .action-btn.delete { color: #ef4444; }
      `}</style>
    </>
  );
}