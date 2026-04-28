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
  const [menuOpen, setMenuOpen] = useState(false);

  async function fetchProducts() {
    try {
      const { data, error: fetchError } = await supabase
        .from("products for Gorosei")
        .select("*")
        .eq("sold", false)
        .order("created_at", { ascending: false });
      
      if (fetchError) throw fetchError;
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

  function getImageUrl(product) {
    return product.mockup_url || product.Image_url || null;
  }

  function createWhatsAppLink(product) {
    const message = encodeURIComponent(
      `Hi Gorosei, I want this:\n\n${product.Name}\nKSh ${product.Price}\nSize: ${product.size || 'M'}`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  return (
    <>
      <nav className="nav">
        <a href="/" className="logo">
          <span className="logo-text">GOROSEI</span>
        </a>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "CLOSE" : "MENU"}
        </button>
        {menuOpen && (
          <div className="menu-overlay">
            <a href="#drops" onClick={() => setMenuOpen(false)}>DROPS</a>
            <a href="/admin" onClick={() => setMenuOpen(false)}>ADMIN</a>
          </div>
        )}
      </nav>

      <header className="hero">
        <div className="hero-content">
          <p className="hero-tag">[-_-]</p>
          <h1 className="hero-title">
            GOROSEI<br />KENYA
          </h1>
          <p className="hero-sub">STREETWEAR // DROPS</p>
        </div>
      </header>

      <main id="drops">
        <section className="section">
          <div className="section-header">
            <span className="section-num">[01]</span>
            <h2 className="section-title">AVAILABLE</h2>
          </div>

          {loading && (
            <div className="loading">
              <div className="loader"></div>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="empty">
              <p>NO DROPS</p>
              <p className="empty-sub">CHECK BACK AT 8PM</p>
            </div>
          )}

          <div className="grid">
            {products.map((product) => {
              const imgUrl = getImageUrl(product);
              return (
                <article key={product.id} className="product-card">
                  <div className="product-image">
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.Name} loading="lazy" />
                    ) : (
                      <div className="no-img">NO IMG</div>
                    )}
                    <div className="product-badge">{product.size || 'OS'}</div>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.Name}</h3>
                    <div className="product-row">
                      <span className="product-price">KSh {product.Price}</span>
                      <a href={createWhatsAppLink(product)} className="product-btn" target="_blank">
                        BUY
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-logo">GOROSEI // KENYA</p>
          <p className="footer-contact">WHATSAPP: {WHATSAPP_NUMBER}</p>
          <p className="footer-copy">©2026</p>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --bg: #000000;
          --bg2: #0a0a0a;
          --text: #ffffff;
          --text2: #666666;
          --accent: #ffffff;
          --accent2: #333333;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'JetBrains Mono', monospace;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        a { color: inherit; text-decoration: none; }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(0,0,0,0.9);
        }

        .logo-text {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .menu-btn {
          background: none;
          border: 1px solid var(--accent2);
          color: var(--text);
          padding: 8px 16px;
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 2px;
          cursor: pointer;
        }

        .menu-overlay {
          position: fixed;
          inset: 0;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          z-index: 99;
        }

        .menu-overlay a {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 8px;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 120px 32px 80px;
          border-bottom: 1px solid var(--accent2);
        }

        .hero-tag {
          font-size: 12px;
          color: var(--text2);
          letter-spacing: 4px;
          margin-bottom: 16px;
        }

        .hero-title {
          font-size: clamp(48px, 15vw, 160px);
          font-weight: 700;
          line-height: 0.9;
          letter-spacing: -4px;
          margin-bottom: 24px;
        }

        .hero-sub {
          font-size: 14px;
          color: var(--text2);
          letter-spacing: 4px;
        }

        .section {
          padding: 80px 32px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 48px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--accent2);
        }

        .section-num {
          font-size: 12px;
          color: var(--text2);
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--accent2);
        }

        @media (min-width: 768px) {
          .grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .product-card {
          background: var(--bg);
        }

        .product-image {
          position: relative;
          aspect-ratio: 1;
          background: var(--bg2);
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-img {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text2);
          font-size: 10px;
          letter-spacing: 2px;
        }

        .product-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--text);
          color: var(--bg);
          font-size: 9px;
          font-weight: 700;
          padding: 4px 8px;
        }

        .product-info {
          padding: 16px;
        }

        .product-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .product-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .product-price {
          font-size: 14px;
          font-weight: 700;
        }

        .product-btn {
          background: var(--text);
          color: var(--bg);
          font-size: 11px;
          font-weight: 700;
          padding: 8px 16px;
          letter-spacing: 1px;
        }

        .product-btn:hover {
          background: var(--text2);
        }

        .loading {
          padding: 80px 0;
          display: flex;
          justify-content: center;
        }

        .loader {
          width: 24px;
          height: 24px;
          border: 2px solid var(--accent2);
          border-top-color: var(--text);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty {
          text-align: center;
          padding: 80px 0;
          color: var(--text2);
        }

        .empty p:first-child {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 4px;
          margin-bottom: 8px;
        }

        .empty-sub {
          font-size: 12px;
          letter-spacing: 2px;
        }

        .footer {
          padding: 48px 32px;
          border-top: 1px solid var(--accent2);
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: center;
        }

        .footer-logo {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .footer-contact {
          font-size: 11px;
          color: var(--text2);
          letter-spacing: 2px;
        }

        .footer-copy {
          font-size: 10px;
          color: var(--text2);
        }

        .error-page {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          padding: 40px;
        }

        .error-page h1 {
          font-size: 18px;
          margin-bottom: 16px;
        }

        .error-page p {
          color: var(--text2);
          margin-bottom: 16px;
        }

        .error-page pre {
          background: var(--bg2);
          padding: 16px;
          font-size: 11px;
          overflow: auto;
          white-space: pre-wrap;
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
      setStatus("Uploading...");

      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("products for Gorosei")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products for Gorosei").getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      setStatus("Generating mockup...");
      let mockupUrl = imageUrl;
      try {
        const res = await fetch(`${BACKEND_URL}/generate-mockup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, productName: name })
        });
        const result = await res.json();
        if (result.image) {
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
        <a href="/" className="logo">
          <span className="logo-text">GOROSEI</span>
        </a>
        <a href="/" className="menu-btn">STORE</a>
      </nav>

      <main className="admin">
        <section className="section">
          <div className="section-header">
            <span className="section-num">[01]</span>
            <h2 className="section-title">ADD DROP</h2>
          </div>

          <form onSubmit={handleUpload} className="form">
            <div className="form-row">
              <input
                placeholder="NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                placeholder="PRICE"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="OS">OS</option>
              </select>
            </div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "PROCESSING..." : "ADD DROP"}
            </button>
            {status && <p className="status">{status}</p>}
          </form>
        </section>

        <section className="section">
          <div className="section-header">
            <span className="section-num">[02]</span>
            <h2 className="section-title">INVENTORY ({products.length})</h2>
          </div>

          <div className="product-list">
            {products.map((p) => (
              <div key={p.id} className="product-item">
                <img src={p.mockup_url || p.Image_url} alt={p.Name} />
                <div className="item-info">
                  <p className="item-name">{p.Name}</p>
                  <p className="item-meta">KSh {p.Price} // {p.size}</p>
                  <span className={p.sold ? "sold-tag" : "avail-tag"}>
                    {p.sold ? "SOLD" : "AVAIL"}
                  </span>
                </div>
                <div className="item-actions">
                  {!p.sold && (
                    <button onClick={() => markSold(p.id)} className="action-btn sold">
                      SOLD
                    </button>
                  )}
                  <button onClick={() => deleteProduct(p.id)} className="action-btn delete">
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --bg: #000000;
          --bg2: #0a0a0a;
          --text: #ffffff;
          --text2: #666666;
          --accent: #ffffff;
          --accent2: #333333;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'JetBrains Mono', monospace;
          min-height: 100vh;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid var(--accent2);
        }

        .logo-text {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .menu-btn {
          background: none;
          border: 1px solid var(--accent2);
          color: var(--text);
          padding: 8px 16px;
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 2px;
        }

        .admin {
          padding: 80px 32px;
          max-width: 600px;
        }

        .section {
          margin-bottom: 48px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 24px;
        }

        .section-num {
          font-size: 12px;
          color: var(--text2);
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr 60px;
          gap: 8px;
        }

        input, select {
          background: var(--bg2);
          border: 1px solid var(--accent2);
          color: var(--text);
          padding: 14px;
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 1px;
        }

        input::placeholder {
          color: var(--text2);
          letter-spacing: 2px;
        }

        .submit-btn {
          background: var(--text);
          color: var(--bg);
          border: none;
          padding: 16px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          cursor: pointer;
        }

        .submit-btn:disabled {
          opacity: 0.5;
        }

        .status {
          color: var(--text);
          font-size: 12px;
        }

        .product-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .product-item {
          display: flex;
          gap: 12px;
          background: var(--bg2);
          padding: 12px;
          align-items: center;
        }

        .product-item img {
          width: 50px;
          height: 50px;
          object-fit: cover;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .item-meta {
          font-size: 11px;
          color: var(--text2);
          margin-bottom: 4px;
        }

        .avail-tag {
          font-size: 10px;
          color: #22c55e;
          letter-spacing: 1px;
        }

        .sold-tag {
          font-size: 10px;
          color: #ef4444;
          letter-spacing: 1px;
        }

        .item-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: 1px solid var(--accent2);
          color: var(--text2);
          padding: 6px 10px;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
          letter-spacing: 1px;
        }

        .action-btn.sold {
          border-color: #22c55e;
          color: #22c55e;
        }

        .action-btn.delete {
          border-color: #ef4444;
          color: #ef4444;
        }
      `}</style>
    </>
  );
}